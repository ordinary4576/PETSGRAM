import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Text, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/apiClient';
import HapticFeedback from '../../services/hapticFeedback';

export default function MapScreen({ navigation }: any) {
  const [selectedPet, setSelectedPet] = useState<any | null>(null);

  // Center map around a cozy default regional coordinate bounds
  const [region] = useState({
    latitude: 34.0522,
    longitude: -118.2437,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421
  });

  // Fetch pet listings mapped to geospatial coordinates
  const { data: pets = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['petsLocationMap'],
    queryFn: async () => {
      const res = await apiClient.get('/pets'); // fetches all listings with coordinate details
      return res.data?.data || [];
    }
  });

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#d97452" />
        <Text style={styles.loadingText}>Scaffolding geographic coordinate grids...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>🐾 Failed to initialize regional map guides.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.btnText}>Retry Map</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        showsUserLocation={true}
        loadingEnabled={true}
      >
        {pets.map((pet: any) => {
          // If pet lacks valid mapping coords, provide mock geofencing coords near center for demo
          const latitude = pet.location?.lat || (34.0522 + (Math.random() - 0.5) * 0.05);
          const longitude = pet.location?.lng || (-118.2437 + (Math.random() - 0.5) * 0.05);
          const imageUrl = pet.images?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=150';

          return (
            <Marker
              key={pet.id}
              coordinate={{ latitude, longitude }}
              title={pet.name}
              description={pet.breed}
              pinColor="#d97452"
              onPress={() => {
                HapticFeedback.light();
                setSelectedPet(pet);
              }}
            >
              <Callout
                onPress={() => navigation.navigate('PetDetails', { petId: pet.id })}
                style={styles.calloutContainer}
              >
                <View style={styles.calloutCard}>
                  <Image source={{ uri: imageUrl }} style={styles.calloutImage} />
                  <View style={styles.calloutInfo}>
                    <Text style={styles.calloutTitle}>{pet.name}</Text>
                    <Text style={styles.calloutSubtitle}>{pet.breed} • {pet.age}</Text>
                    <Text style={styles.viewLink}>Tap to view profile →</Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Cozy Airbnb-style Bottom Sheet Preview Panel */}
      {selectedPet && (
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>🐾 Pet Location Preview</Text>
            <TouchableOpacity 
              onPress={() => {
                HapticFeedback.light();
                setSelectedPet(null);
              }} 
              style={styles.closeBtn}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.sheetCard}
            onPress={() => navigation.navigate('PetDetails', { petId: selectedPet.id })}
          >
            <Image 
              source={{ uri: selectedPet.images?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=150' }} 
              style={styles.sheetImage} 
            />
            <View style={styles.sheetInfo}>
              <Text style={styles.sheetPetName}>{selectedPet.name}</Text>
              <Text style={styles.sheetPetMeta}>{selectedPet.breed} • {selectedPet.age}</Text>
              <Text style={styles.sheetActionText}>Tap to open full bio & timeline tracker →</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf6f0'
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#faf6f0',
    gap: 12
  },
  loadingText: {
    fontSize: 14,
    color: '#8e8276',
    fontWeight: '600'
  },
  errorText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#d97452',
    textAlign: 'center',
    paddingHorizontal: 24
  },
  retryBtn: {
    backgroundColor: '#d97452',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  btnText: {
    color: '#ffffff',
    fontWeight: 'bold'
  },
  calloutContainer: {
    width: 200,
    borderRadius: 12,
    backgroundColor: '#ffffff'
  },
  calloutCard: {
    flexDirection: 'row',
    gap: 8,
    padding: 6
  },
  calloutImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#eae3db'
  },
  calloutInfo: {
    flex: 1,
    justifyContent: 'space-between'
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4a3f35'
  },
  calloutSubtitle: {
    fontSize: 10,
    color: '#8e8276'
  },
  viewLink: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#d97452',
    marginTop: 2
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eae3db',
    gap: 12,
    shadowColor: '#4a3f35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#4a3f35'
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#faf6f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eae3db'
  },
  closeText: {
    fontSize: 11,
    color: '#8e8276',
    fontWeight: 'bold'
  },
  sheetCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center'
  },
  sheetImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#eae3db'
  },
  sheetInfo: {
    flex: 1,
    gap: 2
  },
  sheetPetName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#4a3f35'
  },
  sheetPetMeta: {
    fontSize: 12,
    color: '#8e8276',
    fontWeight: '700'
  },
  sheetActionText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#d97452',
    marginTop: 4
  }
});
