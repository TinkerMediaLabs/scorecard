import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Alert, Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../App';
import Text from '../components/AppText';
import FinishSummaryModal from '../components/FinishSummaryModal';
import RoundTimer from '../components/RoundTimer';
import ScorecardGrid from '../components/ScorecardGrid';
import SettingsModal from '../components/SettingsModal';

import { loadScorecard, recordPresetGameResult, savePreset, saveScorecard } from '../lib/storage';
import { THEMES } from '../lib/themes';
import { DEFAULT_PRESET_STATS, Scorecard } from '../types';


type Props = NativeStackScreenProps<RootStackParamList, 'Scorecard'>;

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ScorecardScreen({ route, navigation }: Props) {
  const { scorecardId } = route.params;
  const [card, setCard] = useState<Scorecard | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
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
  const darkTheme = card.settings.theme === 'chalkboard' || card.settings.theme === 'midnight';

  const persist = (updater: (prev: Scorecard) => Scorecard) => {
    setCard((prev) => {
      if (!prev) return prev;
      const updated = updater(prev);
      saveScorecard(updated);
      return updated;
    });
  };

  const handleScoreChange = (roundId: string, playerId: string, value: number | null) => {
    persist((prev) => ({
      ...prev,
      rounds: prev.rounds.map((r) =>
        r.id === roundId ? { ...r, scores: { ...r.scores, [playerId]: value } } : r
      ),
    }));
  };

  const handleBidChange = (roundId: string, playerId: string, value: number | null) => {
    persist((prev) => ({
      ...prev,
      rounds: prev.rounds.map((r) =>
        r.id === roundId ? { ...r, bids: { ...r.bids, [playerId]: value } } : r
      ),
    }));
  };

  const handleMeldChange = (roundId: string, playerId: string, value: number | null) => {
    persist((prev) => ({
      ...prev,
      rounds: prev.rounds.map((r) =>
        r.id === roundId ? { ...r, melds: { ...r.melds, [playerId]: value } } : r
      ),
    }));
  };

  const handleBonusChange = (roundId: string, playerId: string, value: number | null) => {
    persist((prev) => ({
      ...prev,
      rounds: prev.rounds.map((r) =>
        r.id === roundId ? { ...r, bonuses: { ...r.bonuses, [playerId]: value } } : r
      ),
    }));
  };

  const handleCustomValueChange = (
    roundId: string,
    playerId: string,
    fieldIndex: number,
    value: number | null
  ) => {
    persist((prev) => ({
      ...prev,
      rounds: prev.rounds.map((r) => {
        if (r.id !== roundId) return r;
        const existing = r.customValues?.[playerId] ?? [];
        const nextValues = [...existing];
        nextValues[fieldIndex] = value;
        return { ...r, customValues: { ...r.customValues, [playerId]: nextValues } };
      }),
    }));
  };

  const handleAddRound = () => {
    persist((prev) => ({
      ...prev,
      rounds: [
        ...prev.rounds,
        { id: Crypto.randomUUID(), scores: {}, bids: {}, melds: {}, bonuses: {}, customValues: {} },
      ],
    }));
  };

  const handleAddPlayer = () => {
    persist((prev) => {
      const newPlayer = { id: Crypto.randomUUID(), name: `Player ${prev.players.length + 1}` };
      return { ...prev, players: [...prev.players, newPlayer] };
    });
  };

  const handleRenameCard = (name: string) => {
    persist((prev) => ({ ...prev, name }));
  };

  const handleRenamePlayer = (playerId: string, name: string) => {
    persist((prev) => ({
      ...prev,
      players: prev.players.map((p) => (p.id === playerId ? { ...p, name } : p)),
    }));
  };

  const handleDeletePlayer = (playerId: string) => {
    persist((prev) => {
      const players = prev.players.filter((p) => p.id !== playerId);
      const rounds = prev.rounds.map((r) => {
        const { [playerId]: _removed, ...rest } = r.scores;
        return { ...r, scores: rest };
      });
      return { ...prev, players, rounds };
    });
  };

  const handleUpdateSettings = (patch: Partial<Scorecard['settings']>) => {
    persist((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  };

  const handleSaveAsPreset = async (name: string, settingsSnapshot: Scorecard['settings']) => {
      await savePreset({
        id: Crypto.randomUUID(),
        name,
        settings: settingsSnapshot,
        createdAt: new Date().toISOString(),
        stats: DEFAULT_PRESET_STATS,
      });
      Alert.alert('Preset Saved', `"${name}" is now available from the Home screen.`);
    };

  const handleShufflePlayers = () => {
    persist((prev) => {
      const shuffled = [...prev.players];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return { ...prev, players: shuffled };
    });
  };

  const handleReorderPlayers = (players: Scorecard['players']) => {
    persist((prev) => ({ ...prev, players }));
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
          persist((prev) => ({ ...prev, status: 'finished' }));
          if (card.presetId) {
            recordPresetGameResult(card.presetId, card);
          }
          setShowSummary(true);
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={darkTheme ? 'light' : 'dark'} />
      <View
        style={[
          styles.toolbar,
          { paddingTop: insets.top + 12, backgroundColor: theme.surface, borderBottomColor: theme.border },
        ]}
      >
        <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 20, color: theme.text }}>←</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{card.name}</Text>
        <Pressable onPress={() => setSettingsVisible(true)} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 20 }}>⚙️</Text>
        </Pressable>
        <Pressable
          onPress={card.status === 'finished' ? () => setShowSummary(true) : finishScorecard}
          style={[styles.finishButton, { backgroundColor: card.status === 'finished' ? 'transparent' : theme.accent}]}
        >
          <Text style={[styles.finishText, { color: card.status === 'finished' ? theme.accent : theme.accentText }]}>
            {card.status === 'finished' ? 'Completed' : 'Finish'}
          </Text>
        </Pressable>
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
        bidEnabled={card.settings.bidEnabled}
        meldEnabled={card.settings.meldEnabled}
        bonusEnabled={card.settings.bonusEnabled}
        customFields={card.settings.customFields}
        players={card.players}
        rounds={card.rounds}
        totals={totals}
        roundWinsCount={roundWinsCount}
        leaderTotal={leaderTotal}
        useRomanNumerals={card.settings.useRomanNumerals}
        onScoreChange={handleScoreChange}
        onBidChange={handleBidChange}
        onMeldChange={handleMeldChange}
        onBonusChange={handleBonusChange}
        onCustomValueChange={handleCustomValueChange}
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
        onShufflePlayers={handleShufflePlayers}
        onReorderPlayers={handleReorderPlayers}
        settings={card.settings}
        onUpdateSettings={handleUpdateSettings}
        onSaveAsPreset={handleSaveAsPreset}
      />

      {showSummary && (
        <FinishSummaryModal
          visible={showSummary}
          onDone={() => setShowSummary(false)}
          players={card.players}
          totals={totals}
          roundWinsCount={roundWinsCount}
          roundsPlayed={card.rounds.length}
          lowestScoreWins={card.settings.lowestScoreWins}
          rounds={card.rounds}
        />
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