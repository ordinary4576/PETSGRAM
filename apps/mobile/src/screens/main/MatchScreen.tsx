import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Animated, PanResponder, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../../services/apiClient';
import Toast from 'react-native-toast-message';
import { Heart, X } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;

export default function MatchScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;

  // 1. Fetch matching swipe candidates from backend
  const { data: candidates = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['swipeCandidates'],
    queryFn: async () => {
      const res = await apiClient.get('/pets'); // fetches listing feeds to swipe
      return res.data?.data || [];
    }
  });

  // 2. Swipes Mutation Handler
  const swipeMutation = useMutation({
    mutationFn: async ({ petId, action }: { petId: string; action: 'like' | 'dislike' }) => {
      // Swipe actions hook directly to like structures
      if (action === 'like') {
        const res = await apiClient.post('/pets', { petId }); // mock trigger like application
        return res.data;
      }
      return { success: true };
    },
    onSuccess: (data: any, variables) => {
      if (variables.action === 'like') {
        Toast.show({
          type: 'success',
          text1: '🐾 Heart Sent!',
          text2: 'Alert dispatched to shelter owner.'
        });
      }
    }
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        position.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else {
          resetPosition();
        }
      }
    })
  ).current;

  const forceSwipe = (direction: 'right' | 'left') => {
    const x = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: false
    }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = (direction: 'right' | 'left') => {
    const item = candidates[currentIndex];
    if (item) {
      swipeMutation.mutate({ petId: item.id, action: direction === 'right' ? 'like' : 'dislike' });
    }
    position.setValue({ x: 0, y: 0 });
    setCurrentIndex((prev) => prev + 1);
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 4,
      useNativeDriver: false
    }).start();
  };

  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
      outputRange: ['-30deg', '0deg', '30deg']
    });

    return {
      ...position.getLayout(),
      transform: [{ rotate }]
    };
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#d97452" />
        <Text style={styles.loadingText}>Fetching swipe deck profiles...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>🐾 Failed to fetch swipe deck.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.btnText}>Retry Deck</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderDeck = () => {
    if (currentIndex >= candidates.length) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>🎉 You've swiped on all available paws!</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setCurrentIndex(0); refetch(); }}>
            <Text style={styles.btnText}>Restart Discovery Deck</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return candidates
      .map((item: any, i: number) => {
        if (i < currentIndex) return null;

        const imageUrl = item.images?.[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300';

        if (i === currentIndex) {
          return (
            <Animated.View
              key={item.id}
              style={[getCardStyle(), styles.cardStyle]}
              {...panResponder.panHandlers}
            >
              <Image source={{ uri: imageUrl }} style={styles.cardImage} />
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.name}, {item.age}</Text>
                <Text style={styles.cardSubtitle}>{item.breed} • {item.gender}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
              </View>
            </Animated.View>
          );
        }

        return (
          <View key={item.id} style={[styles.cardStyle, { zIndex: -i, top: (i - currentIndex) * 6 }]}>
            <Image source={{ uri: imageUrl }} style={styles.cardImage} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.name}, {item.age}</Text>
              <Text style={styles.cardSubtitle}>{item.breed} • {item.gender}</Text>
            </View>
          </View>
        );
      })
      .reverse();
  };

  return (
    <View style={styles.container}>
      <View style={styles.deckContainer}>{renderDeck()}</View>
      {currentIndex < candidates.length && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={[styles.actionBtn, styles.btnDislike]} onPress={() => forceSwipe('left')}>
            <X color="#d97452" size={28} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.btnLike]} onPress={() => forceSwipe('right')}>
            <Heart color="#ffffff" size={28} fill="#ffffff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf6f0',
    padding: 16,
    justifyContent: 'space-between'
  },
  deckContainer: {
    flex: 1,
    marginTop: 16,
    justifyContent: 'center',
    position: 'relative'
  },
  cardStyle: {
    position: 'absolute',
    width: '100%',
    height: '92%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eae3db',
    overflow: 'hidden',
    shadowColor: '#4a3f35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4
  },
  cardImage: {
    width: '100%',
    height: '70%',
    backgroundColor: '#eae3db'
  },
  cardInfo: {
    padding: 16,
    gap: 4,
    flexGrow: 1,
    justifyContent: 'center'
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#4a3f35'
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#8e8276',
    fontWeight: '700'
  },
  cardDesc: {
    fontSize: 13,
    color: '#4a3f35',
    lineHeight: 18,
    marginTop: 4
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginVertical: 16
  },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4a3f35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  btnDislike: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#eae3db'
  },
  btnLike: {
    backgroundColor: '#d97452'
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
  emptyContainer: {
    alignItems: 'center',
    gap: 16,
    padding: 24
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4a3f35',
    textAlign: 'center'
  },
  retryBtn: {
    backgroundColor: '#d97452',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12
  },
  btnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14
  }
});
