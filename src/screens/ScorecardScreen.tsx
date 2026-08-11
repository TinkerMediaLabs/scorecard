import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState } from 'react';
import { Alert, Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../App';
import Text from '../components/AppText';
import Coachmark from '../components/Coachmark';
import FinishSummaryModal from '../components/FinishSummaryModal';
import RoundTimer from '../components/RoundTimer';
import ScorecardGrid from '../components/ScorecardGrid';
import SettingsModal from '../components/SettingsModal';
import { useTour } from '../contexts/TourContext';

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
  const tour = useTour();
  const editButtonRef = useRef<View>(null);
  const finishButtonRef = useRef<View>(null);

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
  const darkTheme =
    card.settings.theme === 'chalkboard' ||
    card.settings.theme === 'chalkboard2' ||
    card.settings.theme === 'midnight';

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
        const { [playerId]: _removedScore, ...scores } = r.scores;
        const { [playerId]: _removedBid, ...bids } = r.bids;
        const { [playerId]: _removedMeld, ...melds } = r.melds;
        const { [playerId]: _removedBonus, ...bonuses } = r.bonuses;
        const { [playerId]: _removedCustom, ...customValues } = r.customValues;
        return { ...r, scores, bids, melds, bonuses, customValues };
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
      players: card.players.map((p) => ({ id: p.id, name: p.name })),
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

  // "Most Rounds Won" determines the winner by round-win tally rather than points, but a round
  // still needs a points-based winner to tally in the first place. We use the same lowest/highest
  // direction as "Least Points"/"Most Points" for that per-round comparison.
  const lowestScoreWins = card.settings.winCondition === 'leastPoints';

  const totals = card.players.map((p) =>
    card.rounds.reduce((sum, r) => sum + (r.scores[p.id] ?? 0), 0)
  );

  const roundWinsCount = card.players.map((_, playerIndex) =>
    card.rounds.reduce((count, r) => {
      const scores = card.players.map((p) => r.scores[p.id] ?? null);
      const values = scores.filter((v): v is number => v !== null);
      if (values.length === 0) return count;
      const best = lowestScoreWins ? Math.min(...values) : Math.max(...values);
      return scores[playerIndex] === best ? count + 1 : count;
    }, 0)
  );

  const leaderTotal = totals.length
    ? lowestScoreWins
      ? Math.min(...totals)
      : Math.max(...totals)
    : 0;

  // Round-winner cell highlighting: only once every player in the round has a score entered
  // (no highlighting a round that's still being filled in), and includes every tied player.
  const roundWinnerIds: Record<string, string[]> = {};
  card.rounds.forEach((r) => {
    const entries = card.players.map((p) => ({ id: p.id, value: r.scores[p.id] ?? null }));
    const allEntered = entries.length > 0 && entries.every((e) => e.value !== null);
    if (!allEntered) {
      roundWinnerIds[r.id] = [];
      return;
    }
    const values = entries.map((e) => e.value as number);
    const best = lowestScoreWins ? Math.min(...values) : Math.max(...values);
    roundWinnerIds[r.id] = entries.filter((e) => e.value === best).map((e) => e.id);
  });

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
        <View ref={editButtonRef} collapsable={false} style={{ marginRight: 12 }}>
          <Pressable onPress={() => setSettingsVisible(true)}>
            <Text style={[styles.finishButton, { backgroundColor: 'transparent', color: theme.accent }]}>Edit</Text>
          </Pressable>
        </View>
        <View ref={finishButtonRef} collapsable={false}>
          <Pressable
            onPress={card.status === 'finished' ? () => setShowSummary(true) : finishScorecard}
            style={[styles.finishButton, { backgroundColor: card.status === 'finished' ? 'transparent' : theme.accent}]}
          >
            <Text style={[styles.finishText, { color: card.status === 'finished' ? theme.accent : theme.accentText }]}>
              {card.status === 'finished' ? 'Completed' : 'Finish'}
            </Text>
          </Pressable>
        </View>
      </View>

      <Coachmark
        visible={tour.active && tour.step === 'editScorecard'}
        targetRef={editButtonRef}
        text="Tap Edit anytime to change players, settings, or scoring options for this game."
        stepLabel={`Step ${tour.stepIndex + 1} of ${tour.totalSteps}`}
        isLast={false}
        onNext={tour.next}
        onSkip={tour.skip}
      />
      <Coachmark
        visible={tour.active && tour.step === 'finishScorecard'}
        targetRef={finishButtonRef}
        text="When the game is over, tap Finish to lock in the results and see the recap."
        stepLabel={`Step ${tour.stepIndex + 1} of ${tour.totalSteps}`}
        isLast
        onNext={tour.next}
        onSkip={tour.skip}
      />

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
        roundWinnerIds={roundWinnerIds}
        leaderTotal={leaderTotal}
        winCondition={card.settings.winCondition}
        highlightRoundWinner={card.settings.highlightRoundWinner}
        useRomanNumerals={card.settings.useRomanNumerals}
        onScoreChange={handleScoreChange}
        onBidChange={handleBidChange}
        onMeldChange={handleMeldChange}
        onBonusChange={handleBonusChange}
        onCustomValueChange={handleCustomValueChange}
        onAddPlayer={handleAddPlayer}
        onAddRound={handleAddRound}
        screenWidth={SCREEN_WIDTH}
        showRoundWinner={card.settings.showRoundWinner}
        textSize={card.settings.textSize}
      />

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        cardName={card.name}
        onRenameCard={handleRenameCard}
        players={card.players}
        onRenamePlayer={handleRenamePlayer}
        onDeletePlayer={handleDeletePlayer}
        onAddPlayer={handleAddPlayer}
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
          winCondition={card.settings.winCondition}
          rounds={card.rounds}
          showRoundWinner={card.settings.showRoundWinner}
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