import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { ReactNode, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { RootStackParamList } from '../App';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';

import { usePurchases } from '../contexts/PurchasesContext';
import { TEXT_SIZE_LABELS, TEXT_SIZE_OPTIONS } from '../lib/fonts';
import { DONE_SOUND_LABELS, DONE_SOUND_OPTIONS, TICKER_SOUND_LABELS, TICKER_SOUND_OPTIONS } from '../lib/sounds';
import { THEMES, THEME_NAMES } from '../lib/themes';
import { WIN_CONDITION_LABELS, WIN_CONDITION_OPTIONS } from '../lib/winConditions';
import { DEFAULT_SETTINGS, Player, ScorecardSettings, Theme } from '../types';

const FREE_THEME: Theme = 'whiteboard';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (result: { name: string; settings: ScorecardSettings; players: Player[] }) => void;
  initialName?: string;
  initialSettings?: ScorecardSettings;
  initialPlayers?: Player[];
};

export default function PresetEditorModal({
  visible,
  onClose,
  onSave,
  initialName,
  initialSettings,
  initialPlayers,
}: Props) {
  const [name, setName] = useState('');
  const [settings, setSettings] = useState<ScorecardSettings>(DEFAULT_SETTINGS);
  const [players, setPlayers] = useState<Player[]>([]);
  const [roundSecondsText, setRoundSecondsText] = useState(String(DEFAULT_SETTINGS.timerRoundSeconds));
  const { isUnlocked } = usePurchases();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    if (visible) {
      const nextSettings = initialSettings ?? DEFAULT_SETTINGS;
      setName(initialName ?? '');
      setSettings(nextSettings);
      setRoundSecondsText(String(nextSettings.timerRoundSeconds));
      setPlayers(
        initialPlayers && initialPlayers.length > 0
          ? initialPlayers
          : [
              { id: Crypto.randomUUID(), name: 'Player 1' },
              { id: Crypto.randomUUID(), name: 'Player 2' },
            ]
      );
    }
  }, [visible, initialName, initialSettings, initialPlayers]);

  const updateSettings = (patch: Partial<ScorecardSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const addPlayer = () => {
    setPlayers((prev) => [...prev, { id: Crypto.randomUUID(), name: `Player ${prev.length + 1}` }]);
  };

  const removePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const renamePlayer = (id: string, playerName: string) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name: playerName } : p)));
  };

  const updateCustomField = (index: number, label: string) => {
    const next = [...(settings.customFields ?? [])];
    next[index] = label.slice(0, 8);
    updateSettings({ customFields: next });
  };

  const addCustomField = () => {
    const current = settings.customFields ?? [];
    if (current.length >= 3) return;
    updateSettings({ customFields: [...current, `Field ${current.length + 1}`] });
  };

  const removeCustomField = (index: number) => {
    updateSettings({ customFields: (settings.customFields ?? []).filter((_, i) => i !== index) });
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name Required', 'Give this preset a name before saving.');
      return;
    }
    if (players.length === 0) {
      Alert.alert('At Least One Player', 'A preset needs at least one player.');
      return;
    }
    onSave({ name: trimmed, settings, players });
  };

  const handleSelectTheme = (themeName: Theme) => {
    if (!isUnlocked && themeName !== FREE_THEME) {
      onClose();
      navigation.navigate('Paywall');
      return;
    }
    updateSettings({ theme: themeName });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{initialName ? 'Edit Preset' : 'New Preset'}</Text>
          <Pressable onPress={handleSave}>
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Section title="Preset Name">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Tournament Rules"
              style={styles.textInput}
            />
          </Section>

          <Section title="Players">
            {players.map((p) => (
              <View key={p.id} style={styles.playerRow}>
                <TextInput
                  value={p.name}
                  onChangeText={(text) => renamePlayer(p.id, text)}
                  style={[styles.textInput, styles.playerInput]}
                />
                {players.length > 1 && (
                  <Pressable onPress={() => removePlayer(p.id)} style={styles.deleteButton}>
                    <Text style={styles.deleteIcon}>🗑</Text>
                  </Pressable>
                )}
              </View>
            ))}
            <Pressable onPress={addPlayer} style={styles.addFieldButton}>
              <Text style={styles.addFieldButtonText}>+ Add Player/Team</Text>
            </Pressable>
          </Section>

          <Section title="Play Style">
            <ChipPicker
              options={WIN_CONDITION_OPTIONS}
              labels={WIN_CONDITION_LABELS}
              value={settings.winCondition}
              onChange={(v) => updateSettings({ winCondition: v })}
            />
          </Section>

          <Section title="Cell Options">
            <Row label="Bid" value={settings.bidEnabled} onValueChange={(v) => updateSettings({ bidEnabled: v })} />
            <Row label="Meld" value={settings.meldEnabled} onValueChange={(v) => updateSettings({ meldEnabled: v })} />
            <Row label="Bonus" value={settings.bonusEnabled} onValueChange={(v) => updateSettings({ bonusEnabled: v })} />
          </Section>

          <Section title="Custom Fields">
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
              <Pressable onPress={addCustomField} style={styles.addFieldButton}>
                <Text style={styles.addFieldButtonText}>+ Add Field</Text>
              </Pressable>
            )}
          </Section>

          <Section title="Options">
            <Row label="Use Roman numerals" value={settings.useRomanNumerals} onValueChange={(v) => updateSettings({ useRomanNumerals: v })} />
            <Row label="Show Round Wins" value={settings.showRoundWinner} onValueChange={(v) => updateSettings({ showRoundWinner: v })} />
            <Row label="Highlight Round Winners" value={settings.highlightRoundWinner} onValueChange={(v) => updateSettings({ highlightRoundWinner: v })} />
          </Section>

          <Section title="Text Size">
            <ChipPicker
              options={TEXT_SIZE_OPTIONS}
              labels={TEXT_SIZE_LABELS}
              value={settings.textSize}
              onChange={(v) => updateSettings({ textSize: v })}
            />
          </Section>

          <Section title="Theme">
            <View style={styles.themeRow}>
              {THEME_NAMES.map((themeName) => {
                const palette = THEMES[themeName];
                const selected = settings.theme === themeName;
                const locked = !isUnlocked && themeName !== FREE_THEME;
                return (
                  <Pressable
                    key={themeName}
                    onPress={() => handleSelectTheme(themeName)}
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
            <Row label="Use Timer" value={settings.timerEnabled} onValueChange={(v) => updateSettings({ timerEnabled: v })} />

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
                        updateSettings({ timerRoundSeconds: n });
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

                <Row label="15 Second Warning" value={settings.timerWarningEnabled} onValueChange={(v) => updateSettings({ timerWarningEnabled: v })} />

                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Completion Sound</Text>
                <ChipPicker
                  options={DONE_SOUND_OPTIONS}
                  labels={DONE_SOUND_LABELS}
                  value={settings.timerDoneSound}
                  onChange={(v) => updateSettings({ timerDoneSound: v })}
                />

                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Ticker Sound</Text>
                <ChipPicker
                  options={TICKER_SOUND_OPTIONS}
                  labels={TICKER_SOUND_LABELS}
                  value={settings.timerTickerSound}
                  onChange={(v) => updateSettings({ timerTickerSound: v })}
                />
              </>
            )}
          </Section>
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
  headerTitle: { fontSize: 18, fontWeight: '700' },
  cancelText: { fontSize: 16, color: '#888' },
  saveText: { fontSize: 16, color: '#155843', fontWeight: '600' },
  content: { paddingHorizontal: 20, paddingBottom: 60 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 10 },
  textInput: { borderBottomWidth: 1, borderColor: '#ddd', paddingVertical: 8, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  rowLabel: { fontSize: 16 },
  playerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  playerInput: { flex: 1, marginRight: 10 },
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
  customFieldRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  customFieldInput: { flex: 1, marginRight: 10 },
  deleteButton: { marginLeft: 8, padding: 4 },
  deleteIcon: { fontSize: 16 },
  addFieldButton: { alignSelf: 'flex-start', marginTop: 4, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#eee' },
  addFieldButtonText: { fontSize: 13, fontWeight: '600', color: '#333' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  chipSelected: { backgroundColor: '#155843', borderColor: '#155843' },
  chipText: { fontSize: 13, color: '#333' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
});