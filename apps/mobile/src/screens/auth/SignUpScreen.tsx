import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../services/apiClient';
import Toast from 'react-native-toast-message';

export default function SignUpScreen({ navigation }: any) {
  const { login } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'FOSTER' | 'SHELTER'>('USER');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      Alert.alert('Validation Error', 'Please complete all fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/signup', { name, email, password, role });
      const { accessToken, user } = response.data;
      
      await login(accessToken, user);
      
      Toast.show({
        type: 'success',
        text1: '🐾 Account created!',
        text2: 'Welcome to PETSGRAM.'
      });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Sign up failed. Please try again.';
      Toast.show({
        type: 'error',
        text1: 'Sign Up Failed 🚨',
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
            <Text style={styles.appTitle}>Create Account</Text>
            <Text style={styles.tagline}>Connect with adoptable paws today 🐾</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Alex Jordan"
              placeholderTextColor="#8e8276"
              value={name}
              onChangeText={setName}
            />

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

            <Text style={styles.label}>Account Role Type</Text>
            <View style={styles.rolePickerContainer}>
              {(['USER', 'FOSTER', 'SHELTER'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleOption, role === r && styles.roleOptionActive]}
                  onPress={() => setRole(r)}
                >
                  <Text style={[styles.roleOptionText, role === r && styles.roleOptionTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSignUp} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.btnText}>Register Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footerBlock}>
            <Text style={styles.footerLabel}>Already registered?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
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
    gap: 24
  },
  headerBlock: {
    alignItems: 'center',
    gap: 8
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#d97452'
  },
  tagline: {
    fontSize: 13,
    color: '#8e8276',
    fontWeight: '600'
  },
  formContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eae3db',
    gap: 14,
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
  rolePickerContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  roleOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#eae3db',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#faf6f0'
  },
  roleOptionActive: {
    backgroundColor: '#d97452',
    borderColor: '#d97452'
  },
  roleOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8e8276'
  },
  roleOptionTextActive: {
    color: '#ffffff'
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
  loginLink: {
    fontSize: 13,
    color: '#d97452',
    fontWeight: 'bold'
  }
});
