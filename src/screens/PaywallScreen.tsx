import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../App';
import Text from '../components/AppText';
import { usePurchases } from '../contexts/PurchasesContext';
import { getLifetimeUnlockPriceString } from '../lib/purchases';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

const BENEFITS: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  description: string;
}[] = [
  {
    icon: 'pencil',
    title: 'Unlimited active scorecards',
    description: 'Work on as many games as you want.',
  },
  {
    icon: 'bookmark',
    title: 'Unlimited saved presets',
    description: 'Save as many presets as you need.',
  },
  {
    icon: 'dollar',
    title: 'One payment, yours forever',
    description: "No subscription. Pay once and it's yours.",
  },
  {
    icon: 'refresh',
    title: 'Supports future updates',
    description: 'Get new features as they’re released.',
  },
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
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.iconCircle}>
          <FontAwesome name="unlock-alt" size={44} color="#155843" />
        </View>

        <Text style={styles.title}>
          <Text style={styles.titleAccent}>Unlock</Text>
          <Text style={styles.titleBlack}> Everything</Text>
        </Text>
        <Text style={styles.subtitle}>
          The free version keeps things to one active scorecard and one preset at a time.
        </Text>

        <View style={styles.card}>
          {BENEFITS.map((benefit, i) => (
            <View key={benefit.title}>
              <View style={styles.benefitRow}>
                <View style={styles.benefitIconCircle}>
                  <FontAwesome name={benefit.icon} size={20} color="#155843" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitDescription}>{benefit.description}</Text>
                </View>
              </View>
              {i < BENEFITS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

         <Pressable onPress={handleRestore} disabled={busy !== null} style={styles.restoreButton}>
          {busy === 'restore' ? (
            <ActivityIndicator color="#155843" />
          ) : (
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          )}
        </Pressable>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={handlePurchase}
          disabled={busy !== null}
          style={[styles.purchaseButton, busy !== null && styles.buttonDisabled]}
        >
          {busy === 'purchase' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.purchaseButtonContent}>
              <FontAwesome name="unlock" size={18} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.purchaseButtonText}>
                Unlock Everything{priceString ? ` – ${priceString}` : ''}
              </Text>
            </View>
          )}
        </Pressable>

        <View style={styles.secureRow}>
          <MaterialCommunityIcons name="shield-check-outline" size={16} color="#666" style={{ marginRight: 6 }} />
          <Text style={styles.secureText}>Secure one-time payment</Text>
        </View>

        {/* <Pressable onPress={handleRestore} disabled={busy !== null} style={styles.restoreButton}>
          {busy === 'restore' ? (
            <ActivityIndicator color="#155843" />
          ) : (
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          )}
        </Pressable> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  backArrow: { fontSize: 22, color: '#155843', fontWeight: '700' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, alignItems: 'center' },
  iconCircle: {
    width: 92,
    height: 92,
    borderRadius: 54,
    backgroundColor: '#e6f2ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 14, textAlign: 'center' },
  titleAccent: { color: '#155843' },
  titleBlack: { color: '#000' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  benefitRow: { flexDirection: 'row', alignItems: 'center' },
  benefitIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e6f2ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  benefitTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  benefitDescription: { fontSize: 13, color: '#777', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 14 },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  purchaseButton: {
    width: '100%',
    backgroundColor: '#155843',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#155843',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  purchaseButtonContent: { flexDirection: 'row', alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  purchaseButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  secureText: { fontSize: 13, color: '#666' },
  restoreButton: { paddingVertical: 20, alignItems: 'center' },
  restoreButtonText: { color: '#155843', fontSize: 14, fontWeight: '600' },
});