import { FontAwesome } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../App';
import Text from '../components/AppText';
import { usePurchases } from '../contexts/PurchasesContext';
import { getLifetimeUnlockPriceString } from '../lib/purchases';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

const { height: SCREEN_H } = Dimensions.get('window');
const DISMISS_THRESHOLD = 120;

const BENEFITS: string[] = [
  'Unlimited active scorecards',
  'Unlimited saved preset scorecards',
  'Access to scorecard themes',
  'Includes all future updates',
];

export default function PaywallScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { isUnlocked, purchase, restore } = usePurchases();
  const [priceString, setPriceString] = useState<string | null>(null);
  const [busy, setBusy] = useState<'purchase' | 'restore' | null>(null);
  const translateY = useSharedValue(0);

  useEffect(() => {
    getLifetimeUnlockPriceString().then(setPriceString);
  }, []);

  useEffect(() => {
    if (isUnlocked) {
      navigation.goBack();
    }
  }, [isUnlocked]);

  const dismiss = () => {
    if (busy !== null) return;
    navigation.goBack();
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_THRESHOLD) {
        translateY.value = withTiming(SCREEN_H, { duration: 200 }, (finished) => {
          if (finished) runOnJS(navigation.goBack)();
        });
      } else {
        translateY.value = withTiming(0, { duration: 200 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handlePurchase = async () => {
    setBusy('purchase');
    const result = await purchase();
    setBusy(null);
    if (!result.success && !result.cancelled) {
      Alert.alert('Purchase Failed', result.errorMessage ?? 'Something went wrong. Please try again.');
    }
  };

  const handleRestore = async () => {
    setBusy('restore');
    const result = await restore();
    setBusy(null);
    if (!result.success) {
      Alert.alert(
        'Nothing to Restore',
        result.errorMessage ?? 'No previous purchase was found for this account.'
      );
    }
  };

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />

      <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }, sheetStyle]}>
        <GestureDetector gesture={pan}>
          <View style={styles.dragHandleArea}>
            <View style={styles.dragHandle} />
          </View>
        </GestureDetector>

        <Text style={styles.title}>Upgrade to Pro</Text>
        <Text style={[styles.priceCaption, { textAlign: 'center' }]}>The free version of the app has limitations. Upgrade to Pro for unlimited scorecards and exclusive features.</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{priceString ?? '$1.99'}</Text>
          <Text style={styles.priceCaption}>Lifetime deal</Text>
        </View>

        <Text style={styles.benefitsLabel}>What you get</Text>
        <View style={styles.benefitsList}>
          {BENEFITS.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <FontAwesome name="check" size={13} color="#155843" style={styles.benefitCheck} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={handlePurchase}
          disabled={busy !== null}
          style={[styles.purchaseButton, busy !== null && styles.buttonDisabled]}
        >
          {busy === 'purchase' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.purchaseButtonText}>Upgrade to Pro</Text>
          )}
        </Pressable>

        <Pressable onPress={handleRestore} disabled={busy !== null} style={styles.restoreButton}>
          {busy === 'restore' ? (
            <ActivityIndicator color="#155843" />
          ) : (
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
  },
  dragHandleArea: { alignItems: 'center', paddingTop: 12, paddingBottom: 16 },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0e0e0',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#111', textAlign: 'center', marginBottom: 4 },
  priceRow: { alignItems: 'center', marginBottom: 22 },
  price: { fontSize: 34, fontWeight: '800', color: '#155843' },
  priceCaption: { fontSize: 13, color: '#888', fontWeight: '600', marginTop: 2 },
  benefitsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  benefitsList: { marginBottom: 24 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  benefitCheck: { width: 20 },
  benefitText: { fontSize: 15, color: '#222', fontWeight: '500' },
  purchaseButton: {
    width: '100%',
    backgroundColor: '#155843',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: { opacity: 0.6 },
  purchaseButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  restoreButton: { paddingVertical: 8, alignItems: 'center' },
  restoreButtonText: { color: '#155843', fontSize: 13, fontWeight: '600' },
});