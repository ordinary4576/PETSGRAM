import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import apiClient from '../../services/apiClient';
import Toast from 'react-native-toast-message';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetRequest = async () => {
    if (!email) {
      Alert.alert('Validation Error', 'Please specify your email address.');
      return;
    }

    setLoading(true);
    try {
      // Endpoint is mocked in emailService but has live structures
      await apiClient.post('/auth/forgot-password', { email });
      
      Toast.show({
        type: 'success',
        text1: '🐾 Reset email dispatched!',
        text2: 'Check your inbox for a secure token link.'
      });
      navigation.navigate('Login');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Action failed. Please verify connection.';
      Toast.show({
        type: 'error',
        text1: 'Reset Request Failed 🚨',
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
            <Text style={styles.appTitle}>Reset Password</Text>
            <Text style={styles.tagline}>Get secure reset instructions via SMTP 🐾</Text>
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

            <TouchableOpacity style={styles.primaryBtn} onPress={handleResetRequest} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.btnText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.backText}>← Back to Sign In</Text>
          </TouchableOpacity>
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
  backBtn: {
    alignSelf: 'center',
    padding: 10
  },
  backText: {
    fontSize: 14,
    color: '#d97452',
    fontWeight: 'bold'
  }
});
