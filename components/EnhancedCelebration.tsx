import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';
import { Modal, Portal, Text } from 'react-native-paper';
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
  earnedAmount = 0,
  earnedXP = 0,
  leveledUp = false,
  newLevel = 1,
  taskTitle = 'Task'
}: EnhancedCelebrationProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
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

      // Fade in and scale up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true
        })
      ]).start();

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

      // Auto-close after animation
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }).start(() => {
          onComplete();
          // Reset animations
          fadeAnim.setValue(0);
          scaleAnim.setValue(0.5);
          confettiAnims.forEach(anim => {
            anim.x.setValue(Math.random() * width);
            anim.y.setValue(-50);
            anim.rotation.setValue(0);
            anim.opacity.setValue(1);
          });
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const confettiColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

  return (
    <Portal>
      <Modal
        visible={visible}
        dismissable={false}
        contentContainerStyle={styles.modal}
      >
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

        {/* Main Content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {leveledUp ? (
            // Level Up Animation
            <>
              <Text style={styles.levelUpEmoji}>🎉</Text>
              <Text style={styles.levelUpTitle}>LEVEL UP!</Text>
              <Text style={styles.levelUpLevel}>Level {newLevel}</Text>
              <Text style={styles.levelUpSubtext}>You're getting stronger!</Text>
            </>
          ) : (
            // Regular Completion
            <>
              <Text style={styles.emoji}>✨</Text>
              <Text style={styles.title}>Committed!</Text>
              <Text style={styles.taskName}>{taskTitle}</Text>
              
              {earnedAmount > 0 && (
                <View style={styles.rewardRow}>
                  <Text style={styles.rewardLabel}>💰</Text>
                  <Text style={styles.rewardValue}>${earnedAmount.toFixed(2)}</Text>
                </View>
              )}
              
              {earnedXP > 0 && (
                <View style={styles.rewardRow}>
                  <Text style={styles.rewardLabel}>⭐</Text>
                  <Text style={styles.rewardValue}>+{earnedXP} XP</Text>
                </View>
              )}
            </>
          )}
        </Animated.View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2
  },
  content: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 8
  },
  taskName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center'
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6
  },
  rewardLabel: {
    fontSize: 24,
    marginRight: 8
  },
  rewardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32'
  },
  levelUpEmoji: {
    fontSize: 80,
    marginBottom: 16
  },
  levelUpTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
    textShadowColor: '#FF6B00',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  levelUpLevel: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 8
  },
  levelUpSubtext: {
    fontSize: 18,
    color: '#666',
    fontStyle: 'italic'
  }
});
