import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { useCallback, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { RootStackParamList } from '../App';
import ScorecardGrid from '../components/ScorecardGrid';
import { loadScorecard, saveScorecard } from '../lib/storage';
import { Scorecard } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Scorecard'>;

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ScorecardScreen({ route, navigation }: Props) {
  const { scorecardId } = route.params;
  const [card, setCard] = useState<Scorecard | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadScorecard(scorecardId).then(setCard);
    }, [scorecardId])
  );

  if (!card) {
    return (
      <View style={styles.center}>
        <Text>Loading…</Text>
      </View>
    );
  }

  const persist = (updated: Scorecard) => {
    setCard(updated);
    saveScorecard(updated);
  };

  const handleScoreChange = (roundId: string, playerId: string, value: number | null) => {
    const rounds = card.rounds.map((r) =>
      r.id === roundId ? { ...r, scores: { ...r.scores, [playerId]: value } } : r
    );
    persist({ ...card, rounds });
  };

  const handleAddRound = () => {
    persist({ ...card, rounds: [...card.rounds, { id: Crypto.randomUUID(), scores: {} }] });
  };

  const handleAddPlayer = () => {
    const newPlayer = { id: Crypto.randomUUID(), name: `Player ${card.players.length + 1}` };
    persist({ ...card, players: [...card.players, newPlayer] });
  };

  const totals = card.players.map((p) =>
    card.rounds.reduce((sum, r) => sum + (r.scores[p.id] ?? 0), 0)
  );

  const roundWinsCount = card.players.map((_, playerIndex) =>
    card.rounds.reduce((count, r) => {
      const scores = card.players.map((p) => r.scores[p.id] ?? null);
      const values = scores.filter((v): v is number => v !== null);
      if (values.length === 0) return count;
      const best = card.settings.lowestScoreWins ? Math.min(...values) : Math.max(...values);
      return scores[playerIndex] === best ? count + 1 : count;
    }, 0)
  );

  const leaderTotal = totals.length
    ? card.settings.lowestScoreWins
      ? Math.min(...totals)
      : Math.max(...totals)
    : 0;

  const finishScorecard = () => {
    persist({ ...card, status: 'finished' });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Text style={styles.title} numberOfLines={1}>{card.name}</Text>
        <TouchableOpacity onPress={finishScorecard} style={styles.finishButton}>
          <Text style={styles.finishText}>Finish</Text>
        </TouchableOpacity>
      </View>

      <ScorecardGrid
        players={card.players}
        rounds={card.rounds}
        totals={totals}
        roundWinsCount={roundWinsCount}
        leaderTotal={leaderTotal}
        useRomanNumerals={card.settings.useRomanNumerals}
        onScoreChange={handleScoreChange}
        onAddPlayer={handleAddPlayer}
        onAddRound={handleAddRound}
        screenWidth={SCREEN_WIDTH}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  finishButton: { backgroundColor: '#155843', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  finishText: { color: '#fff', fontWeight: '600' },
});