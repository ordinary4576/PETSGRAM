import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import HapticFeedback from '../services/hapticFeedback';

interface UndoSnackbarProps {
  visible: boolean;
  message: string;
  duration?: number;
  onUndo: () => void;
  onDismiss: () => void;
}

export default function UndoSnackbar({ visible, message, duration = 5000, onUndo, onDismiss }: UndoSnackbarProps) {
  const [timeLeft, setTimeLeft] = useState(duration / 1000);
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      HapticFeedback.warning();
      setTimeLeft(duration / 1000);

      // Slide in transition
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true
      }).start();

      // Setup countdown interval timer ticks
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleDismiss();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 250,
        useNativeDriver: true
      }).start();
    }
  }, [visible]);

  const handleUndo = () => {
    HapticFeedback.success();
    onUndo();
    handleDismiss();
  };

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: 100,
      duration: 250,
      useNativeDriver: true
    }).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.snackbar, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.content}>
        <Text style={styles.messageText}>{message}</Text>
        <Text style={styles.timerText}>({timeLeft}s)</Text>
      </View>
      <TouchableOpacity style={styles.undoBtn} onPress={handleUndo}>
        <Text style={styles.undoText}>UNDO</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  snackbar: {
    position: 'absolute',
    bottom: 80, // mounts above the bottom tab navigation bar safely
    left: 16,
    right: 16,
    backgroundColor: '#4a3f35',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  messageText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600'
  },
  timerText: {
    color: '#eae3db',
    fontSize: 11,
    fontWeight: 'bold'
  },
  undoBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#d97452',
    borderRadius: 6
  },
  undoText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold'
  }
});
