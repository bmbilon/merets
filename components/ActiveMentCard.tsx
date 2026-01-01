import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Surface, Text, Button, Chip, ProgressBar } from 'react-native-paper';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface ActiveMent {
  id: string;
  title: string;
  description?: string;
  category: string;
  credits: number;
  timeEstimate: string;
  status: 'in_progress' | 'submitted';
  startedAt: string;
  taskTemplateId?: string;
}

interface ActiveMentCardProps {
  ment: ActiveMent;
  onPress: () => void;
  onSubmit: () => void;
}

export default function ActiveMentCard({ ment, onPress, onSubmit }: ActiveMentCardProps) {
  const isSubmitted = ment.status === 'submitted';
  
  // Calculate time since started (mock progress for now)
  const startDate = new Date(ment.startedAt);
  const now = new Date();
  const hoursElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60));
  const daysElapsed = Math.floor(hoursElapsed / 24);
  
  const timeDisplay = daysElapsed > 0 
    ? `${daysElapsed}d ago` 
    : hoursElapsed > 0 
    ? `${hoursElapsed}h ago` 
    : 'Just now';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Surface style={{ 
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        backgroundColor: '#fff',
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: isSubmitted ? '#FF9800' : '#4CAF50'
      }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 4 }}>
              {ment.title}
            </Text>
            <Text variant="bodySmall" style={{ color: '#666' }}>
              {ment.category} • Started {timeDisplay}
            </Text>
          </View>
          <Chip
            compact
            style={{ 
              backgroundColor: isSubmitted ? '#FFF3E0' : '#E8F5E9'
            }}
            textStyle={{ 
              color: isSubmitted ? '#F57C00' : '#2E7D32',
              fontWeight: '600',
              fontSize: 11
            }}
          >
            {isSubmitted ? 'Pending Review' : 'In Progress'}
          </Chip>
        </View>

        {/* Description */}
        {ment.description && (
          <Text variant="bodyMedium" style={{ color: '#666', marginBottom: 12, lineHeight: 20 }}>
            {ment.description}
          </Text>
        )}

        {/* Stats Row */}
        <View style={{ 
          flexDirection: 'row', 
          gap: 16, 
          marginBottom: isSubmitted ? 0 : 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0'
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <IconSymbol size={16} name="dollarsign.circle.fill" color="#4CAF50" />
            <Text variant="bodyMedium" style={{ fontWeight: '600', color: '#4CAF50' }}>
              ${ment.credits}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <IconSymbol size={16} name="clock.fill" color="#666" />
            <Text variant="bodyMedium" style={{ color: '#666' }}>
              {ment.timeEstimate}
            </Text>
          </View>
        </View>

        {/* Submit Button (only show if not submitted) */}
        {!isSubmitted && (
          <Button
            mode="contained"
            onPress={(e) => {
              e.stopPropagation();
              onSubmit();
            }}
            style={{ borderRadius: 12, marginTop: 4 }}
            contentStyle={{ paddingVertical: 4 }}
            buttonColor="#2196F3"
          >
            Submit for Approval
          </Button>
        )}
      </Surface>
    </TouchableOpacity>
  );
}
