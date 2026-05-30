import React, { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import apiClient from '../../services/apiClient';
import { useAuthStore } from '../../store/authStore';
import { Plus } from 'lucide-react-native';

export default function FeedScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch paginated pets listings utilizing clean infinite queries
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isLoading,
    isError,
    error
  } = useInfiniteQuery({
    queryKey: ['petsFeed'],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await apiClient.get(`/pets?page=${pageParam}&limit=10`);
      return res.data; // expect { data: Pet[], nextPage: number | null }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage || undefined,
    initialPageParam: 1
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderPetItem = ({ item }: any) => {
    const imageUrl = item.images?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300';
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('PetDetails', { petId: item.id })}
      >
        <Image source={{ uri: imageUrl }} style={styles.cardImage} />
        <View style={styles.cardDetails}>
          <View style={styles.cardHeader}>
            <Text style={styles.petName}>{item.name}</Text>
            <View style={[styles.typeBadge, styles[`badge_${item.type}`]]}>
              <Text style={styles.typeBadgeText}>{item.type}</Text>
            </View>
          </View>
          <Text style={styles.petMeta}>{item.breed} • {item.age} • {item.gender}</Text>
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render dummy skeletons loader layout during initial loading states
  const renderSkeletons = () => (
    <View style={styles.skeletonsContainer}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonDetails}>
            <View style={styles.skeletonHeader} />
            <View style={styles.skeletonMeta} />
            <View style={styles.skeletonText} />
          </View>
        </View>
      ))}
    </View>
  );

  if (isLoading) {
    return renderSkeletons();
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>🐾 Failed to fetch active feeds.</Text>
        <Text style={styles.errorSub}>{(error as any)?.message || 'Check connection settings.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>Retry Fetch</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const petsList = data?.pages.flatMap((page) => page.data) || [];

  return (
    <View style={styles.container}>
      <FlatList
        data={petsList}
        renderItem={renderPetItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#d97452']} />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? <ActivityIndicator size="small" color="#d97452" style={styles.loadingMore} /> : null
        }
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>🐾 No pets reported active.</Text>
          </View>
        }
      />

      {/* FLOAT FAB NAVIGATION TRIGGER FOR SHELTERS / ADMINS */}
      {(user?.role === 'SHELTER' || user?.role === 'ADMIN') && (
        <TouchableOpacity
          style={styles.fabBtn}
          onPress={() => navigation.navigate('CreateListing')}
        >
          <Plus color="#ffffff" size={24} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf6f0'
  },
  listContent: {
    padding: 16,
    gap: 16
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eae3db',
    overflow: 'hidden',
    shadowColor: '#4a3f35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#eae3db'
  },
  cardDetails: {
    padding: 16,
    gap: 6
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  petName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4a3f35'
  },
  petMeta: {
    fontSize: 13,
    color: '#8e8276',
    fontWeight: '600'
  },
  description: {
    fontSize: 13,
    color: '#4a3f35',
    lineHeight: 18,
    marginTop: 4
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  badge_ADOPTION: { backgroundColor: '#d97452' },
  badge_FOSTER: { backgroundColor: '#6aa84f' },
  badge_RESCUE: { backgroundColor: '#e69138' },
  badge_LOST: { backgroundColor: '#cc0000' },
  fabBtn: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#d97452',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d97452',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12
  },
  errorText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#d97452'
  },
  errorSub: {
    fontSize: 13,
    color: '#8e8276'
  },
  retryBtn: {
    backgroundColor: '#d97452',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: 'bold'
  },
  emptyText: {
    fontSize: 14,
    color: '#8e8276',
    fontWeight: '600',
    marginTop: 64
  },
  loadingMore: {
    marginVertical: 16
  },
  skeletonsContainer: {
    padding: 16,
    gap: 16,
    backgroundColor: '#faf6f0',
    flex: 1
  },
  skeletonCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    height: 270,
    gap: 12,
    borderWidth: 1,
    borderColor: '#eae3db'
  },
  skeletonImage: {
    height: 180,
    backgroundColor: '#eae3db'
  },
  skeletonDetails: {
    paddingHorizontal: 16,
    gap: 8
  },
  skeletonHeader: {
    height: 20,
    backgroundColor: '#eae3db',
    width: '40%',
    borderRadius: 4
  },
  skeletonMeta: {
    height: 14,
    backgroundColor: '#eae3db',
    width: '60%',
    borderRadius: 4
  },
  skeletonText: {
    height: 14,
    backgroundColor: '#eae3db',
    width: '90%',
    borderRadius: 4
  }
});
