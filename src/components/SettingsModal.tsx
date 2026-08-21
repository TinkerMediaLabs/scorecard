import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ReactNode, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { RootStackParamList } from '../App';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';

import { usePurchases } from '../contexts/PurchasesContext';
import { DONE_SOUND_LABELS, DONE_SOUND_OPTIONS, TICKER_SOUND_LABELS, TICKER_SOUND_OPTIONS } from '../lib/sounds';
import { THEMES, THEME_NAMES } from '../lib/themes';
import { Player, Preset, ScorecardSettings, Theme } from '../types';

import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { TEXT_SIZE_LABELS, TEXT_SIZE_OPTIONS } from '../lib/fonts';
import { WIN_CONDITION_LABELS, WIN_CONDITION_OPTIONS } from '../lib/winConditions';

const FREE_THEME: Theme = 'whiteboard';

// Only these fields are pushed to (or compared against) a linked preset. Things like the card's
// own name or the live player order are session-specific to this scorecard and never touch the
// preset record.
function settingsEqual(a: ScorecardSettings, b: ScorecardSettings): boolean {
  const aFields = a.customFields ?? [];
  const bFields = b.customFields ?? [];
  return (
    a.winCondition === b.winCondition &&
    a.showRoundWinner === b.showRoundWinner &&
    a.highlightRoundWinner === b.highlightRoundWinner &&
    a.useRomanNumerals === b.useRomanNumerals &&
    a.theme === b.theme &&
    a.timerEnabled === b.timerEnabled &&
    a.timerWarningEnabled === b.timerWarningEnabled &&
    a.timerRoundSeconds === b.timerRoundSeconds &&
    a.timerDoneSound === b.timerDoneSound &&
    a.timerTickerSound === b.timerTickerSound &&
    a.bidEnabled === b.bidEnabled &&
    a.meldEnabled === b.meldEnabled &&
    a.bonusEnabled === b.bonusEnabled &&
    a.textSize === b.textSize &&
    aFields.length === bFields.length &&
    aFields.every((v, i) => v === bFields[i])
  );
}

type Props = {
  visible: boolean;
  onClose: () => void;
  cardName: string;
  onRenameCard: (name: string) => void;
  players: Player[];
  onRenamePlayer: (playerId: string, name: string) => void;
  onDeletePlayer: (playerId: string) => void;
  onAddPlayer: () => void;
  settings: ScorecardSettings;
  onUpdateSettings: (patch: Partial<ScorecardSettings>) => void;
  onShufflePlayers: () => void;
  onReorderPlayers: (players: Player[]) => void;
  onSaveAsPreset: (name: string, settings: ScorecardSettings) => void;
  linkedPreset: Preset | null;
  onApplyChangesToPreset: (settings: ScorecardSettings) => void | Promise<void>;
};

export default function SettingsModal({
  visible,
  onClose,
  cardName,
  onRenameCard,
  players,
  onRenamePlayer,
  onDeletePlayer,
  onAddPlayer,
  settings,
  onUpdateSettings,
  onShufflePlayers,
  onReorderPlayers,
  onSaveAsPreset,
  linkedPreset,
  onApplyChangesToPreset,
}: Props) {
  const [presetName, setPresetName] = useState('');
  const [showPresetInput, setShowPresetInput] = useState(false);
  const [roundSecondsText, setRoundSecondsText] = useState(String(settings.timerRoundSeconds));
  const [presetBaseline, setPresetBaseline] = useState<ScorecardSettings | null>(linkedPreset?.settings ?? null);
  const [hasChangedOnce, setHasChangedOnce] = useState(false);
  const { isUnlocked } = usePurchases();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    setRoundSecondsText(String(settings.timerRoundSeconds));
  }, [settings.timerRoundSeconds]);

  // Reset the "have settings diverged from the preset" tracking each time the modal is opened,
  // so "Apply Changes to Preset" only appears once the user actually changes something in this
  // session (not just because a stale comparison happened to differ).
  useEffect(() => {
    if (visible) {
      setPresetBaseline(linkedPreset?.settings ?? null);
      setHasChangedOnce(false);
    }
  }, [visible]);

  const isPresetDirty = presetBaseline ? !settingsEqual(settings, presetBaseline) : false;

  useEffect(() => {
    if (isPresetDirty) setHasChangedOnce(true);
  }, [isPresetDirty]);

  const handleApplyChangesToPreset = async () => {
    await onApplyChangesToPreset(settings);
    setPresetBaseline(settings);
  };

  const updateCustomField = (index: number, label: string) => {
    const next = [...(settings.customFields ?? [])];
    next[index] = label.slice(0, 8);
    onUpdateSettings({ customFields: next });
  };

  const addCustomField = () => {
    const current = settings.customFields ?? [];
    if (current.length >= 3) return;
    onUpdateSettings({ customFields: [...current, `Field ${current.length + 1}`] });
  };

  const removeCustomField = (index: number) => {
    onUpdateSettings({ customFields: (settings.customFields ?? []).filter((_, i) => i !== index) });
  };

  const handleSavePreset = () => {
    const trimmed = presetName.trim();
    if (!trimmed) return;
    onSaveAsPreset(trimmed, settings);
    setPresetName('');
    setShowPresetInput(false);
  };

  const handleSelectTheme = (name: Theme) => {
    if (!isUnlocked && name !== FREE_THEME) {
      onClose();
      navigation.navigate('Paywall');
      return;
    }
    onUpdateSettings({ theme: name });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {linkedPreset && (
            <View style={styles.presetLinkBlock}>
              <View style={styles.presetIndicatorRow}>
                <MaterialCommunityIcons
                  name="keyboard-return"
                  size={16}
                  color="#155843"
                  style={styles.presetIndicatorIcon}
                />
                <Text style={styles.presetIndicatorText}>{linkedPreset.name}</Text>
              </View>

              {hasChangedOnce && (
                <Pressable
                  onPress={isPresetDirty ? handleApplyChangesToPreset : undefined}
                  disabled={!isPresetDirty}
                  style={[styles.applyPresetButton, !isPresetDirty && styles.applyPresetButtonDisabled]}
                >
                  <Text
                    style={[
                      styles.applyPresetButtonText,
                      !isPresetDirty && styles.applyPresetButtonTextDisabled,
                    ]}
                  >
                    {isPresetDirty ? 'Apply Changes to Preset' : 'Preset Updated'}
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          <Section title="Card Title">
            <TextInput value={cardName} onChangeText={onRenameCard} style={styles.textInput} />
          </Section>

          <View style={styles.section}>
            <View style={styles.playersHeaderRow}>
              <Text style={styles.sectionTitle}>Players</Text>
              <Pressable onPress={onShufflePlayers} style={styles.randomizeButton}>
                <Text style={styles.randomizeButtonText}>Randomize Order</Text>
              </Pressable>
            </View>

            <GestureHandlerRootView>
              <DraggableFlatList
                data={players}
                scrollEnabled={false}
                keyExtractor={(item) => item.id}
                onDragEnd={({ data }) => onReorderPlayers(data)}
                renderItem={({ item, drag, isActive }: RenderItemParams<Player>) => (
                  <ScaleDecorator>
                    <View style={[styles.playerRow, isActive && styles.playerRowActive]}>
                      <Pressable onLongPress={drag} hitSlop={10} style={styles.dragHandle}>
                        <Text style={styles.dragHandleIcon}>☰</Text>
                      </Pressable>
                      <TextInput
                        value={item.name}
                        onChangeText={(text) => onRenamePlayer(item.id, text)}
                        style={[styles.textInput, styles.playerInput]}
                      />
                      {players.length > 1 && (
                        <Pressable onPress={() => onDeletePlayer(item.id)} style={styles.deleteButton}>
                          <Text style={styles.deleteIcon}>🗑</Text>
                        </Pressable>
                      )}
                    </View>
                  </ScaleDecorator>
                )}
              />
            </GestureHandlerRootView>
            <Pressable onPress={onAddPlayer} style={styles.addPlayerButton}>
              <Text style={styles.addPlayerButtonText}>+ Add Player/Team</Text>
            </Pressable>
          </View>

          <Section title="Play Style">
            <ChipPicker
              options={WIN_CONDITION_OPTIONS}
              labels={WIN_CONDITION_LABELS}
              value={settings.winCondition}
              onChange={(v) => onUpdateSettings({ winCondition: v })}
            />
          </Section>

          <Section title="Cell Options">
            <Row label="Bid" value={settings.bidEnabled} onValueChange={(v) => onUpdateSettings({ bidEnabled: v })} />
            <Row label="Meld" value={settings.meldEnabled} onValueChange={(v) => onUpdateSettings({ meldEnabled: v })} />
            <Row label="Bonus" value={settings.bonusEnabled} onValueChange={(v) => onUpdateSettings({ bonusEnabled: v })} />

            <Text style={styles.subLabel}>Custom Fields</Text>
            {(settings.customFields ?? []).map((label, i) => (
              <View key={i} style={styles.customFieldRow}>
                <TextInput
                  value={label}
                  onChangeText={(text) => updateCustomField(i, text)}
                  maxLength={8}
                  style={[styles.textInput, styles.customFieldInput]}
                />
                <Pressable onPress={() => removeCustomField(i)} style={styles.deleteButton}>
                  <Text style={styles.deleteIcon}>🗑</Text>
                </Pressable>
              </View>
            ))}
            {(settings.customFields ?? []).length < 3 && (
              <Pressable onPress={addCustomField} style={styles.randomizeButton}>
                <Text style={styles.randomizeButtonText}>+ Add Custom Field</Text>
              </Pressable>
            )}
          </Section>

          <Section title="Display Options">
            <Row label="Roman numeral rounds" value={settings.useRomanNumerals} onValueChange={(v) => onUpdateSettings({ useRomanNumerals: v })} />
            <Row label="Show Round Wins" value={settings.showRoundWinner} onValueChange={(v) => onUpdateSettings({ showRoundWinner: v })} />
            <Row label="Highlight Round Winners" value={settings.highlightRoundWinner} onValueChange={(v) => onUpdateSettings({ highlightRoundWinner: v })} />
          </Section>

          <Section title="Text Size">
            <ChipPicker
              options={TEXT_SIZE_OPTIONS}
              labels={TEXT_SIZE_LABELS}
              value={settings.textSize}
              onChange={(v) => onUpdateSettings({ textSize: v })}
            />
          </Section>

          <Section title="Theme">
            <View style={styles.themeRow}>
              {THEME_NAMES.map((name) => {
                const palette = THEMES[name];
                const selected = settings.theme === name;
                const locked = !isUnlocked && name !== FREE_THEME;
                return (
                  <Pressable
                    key={name}
                    onPress={() => handleSelectTheme(name)}
                    style={[
                      styles.themeSwatch,
                      { backgroundColor: palette.background, borderColor: !locked && selected ? palette.accent : '#ddd' },
                    ]}
                  >
                    <View style={locked ? styles.themeSwatchDimmed : undefined}>
                      <Text style={[styles.themeLabel, { color: palette.text }]}>{palette.label}</Text>
                    </View>
                    {locked && (
                      <View style={styles.themeLockOverlay}>
                        <MaterialCommunityIcons name="lock" size={24} style={styles.themeLockIcon} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Section>

          <Section title="Timer">
            <Row label="Use Timer" value={settings.timerEnabled} onValueChange={(v) => onUpdateSettings({ timerEnabled: v })} />

            {settings.timerEnabled && (
              <>
                <View style={[styles.playerRow, { justifyContent: 'space-between' }]}>
                  <Text style={styles.rowLabel}>Round length (seconds)</Text>
                  <TextInput
                    keyboardType="number-pad"
                    value={roundSecondsText}
                    onChangeText={(text) => {
                      const digitsOnly = text.replace(/[^0-9]/g, '');
                      setRoundSecondsText(digitsOnly);
                      const n = parseInt(digitsOnly, 10);
                      if (!Number.isNaN(n) && n > 0) {
                        onUpdateSettings({ timerRoundSeconds: n });
                      }
                    }}
                    onBlur={() => {
                      const n = parseInt(roundSecondsText, 10);
                      if (Number.isNaN(n) || n <= 0) {
                        setRoundSecondsText(String(settings.timerRoundSeconds));
                      }
                    }}
                    style={[styles.textInput, { width: 60, textAlign: 'center' }]}
                  />
                </View>

                <Row label="10 Second Warning" value={settings.timerWarningEnabled} onValueChange={(v) => onUpdateSettings({ timerWarningEnabled: v })} />

                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Completion Sound</Text>
                <ChipPicker
                  options={DONE_SOUND_OPTIONS}
                  labels={DONE_SOUND_LABELS}
                  value={settings.timerDoneSound}
                  onChange={(v) => onUpdateSettings({ timerDoneSound: v })}
                />

                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Ticker Sound</Text>
                <ChipPicker
                  options={TICKER_SOUND_OPTIONS}
                  labels={TICKER_SOUND_LABELS}
                  value={settings.timerTickerSound}
                  onChange={(v) => onUpdateSettings({ timerTickerSound: v })}
                />
              </>
            )}
          </Section>

          <Section title="Save as Preset">
            {showPresetInput ? (
              <View style={styles.presetSaveRow}>
                <TextInput
                  value={presetName}
                  onChangeText={setPresetName}
                  placeholder="Preset name"
                  style={[styles.textInput, styles.presetSaveInput]}
                  autoFocus
                />
                <Pressable onPress={handleSavePreset} style={styles.presetSaveButton}>
                  <Text style={styles.presetSaveButtonText}>Save</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => setShowPresetInput(true)} style={styles.randomizeButton}>
                <Text style={styles.randomizeButtonText}>
                  {linkedPreset ? 'Save Current Settings as New Preset' : 'Save Current Settings as Preset'}
                </Text>
              </Pressable>
            )}
          </Section>
          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#ddd', true: '#155843' }}
        thumbColor="#fff"
        ios_backgroundColor="#ddd"
      />
    </View>
  );
}

function ChipPicker<T extends string>({
  options,
  labels,
  value,
  onChange,
}: {
  options: T[];
  labels: Record<T, string>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <Pressable key={opt} onPress={() => onChange(opt)} style={[styles.chip, selected && styles.chipSelected]}>
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{labels[opt]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  doneText: { fontSize: 16, color: '#155843', fontWeight: '600' },
  content: { paddingHorizontal: 20, paddingBottom: 60 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#000', textTransform: 'uppercase', marginBottom: 10, fontFamily: 'FuzzyBubblesBold' },
  subLabel: { fontSize: 12, fontWeight: '600', color: '#888', marginTop: 10, marginBottom: 8 },
  presetLinkBlock: { marginBottom: 20 },
  presetIndicatorRow: { flexDirection: 'row', alignItems: 'center' },
  presetIndicatorIcon: { marginRight: 6 },
  presetIndicatorText: { fontSize: 14, fontWeight: '700', color: '#155843' },
  applyPresetButton: { marginTop: 10, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#155843' },
  applyPresetButtonDisabled: { backgroundColor: '#ccc' },
  applyPresetButtonText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  applyPresetButtonTextDisabled: { color: '#f2f2f2' },
  textInput: { borderBottomWidth: 1, borderColor: '#ddd', paddingVertical: 8, fontSize: 16 },
  playerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  playerInput: { flex: 1 },
  deleteButton: { marginLeft: 10 },
  deleteText: { color: '#d92121', fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  rowLabel: { fontSize: 16 },
  themeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  themeSwatch: { width: '47%', paddingVertical: 16, borderRadius: 10, borderWidth: 2, alignItems: 'center', position: 'relative', overflow: 'hidden' },
  themeSwatchDimmed: { opacity: 0.35 },
  themeLockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  themeLockIcon: { color: '#e7e7e7' },
  themeLabel: { fontWeight: '600', fontSize: 13 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  chipSelected: { backgroundColor: '#155843', borderColor: '#155843' },
  chipText: { fontSize: 13, color: '#333' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  shuffleButton: { alignSelf: 'flex-start', marginTop: 4, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#eee' },
  shuffleButtonText: { fontSize: 13, fontWeight: '600', color: '#333' },
  playersHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  randomizeButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#eee' },
  randomizeButtonText: { fontSize: 13, fontWeight: '600', color: '#333' },
  dragHandle: { paddingHorizontal: 6, paddingVertical: 4, marginRight: 8 },
  dragHandleIcon: { fontSize: 18, color: '#999' },
  deleteIcon: { fontSize: 16 },
  playerRowActive: { opacity: 0.7 },
  customFieldRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  customFieldInput: { flex: 1, marginRight: 10 },
  presetSaveRow: { flexDirection: 'row', alignItems: 'center' },
  presetSaveInput: { flex: 1, marginRight: 10 },
  presetSaveButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#155843' },
  presetSaveButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  addPlayerButton: { alignSelf: 'flex-start', marginTop: 12, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#eee' },
  addPlayerButtonText: { fontSize: 13, fontWeight: '600', color: '#333' },
});