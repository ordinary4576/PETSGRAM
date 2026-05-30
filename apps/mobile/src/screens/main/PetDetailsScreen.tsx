import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../../services/apiClient';
import Toast from 'react-native-toast-message';
import { ShieldCheck, Heart, ShieldAlert, Award } from 'lucide-react-native';

export default function PetDetailsScreen({ route, navigation }: any) {
  const { petId } = route.params;
  const [applying, setApplying] = useState(false);

  // Fetch pet details from live database endpoint
  const { data: pet, isLoading, isError, refetch } = useQuery({
    queryKey: ['petDetails', petId],
    queryFn: async () => {
      const res = await apiClient.get(`/pets`); // fetch all listings
      const list = res.data?.data || [];
      const match = list.find((p: any) => p.id === petId);
      if (!match) throw new Error('Pet listing details not found.');
      return match;
    }
  });

  // Submit adoption foster application mutation
  const applyMutation = useMutation({
    mutationFn: async () => {
      // In production: POST /api/v1/applications
      const res = await apiClient.post('/pets', { petId }); // mock application post
      return res.data;
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: '🐾 Application Filed!',
        text2: 'Shelter will review your cozy home profile.'
      });
      navigation.goBack();
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: 'Submission Failed 🚨',
        text2: err.message || 'Verification failed.'
      });
    }
  });

  const handleApply = () => {
    Alert.alert(
      '🐾 Submit Foster Application',
      `Are you sure you want to apply to foster or adopt ${pet?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Application',
          onPress: () => applyMutation.mutate()
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#d97452" />
        <Text style={styles.loadingText}>Fetching pet characteristics details...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>🐾 Failed to fetch listing profiles.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.btnText}>Retry Fetch</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imageUrl = pet.images?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={{ uri: imageUrl }} style={styles.petImage} />

        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.petName}>{pet.name}</Text>
            <View style={[styles.typeBadge, styles[`badge_${pet.type}`]]}>
              <Text style={styles.badgeText}>{pet.type}</Text>
            </View>
          </View>
          <Text style={styles.petMeta}>{pet.breed} • {pet.age} • {pet.gender}</Text>
        </View>

        <View style={styles.specsContainer}>
          <View style={styles.specBox}>
            <ShieldCheck color={pet.vaccinated ? '#6aa84f' : '#cc0000'} size={24} />
            <Text style={styles.specTitle}>Vaccinated</Text>
            <Text style={styles.specValue}>{pet.vaccinated ? 'Yes' : 'No'}</Text>
          </View>
          <View style={styles.specBox}>
            <ShieldCheck color={pet.microchipped ? '#6aa84f' : '#cc0000'} size={24} />
            <Text style={styles.specTitle}>Microchip</Text>
            <Text style={styles.specValue}>{pet.microchipped ? 'Yes' : 'No'}</Text>
          </View>
          <View style={styles.specBox}>
            <ShieldCheck color={pet.neutered ? '#6aa84f' : '#cc0000'} size={24} />
            <Text style={styles.specTitle}>Neutered</Text>
            <Text style={styles.specValue}>{pet.neutered ? 'Yes' : 'No'}</Text>
          </View>
        </View>

        <View style={styles.bioCard}>
          <Text style={styles.sectionTitle}>Story & Characteristics</Text>
          <Text style={styles.bioText}>{pet.description}</Text>
        </View>

        <TouchableOpacity style={styles.applyBtn} onPress={handleApply} disabled={applyMutation.isPending}>
          {applyMutation.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Heart color="#ffffff" size={18} fill="#ffffff" />
              <Text style={styles.applyBtnText}>Apply for Adoption / Foster</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#faf6f0'
  },
  container: {
    padding: 16,
    gap: 16
  },
  petImage: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    backgroundColor: '#eae3db'
  },
  infoCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eae3db',
    gap: 6
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  petName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#4a3f35'
  },
  petMeta: {
    fontSize: 14,
    color: '#8e8276',
    fontWeight: '700'
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  badge_ADOPTION: { backgroundColor: '#d97452' },
  badge_FOSTER: { backgroundColor: '#6aa84f' },
  badge_RESCUE: { backgroundColor: '#e69138' },
  badge_LOST: { backgroundColor: '#cc0000' },
  specsContainer: {
    flexDirection: 'row',
    gap: 12
  },
  specBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eae3db',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 6
  },
  specTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8e8276'
  },
  specValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#4a3f35'
  },
  bioCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eae3db',
    gap: 8
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#4a3f35'
  },
  bioText: {
    fontSize: 13,
    color: '#4a3f35',
    lineHeight: 20
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d97452',
    padding: 16,
    borderRadius: 16,
    gap: 10,
    marginTop: 8
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
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
    color: '#d97452'
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
  }
});
