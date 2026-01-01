import React from 'react';
import { View } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export default function EmptyState({ 
  icon,
  title,
  message,
  actionLabel,
  onAction,
  compact = false 
}: EmptyStateProps) {
  if (compact) {
    return (
      <View style={{ 
        padding: 24,
        alignItems: 'center'
      }}>
        <IconSymbol size={32} name={icon} color="#ccc" style={{ marginBottom: 8 }} />
        <Text variant="bodyMedium" style={{ color: '#999', textAlign: 'center' }}>
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
      <IconSymbol size={64} name={icon} color="#ccc" style={{ marginBottom: 16 }} />
      <Text variant="headlineSmall" style={{ 
        color: '#999', 
        textAlign: 'center', 
        marginBottom: 8,
        fontWeight: 'bold'
      }}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={{ 
        color: '#999', 
        textAlign: 'center',
        marginBottom: actionLabel ? 16 : 0
      }}>
        {message}
      </Text>
      {actionLabel && onAction && (
        <Button 
          mode="contained" 
          onPress={onAction}
          style={{ borderRadius: 12 }}
        >
          {actionLabel}
        </Button>
      )}
    </Surface>
  );
}
