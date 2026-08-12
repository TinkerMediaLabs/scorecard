import { FontAwesome } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import Text from './AppText';

export type SwipeAction = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  onPress: () => void;
};

type Props = {
  children: ReactNode;
  actions: SwipeAction[];
  onPress: () => void;
  cardStyle?: ViewStyle;
};

const ACTION_WIDTH = 64;

export default function SwipeableCard({ children, actions, onPress, cardStyle }: Props) {
  const trayWidth = actions.length * ACTION_WIDTH;
  const translateX = useSharedValue(0);
  const isOpen = useSharedValue(false);

  const close = () => {
    'worklet';
    translateX.value = withTiming(0, { duration: 200 });
    isOpen.value = false;
  };

  const openFully = () => {
    'worklet';
    translateX.value = withTiming(-trayWidth, { duration: 200 });
    isOpen.value = true;
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      const base = isOpen.value ? -trayWidth : 0;
      const next = base + e.translationX;
      translateX.value = Math.min(0, Math.max(-trayWidth, next));
    })
    .onEnd((e) => {
      const midpoint = -trayWidth / 2;
      const pastHalfway = translateX.value < midpoint;
      if (pastHalfway || e.velocityX < -500) {
        openFully();
      } else {
        close();
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const indicatorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, -16], [1, 0], Extrapolation.CLAMP),
  }));

  const handleCardPress = () => {
    if (isOpen.value) {
      close();
    } else {
      onPress();
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.trayContainer, { width: trayWidth }]}>
        {actions.map((action) => (
          <Pressable
            key={action.key}
            style={[styles.actionButton, { backgroundColor: action.color, width: ACTION_WIDTH }]}
            onPress={() => {
              close();
              action.onPress();
            }}
          >
            <FontAwesome name={action.icon} size={20} color="#fff" />
            <Text style={styles.actionLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.card, cardStyle, cardAnimatedStyle]}>
          <Pressable style={styles.pressableContent} onPress={handleCardPress}>
            {children}
          </Pressable>
          <Animated.View style={[styles.swipeIndicator, indicatorAnimatedStyle]} pointerEvents="none">
            <FontAwesome name="chevron-left" size={11} color="#e8e8e8" />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative', marginBottom: 10 },
  trayContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
  },
  actionButton: { alignItems: 'center', justifyContent: 'center', height: '100%' },
  actionLabel: { color: '#fff', fontSize: 11, marginTop: 4, fontWeight: '600' },
  card: {},
  pressableContent: { flex: 1 },
    swipeIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 18,
    backgroundColor: '#555555',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    },
});