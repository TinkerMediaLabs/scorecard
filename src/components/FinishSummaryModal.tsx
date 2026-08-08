import { useEffect, useMemo } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { PIConfetti } from 'react-native-fast-confetti';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Player, Round, WinCondition } from '../types';
import Text from './AppText';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CARD_OFFSCREEN_Y = SCREEN_H * 0.85;
const DISMISS_THRESHOLD = 120;
const ORIGIN_COUNT = 7;
const RISE_DURATION = 3000;
const CONFETTI_DURATION = 3000;

type Props = {
  visible: boolean;
  onDone: () => void;
  players: Player[];
  totals: number[];
  roundWinsCount: number[];
  roundsPlayed: number;
  winCondition: WinCondition;
  rounds: Round[];
  showRoundWinner: boolean;
};

export default function FinishSummaryModal({
  visible,
  onDone,
  players,
  totals,
  roundWinsCount,
  roundsPlayed,
  winCondition,
  rounds,
  showRoundWinner,
}: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(CARD_OFFSCREEN_Y);

  const isRoundsMode = winCondition === 'mostRoundsWon';
  const lowestScoreWins = winCondition === 'leastPoints';

  useEffect(() => {
    if (visible) {
      translateY.value = CARD_OFFSCREEN_Y;
      translateY.value = withTiming(0, { duration: RISE_DURATION, easing: Easing.out(Easing.cubic) });
    }
  }, [visible]);

  const closeAnimated = () => {
    translateY.value = withTiming(CARD_OFFSCREEN_Y, { duration: 250 }, (finished) => {
      if (finished) runOnJS(onDone)();
    });
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_THRESHOLD) {
        translateY.value = withTiming(CARD_OFFSCREEN_Y, { duration: 200 }, (finished) => {
          if (finished) runOnJS(onDone)();
        });
      } else {
        translateY.value = withTiming(0, { duration: 200 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Random burst points scattered across the screen, regenerated each time the modal opens
  const randomOrigins = useMemo(() => {
    return Array.from({ length: ORIGIN_COUNT }).map(() => ({
      x: Math.random() * SCREEN_W,
      y: SCREEN_H * (0.15 + Math.random() * 0.55),
    }));
  }, [visible]);

  const bestRoundScore = useMemo(() => {
    let best: { value: number; playerName: string } | null = null;
    for (const round of rounds) {
      for (const p of players) {
        const score = round.scores[p.id];
        if (score == null) continue;
        const better = best ? (lowestScoreWins ? score < best.value : score > best.value) : true;
        if (better) best = { value: score, playerName: p.name };
      }
    }
    return best;
  }, [rounds, players, lowestScoreWins]);

  if (!visible || players.length === 0) return null;

  const leaderRoundWins = roundWinsCount.length ? Math.max(...roundWinsCount) : 0;
  const bestTotal = lowestScoreWins ? Math.min(...totals) : Math.max(...totals);
  const winnerIndex = isRoundsMode ? roundWinsCount.indexOf(leaderRoundWins) : totals.indexOf(bestTotal);

  const rest = players
    .map((p, i) => ({ player: p, total: totals[i], wins: roundWinsCount[i], index: i }))
    .filter((_, i) => i !== winnerIndex)
    .sort((a, b) => (isRoundsMode ? b.wins - a.wins : lowestScoreWins ? a.total - b.total : b.total - a.total));

  const totalPointsScored = totals.reduce((a, v) => a + v, 0);
  const mean = totals.length ? totalPointsScored / totals.length : 0;
  const variance = totals.length
    ? totals.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / totals.length
    : 0;
  const stdDev = Math.round(Math.sqrt(variance));

  const secondPlaceTotal = rest.length ? rest[0].total : null;
  const spread =
    secondPlaceTotal !== null && secondPlaceTotal !== 0
      ? Math.round(((bestTotal - secondPlaceTotal) / secondPlaceTotal) * 100)
      : null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeAnimated}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeAnimated} />

          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <PIConfetti autoplay sprayDuration={CONFETTI_DURATION} containerStyle={{ flex: 1 }}>
              {randomOrigins.map((origin, i) => (
                <PIConfetti.Origin key={i} blastPosition={origin} count={120} initialSpeed={2.4} spread={Math.PI * 2}>
                  <PIConfetti.Flake size={10} radius={3} />
                </PIConfetti.Origin>
              ))}
            </PIConfetti>
          </View>

          <Animated.View style={[styles.card, cardStyle, { paddingBottom: insets.bottom + 10 }]}>
            <GestureDetector gesture={pan}>
              <View style={styles.dragHandleArea}>
                <View style={styles.dragHandle} />
              </View>
            </GestureDetector>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.plaqueOuter}>
                <View style={styles.plaqueInner}>
                  <Text style={styles.trophy}>🏆</Text>
                  <Text style={styles.winnerLabel}>WINNER</Text>
                  <Text style={styles.winnerName}>{players[winnerIndex]?.name}</Text>
                  <View style={styles.plaqueDivider} />
                  {!isRoundsMode && (
                    <Text style={styles.winnerStat}>{totals[winnerIndex]} Points</Text>
                  )}
                  {(isRoundsMode || showRoundWinner) && (
                    <Text style={[styles.winnerStat, isRoundsMode && styles.winnerStatEmphasis]}>
                      {roundWinsCount[winnerIndex]} Rounds Won
                    </Text>
                  )}
                </View>
              </View>

              {rest.map((r) => (
                <View key={r.player.id} style={styles.restRow}>
                  <Text style={styles.restName}>{r.player.name}</Text>
                  <Text style={styles.restTotal}>{isRoundsMode ? `${r.wins} wins` : `${r.total} points`}</Text>
                </View>
              ))}

              <View style={styles.statsGrid}>
                <View style={styles.statTile}>
                  <Text style={styles.statValue}>{roundsPlayed}</Text>
                  <Text style={styles.statLabel}>Rounds Played</Text>
                </View>
                <View style={styles.statTile}>
                  <Text style={styles.statValue}>{totalPointsScored}</Text>
                  <Text style={styles.statLabel}>Total Points Scored</Text>
                </View>
                <View style={styles.statTile}>
                  <Text style={styles.statValue}>{stdDev}</Text>
                  <Text style={styles.statLabel}>Standard Deviation</Text>
                </View>
                <View style={styles.statTile}>
                  <Text style={styles.statValue}>{spread === null ? '—' : `${spread}%`}</Text>
                  <Text style={styles.statLabel}>Spread (1st to 2nd)</Text>
                </View>
                <View style={styles.statTile}>
                  <Text style={styles.statValue}>{bestRoundScore ? bestRoundScore.value : '—'}</Text>
                  <Text style={styles.statLabel}>
                    Best Round{bestRoundScore ? ` (${bestRoundScore.playerName})` : ''}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  dragHandleArea: { alignItems: 'center', paddingVertical: 12 },
  dragHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#ddd' },
  content: { paddingHorizontal: 20, paddingBottom: 10 },
  plaqueOuter: {
    backgroundColor: '#D4AF37',
    borderRadius: 18,
    padding: 6,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  plaqueInner: {
    backgroundColor: '#FFF8E1',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#B8860B',
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  trophy: { fontSize: 40, marginBottom: 6 },
  winnerLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 2, color: '#8B6914' },
  winnerName: { fontSize: 26, fontWeight: '800', color: '#3a2a00', marginTop: 4, textAlign: 'center' },
  plaqueDivider: { width: '60%', height: 1, backgroundColor: '#B8860B', marginVertical: 10 },
  winnerStat: { fontSize: 15, color: '#5c4600', fontWeight: '600' },
  winnerStatEmphasis: { fontSize: 22, fontWeight: '800' },
  restRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' },
  restName: { fontSize: 16 },
  restTotal: { fontSize: 16, color: '#555' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 30 },
  statTile: { width: '48%', backgroundColor: '#f0f0f0', borderRadius: 10, padding: 16, marginBottom: 12, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4, textAlign: 'center' },
});