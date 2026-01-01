import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

interface CelebrationOverlayProps {
  visible: boolean;
  message?: string;
}

export default function CelebrationOverlay({ visible, message = "🎉 Committed!" }: CelebrationOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  
  // Create multiple confetti pieces
  const confettiAnims = useRef(
    Array.from({ length: 50 }, () => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-50),
      rotation: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Fade in and scale up the message
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate confetti falling
      confettiAnims.forEach((confetti, index) => {
        Animated.parallel([
          Animated.timing(confetti.y, {
            toValue: height + 100,
            duration: 2000 + Math.random() * 1000,
            delay: index * 20,
            useNativeDriver: true,
          }),
          Animated.timing(confetti.rotation, {
            toValue: Math.random() * 720 - 360,
            duration: 2000 + Math.random() * 1000,
            delay: index * 20,
            useNativeDriver: true,
          }),
        ]).start();
      });

      // Fade out after 2 seconds
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 2000);
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
      confettiAnims.forEach(confetti => {
        confetti.y.setValue(-50);
        confetti.rotation.setValue(0);
      });
    }
  }, [visible]);

  if (!visible) return null;

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Confetti pieces */}
      {confettiAnims.map((confetti, index) => {
        const color = colors[index % colors.length];
        return (
          <Animated.View
            key={index}
            style={[
              styles.confetti,
              {
                backgroundColor: color,
                transform: [
                  { translateX: confetti.x },
                  { translateY: confetti.y },
                  { rotate: confetti.rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }) },
                ],
              },
            ]}
          />
        );
      })}

      {/* Success message */}
      <Animated.View
        style={[
          styles.messageContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  messageContainer: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
});
