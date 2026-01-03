import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, TextInput, Surface } from 'react-native-paper';

interface PinAuthProps {
  userName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Simple PIN for demo - in production, this should be hashed/secured
const PARENT_PIN = '1234';

export default function PinAuth({ userName, onSuccess, onCancel }: PinAuthProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (pin === PARENT_PIN) {
      setError('');
      onSuccess();
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.card}>
        <Text variant="headlineMedium" style={styles.title}>
          Parent Access Required
        </Text>
        
        <Text variant="bodyLarge" style={styles.subtitle}>
          Enter PIN to access {userName}'s account
        </Text>

        <TextInput
          mode="outlined"
          label="PIN"
          value={pin}
          onChangeText={(text) => {
            setPin(text);
            setError('');
          }}
          secureTextEntry
          keyboardType="number-pad"
          maxLength={4}
          style={styles.input}
          error={!!error}
          autoFocus
          onSubmitEditing={handleSubmit}
        />

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        <View style={styles.hint}>
          <Text variant="bodySmall" style={styles.hintText}>
            💡 Demo PIN: 1234
          </Text>
        </View>

        <View style={styles.buttons}>
          <Button
            mode="outlined"
            onPress={onCancel}
            style={styles.button}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            disabled={pin.length < 4}
          >
            Unlock
          </Button>
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  input: {
    marginBottom: 8,
  },
  error: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 8,
  },
  hint: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  hintText: {
    textAlign: 'center',
    color: '#1976d2',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
