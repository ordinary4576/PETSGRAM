import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../services/apiClient';
import Toast from 'react-native-toast-message';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please complete both fields to continue.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { accessToken, user } = response.data;
      
      await login(accessToken, user);
      
      Toast.show({
        type: 'success',
        text1: '🐾 Welcome back!',
        text2: 'Successfully signed in.'
      });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Login failed. Please verify credentials.';
      Toast.show({
        type: 'error',
        text1: 'Sign In Failed 🚨',
        text2: msg
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.headerBlock}>
            <Text style={styles.appTitle}>PETSGRAM</Text>
            <Text style={styles.tagline}>Adopt, Foster, Connect 🐾</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="alex@domain.com"
              placeholderTextColor="#8e8276"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#8e8276"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.btnText}>Sign In Securely</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footerBlock}>
            <Text style={styles.footerLabel}>New to PETSGRAM?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signUpLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#faf6f0'
  },
  keyboardView: {
    flex: 1
  },
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 32
  },
  headerBlock: {
    alignItems: 'center',
    gap: 8
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#d97452',
    letterSpacing: 2
  },
  tagline: {
    fontSize: 14,
    color: '#8e8276',
    fontWeight: '600'
  },
  formContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eae3db',
    gap: 16,
    shadowColor: '#4a3f35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  label: {
    fontSize: 13,
    color: '#4a3f35',
    fontWeight: '700'
  },
  input: {
    backgroundColor: '#faf6f0',
    borderWidth: 1,
    borderColor: '#eae3db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#4a3f35'
  },
  forgotBtn: {
    alignSelf: 'flex-end'
  },
  forgotText: {
    fontSize: 13,
    color: '#d97452',
    fontWeight: '600'
  },
  primaryBtn: {
    backgroundColor: '#d97452',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  btnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold'
  },
  footerBlock: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6
  },
  footerLabel: {
    fontSize: 13,
    color: '#8e8276'
  },
  signUpLink: {
    fontSize: 13,
    color: '#d97452',
    fontWeight: 'bold'
  }
});
