import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Text, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/apiClient';

export default function MapScreen({ navigation }: any) {
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
  }
});
