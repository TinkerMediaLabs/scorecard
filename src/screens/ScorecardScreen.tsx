import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { useCallback, useState } from 'react';
import { Alert, Dimensions, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { PIConfetti } from 'react-native-fast-confetti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Text from '../components/AppText';

import { RootStackParamList } from '../App';
import RoundTimer from '../components/RoundTimer';
import ScorecardGrid from '../components/ScorecardGrid';
import SettingsModal from '../components/SettingsModal';
import { loadScorecard, saveScorecard } from '../lib/storage';
import { THEMES } from '../lib/themes';
import { Scorecard } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Scorecard'>;

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ScorecardScreen({ route, navigation }: Props) {
  const { scorecardId } = route.params;
  const [card, setCard] = useState<Scorecard | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const insets = useSafeAreaInsets();

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

  const theme = THEMES[card.settings.theme];

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

  const handleRenameCard = (name: string) => persist({ ...card, name });

  const handleRenamePlayer = (playerId: string, name: string) => {
    persist({ ...card, players: card.players.map((p) => (p.id === playerId ? { ...p, name } : p)) });
  };

  const handleDeletePlayer = (playerId: string) => {
    const players = card.players.filter((p) => p.id !== playerId);
    const rounds = card.rounds.map((r) => {
      const { [playerId]: _removed, ...rest } = r.scores;
      return { ...r, scores: rest };
    });
    persist({ ...card, players, rounds });
  };

  const handleUpdateSettings = (patch: Partial<Scorecard['settings']>) => {
    persist({ ...card, settings: { ...card.settings, ...patch } });
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
    Alert.alert('End Game?', 'This marks the scorecard finished and moves it to history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        style: 'destructive',
        onPress: () => {
          persist({ ...card, status: 'finished' });
          setShowConfetti(true);
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.toolbar,
          { paddingTop: insets.top, backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 20, color: theme.text }}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{card.name}</Text>
        <Pressable onPress={() => setSettingsVisible(true)} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 20 }}>⚙️</Text>
        </Pressable>
        <TouchableOpacity onPress={finishScorecard} style={[styles.finishButton, { backgroundColor: theme.accent }]}>
          <Text style={[styles.finishText, { color: theme.accentText }]}>Finish</Text>
        </TouchableOpacity>
      </View>

      {card.settings.timerEnabled && (
        <RoundTimer
          theme={theme}
          roundSeconds={card.settings.timerRoundSeconds}
          warningEnabled={card.settings.timerWarningEnabled}
          doneSound={card.settings.timerDoneSound}
          tickerSound={card.settings.timerTickerSound}
        />
      )}

      <ScorecardGrid
        bottomInset={insets.bottom}
        theme={theme}
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

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        cardName={card.name}
        onRenameCard={handleRenameCard}
        players={card.players}
        onRenamePlayer={handleRenamePlayer}
        onDeletePlayer={handleDeletePlayer}
        settings={card.settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {showConfetti && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <PIConfetti autoplay containerStyle={{ flex: 1 }} onAnimationEnd={() => navigation.goBack()}>
            <PIConfetti.Origin blastPosition="center" count={200}>
              <PIConfetti.Flake size={10} radius={3} />
            </PIConfetti.Origin>
          </PIConfetti>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '700', flex: 1 },
  finishButton: { borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  finishText: { fontWeight: '600' },
});