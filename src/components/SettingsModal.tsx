import { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Player, ScorecardSettings } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  cardName: string;
  onRenameCard: (name: string) => void;
  players: Player[];
  onRenamePlayer: (playerId: string, name: string) => void;
  onDeletePlayer: (playerId: string) => void;
  settings: ScorecardSettings;
  onUpdateSettings: (patch: Partial<ScorecardSettings>) => void;
};

export default function SettingsModal({
  visible,
  onClose,
  cardName,
  onRenameCard,
  players,
  onRenamePlayer,
  onDeletePlayer,
  settings,
  onUpdateSettings,
}: Props) {
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
          <Section title="Card Title">
            <TextInput value={cardName} onChangeText={onRenameCard} style={styles.textInput} />
          </Section>

          <Section title="Players">
            {players.map((p) => (
              <View key={p.id} style={styles.playerRow}>
                <TextInput
                  value={p.name}
                  onChangeText={(text) => onRenamePlayer(p.id, text)}
                  style={[styles.textInput, styles.playerInput]}
                />
                {players.length > 2 && (
                  <Pressable onPress={() => onDeletePlayer(p.id)} style={styles.deleteButton}>
                    <Text style={styles.deleteText}>Remove</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </Section>

          <Section title="Play Style">
            <Row label="Lowest score wins" value={settings.lowestScoreWins} onValueChange={(v) => onUpdateSettings({ lowestScoreWins: v })} />
          </Section>

          <Section title="Options">
            <Row label="Use Roman numerals" value={settings.useRomanNumerals} onValueChange={(v) => onUpdateSettings({ useRomanNumerals: v })} />
            <Row label="Highlight round winner" value={settings.showRoundWinner} onValueChange={(v) => onUpdateSettings({ showRoundWinner: v })} />
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
      <Switch value={value} onValueChange={onValueChange} />
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
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 10 },
  textInput: { borderBottomWidth: 1, borderColor: '#ddd', paddingVertical: 8, fontSize: 16 },
  playerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  playerInput: { flex: 1 },
  deleteButton: { marginLeft: 10 },
  deleteText: { color: '#d92121', fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  rowLabel: { fontSize: 16 },
});