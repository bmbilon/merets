import React from 'react';
import { View, Modal } from 'react-native';
import { Surface, Text, Button, Divider } from 'react-native-paper';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface ReceiptItem {
  label: string;
  value: string;
  highlight?: boolean;
  icon?: string;
}

interface ReceiptCardProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  subtitle?: string;
  icon: string;
  iconColor: string;
  items: ReceiptItem[];
  nextSteps?: string[];
  primaryAction?: {
    label: string;
    onPress: () => void;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
}

export default function ReceiptCard({
  visible,
  onDismiss,
  title,
  subtitle,
  icon,
  iconColor,
  items,
  nextSteps,
  primaryAction,
  secondaryAction,
}: ReceiptCardProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={{ 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 20
      }}>
        <Surface style={{ 
          width: '100%',
          maxWidth: 400,
          borderRadius: 24,
          padding: 24,
          backgroundColor: '#fff'
        }}>
          {/* Icon */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{ 
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: `${iconColor}20`,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <IconSymbol size={40} name={icon as any} color={iconColor} />
            </View>
            
            <Text variant="headlineSmall" style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: 4 }}>
              {title}
            </Text>
            
            {subtitle && (
              <Text variant="bodyMedium" style={{ color: '#666', textAlign: 'center' }}>
                {subtitle}
              </Text>
            )}
          </View>

          <Divider style={{ marginBottom: 16 }} />

          {/* Receipt Items */}
          <View style={{ marginBottom: 16 }}>
            {items.map((item, index) => (
              <View 
                key={index}
                style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: index < items.length - 1 ? 1 : 0,
                  borderBottomColor: '#f0f0f0'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {item.icon && (
                    <IconSymbol size={18} name={item.icon as any} color="#666" />
                  )}
                  <Text variant="bodyMedium" style={{ color: '#666' }}>
                    {item.label}
                  </Text>
                </View>
                <Text 
                  variant="bodyLarge" 
                  style={{ 
                    fontWeight: item.highlight ? 'bold' : 'normal',
                    color: item.highlight ? iconColor : '#333'
                  }}
                >
                  {item.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Next Steps */}
          {nextSteps && nextSteps.length > 0 && (
            <>
              <Divider style={{ marginBottom: 16 }} />
              <View style={{ marginBottom: 16 }}>
                <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 12 }}>
                  What's Next
                </Text>
                {nextSteps.map((step, index) => (
                  <View key={index} style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
                    <Text style={{ color: iconColor, fontWeight: 'bold' }}>•</Text>
                    <Text variant="bodyMedium" style={{ flex: 1, color: '#666' }}>
                      {step}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Actions */}
          <View style={{ gap: 8 }}>
            {primaryAction && (
              <Button
                mode="contained"
                onPress={primaryAction.onPress}
                style={{ borderRadius: 12 }}
                contentStyle={{ paddingVertical: 8 }}
              >
                {primaryAction.label}
              </Button>
            )}
            {secondaryAction && (
              <Button
                mode="outlined"
                onPress={secondaryAction.onPress}
                style={{ borderRadius: 12 }}
                contentStyle={{ paddingVertical: 8 }}
              >
                {secondaryAction.label}
              </Button>
            )}
            {!primaryAction && !secondaryAction && (
              <Button
                mode="contained"
                onPress={onDismiss}
                style={{ borderRadius: 12 }}
                contentStyle={{ paddingVertical: 8 }}
              >
                Got it
              </Button>
            )}
          </View>
        </Surface>
      </View>
    </Modal>
  );
}
