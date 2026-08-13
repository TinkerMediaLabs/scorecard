import { useEffect, useMemo, useRef, useState } from 'react';
import { ImageBackground, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { scrollTo, useAnimatedRef, useAnimatedScrollHandler } from 'react-native-reanimated';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import { TEXT_SCALE } from '../lib/fonts';
import { ThemePalette } from '../lib/themes';
import { Player, Round, TextSize, WinCondition } from '../types';

const ROUND_COL_WIDTH = 56;
const ROW_HEIGHT = 56;
const EXPANDED_ROW_HEIGHT = 78;

// Minimum comfortable cell width, in points, before we scroll instead of shrinking further.
// These match what 4 columns (standard/large) and 3 columns (extraLarge) worked out to on a
// typical phone, so phone layouts are unchanged. On wider screens (tablets), more columns of
// at least this width fit before the floor kicks in, instead of the same fixed column count
// just stretching into oversized cells.
const MIN_CELL_WIDTH_STANDARD = 84;
const MIN_CELL_WIDTH_EXTRA_LARGE = 111;

type Props = {
  players: Player[];
  rounds: Round[];
  totals: number[];
  roundWinsCount: number[];
  roundWinnerIds: Record<string, string[]>;
  leaderTotal: number;
  winCondition: WinCondition;
  useRomanNumerals: boolean;
  theme: ThemePalette;
  bidEnabled: boolean;
  meldEnabled: boolean;
  bonusEnabled: boolean;
  customFields: string[];
  onScoreChange: (roundId: string, playerId: string, value: number | null) => void;
  onBidChange: (roundId: string, playerId: string, value: number | null) => void;
  onMeldChange: (roundId: string, playerId: string, value: number | null) => void;
  onBonusChange: (roundId: string, playerId: string, value: number | null) => void;
  onCustomValueChange: (roundId: string, playerId: string, fieldIndex: number, value: number | null) => void;
  //onAddPlayer: () => void;
  onAddRound: () => void;
  screenWidth: number;
  bottomInset?: number;
  showRoundWinner: boolean;
  highlightRoundWinner: boolean;
  textSize: TextSize;
};

function winsLabel(count: number): string {
  return `${count} ${count === 1 ? 'Win' : 'Wins'}`;
}

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

function createStyles(theme: ThemePalette, textScale: number) {
  const scaled = (size: number) => Math.round(size * textScale);
  const scaledRowHeight = scaled(ROW_HEIGHT);

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    headerRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: theme.border },
    footerRow: { flexDirection: 'row', borderTopWidth: 1, borderColor: theme.border },
    corner: { height: scaledRowHeight, backgroundColor: theme.roundColumnSurface ?? theme.surface },    headerCell: { height: scaledRowHeight, alignItems: 'center', justifyContent: 'center', 
    borderRightWidth: 1, borderColor: theme.border },
    headerText: { fontWeight: '700', fontSize: scaled(14), color: theme.text, ...(theme.fontFamily ? { fontFamily: theme.fontFamily } : {}) },    
    roundCell: { alignItems: 'center', justifyContent: 'center', backgroundColor: theme.roundColumnSurface ?? theme.surface, borderBottomWidth: 1, borderColor: theme.border },    roundText: { fontWeight: '600', fontSize: scaled(14), color: theme.mutedText, ...(theme.fontFamily ? { fontFamily: theme.fontFamily } : {}) },    
    addCell: { alignItems: 'center', justifyContent: 'center' },
    addText: { fontSize: 20, color: theme.accent },
    body: { flex: 1, flexDirection: 'row' },
    scoreCell: { alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderBottomWidth: 1, borderColor: theme.border },
    scoreCellRoundWinner: { backgroundColor: theme.roundWinnerHighlight },
    scoreText: { fontSize: scaled(16), color: theme.text, ...(theme.fontFamily ? { fontFamily: theme.fontFamily } : {}) },    
    extrasRow: { flexDirection: 'row', marginTop: 2, gap: 14 },
    extraField: { alignItems: 'center' },
    extrasLabel: { fontSize: scaled(9), color: '#aaaaaa' },
    extrasValue: { fontSize: scaled(10), color: '#aaaaaa', fontWeight: '600' },
    footerCell: { height: scaledRowHeight, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderColor: theme.border },
    footerCellWinner: { backgroundColor: theme.accent },
    footerTotal: { fontWeight: '700', fontSize: scaled(18), color: theme.text, ...(theme.fontFamily ? { fontFamily: theme.fontFamily } : {}) },    
    footerWins: { fontSize: scaled(11), color: theme.mutedText, ...(theme.fontFamily ? { fontFamily: theme.fontFamily } : {}) },    
    footerWinsPrimary: { fontWeight: '700', fontSize: scaled(22), color: theme.text, ...(theme.fontFamily ? { fontFamily: theme.fontFamily } : {}) },    
    footerWinnerText: { color: theme.accentText },
    modalBackdrop: { flex: 1, backgroundColor: '#00000055', alignItems: 'center', justifyContent: 'center' },
    modalCard: { backgroundColor: theme.surface, borderRadius: 12, paddingVertical: 20, paddingHorizontal: 26, width: 260 },
    modalInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    modalInput: { fontSize: scaled(40), textAlign: 'center', color: theme.text, width: 120 },
    signToggle: { marginRight: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: theme.border, alignItems: 'center', justifyContent: 'center' },
    signToggleText: { fontSize: scaled(16), fontWeight: '700', color: theme.text, textAlign: 'center', ...(theme.fontFamily ? { fontFamily: theme.fontFamily } : {}) },
    extraFieldRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    extraFieldLabel: { fontSize: scaled(14), fontWeight: '600', color: theme.mutedText, flex: 1, ...(theme.fontFamily ? { fontFamily: theme.fontFamily } : {}) },
    extraFieldInputGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    extraFieldInput: { borderBottomWidth: 1, borderColor: theme.border, fontSize: scaled(18), textAlign: 'center', width: 55, color: theme.text },
    stepperButton: { width: 26, height: 26, borderRadius: 6, backgroundColor: theme.border, alignItems: 'center', justifyContent: 'center' },
    stepperButtonText: { fontSize: scaled(16), fontWeight: '700', color: theme.text, textAlign: 'center', includeFontPadding: false, ...(theme.fontFamily ? { fontFamily: theme.fontFamily } : {}) },
    modalTitle: { fontSize: scaled(16), fontWeight: '700', color: theme.text, textAlign: 'center', marginBottom: 12, ...(theme.fontFamily ? { fontFamily: theme.fontFamily } : {}) },
    nextButton: { marginTop: 16, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8, backgroundColor: theme.accent },
    nextButtonText: { fontWeight: '700', color: theme.accentText, ...(theme.fontFamily ? { fontFamily: theme.fontFamily } : {}) },
    modalPlayerName: { fontSize: scaled(14), color: theme.mutedText, textAlign: 'center', marginBottom: 12, ...(theme.fontFamily ? { fontFamily: theme.fontFamily } : {}) },
    modalDivider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.border, marginBottom: 16 },
  });
}

export default function ScorecardGrid({
  players,
  rounds,
  totals,
  roundWinsCount,
  roundWinnerIds,
  leaderTotal,
  winCondition = 'mostPoints',
  useRomanNumerals,
  theme,
  bidEnabled,
  meldEnabled,
  bonusEnabled = false,
  customFields = [],
  onScoreChange,
  onBidChange,
  onMeldChange,
  onBonusChange,
  onCustomValueChange,
  //onAddPlayer,
  onAddRound,
  screenWidth,
  bottomInset = 0,
  showRoundWinner,
  highlightRoundWinner,
  textSize = 'standard',
}: Props) {
  const textScale = TEXT_SCALE[textSize] ?? 1;
  const styles = useMemo(() => createStyles(theme, textScale), [theme, textScale]);
  const BackgroundComponent: any = theme.backgroundImage ? ImageBackground : View;
  const backgroundProps = theme.backgroundImage
    ? { source: theme.backgroundImage, resizeMode: 'cover' as const }
    : {};
  const scrollAreaWidth = screenWidth - ROUND_COL_WIDTH;
  const minCellWidth = textSize === 'extraLarge' ? MIN_CELL_WIDTH_EXTRA_LARGE : MIN_CELL_WIDTH_STANDARD;
  const maxVisibleColumns = Math.max(1, Math.floor(scrollAreaWidth / minCellWidth));
  const cellWidth = Math.floor(scrollAreaWidth / Math.min(Math.max(players.length, 1), maxVisibleColumns));
  const hasExtras = bidEnabled || meldEnabled || bonusEnabled || customFields.length > 0;
  const rowHeight = Math.round((hasExtras ? EXPANDED_ROW_HEIGHT : ROW_HEIGHT) * textScale);
  const isRoundsMode = winCondition === 'mostRoundsWon';
  const leaderRoundWins = roundWinsCount.length ? Math.max(...roundWinsCount) : 0;

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
  const [draftScore, setDraftScore] = useState('');
  const [draftBid, setDraftBid] = useState('');
  const [draftMeld, setDraftMeld] = useState('');
  const [draftBonus, setDraftBonus] = useState('');
  const [draftCustom, setDraftCustom] = useState<string[]>([]);
  const scoreInputRef = useRef<any>(null);

  const openEditor = (
    roundId: string,
    playerId: string,
    score: number | null,
    bid: number | null,
    meld: number | null,
    bonus: number | null,
    customValues: (number | null)[]
  ) => {
    setEditing({ roundId, playerId });
    setDraftScore(score == null ? '' : String(score));
    setDraftBid(bid == null ? '' : String(bid));
    setDraftMeld(meld == null ? '' : String(meld));
    setDraftBonus(bonus == null ? '' : String(bonus));
    setDraftCustom(customFields.map((_, i) => (customValues[i] == null ? '' : String(customValues[i]))));
  };

  const parseField = (text: string): number | null => {
    const trimmed = text.trim();
    if (trimmed === '' || trimmed === '-') return null;
    const num = Number(trimmed);
    return Number.isNaN(num) ? null : num;
  };

  const applyFieldToScore = (fieldValue: string, sign: 1 | -1) => {
    const amount = parseField(fieldValue);
    if (amount == null) return;
    setDraftScore((prev) => {
      const current = parseField(prev) ?? 0;
      return String(current + sign * amount);
    });
  };

  const commitCurrentFields = () => {
    if (!editing) return;
    onScoreChange(editing.roundId, editing.playerId, parseField(draftScore));
    if (bidEnabled) onBidChange(editing.roundId, editing.playerId, parseField(draftBid));
    if (meldEnabled) onMeldChange(editing.roundId, editing.playerId, parseField(draftMeld));
    if (bonusEnabled) onBonusChange(editing.roundId, editing.playerId, parseField(draftBonus));
    customFields.forEach((_, i) => {
      onCustomValueChange(editing.roundId, editing.playerId, i, parseField(draftCustom[i] ?? ''));
    });
  };

  const commitEditor = () => {
    commitCurrentFields();
    setEditing(null);
  };

  const handleModalShow = () => {
    if (!hasExtras) {
      setTimeout(() => scoreInputRef.current?.focus(), 50);
    }
  };

  const currentPlayerIndex = editing ? players.findIndex((p) => p.id === editing.playerId) : -1;
  const isLastPlayer = currentPlayerIndex === players.length - 1;
  const editingRoundIndex = editing ? rounds.findIndex((r) => r.id === editing.roundId) : -1;
  const editingPlayer = editing ? players.find((p) => p.id === editing.playerId) : undefined;
  const modalTitle =
    editingRoundIndex >= 0
      ? `${useRomanNumerals ? toRoman(editingRoundIndex + 1) : editingRoundIndex + 1}`
      : '';

  const advanceToNextPlayer = () => {
    if (!editing) return;
    commitCurrentFields();

    const round = rounds.find((r) => r.id === editing.roundId);
    const nextPlayer = players[currentPlayerIndex + 1];
    if (!round || !nextPlayer) return;

    openEditor(
      round.id,
      nextPlayer.id,
      round.scores[nextPlayer.id] ?? null,
      round.bids?.[nextPlayer.id] ?? null,
      round.melds?.[nextPlayer.id] ?? null,
      round.bonuses?.[nextPlayer.id] ?? null,
      round.customValues?.[nextPlayer.id] ?? []
    );
    if (!hasExtras) {
      setTimeout(() => scoreInputRef.current?.focus(), 50);
    }
  };

  return (
    <BackgroundComponent style={[styles.container, { paddingBottom: bottomInset }]} {...backgroundProps}>
      <View style={styles.headerRow}>
        <View style={[styles.corner, { width: ROUND_COL_WIDTH }]} />
        <Animated.ScrollView ref={headerRef} horizontal scrollEnabled={false} showsHorizontalScrollIndicator={false} style={{ width: scrollAreaWidth }}>
          {players.map((p) => (
            <View key={p.id} style={[styles.headerCell, { width: cellWidth }]}>
              <Text style={styles.headerText} numberOfLines={1}>{p.name}</Text>
            </View>
          ))}
          {/* <Pressable style={[styles.addCell, { width: 48 }]} onPress={onAddPlayer}>
            <Text style={styles.addText}>+</Text>
          </Pressable> */}
        </Animated.ScrollView>
      </View>

      <View style={styles.body}>
        <Animated.ScrollView ref={columnRef} scrollEnabled={false} showsVerticalScrollIndicator={false} style={{ width: ROUND_COL_WIDTH }}>
          {rounds.map((r, i) => (
            <View key={r.id} style={[styles.roundCell, { height: rowHeight, width: ROUND_COL_WIDTH }]}>
              <Text style={styles.roundText}>{useRomanNumerals ? toRoman(i + 1) : i + 1}</Text>
            </View>
          ))}
          <Pressable style={[styles.addCell, { height: rowHeight, width: ROUND_COL_WIDTH }]} onPress={onAddRound}>
            <Text style={styles.addText}>+</Text>
          </Pressable>
        </Animated.ScrollView>

        <Animated.ScrollView horizontal onScroll={onHorizontalScroll} scrollEventThrottle={16} showsHorizontalScrollIndicator={false} style={{ width: scrollAreaWidth }}>
          <Animated.ScrollView onScroll={onVerticalScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
            {rounds.map((round) => (
              <View key={round.id} style={{ flexDirection: 'row', height: rowHeight }}>
                {players.map((p) => {
                  const value = round.scores[p.id] ?? null;
                  const bidValue = round.bids?.[p.id] ?? null;
                  const meldValue = round.melds?.[p.id] ?? null;
                  const bonusValue = round.bonuses?.[p.id] ?? null;
                  const customValues = round.customValues?.[p.id] ?? [];
                  const isRoundWinnerCell =
                    highlightRoundWinner && (roundWinnerIds[round.id]?.includes(p.id) ?? false);
                  return (
                    <Pressable
                      key={p.id}
                      style={[
                        styles.scoreCell,
                        { width: cellWidth, height: rowHeight },
                        isRoundWinnerCell && styles.scoreCellRoundWinner,
                      ]}
                      onPress={() => openEditor(round.id, p.id, value, bidValue, meldValue, bonusValue, customValues)}
                    >
                      <Text style={styles.scoreText}>{value == null ? '' : value}</Text>
                      {hasExtras && (
                        <View style={styles.extrasRow}>
                          {bidEnabled && (
                            <View style={styles.extraField}>
                              <Text style={styles.extrasLabel}>Bid</Text>
                              <Text style={styles.extrasValue}>{bidValue ?? '–'}</Text>
                            </View>
                          )}
                          {meldEnabled && (
                            <View style={styles.extraField}>
                              <Text style={styles.extrasLabel}>Meld</Text>
                              <Text style={styles.extrasValue}>{meldValue ?? '–'}</Text>
                            </View>
                          )}
                          {bonusEnabled && (
                            <View style={styles.extraField}>
                              <Text style={styles.extrasLabel}>Bonus</Text>
                              <Text style={styles.extrasValue}>{bonusValue ?? '–'}</Text>
                            </View>
                          )}
                          {customFields.map((label, i) => (
                            <View key={i} style={styles.extraField}>
                              <Text style={styles.extrasLabel}>{label}</Text>
                              <Text style={styles.extrasValue}>{customValues[i] ?? '–'}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </Pressable>
                  );
                })}
                {/* <View style={{ width: 48 }} /> */}
              </View>
            ))}
            <View style={{ height: rowHeight }} />
          </Animated.ScrollView>
        </Animated.ScrollView>
      </View>

      <View style={styles.footerRow}>
        <View style={[styles.corner, { width: ROUND_COL_WIDTH }]} />
        <Animated.ScrollView ref={footerRef} horizontal scrollEnabled={false} showsHorizontalScrollIndicator={false} style={{ width: scrollAreaWidth }}>
          {players.map((p, i) => {
            const isWinner = isRoundsMode
              ? leaderRoundWins > 0 && roundWinsCount[i] === leaderRoundWins
              : totals[i] === leaderTotal;
            return (
              <View key={p.id} style={[styles.footerCell, { width: cellWidth }, isWinner && styles.footerCellWinner]}>
                {!isRoundsMode && (
                  <Text style={[styles.footerTotal, isWinner && styles.footerWinnerText]}>{totals[i]}</Text>
                )}
                {isRoundsMode ? (
                  <Text style={[styles.footerWinsPrimary, isWinner && styles.footerWinnerText]}>
                    {winsLabel(roundWinsCount[i])}
                  </Text>
                ) : (
                  showRoundWinner && (
                    <Text style={[styles.footerWins, isWinner && styles.footerWinnerText]}>{winsLabel(roundWinsCount[i])}</Text>
                  )
                )}
              </View>
            );
          })}
        </Animated.ScrollView>
      </View>

      <Modal visible={editing !== null} transparent animationType="fade" onShow={handleModalShow} onRequestClose={() => setEditing(null)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.modalBackdrop} onPress={commitEditor}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>

              <Text style={styles.modalPlayerName}>{editingPlayer?.name}</Text>
              <View style={styles.modalDivider} />

              <View style={styles.modalInputRow}>
                <Pressable
                  onPress={() => setDraftScore((v) => (v.startsWith('-') ? v.slice(1) : v ? `-${v}` : '-'))}
                  style={styles.signToggle}
                >
                  <Text style={styles.signToggleText}>+/-</Text>
                </Pressable>
                <TextInput
                  ref={scoreInputRef}
                  keyboardType="number-pad"
                  value={draftScore}
                  onChangeText={(text) => setDraftScore(text.replace(/[^0-9-]/g, ''))}
                  onSubmitEditing={commitEditor}
                  placeholder="0"
                  placeholderTextColor="#cccccc"
                  style={styles.modalInput}
                />
              </View>

              {bidEnabled && (
                <ExtraFieldRow
                  label="Bid"
                  value={draftBid}
                  onChangeText={(text) => setDraftBid(text.replace(/[^0-9]/g, ''))}
                  onApply={(sign) => applyFieldToScore(draftBid, sign)}
                  styles={styles}
                />
              )}

              {meldEnabled && (
                <ExtraFieldRow
                  label="Meld"
                  value={draftMeld}
                  onChangeText={(text) => setDraftMeld(text.replace(/[^0-9]/g, ''))}
                  onApply={(sign) => applyFieldToScore(draftMeld, sign)}
                  styles={styles}
                />
              )}

              {bonusEnabled && (
                <ExtraFieldRow
                  label="Bonus"
                  value={draftBonus}
                  onChangeText={(text) => setDraftBonus(text.replace(/[^0-9]/g, ''))}
                  onApply={(sign) => applyFieldToScore(draftBonus, sign)}
                  styles={styles}
                />
              )}

              {customFields.map((label, i) => (
                <ExtraFieldRow
                  key={i}
                  label={label}
                  value={draftCustom[i] ?? ''}
                  onChangeText={(text) =>
                    setDraftCustom((prev) => {
                      const next = [...prev];
                      next[i] = text.replace(/[^0-9]/g, '');
                      return next;
                    })
                  }
                  onApply={(sign) => applyFieldToScore(draftCustom[i] ?? '', sign)}
                  styles={styles}
                />
              ))}

              {isLastPlayer ? (
                <Pressable style={styles.nextButton} onPress={commitEditor}>
                  <Text style={styles.nextButtonText}>✓ Done</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.nextButton} onPress={advanceToNextPlayer}>
                  <Text style={styles.nextButtonText}>Next Player →</Text>
                </Pressable>
              )}
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </BackgroundComponent>
  );
}

function ExtraFieldRow({
  label,
  value,
  onChangeText,
  onApply,
  styles,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onApply: (sign: 1 | -1) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.extraFieldRow}>
      <Text style={styles.extraFieldLabel}>{label}</Text>
      <View style={styles.extraFieldInputGroup}>
        <TextInput
          keyboardType="number-pad"
          value={value}
          onChangeText={onChangeText}
          style={styles.extraFieldInput}
        />
        <Pressable style={styles.stepperButton} onPress={() => onApply(-1)} hitSlop={6}>
          <Text style={styles.stepperButtonText}>−</Text>
        </Pressable>
        <Pressable style={styles.stepperButton} onPress={() => onApply(1)} hitSlop={6}>
          <Text style={styles.stepperButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}