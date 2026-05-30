import { Response } from 'express';
import { PrismaClient, ListingType } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/rbac';
import { StorageService } from '../services/storageService';
import { z } from 'zod';

const prisma = new PrismaClient();

// Query parameter validation schema
const searchPetsQuerySchema = z.object({
  category: z.string().optional(),
  type: z.enum(['ADOPTION', 'FOSTER', 'RESCUE', 'LOST']).optional(),
  breed: z.string().optional(),
  vaccinated: z.enum(['true', 'false']).optional(),
  lat: z.string().regex(/^-?\d+(\.\d+)?$/).optional(),
  lng: z.string().regex(/^-?\d+(\.\d+)?$/).optional(),
  radiusKm: z.string().regex(/^\d+$/).optional()
});

export class PetController {
  /**
   * Publishes a new pet listing (POST /api/v1/pets)
   */
  public static async createPetListing(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ status: 'error', message: 'Unauthorized.' });

      const { name, category, type, breed, age, gender, images, description, vaccinated, microchipped, neutered, temperaments, locationName, lat, lng } = req.body;

      if (!name || !category || !breed || !age || !description) {
        return res.status(400).json({
          status: 'error',
          code: 'BAD_REQUEST',
          message: 'Missing required parameters.'
        });
      }

      // 1. Resolve Location Node (Geospatial coordinate mapping)
      let locationId: string | null = null;
      if (locationName && lat && lng) {
        const location = await prisma.location.create({
          data: {
            name: locationName,
            lat: parseFloat(lat),
            lng: parseFloat(lng)
          }
        });
        locationId = location.id.toString();
      }

      // 2. Write Pet listing
      const pet = await prisma.pet.create({
        data: {
          name,
          category,
          type: type as ListingType,
          breed,
          age,
          gender,
          images: images || [],
          description,
          vaccinated: !!vaccinated,
          microchipped: !!microchipped,
          neutered: !!neutered,
          temperaments: temperaments || [],
          ownerId: req.user.id,
          locationId
        }
      });

      console.info(`AUDIT TRAIL: Pet listing created. PetID: ${pet.id}, OwnerID: ${req.user.id}, Category: ${pet.category}`);

      return res.status(201).json({
        status: 'success',
        message: 'Listing created successfully.',
        pet
      });

    } catch (error: any) {
      console.error(`ERROR: Failed to create pet. Message: ${error.message}`);
      return res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database insertion error.'
      });
    }
  }

  /**
   * Returns listings with radius calculations, preventing N+1 queries using Prisma relation inclusions (GET /api/v1/pets)
   */
  public static async searchPets(req: AuthenticatedRequest, res: Response) {
    try {
      // 1. Zod query string parser
      const parsedQuery = searchPetsQuerySchema.parse(req.query);

      // 2. Build where filter clauses
      const whereClause: any = {
        deletedAt: null // Soft-delete compliance
      };

      if (parsedQuery.category) whereClause.category = parsedQuery.category;
      if (parsedQuery.type) whereClause.type = parsedQuery.type;
      if (parsedQuery.breed) whereClause.breed = { contains: parsedQuery.breed, mode: 'insensitive' };
      if (parsedQuery.vaccinated) whereClause.vaccinated = parsedQuery.vaccinated === 'true';

      // 3. Optimized Database Fetch - PREVENT N+1:
      // We pull related owner and location entities in a single JOIN query!
      const pets = await prisma.pet.findMany({
        where: whereClause,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isVerified: true
            }
          },
          location: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // 4. If geospatial bounding queries exist, calculate distance
      if (parsedQuery.lat && parsedQuery.lng && parsedQuery.radiusKm) {
        const centerLat = parseFloat(parsedQuery.lat);
        const centerLng = parseFloat(parsedQuery.lng);
        const radius = parseFloat(parsedQuery.radiusKm);

        // Haversine geospatial radius filtering logic
        const filteredPets = pets.filter((pet) => {
          if (!pet.location) return false;
          
          const R = 6371; // Earth radius in km
          const dLat = (pet.location.lat - centerLat) * (Math.PI / 180);
          const dLng = (pet.location.lng - centerLng) * (Math.PI / 180);
          
          const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(centerLat * (Math.PI / 180)) * Math.cos(pet.location.lat * (Math.PI / 180)) * 
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
          
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          (pet as any).distanceKm = parseFloat(distance.toFixed(2));
          return distance <= radius;
        });

        return res.status(200).json({
          status: 'success',
          count: filteredPets.length,
          pets: filteredPets
        });
      }

      return res.status(200).json({
        status: 'success',
        count: pets.length,
        pets
      });

    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          status: 'error',
          code: 'INVALID_QUERY',
          errors: error.errors
        });
      }

      return res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to complete radius search queries.'
      });
    }
  }
  /**
   * Generates AWS S3 Pre-Signed PUT upload URLs (GET /api/v1/pets/upload-url)
   */
  public static async getUploadUrl(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ status: 'error', message: 'Unauthorized.' });

      const filename = req.query.filename as string;
      const mimetype = req.query.mimetype as string;

      if (!filename || !mimetype) {
        return res.status(400).json({
          status: 'error',
          code: 'BAD_REQUEST',
          message: 'Query parameters filename and mimetype are required.'
        });
      }

      // Generate secure pre-signed PUT URLs
      const credentials = await StorageService.getPresignedUploadUrl(filename, mimetype);

      return res.status(200).json({
        status: 'success',
        ...credentials
      });

    } catch (error: any) {
      return res.status(400).json({
        status: 'error',
        code: 'STORAGE_URL_ERROR',
        message: error.message
      });
    }
  }
}
export default PetController;
