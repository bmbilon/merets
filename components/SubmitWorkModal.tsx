import React, { useState } from 'react';
import { View, Image, Alert, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button, TextInput, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { SupabaseService } from '../lib/supabase-service';

interface SubmitWorkModalProps {
  visible: boolean;
  onDismiss: () => void;
  mentId: string;
  mentTitle: string;
  userId: string;
  onSuccess: () => void;
}

export default function SubmitWorkModal({
  visible,
  onDismiss,
  mentId,
  mentTitle,
  userId,
  onSuccess
}: SubmitWorkModalProps) {
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 3 - selectedPhotos.length
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map(asset => asset.uri);
      setSelectedPhotos([...selectedPhotos, ...newPhotos].slice(0, 3));
    }
  };

  const takePhoto = async () => {
    try {
      // Check if camera is available
      const cameraAvailable = await ImagePicker.getCameraPermissionsAsync();
      
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your camera');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedPhotos([...selectedPhotos, result.assets[0].uri].slice(0, 3));
      }
    } catch (error) {
      console.log('[CAMERA] Camera not available (simulator?):', error);
      Alert.alert(
        'Camera not available',
        'Camera is not available on simulator. Please use "Choose from Library" instead.',
        [{ text: 'OK' }]
      );
    }
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos(selectedPhotos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      console.log('[SUBMIT] Starting submission for commitment ID:', mentId);
      console.log('[SUBMIT] User ID:', userId);
      
      // Upload photos to Supabase storage (optional)
      const uploadedUrls: string[] = [];
      if (selectedPhotos.length > 0) {
        console.log('[SUBMIT] Uploading photos...');
        for (const photoUri of selectedPhotos) {
          console.log('[SUBMIT] Uploading photo:', photoUri);
          const url = await SupabaseService.uploadPhoto(photoUri, userId);
          if (url) {
            uploadedUrls.push(url);
            console.log('[SUBMIT] Photo uploaded:', url);
          }
        }
      }

      console.log('[SUBMIT] Creating submission record...');
      
      // Submit commitment (photos and notes are optional)
      const result = await SupabaseService.submitCommitment(
        mentId,
        uploadedUrls,
        submissionNotes || 'Task completed',
        userId
      );

      if (result.success) {
        console.log('[SUBMIT] Submission successful!');
        
        Alert.alert(
          'Submitted! 🎉',
          'Your work has been submitted for parent approval. You\'ll be notified when it\'s reviewed!',
          [{ 
            text: 'OK', 
            onPress: () => {
              // Reset form
              setSubmissionNotes('');
              setSelectedPhotos([]);
              onDismiss();
              onSuccess();
            }
          }]
        );
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('[SUBMIT] Error submitting:', error);
      Alert.alert('Error', 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={{
          backgroundColor: 'white',
          padding: 20,
          margin: 20,
          borderRadius: 16,
          maxHeight: '85%'
        }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 8 }}>
            Submit Your Work
          </Text>

          <Text variant="titleMedium" style={{ marginBottom: 20, color: '#666' }}>
            {mentTitle}
          </Text>

          {/* Photo Upload */}
          <View style={{ marginBottom: 20 }}>
            <Text variant="bodyLarge" style={{ marginBottom: 12, fontWeight: '600' }}>
              Proof of Completion <Text style={{ color: '#999' }}>(Optional)</Text>
            </Text>
            
            {/* Selected Photos */}
            {selectedPhotos.length > 0 && (
              <View style={{ 
                flexDirection: 'row', 
                flexWrap: 'wrap', 
                gap: 8, 
                marginBottom: 12 
              }}>
                {selectedPhotos.map((uri, index) => (
                  <View key={index} style={{ position: 'relative' }}>
                    <Image
                      source={{ uri }}
                      style={{ 
                        width: 90, 
                        height: 90, 
                        borderRadius: 12,
                        backgroundColor: '#f0f0f0'
                      }}
                    />
                    <IconButton
                      icon="close-circle"
                      size={24}
                      iconColor="#f44336"
                      onPress={() => removePhoto(index)}
                      style={{ 
                        position: 'absolute', 
                        top: -8, 
                        right: -8, 
                        backgroundColor: 'white',
                        margin: 0
                      }}
                    />
                  </View>
                ))}
              </View>
            )}

            {/* Photo Action Buttons */}
            {selectedPhotos.length < 3 && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button
                  mode="outlined"
                  icon="camera"
                  onPress={takePhoto}
                  style={{ flex: 1, borderRadius: 12 }}
                  contentStyle={{ paddingVertical: 4 }}
                >
                  Take Photo
                </Button>
                <Button
                  mode="outlined"
                  icon="image"
                  onPress={pickImage}
                  style={{ flex: 1, borderRadius: 12 }}
                  contentStyle={{ paddingVertical: 4 }}
                >
                  Choose ({selectedPhotos.length}/3)
                </Button>
              </View>
            )}

            <Text variant="bodySmall" style={{ color: '#999', marginTop: 8 }}>
              Photos are optional - you can submit with just a click!
            </Text>
          </View>

          {/* Notes */}
          <View style={{ marginBottom: 24 }}>
            <Text variant="bodyLarge" style={{ marginBottom: 8, fontWeight: '600' }}>
              Notes (Optional)
            </Text>
            <TextInput
              mode="outlined"
              placeholder="Any notes about the work you did..."
              value={submissionNotes}
              onChangeText={setSubmissionNotes}
              multiline
              numberOfLines={4}
              style={{ borderRadius: 12 }}
              maxLength={500}
            />
            <Text variant="bodySmall" style={{ color: '#999', marginTop: 4 }}>
              {submissionNotes.length}/500 characters
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button
              mode="outlined"
              onPress={onDismiss}
              style={{ flex: 1, borderRadius: 12 }}
              contentStyle={{ paddingVertical: 8 }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={{ flex: 1, borderRadius: 12 }}
              contentStyle={{ paddingVertical: 8 }}
              buttonColor="#4CAF50"
              loading={submitting}
              disabled={submitting}
            >
              Submit Work
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}
