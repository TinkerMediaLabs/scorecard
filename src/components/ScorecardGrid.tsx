import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { scrollTo, useAnimatedRef, useAnimatedScrollHandler } from 'react-native-reanimated';

import { ThemePalette } from '../lib/themes';
import { Player, Round } from '../types';

import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';

const ROUND_COL_WIDTH = 56;
const ROW_HEIGHT = 56;

type Props = {
  players: Player[];
  rounds: Round[];
  totals: number[];
  roundWinsCount: number[];
  leaderTotal: number;
  useRomanNumerals: boolean;
  theme: ThemePalette;
  onScoreChange: (roundId: string, playerId: string, value: number | null) => void;
  onAddPlayer: () => void;
  onAddRound: () => void;
  screenWidth: number;
  bottomInset?: number;
};

const ROMAN: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];
function toRoman(num: number): string {
  let result = '';
  let n = num;
  for (const [value, symbol] of ROMAN) {
    while (n >= value) {
      result += symbol;
      n -= value;
    }
  }
  return result;
}

function createStyles(theme: ThemePalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    headerRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: theme.border },
    footerRow: { flexDirection: 'row', borderTopWidth: 1, borderColor: theme.border },
    corner: { height: ROW_HEIGHT, backgroundColor: theme.surface },
    headerCell: { height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderColor: theme.border },
    headerText: { fontWeight: '600', fontSize: 14, color: theme.text },
    roundCell: { alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface, borderBottomWidth: 1, borderColor: theme.border },
    roundText: { fontWeight: '600', color: theme.mutedText },
    addCell: { alignItems: 'center', justifyContent: 'center' },
    addText: { fontSize: 20, color: theme.accent },
    body: { flex: 1, flexDirection: 'row' },
    scoreCell: { alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderBottomWidth: 1, borderColor: theme.border },
    scoreText: { fontSize: 16, color: theme.text },
    footerCell: { height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderColor: theme.border },
    footerCellWinner: { backgroundColor: theme.accent },
    footerTotal: { fontWeight: '700', fontSize: 16, color: theme.text },
    footerWins: { fontSize: 11, color: theme.mutedText },
    footerWinnerText: { color: theme.accentText },
    modalBackdrop: { flex: 1, backgroundColor: '#00000055', alignItems: 'center', justifyContent: 'center' },
    modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: 200 },
    modalInput: { fontSize: 40, textAlign: 'center', color: '#000' },
    modalInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    signToggle: { marginRight: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#eee' },
    signToggleText: { fontSize: 16, fontWeight: '700', color: '#000' },
  });
}

export default function ScorecardGrid({
  players,
  rounds,
  totals,
  roundWinsCount,
  leaderTotal,
  useRomanNumerals,
  theme,
  onScoreChange,
  onAddPlayer,
  onAddRound,
  screenWidth,
  bottomInset = 0,
}: Props) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const cellWidth = Math.floor((screenWidth - ROUND_COL_WIDTH) / Math.min(Math.max(players.length, 1), 4));
  const scrollAreaWidth = screenWidth - ROUND_COL_WIDTH;
  const headerRef = useAnimatedRef<Animated.ScrollView>();
  const footerRef = useAnimatedRef<Animated.ScrollView>();
  const columnRef = useAnimatedRef<Animated.ScrollView>();

  const onHorizontalScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollTo(headerRef, event.contentOffset.x, 0, false);
      scrollTo(footerRef, event.contentOffset.x, 0, false);
    },
  });

  const onVerticalScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollTo(columnRef, 0, event.contentOffset.y, false);
    },
  });

  useEffect(() => {
    headerRef.current?.scrollTo({ x: 0, y: 0, animated: false });
    footerRef.current?.scrollTo({ x: 0, y: 0, animated: false });
    columnRef.current?.scrollTo({ x: 0, y: 0, animated: false });
  }, []);

  const [editing, setEditing] = useState<{ roundId: string; playerId: string } | null>(null);
  const [draftValue, setDraftValue] = useState('');

  const scoreInputRef = useRef<any>(null);

  const openEditor = (roundId: string, playerId: string, currentValue: number | null) => {
    setEditing({ roundId, playerId });
    setDraftValue(currentValue == null ? '' : String(currentValue));
  };

  const commitEditor = () => {
    if (editing) {
      const num = draftValue.trim() === '' ? null : Number(draftValue);
      onScoreChange(editing.roundId, editing.playerId, Number.isNaN(num as number) ? null : num);
    }
    setEditing(null);
  };

  const handleModalShow = () => {
    setTimeout(() => scoreInputRef.current?.focus(), 50);
  };

  return (
    <View style={[styles.container, { paddingBottom: bottomInset }]}>
      <View style={styles.headerRow}>
        <View style={[styles.corner, { width: ROUND_COL_WIDTH }]} />
          <Animated.ScrollView ref={headerRef} horizontal scrollEnabled={false} showsHorizontalScrollIndicator={false} style={{ width: scrollAreaWidth }}>
          {players.map((p) => (            <View key={p.id} style={[styles.headerCell, { width: cellWidth }]}>
              <Text style={styles.headerText} numberOfLines={1}>{p.name}</Text>
            </View>
          ))}
          <Pressable style={[styles.addCell, { width: 48 }]} onPress={onAddPlayer}>
            <Text style={styles.addText}>+</Text>
          </Pressable>
        </Animated.ScrollView>
      </View>

      <View style={styles.body}>
        <Animated.ScrollView ref={columnRef} scrollEnabled={false} showsVerticalScrollIndicator={false} style={{ width: ROUND_COL_WIDTH }}>
         {rounds.map((r, i) => (
          <View key={r.id} style={[styles.roundCell, { height: ROW_HEIGHT, width: ROUND_COL_WIDTH }]}>
            <Text style={styles.roundText}>{useRomanNumerals ? toRoman(i + 1) : i + 1}</Text>
          </View>
        ))}
        <Pressable style={[styles.addCell, { height: ROW_HEIGHT, width: ROUND_COL_WIDTH }]} onPress={onAddRound}>
          <Text style={styles.addText}>+</Text>
        </Pressable>
        </Animated.ScrollView>

        <Animated.ScrollView horizontal onScroll={onHorizontalScroll} scrollEventThrottle={16} showsHorizontalScrollIndicator={false} style={{ width: scrollAreaWidth }}>
          <Animated.ScrollView onScroll={onVerticalScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
            {rounds.map((round) => (              <View key={round.id} style={{ flexDirection: 'row', height: ROW_HEIGHT }}>
                {players.map((p) => {
                  const value = round.scores[p.id] ?? null;
                  return (
                    <Pressable key={p.id} style={[styles.scoreCell, { width: cellWidth }]} onPress={() => openEditor(round.id, p.id, value)}>
                      <Text style={styles.scoreText}>{value == null ? '' : value}</Text>
                    </Pressable>
                  );
                })}
                <View style={{ width: 48 }} />
              </View>
            ))}
            <View style={{ height: ROW_HEIGHT }} />
          </Animated.ScrollView>
        </Animated.ScrollView>
      </View>

      <View style={styles.footerRow}>
        <View style={[styles.corner, { width: ROUND_COL_WIDTH }]} />
          <Animated.ScrollView ref={footerRef} horizontal scrollEnabled={false} showsHorizontalScrollIndicator={false} style={{ width: scrollAreaWidth }}>
          {players.map((p, i) => { const isWinner = totals[i] === leaderTotal;
            return (
              <View key={p.id} style={[styles.footerCell, { width: cellWidth }, isWinner && styles.footerCellWinner]}>
                <Text style={[styles.footerTotal, isWinner && styles.footerWinnerText]}>{totals[i]}</Text>
                <Text style={[styles.footerWins, isWinner && styles.footerWinnerText]}>{roundWinsCount[i]}W</Text>
              </View>
            );
          })}
        </Animated.ScrollView>
      </View>

      <Modal visible={editing !== null} transparent animationType="fade" onShow={handleModalShow} onRequestClose={() => setEditing(null)}>
        <Pressable style={styles.modalBackdrop} onPress={commitEditor}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalInputRow}>
              <Pressable
                onPress={() => setDraftValue((v) => (v.startsWith('-') ? v.slice(1) : v ? `-${v}` : '-'))}
                style={styles.signToggle}
              >
                <Text style={styles.signToggleText}>+/-</Text>
              </Pressable>
              <TextInput
                ref={scoreInputRef}
                keyboardType="number-pad"
                value={draftValue}
                onChangeText={(text) => setDraftValue(text.replace(/[^0-9-]/g, ''))}
                onSubmitEditing={commitEditor}
                style={styles.modalInput}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}