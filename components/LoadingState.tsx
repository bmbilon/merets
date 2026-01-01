import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface LoadingStateProps {
  message?: string;
  icon?: string;
  compact?: boolean;
}

export default function LoadingState({ 
  message = 'Loading...', 
  icon,
  compact = false 
}: LoadingStateProps) {
  if (compact) {
    return (
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12,
        padding: 16 
      }}>
        <ActivityIndicator size="small" color="#2196F3" />
        <Text variant="bodyMedium" style={{ color: '#666' }}>
          {message}
        </Text>
      </View>
    );
  }

  return (
    <Surface style={{ 
      borderRadius: 16,
      padding: 32,
      backgroundColor: '#fff',
      elevation: 2,
      alignItems: 'center'
    }}>
      {icon && (
        <IconSymbol 
          size={48} 
          name={icon} 
          color="#2196F3" 
          style={{ marginBottom: 16 }} 
        />
      )}
      <ActivityIndicator size="large" color="#2196F3" style={{ marginBottom: 16 }} />
      <Text variant="bodyLarge" style={{ color: '#666', textAlign: 'center' }}>
        {message}
      </Text>
    </Surface>
  );
}
