import { ReactNode, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';

import { THEMES, THEME_NAMES } from '../lib/themes';
import { DEFAULT_SETTINGS, ScorecardSettings } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (result: { name: string; settings: ScorecardSettings }) => void;
  initialName?: string;
  initialSettings?: ScorecardSettings;
};

export default function PresetEditorModal({ visible, onClose, onSave, initialName, initialSettings }: Props) {
  const [name, setName] = useState('');
  const [settings, setSettings] = useState<ScorecardSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (visible) {
      setName(initialName ?? '');
      setSettings(initialSettings ?? DEFAULT_SETTINGS);
    }
  }, [visible, initialName, initialSettings]);

  const updateSettings = (patch: Partial<ScorecardSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
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
    onSave({ name: trimmed, settings });
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

          <Section title="Play Style">
            <Row label="Lowest score wins" value={settings.lowestScoreWins} onValueChange={(v) => updateSettings({ lowestScoreWins: v })} />
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
            <Row label="Highlight round winner" value={settings.showRoundWinner} onValueChange={(v) => updateSettings({ showRoundWinner: v })} />
          </Section>

          <Section title="Theme">
            <View style={styles.themeRow}>
              {THEME_NAMES.map((themeName) => {
                const palette = THEMES[themeName];
                const selected = settings.theme === themeName;
                return (
                  <Pressable
                    key={themeName}
                    onPress={() => updateSettings({ theme: themeName })}
                    style={[
                      styles.themeSwatch,
                      { backgroundColor: palette.background, borderColor: selected ? palette.accent : '#ddd' },
                    ]}
                  >
                    <Text style={[styles.themeLabel, { color: palette.text }]}>{palette.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Section>

          <Section title="Timer">
            <Row label="Use Timer" value={settings.timerEnabled} onValueChange={(v) => updateSettings({ timerEnabled: v })} />

            {settings.timerEnabled && (
              <View style={[styles.playerRow, { justifyContent: 'space-between' }]}>
                <Text style={styles.rowLabel}>Round length (seconds)</Text>
                <TextInput
                  keyboardType="number-pad"
                  value={String(settings.timerRoundSeconds)}
                  onChangeText={(text) => {
                    const n = parseInt(text, 10);
                    if (!Number.isNaN(n)) updateSettings({ timerRoundSeconds: n });
                  }}
                  style={[styles.textInput, { width: 60, textAlign: 'center' }]}
                />
              </View>
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
  themeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  themeSwatch: { width: '47%', paddingVertical: 16, borderRadius: 10, borderWidth: 2, alignItems: 'center' },
  themeLabel: { fontWeight: '600', fontSize: 13 },
  customFieldRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  customFieldInput: { flex: 1, marginRight: 10 },
  deleteButton: { marginLeft: 8, padding: 4 },
  deleteIcon: { fontSize: 16 },
  addFieldButton: { alignSelf: 'flex-start', marginTop: 4, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#eee' },
  addFieldButtonText: { fontSize: 13, fontWeight: '600', color: '#333' },
});