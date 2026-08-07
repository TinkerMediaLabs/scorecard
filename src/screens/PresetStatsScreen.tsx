import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../App';
import Text from '../components/AppText';
import { listPresets, loadAllScorecards } from '../lib/storage';
import { ThemePalette, THEMES } from '../lib/themes';
import { Preset, Scorecard } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'PresetStats'>;

type GameRecord = {
  value: number;
  playerName: string;
  cardName: string;
  date: string;
};

function computeStats(cards: Scorecard[], lowestScoreWins: boolean) {
  let highestTotal: GameRecord | null = null;
  let bestRound: GameRecord | null = null;
  let winningScoreSum = 0;
  let roundsSum = 0;

  for (const card of cards) {
    const totals = card.players.map((p) =>
      card.rounds.reduce((sum, r) => sum + (r.scores[p.id] ?? 0), 0)
    );

    card.players.forEach((p, i) => {
      const total = totals[i];
      if (!highestTotal || total > highestTotal.value) {
        highestTotal = { value: total, playerName: p.name, cardName: card.name, date: card.updatedAt };
      }
    });

    if (totals.length > 0) {
      const gameBest = lowestScoreWins ? Math.min(...totals) : Math.max(...totals);
      winningScoreSum += gameBest;
    }
    roundsSum += card.rounds.length;

    for (const round of card.rounds) {
      for (const p of card.players) {
        const score = round.scores[p.id];
        if (score == null) continue;
        const isBetter = bestRound ? (lowestScoreWins ? score < bestRound.value : score > bestRound.value) : true;
        if (isBetter) {
          bestRound = { value: score, playerName: p.name, cardName: card.name, date: card.updatedAt };
        }
      }
    }
  }

  return {
    gamesPlayed: cards.length,
    highestTotal,
    bestRound,
    averageWinningScore: cards.length ? Math.round(winningScoreSum / cards.length) : 0,
    averageRounds: cards.length ? Math.round((roundsSum / cards.length) * 10) / 10 : 0,
  };
}

export default function PresetStatsScreen({ route, navigation }: Props) {
  const { presetId } = route.params;
  const [preset, setPreset] = useState<Preset | null>(null);
  const [games, setGames] = useState<Scorecard[]>([]);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      listPresets().then((presets) => {
        setPreset(presets.find((p) => p.id === presetId) ?? null);
      });
      loadAllScorecards().then((cards) => {
        const finished = cards
          .filter((c) => c.presetId === presetId && c.status === 'finished')
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        setGames(finished);
      });
    }, [presetId])
  );

  if (!preset) {
    return (
      <View style={styles.center}>
        <Text>Loading…</Text>
      </View>
    );
  }

  const theme = THEMES[preset.settings.theme];
  const stats = computeStats(games, preset.settings.lowestScoreWins);

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 20, color: theme.text }}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {preset.name}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {stats.gamesPlayed === 0 ? (
          <Text style={[styles.empty, { color: theme.mutedText }]}>
            No finished games yet. Stats show up here once a scorecard created from this preset is finished.
          </Text>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <StatTile theme={theme} value={String(stats.gamesPlayed)} label="Games Played" />
              <StatTile theme={theme} value={String(stats.averageWinningScore)} label="Avg. Winning Score" />
              <StatTile theme={theme} value={String(stats.averageRounds)} label="Avg. Rounds / Game" />
            </View>

            {stats.highestTotal && (
              <RecordCard theme={theme} title="Most Points Scored" record={stats.highestTotal} />
            )}

            {stats.bestRound && (
              <RecordCard
                theme={theme}
                title={preset.settings.lowestScoreWins ? 'Best (Lowest) Round Score' : 'Best (Highest) Round Score'}
                record={stats.bestRound}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StatTile({ theme, value, label }: { theme: ThemePalette; value: string; label: string }) {
  return (
    <View style={[styles.statTile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.mutedText }]}>{label}</Text>
    </View>
  );
}

function RecordCard({ theme, title, record }: { theme: ThemePalette; title: string; record: GameRecord }) {
  return (
    <View style={[styles.recordCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.recordTitle, { color: theme.mutedText }]}>{title}</Text>
      <Text style={[styles.recordValue, { color: theme.text }]}>{record.value}</Text>
      <Text style={[styles.recordMeta, { color: theme.mutedText }]}>
        {record.playerName} · {record.cardName} · {new Date(record.date).toLocaleDateString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { textAlign: 'center', marginTop: 60, fontSize: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  statTile: { width: '31%', borderRadius: 10, borderWidth: 1, padding: 12, alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 4, textAlign: 'center' },
  recordCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 12 },
  recordTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  recordValue: { fontSize: 28, fontWeight: '800' },
  recordMeta: { fontSize: 12, marginTop: 4 },
});