import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface EnhancedCelebrationProps {
  visible: boolean;
  onComplete: () => void;
  earnedAmount?: number;
  earnedXP?: number;
  leveledUp?: boolean;
  newLevel?: number;
  taskTitle?: string;
}

export default function EnhancedCelebration({
  visible,
  onComplete,
}: EnhancedCelebrationProps) {
  const confettiAnims = useRef(
    Array.from({ length: 50 }, () => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-50),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(1)
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Confetti animation
      confettiAnims.forEach((anim, index) => {
        Animated.parallel([
          Animated.timing(anim.y, {
            toValue: height + 100,
            duration: 2000 + Math.random() * 1000,
            delay: index * 20,
            useNativeDriver: true
          }),
          Animated.timing(anim.rotation, {
            toValue: Math.random() * 720 - 360,
            duration: 2000,
            delay: index * 20,
            useNativeDriver: true
          }),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 2000,
            delay: index * 20 + 1000,
            useNativeDriver: true
          })
        ]).start();
      });

      // Auto-complete after animation
      const timer = setTimeout(() => {
        onComplete();
        // Reset animations
        confettiAnims.forEach(anim => {
          anim.x.setValue(Math.random() * width);
          anim.y.setValue(-50);
          anim.rotation.setValue(0);
          anim.opacity.setValue(1);
        });
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const confettiColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Confetti */}
      {confettiAnims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.confetti,
            {
              transform: [
                { translateX: anim.x },
                { translateY: anim.y },
                { rotate: anim.rotation.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg']
                })}
              ],
              opacity: anim.opacity,
              backgroundColor: confettiColors[index % confettiColors.length]
            }
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2
  }
});
