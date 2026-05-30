import React, { useEffect, useState } from 'react';
import { AppState, AppStateStatus, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import RootNavigator from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import NetInfo from '@react-native-community/netinfo';
import messaging from '@react-native-firebase/messaging';
import OfflineBanner from './src/components/OfflineBanner';
import UndoSnackbar from './src/components/UndoSnackbar';

// 1. Initialize React Query Client with Offline caching configurations
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      refetchOnWindowFocus: true
    }
  }
});

// 2. Define deep linking config parameters
const linking = {
  prefixes: ['petsgram://', 'https://petsgram.io', 'https://*.petsgram.io'],
  config: {
    screens: {
      AuthStack: {
        screens: {
          Login: 'login',
          SignUp: 'signup'
        }
      },
      MainTabs: {
        screens: {
          Feed: 'feed',
          Match: 'match',
          Map: 'map',
          Chat: 'chat',
          Profile: 'profile'
        }
      },
      PetDetails: 'pet/:petId'
    }
  }
};

// 3. Centralized Robust Error Boundary
class GlobalErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('CRITICAL CLIENT MOBILE EXCEPTION DETECTED:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>🐾 Oops! A technical hitch occurred.</Text>
          <Text style={styles.errorSub}>{this.state.error?.message || 'Unexpected rendering cycle crash.'}</Text>
          <View style={styles.retryButton}>
            <Text style={styles.retryText} onPress={() => this.setState({ hasError: false })}>Reload Core Interface</Text>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { initializeSession, snackbarVisible, snackbarMessage, onUndoCallback, dismissSnackbar } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  // A. Deep-Linking & FCM App Startup Bootstrap handlers
  useEffect(() => {
    const bootstrap = async () => {
      try {
        // Init secure store session tokens check
        await initializeSession();

        // Check Push Notifications permissions
        const authStatus = await messaging().requestPermission();
        const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED || authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (enabled) {
          console.info('NOTIFICATION SYSTEM: FCM Authorization granted.');
          // Log FCM device registration token
          const token = await messaging().getToken();
          console.info('FCM REGISTERED DEVICE TOKEN:', token);
        }
      } catch (e) {
        console.warn('Bootstrap verification issue:', e);
      } finally {
        setIsReady(true);
      }
    };
    bootstrap();
  }, []);

  // B. Enforce Lifecycle Handling (onCreate, onStart, onResume, onPause, onStop, onDestroy)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.info(`APP LIFECYCLE: Transitioned from current state to [${nextAppState}]`);
      if (nextAppState === 'active') {
        // App resumed / onResume - refresh connection caches
        queryClient.invalidateQueries();
      } else if (nextAppState === 'background') {
        // App paused / onPause - persist offline queues
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  // C. Foreground Push Listener Setup
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Toast.show({
        type: 'info',
        text1: remoteMessage.notification?.title || '🚨 EMERGENCY ALERT',
        text2: remoteMessage.notification?.body || 'New alert reported near you!'
      });
    });
    return unsubscribe;
  }, []);

  if (!isReady) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color="#d97452" />
        <Text style={styles.splashText}>Authorizing cryptographic sessions...</Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <GlobalErrorBoundary>
          <NavigationContainer linking={linking as any}>
            <OfflineBanner />
            <RootNavigator />
            <UndoSnackbar
              visible={snackbarVisible}
              message={snackbarMessage}
              onUndo={onUndoCallback}
              onDismiss={dismissSnackbar}
            />
            <Toast />
          </NavigationContainer>
        </GlobalErrorBoundary>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#faf6f0',
    gap: 16
  },
  splashText: {
    fontSize: 14,
    color: '#8e8276',
    fontWeight: '600'
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#faf6f0',
    padding: 24,
    gap: 12
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#d97452'
  },
  errorSub: {
    fontSize: 13,
    color: '#8e8276',
    textAlign: 'center',
    lineHeight: 18
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: '#d97452',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8
  },
  retryText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14
  }
});
