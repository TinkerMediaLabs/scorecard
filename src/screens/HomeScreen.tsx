import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../App';
import Text from '../components/AppText';
import ScorecardListItem from '../components/ScorecardListItem';
import { clearAllData, deleteScorecard, loadAllScorecards, saveScorecard } from '../lib/storage';
import { DEFAULT_SETTINGS, Scorecard } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const insets = useSafeAreaInsets();

  const reload = useCallback(() => {
    loadAllScorecards().then((cards) => {
      const active = cards
        .filter((c) => c.status === 'active')
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      setScorecards(active);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const createNewScorecard = async () => {
    const now = new Date().toISOString();
    const newCard: Scorecard = {
      id: Crypto.randomUUID(),
      name: new Date().toLocaleDateString(),
      status: 'active',
      createdAt: now,
      updatedAt: now,
      players: [
        { id: Crypto.randomUUID(), name: 'Player 1' },
        { id: Crypto.randomUUID(), name: 'Player 2' },
      ],
      rounds: [{ id: Crypto.randomUUID(), scores: {} }],
      settings: DEFAULT_SETTINGS,
    };
    await saveScorecard(newCard);
    navigation.navigate('Scorecard', { scorecardId: newCard.id });
  };

  const handleDelete = async (id: string) => {
    await deleteScorecard(id);
    reload();
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data?',
      'This permanently deletes every scorecard, in progress and finished. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            reload();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Universal Scorecard</Text>
        <TouchableOpacity onPress={() => navigation.navigate('History')}>
          <Text style={styles.historyLink}>History</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.newButton} onPress={createNewScorecard}>
        <Text style={styles.newButtonText}>+ New Scorecard</Text>
      </TouchableOpacity>

      <FlatList
        data={scorecards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No scorecards yet.</Text>}
        renderItem={({ item }) => (
          <ScorecardListItem
            card={item}
            onPress={() => navigation.navigate('Scorecard', { scorecardId: item.id })}
            onDelete={() => handleDelete(item.id)}
          />
        )}
      />

      <TouchableOpacity onPress={handleClearAllData} style={styles.clearDataLink}>
        <Text style={styles.clearDataText}>Clear All Data</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '700' },
  historyLink: { fontSize: 15, fontWeight: '600', color: '#155843' },
  newButton: { backgroundColor: '#155843', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 24 },
  newButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  list: { paddingBottom: 20 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  clearDataLink: { alignItems: 'center', paddingVertical: 16 },
  clearDataText: { fontSize: 13, color: '#c0392b' },
});