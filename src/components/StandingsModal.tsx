import { FontAwesome } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ThemePalette } from '../lib/themes';
import { Player, WinCondition } from '../types';
import Text from './AppText';

type Props = {
  visible: boolean;
  onClose: () => void;
  players: Player[];
  totals: number[];
  roundWinsCount: number[];
  winCondition: WinCondition;
  theme: ThemePalette;
};

type StandingEntry = {
  player: Player;
  rank: number;
  label: string;
  isLeader: boolean;
};

function winsLabel(count: number): string {
  return `${count} ${count === 1 ? 'Win' : 'Wins'}`;
}

export default function StandingsModal({
  visible,
  onClose,
  players,
  totals,
  roundWinsCount,
  winCondition,
  theme,
}: Props) {
  if (!visible || players.length === 0) return null;

  const isRoundsMode = winCondition === 'mostRoundsWon';
  const lowestScoreWins = winCondition === 'leastPoints';
  const higherIsBetter = isRoundsMode || !lowestScoreWins;

  const regularFont = theme.fontFamily ? { fontFamily: theme.fontFamily } : {};
  const boldFontFamily = theme.fontFamilyBold ?? theme.fontFamily;
  const boldFont = boldFontFamily ? { fontFamily: boldFontFamily } : {};

  const metric = isRoundsMode ? roundWinsCount : totals;
  const bestValue = metric.length ? (higherIsBetter ? Math.max(...metric) : Math.min(...metric)) : 0;

  const ranked = players
    .map((p, i) => ({ player: p, value: metric[i] ?? 0 }))
    .sort((a, b) => (higherIsBetter ? b.value - a.value : a.value - b.value));

  // Standard competition ranking — tied players share the same rank number, and the next rank
  // skips ahead to reflect how many players are ahead of it (1, 1, 3, 4...).
  const entries: StandingEntry[] = [];
  let currentRank = 1;
  ranked.forEach((r, i) => {
    if (i > 0 && r.value !== ranked[i - 1].value) {
      currentRank = i + 1;
    }
    entries.push({
      player: r.player,
      rank: currentRank,
      label: isRoundsMode ? winsLabel(r.value) : `${r.value} pts`,
      isLeader: r.value === bestValue,
    });
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }, boldFont]}>Current Standings</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <FontAwesome name="times" size={20} color={theme.mutedText} />
            </Pressable>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {entries.map((entry) => (
              <View key={entry.player.id} style={[styles.row, { borderColor: theme.border }]}>
                <Text
                  style={[styles.rank, { color: entry.isLeader ? theme.mutedText : theme.mutedText }, boldFont]}
                >
                  {entry.rank}.
                </Text>
                <Text
                  style={[styles.name, { color: theme.text }, entry.isLeader ? boldFont : regularFont]}
                  numberOfLines={1}
                >
                  {entry.player.name}
                </Text>
                <Text style={[styles.score, { color: entry.isLeader ? theme.text : theme.text }, boldFont]}>
                  {entry.label}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  card: { width: 320, maxHeight: '70%', borderRadius: 16, borderWidth: 2, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700' },
  list: { flexGrow: 0 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  rank: { width: 28, fontSize: 16, fontWeight: '700' },
  name: { flex: 1, fontSize: 16 },
  score: { fontSize: 16, fontWeight: '700' },
});