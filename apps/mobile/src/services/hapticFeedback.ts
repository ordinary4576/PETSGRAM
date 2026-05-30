import { Vibration, Platform } from 'react-native';

export class HapticFeedback {
  /**
   * Safe wrapper to trigger success haptics or system short buzzes
   */
  public static success() {
    try {
      // safe fallback if native module expo-haptics is down
      Vibration.vibrate([0, 10, 50, 10]);
    } catch (e) {
      Vibration.vibrate(20);
    }
  }

  /**
   * Safe wrapper to trigger light navigation pops haptics
   */
  public static light() {
    try {
      Vibration.vibrate(10);
    } catch (e) {
      Vibration.vibrate(10);
    }
  }

  /**
   * Safe wrapper to trigger heavy alert / error haptics
   */
  public static error() {
    try {
      Vibration.vibrate([0, 50, 100, 50]);
    } catch (e) {
      Vibration.vibrate(80);
    }
  }

  /**
   * Safe warning haptic vibrations
   */
  public static warning() {
    try {
      Vibration.vibrate([0, 30, 80, 30]);
    } catch (e) {
      Vibration.vibrate(40);
    }
  }
}

export default HapticFeedback;
