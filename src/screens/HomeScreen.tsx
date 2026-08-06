import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { RootStackParamList } from '../App';
import { loadAllScorecards, saveScorecard } from '../lib/storage';
import { DEFAULT_SETTINGS, Scorecard } from '../types';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {

  const insets = useSafeAreaInsets();

  const [scorecards, setScorecards] = useState<Scorecard[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadAllScorecards().then((cards) => {
        cards.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        setScorecards(cards);
      });
    }, [])
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

  return (
<View style={[styles.container, { paddingTop: insets.top + 20 }]}>      
  <Text style={styles.title}>Universal Scorecard</Text>
      <TouchableOpacity style={styles.newButton} onPress={createNewScorecard}>
        <Text style={styles.newButtonText}>+ New Scorecard</Text>
      </TouchableOpacity>

      <FlatList
        data={scorecards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No scorecards yet.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Scorecard', { scorecardId: item.id })}
          >
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardMeta}>
              {item.status === 'finished' ? 'Finished' : 'In progress'} · {item.players.length} players
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: 20, 
    backgroundColor: '#fff' 
  },
  title: { 
    fontSize: 28, 
    fontWeight: '700', 
    marginBottom: 20 
  },
  newButton: {
    backgroundColor: '#155843',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  newButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  list: { paddingBottom: 40 },
  empty: { 
    textAlign: 'center', 
    color: '#888', 
    marginTop: 40 
  },
  card: { 
    backgroundColor: '#f5f5f5', 
    borderRadius: 10, 
    padding: 16, 
    marginBottom: 10 
  },
  cardName: { 
    fontSize: 16, 
    fontWeight: '600' 
  },
  cardMeta: { 
    fontSize: 13, 
    color: '#666', 
    marginTop: 4 
  },
});