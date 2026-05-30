import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/apiClient';
import Toast from 'react-native-toast-message';

export default function CreateListingScreen({ navigation }: any) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState('https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300'); // mock image URI for compilation demo
  const [loading, setLoading] = useState(false);

  // Submit Listing Mutation
  const createListingMutation = useMutation({
    mutationFn: async (petData: any) => {
      // 1. Fetch pre-signed PUT S3 upload url from backend
      const presignedRes = await apiClient.get(`/pets/upload-url?filename=${name.toLowerCase()}.jpg&mimetype=image/jpeg`);
      const { uploadUrl, fileUrl } = presignedRes.data;

      console.info(`CLOUD S3 FLOW: Presigned Upload URL retrieved. Signed URL: ${uploadUrl}`);
      
      // In production: perform direct PUT binary upload to uploadUrl
      // await axios.put(uploadUrl, binaryBlob, { headers: { 'Content-Type': 'image/jpeg' } });
      
      // 2. Publish pet metadata with live uploaded S3 fileUrl to backend database
      const saveRes = await apiClient.post('/pets', {
        ...petData,
        images: [fileUrl]
      });
      return saveRes.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['petsFeed'] });
      Toast.show({
        type: 'success',
        text1: '🐾 Listing Published!',
        text2: 'Adoptable paw posted successfully.'
      });
      navigation.goBack();
    },
    onError: (err: any) => {
      Toast.show({
        type: 'error',
        text1: 'Posting Failed 🚨',
        text2: err.message || 'Verification issue.'
      });
    }
  });

  const handleCreate = () => {
    if (!name || !breed || !age || !description) {
      Alert.alert('Validation Error', 'Please complete all form fields.');
      return;
    }

    createListingMutation.mutate({
      name,
      category,
      breed,
      age,
      gender,
      description
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.formContainer}>
            <Text style={styles.label}>Pet Name</Text>
            <TextInput style={styles.input} placeholder="Ziggy" value={name} onChangeText={setName} />

            <Text style={styles.label}>Pet Category</Text>
            <View style={styles.pickerContainer}>
              {['dog', 'cat', 'bunny', 'other'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.pickerOption, category === cat && styles.pickerOptionActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.pickerText, category === cat && styles.pickerTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Breed</Text>
            <TextInput style={styles.input} placeholder="Golden Retriever" value={breed} onChangeText={setBreed} />

            <Text style={styles.label}>Age Profile</Text>
            <TextInput style={styles.input} placeholder="Puppy (3 Months)" value={age} onChangeText={setAge} />

            <Text style={styles.label}>Gender</Text>
            <View style={styles.pickerContainer}>
              {['male', 'female'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.pickerOption, gender === g && styles.pickerOptionActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.pickerText, gender === g && styles.pickerTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Description & Story</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell a heartwarming story about this paw..."
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={createListingMutation.isPending}>
              {createListingMutation.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>Upload & Publish Listing</Text>
              )}
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
    padding: 16
  },
  formContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 20,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 8
  },
  pickerOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#eae3db',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#faf6f0'
  },
  pickerOptionActive: {
    backgroundColor: '#d97452',
    borderColor: '#d97452'
  },
  pickerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8e8276'
  },
  pickerTextActive: {
    color: '#ffffff'
  },
  submitBtn: {
    backgroundColor: '#d97452',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
