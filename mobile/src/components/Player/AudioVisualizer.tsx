import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface AudioVisualizerProps {
  isPlaying: boolean;
  barCount?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isPlaying, barCount = 18 }) => {
  const animatedValues = useRef<Animated.Value[]>(
    Array.from({ length: barCount }).map(() => new Animated.Value(4))
  ).current;

  useEffect(() => {
    if (!isPlaying) {
      animatedValues.forEach((val) => val.setValue(4));
      return;
    }

    const animations = animatedValues.map((val, i) => {
      const targetHeight = 12 + ((i * 7) % 24);
      return Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: targetHeight,
            duration: 350 + (i % 4) * 80,
            useNativeDriver: false,
          }),
          Animated.timing(val, {
            toValue: 4,
            duration: 350 + (i % 4) * 80,
            useNativeDriver: false,
          }),
        ])
      );
    });

    animations.forEach((anim) => anim.start());

    return () => {
      animations.forEach((anim) => anim.stop());
    };
  }, [isPlaying]);

  return (
    <View style={styles.container}>
      {animatedValues.map((anim, idx) => (
        <Animated.View
          key={idx}
          style={[
            styles.bar,
            {
              height: anim,
              backgroundColor: isPlaying ? (idx % 2 === 0 ? '#8b5cf6' : '#ec4899') : '#334155',
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    gap: 4,
    paddingHorizontal: 12,
  },
  bar: {
    width: 3.5,
    borderRadius: 99,
  },
});
