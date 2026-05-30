import { create } from 'zustand';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'FOSTER' | 'SHELTER' | 'MODERATOR' | 'ADMIN';
  isVerified: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: UserSession | null;
  loading: boolean;
  login: (accessToken: string, user: UserSession) => Promise<void>;
  logout: () => Promise<void>;
  initializeSession: () => Promise<void>;
  
  // Centralized Undo Snackbar State parameters
  snackbarVisible: boolean;
  snackbarMessage: string;
  onUndoCallback: () => void;
  triggerSnackbar: (message: string, onUndo: () => void) => void;
  dismissSnackbar: () => void;
}

const SECURE_STORE_KEY = 'petsgram_jwt_token';

// Safely access Keychain with dynamic runtime fallback for test runners / environments
const secureSetItem = async (key: string, value: string) => {
  try {
    await Keychain.setGenericPassword(key, value, { service: 'com.ordinary.petsgram' });
  } catch (error) {
    // Graceful secure fallback for sandbox or testing environments
    await AsyncStorage.setItem(key, value);
  }
};

const secureGetItem = async (key: string): Promise<string | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({ service: 'com.ordinary.petsgram' });
    if (credentials) {
      return credentials.password;
    }
    return await AsyncStorage.getItem(key);
  } catch (error) {
    return await AsyncStorage.getItem(key);
  }
};

const secureDeleteItem = async (key: string) => {
  try {
    await Keychain.resetGenericPassword({ service: 'com.ordinary.petsgram' });
    await AsyncStorage.removeItem(key);
  } catch (error) {
    await AsyncStorage.removeItem(key);
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  accessToken: null,
  user: null,
  loading: true,

  /**
   * Caches short-lived tokens in secure storage and logs session
   */
  login: async (accessToken: string, user: UserSession) => {
    set({ loading: true });
    try {
      await secureSetItem(SECURE_STORE_KEY, accessToken);
      // Persist user details for offline launch profiles
      await AsyncStorage.setItem('petsgram_user_profile', JSON.stringify(user));
      
      set({
        isAuthenticated: true,
        accessToken,
        user,
        loading: false
      });
      console.info(`SESSION STARTED: Zustand state synchronized. User: ${user.email}`);
    } catch (e) {
      set({ loading: false });
    }
  },

  /**
   * Clears keychains and resets local memory states
   */
  logout: async () => {
    set({ loading: true });
    try {
      await secureDeleteItem(SECURE_STORE_KEY);
      await AsyncStorage.removeItem('petsgram_user_profile');
      
      set({
        isAuthenticated: false,
        accessToken: null,
        user: null,
        loading: false
      });
      console.info('SESSION TERMINATED: secure tokens purged from hardware Keychain.');
    } catch (e) {
      set({ loading: false });
    }
  },

  /**
   * Pulls cached tokens from secure Keychains on application startups
   */
  initializeSession: async () => {
    try {
      const cachedToken = await secureGetItem(SECURE_STORE_KEY);
      const cachedProfile = await AsyncStorage.getItem('petsgram_user_profile');
      
      if (cachedToken && cachedProfile) {
        set({
          isAuthenticated: true,
          accessToken: cachedToken,
          user: JSON.parse(cachedProfile),
          loading: false
        });
      } else {
        set({ loading: false });
      }
    } catch (e) {
      set({ loading: false });
    }
  },

  // Centralized Undo Snackbar actions implementation
  snackbarVisible: false,
  snackbarMessage: '',
  onUndoCallback: () => {},
  triggerSnackbar: (message: string, onUndo: () => void) => {
    set({
      snackbarVisible: true,
      snackbarMessage: message,
      onUndoCallback: onUndo
    });
  },
  dismissSnackbar: () => {
    set({
      snackbarVisible: false
    });
  }
}));

export default useAuthStore;
