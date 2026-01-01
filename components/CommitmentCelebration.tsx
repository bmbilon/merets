import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

interface CommitmentCelebrationProps {
  visible: boolean;
  onComplete: () => void;
}

export default function CommitmentCelebration({ visible, onComplete }: CommitmentCelebrationProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const confettiAnims = useRef(
    Array.from({ length: 30 }, () => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-50),
      rotation: new Animated.Value(0)
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Animate main message
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

      // Animate confetti
      confettiAnims.forEach((anim, index) => {
        Animated.parallel([
          Animated.timing(anim.y, {
            toValue: height + 100,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true
          }),
          Animated.timing(anim.rotation, {
            toValue: Math.random() * 720 - 360,
            duration: 2000 + Math.random() * 1000,
            useNativeDriver: true
          })
        ]).start();
      });

      // Auto-hide after animation
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true
          })
        ]).start(() => {
          onComplete();
        });
      }, 2500);
    }
  }, [visible]);

  if (!visible) return null;

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        pointerEvents: 'none'
      }}
    >
      {/* Confetti */}
      {confettiAnims.map((anim, index) => (
        <Animated.View
          key={index}
          style={{
            position: 'absolute',
            width: 10,
            height: 10,
            backgroundColor: colors[index % colors.length],
            borderRadius: 5,
            transform: [
              { translateX: anim.x },
              { translateY: anim.y },
              { rotate: anim.rotation.interpolate({
                inputRange: [0, 360],
                outputRange: ['0deg', '360deg']
              })}
            ]
          }}
        />
      ))}

      {/* Main Message */}
      <Animated.View
        style={{
          position: 'absolute',
          top: height * 0.4,
          left: 0,
          right: 0,
          alignItems: 'center',
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }]
        }}
      >
        <View
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            paddingHorizontal: 40,
            paddingVertical: 24,
            borderRadius: 20,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8
          }}
        >
          <Text
            variant="headlineMedium"
            style={{
              fontWeight: 'bold',
              color: '#4CAF50',
              textAlign: 'center'
            }}
          >
            🎉 Committed!
          </Text>
          <Text
            variant="bodyMedium"
            style={{
              color: '#666',
              textAlign: 'center',
              marginTop: 8
            }}
          >
            You've got this!
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
