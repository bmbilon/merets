import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { Modal, Portal, Text, Button } from 'react-native-paper';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface CelebrationModalProps {
  visible: boolean;
  onDismiss: () => void;
  type: 'approval' | 'levelup' | 'achievement' | 'streak';
  data: {
    title?: string;
    subtitle?: string;
    xpEarned?: number;
    creditsEarned?: number;
    tipAmount?: number;
    totalEarned?: number;
    newLevel?: number;
    achievementName?: string;
    streakDays?: number;
  };
}

export default function CelebrationModal({
  visible,
  onDismiss,
  type,
  data
}: CelebrationModalProps) {
  const confettiRef = useRef<any>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const coinAnim = useRef(new Animated.Value(0)).current;
  
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Fire confetti
      if (confettiRef.current) {
        confettiRef.current.start();
      }

      // Animate entrance
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();

      // Animate coins
      if (data.creditsEarned || data.totalEarned) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(coinAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true
            }),
            Animated.timing(coinAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true
            })
          ])
        ).start();
      }
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      coinAnim.setValue(0);
    }
  }, [visible]);

  const getIcon = () => {
    switch (type) {
      case 'approval':
        return 'checkmark.circle.fill';
      case 'levelup':
        return 'arrow.up.circle.fill';
      case 'achievement':
        return 'trophy.fill';
      case 'streak':
        return 'flame.fill';
      default:
        return 'star.fill';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'approval':
        return '#4CAF50';
      case 'levelup':
        return '#FF9800';
      case 'achievement':
        return '#FFD700';
      case 'streak':
        return '#FF5722';
      default:
        return '#2196F3';
    }
  };

  const coinTranslateY = coinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -100]
  });

  const coinOpacity = coinAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1, 0]
  });

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={{
          backgroundColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}
      >
        {/* Confetti */}
        {visible && (
          <ConfettiCannon
            ref={confettiRef}
            count={200}
            origin={{ x: screenWidth / 2, y: screenHeight / 2 }}
            autoStart={false}
            fadeOut={true}
            explosionSpeed={350}
            fallSpeed={2500}
          />
        )}

        {/* Main Content */}
        <Animated.View
          style={{
            backgroundColor: 'white',
            borderRadius: 24,
            padding: 32,
            alignItems: 'center',
            width: '100%',
            maxWidth: 400,
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim
          }}
        >
          {/* Icon */}
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: `${getColor()}20`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24
            }}
          >
            <IconSymbol size={60} name={getIcon()} color={getColor()} />
          </View>

          {/* Title */}
          <Text
            variant="headlineMedium"
            style={{
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 8
            }}
          >
            {data.title || 'Congratulations!'}
          </Text>

          {/* Subtitle */}
          {data.subtitle && (
            <Text
              variant="bodyLarge"
              style={{
                color: '#666',
                textAlign: 'center',
                marginBottom: 24
              }}
            >
              {data.subtitle}
            </Text>
          )}

          {/* Stats */}
          <View style={{ width: '100%', marginBottom: 24 }}>
            {/* XP Earned */}
            {data.xpEarned !== undefined && data.xpEarned > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#F3E5F5',
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <IconSymbol size={24} name="star.fill" color="#9C27B0" />
                  <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                    XP Earned
                  </Text>
                </View>
                <Text
                  variant="headlineSmall"
                  style={{ fontWeight: 'bold', color: '#9C27B0' }}
                >
                  +{data.xpEarned}
                </Text>
              </View>
            )}

            {/* Credits Earned */}
            {data.totalEarned !== undefined && data.totalEarned > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#E8F5E9',
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12,
                  position: 'relative',
                  overflow: 'visible'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <IconSymbol size={24} name="dollarsign.circle.fill" color="#4CAF50" />
                  <View>
                    <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                      Total Earned
                    </Text>
                    {data.tipAmount && data.tipAmount > 0 && (
                      <Text variant="bodySmall" style={{ color: '#666' }}>
                        Includes ${data.tipAmount.toFixed(2)} tip!
                      </Text>
                    )}
                  </View>
                </View>
                <Text
                  variant="headlineSmall"
                  style={{ fontWeight: 'bold', color: '#4CAF50' }}
                >
                  ${data.totalEarned.toFixed(2)}
                </Text>

                {/* Animated Coins */}
                {[0, 1, 2].map((index) => (
                  <Animated.View
                    key={index}
                    style={{
                      position: 'absolute',
                      right: 20 + index * 15,
                      bottom: 16,
                      transform: [
                        { translateY: coinTranslateY },
                        { rotate: `${index * 30}deg` }
                      ],
                      opacity: coinOpacity
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>💰</Text>
                  </Animated.View>
                ))}
              </View>
            )}

            {/* Level Up */}
            {data.newLevel !== undefined && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#FFF3E0',
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <IconSymbol size={24} name="arrow.up.circle.fill" color="#FF9800" />
                  <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                    New Level
                  </Text>
                </View>
                <Text
                  variant="headlineSmall"
                  style={{ fontWeight: 'bold', color: '#FF9800' }}
                >
                  Level {data.newLevel}
                </Text>
              </View>
            )}

            {/* Achievement */}
            {data.achievementName && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: '#FFF9C4',
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 12
                }}
              >
                <IconSymbol size={24} name="trophy.fill" color="#F57F17" />
                <Text variant="titleMedium" style={{ fontWeight: '600', flex: 1 }}>
                  {data.achievementName}
                </Text>
              </View>
            )}

            {/* Streak */}
            {data.streakDays !== undefined && data.streakDays > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#FFEBEE',
                  padding: 16,
                  borderRadius: 12
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <IconSymbol size={24} name="flame.fill" color="#FF5722" />
                  <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                    Streak
                  </Text>
                </View>
                <Text
                  variant="headlineSmall"
                  style={{ fontWeight: 'bold', color: '#FF5722' }}
                >
                  {data.streakDays} days 🔥
                </Text>
              </View>
            )}
          </View>

          {/* Action Button */}
          <Button
            mode="contained"
            onPress={onDismiss}
            style={{ borderRadius: 12, width: '100%' }}
            contentStyle={{ paddingVertical: 8 }}
            buttonColor={getColor()}
          >
            Awesome!
          </Button>
        </Animated.View>
      </Modal>
    </Portal>
  );
}
