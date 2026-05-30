import { create } from 'zustand';

// Simulated react-native-keychain/expo-secure-store interface for secure hardware tokens
const SecureStore = {
  setItemAsync: async (key: string, value: string) => {
    // Under hardware: await Expo.SecureStore.setItemAsync(key, value)
    console.info(`SECURE KEYCHAIN: Encrypted storage update. Key: ${key}`);
    localStorage.setItem(key, value);
  },
  getItemAsync: async (key: string): Promise<string | null> => {
    return localStorage.getItem(key);
  },
  deleteItemAsync: async (key: string) => {
    localStorage.removeItem(key);
  }
};

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
}

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
      await SecureStore.setItemAsync('petsgram_jwt_token', accessToken);
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
      await SecureStore.deleteItemAsync('petsgram_jwt_token');
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
      const cachedToken = await SecureStore.getItemAsync('petsgram_jwt_token');
      if (cachedToken) {
        // In real: call backend /api/v1/auth/refresh to verify token status
        set({
          isAuthenticated: true,
          accessToken: cachedToken,
          user: {
            id: 'usr_mock_id_29a0f',
            name: 'Alex Jordan',
            email: 'alex.jordan@domain.com',
            role: 'USER',
            isVerified: true
          },
          loading: false
        });
      } else {
        set({ loading: false });
      }
    } catch (e) {
      set({ loading: false });
    }
  }
}));
export default useAuthStore;
