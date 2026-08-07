import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Text from './AppText';

import { Preset } from '../types';

type Props = {
  preset: Preset;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewStats: () => void;
};

export default function PresetListItem({ preset, onPress, onEdit, onDelete, onViewStats }: Props) {
  const confirmDelete = () => {
    Alert.alert(
      'Delete Preset?',
      `"${preset.name}" will be permanently deleted. Scorecards already created from it are unaffected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName}>{preset.name}</Text>
        <Text style={styles.cardMeta}>Tap to start a new scorecard</Text>
      </View>
      <Pressable onPress={onViewStats} hitSlop={10} style={styles.statsButton}>
        <Text style={styles.statsIcon}>📊</Text>
      </Pressable>
      <Pressable onPress={onEdit} hitSlop={10} style={styles.editButton}>
        <Text style={styles.editIcon}>✏️</Text>
      </Pressable>
      <Pressable onPress={confirmDelete} hitSlop={10} style={styles.deleteButton}>
        <Text style={styles.deleteIcon}>🗑</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 10, padding: 16, marginBottom: 10 },
  cardName: { fontSize: 16, fontWeight: '600' },
  cardMeta: { fontSize: 13, color: '#666', marginTop: 4 },
  statsButton: { marginLeft: 8, padding: 4 },
  statsIcon: { fontSize: 16 },
  editButton: { marginLeft: 8, padding: 4 },
  editIcon: { fontSize: 16 },
  deleteButton: { marginLeft: 8, padding: 4 },
  deleteIcon: { fontSize: 18 },
});