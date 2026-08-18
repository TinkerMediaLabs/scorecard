import { FontAwesome } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../App';
import Text from '../components/AppText';
import { usePurchases } from '../contexts/PurchasesContext';
import { getLifetimeUnlockPriceString } from '../lib/purchases';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

const BENEFITS = [
  'Unlimited active scorecards at once',
  'Unlimited saved presets',
  'One payment, yours forever — no subscription',
  'Supports future updates to the app',
];

export default function PaywallScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { isUnlocked, purchase, restore } = usePurchases();
  const [priceString, setPriceString] = useState<string | null>(null);
  const [busy, setBusy] = useState<'purchase' | 'restore' | null>(null);

  useEffect(() => {
    getLifetimeUnlockPriceString().then(setPriceString);
  }, []);

  useEffect(() => {
    if (isUnlocked) {
      navigation.goBack();
    }
  }, [isUnlocked]);

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
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <FontAwesome name="unlock-alt" size={28} color="#155843" />
        </View>

        <Text style={styles.title}>Unlock Everything</Text>
        <Text style={styles.subtitle}>
          The free version keeps things to one active scorecard and one preset at a time. Unlock removes
          both limits for good.
        </Text>

        <View style={styles.benefitsList}>
          {BENEFITS.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <FontAwesome name="check-circle" size={18} color="#155843" style={{ marginRight: 10 }} />
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
            <Text style={styles.purchaseButtonText}>
              Unlock Everything{priceString ? ` — ${priceString}` : ''}
            </Text>
          )}
        </Pressable>

        <Pressable onPress={handleRestore} disabled={busy !== null} style={styles.restoreButton}>
          {busy === 'restore' ? (
            <ActivityIndicator color="#155843" />
          ) : (
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20, alignItems: 'center' },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e6f2ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#000', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  benefitsList: { width: '100%', marginBottom: 32 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  benefitText: { fontSize: 15, color: '#333', flex: 1 },
  purchaseButton: {
    width: '100%',
    backgroundColor: '#155843',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  buttonDisabled: { opacity: 0.6 },
  purchaseButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  restoreButton: { paddingVertical: 10 },
  restoreButtonText: { color: '#155843', fontSize: 14, fontWeight: '600' },
});