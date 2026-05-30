import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Play, Pause } from 'lucide-react-native';
import HapticFeedback from '../services/hapticFeedback';

export default function ChatVoiceWaveform() {
  const [isPlaying, setIsPlaying] = useState(false);
  const animValue = React.useRef(new Animated.Value(0)).current;

  // Static bars heights frequency array representing cozy voice memo soundwaves
  const BARS = [12, 24, 18, 32, 16, 28, 20, 36, 14, 22, 18, 26, 12];

  const handlePlayToggle = () => {
    HapticFeedback.light();
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 800,
            useNativeDriver: false
          })
        ])
      ).start();
    } else {
      animValue.stopAnimation();
    }
  }, [isPlaying]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.playBtn} onPress={handlePlayToggle}>
        {isPlaying ? (
          <Pause color="#ffffff" size={14} fill="#ffffff" />
        ) : (
          <Play color="#ffffff" size={14} fill="#ffffff" />
        )}
      </TouchableOpacity>

      <View style={styles.waveformContainer}>
        {BARS.map((height, index) => {
          // Animate height scaling dynamically during play
          const heightAnim = animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [height, height * 0.4]
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.waveformBar,
                {
                  height: isPlaying ? heightAnim : height,
                  backgroundColor: isPlaying ? '#d97452' : '#8e8276'
                }
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf6f0',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eae3db',
    gap: 12,
    alignSelf: 'flex-start',
    width: 220
  },
  playBtn: {
    backgroundColor: '#d97452',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d97452',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 36,
    flex: 1
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5
  }
});
