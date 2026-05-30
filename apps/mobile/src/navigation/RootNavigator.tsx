import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';
import { RootStackParamList } from '../../types/navigation';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Import Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import FeedScreen from '../screens/main/FeedScreen';
import MatchScreen from '../screens/main/MatchScreen';
import MapScreen from '../screens/main/MapScreen';
import ChatScreen from '../screens/main/ChatScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import PetDetailsScreen from '../screens/main/PetDetailsScreen';
import CreateListingScreen from '../screens/main/CreateListingScreen';

// Lucide icons for gorgeous native indicators
import { Flame, Compass, MessageSquare, User, ListCollapse } from 'lucide-react-native';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// 1. App Main Bottom Tabs Navigation
function MainTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#faf6f0', borderBottomWidth: 1, borderBottomColor: '#eae3db' },
        headerTitleStyle: { color: '#4a3f35', fontWeight: 'bold' },
        tabBarStyle: { backgroundColor: '#faf6f0', borderTopColor: '#eae3db', height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: '#d97452',
        tabBarInactiveTintColor: '#8e8276',
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          title: 'Adoption Feed',
          tabBarIcon: ({ color, size }) => <ListCollapse color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="Match"
        component={MatchScreen}
        options={{
          title: 'Pet Swipe',
          tabBarIcon: ({ color, size }) => <Flame color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: 'Pet Map',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
}

// 2. Main Root Navigation Container Stack
export const RootNavigator: React.FC = () => {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d97452" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // Auth Navigator Tree
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      ) : (
        // Primary App Navigation Tree
        <>
          <Stack.Screen name="MainTabs" component={MainTabsNavigator} />
          <Stack.Screen
            name="PetDetails"
            component={PetDetailsScreen}
            options={{ headerShown: true, title: 'Listing Details', headerStyle: { backgroundColor: '#faf6f0' } }}
          />
          <Stack.Screen
            name="CreateListing"
            component={CreateListingScreen}
            options={{ headerShown: true, title: 'Create Pet Listing', headerStyle: { backgroundColor: '#faf6f0' } }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#faf6f0'
  }
});

export default RootNavigator;
