import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Text from './AppText';

import { Scorecard } from '../types';

type Props = {
  card: Scorecard;
  onPress: () => void;
  onDelete: () => void;
};

export default function ScorecardListItem({ card, onPress, onDelete }: Props) {
  const confirmDelete = () => {
    Alert.alert('Delete Scorecard?', `"${card.name}" will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName}>{card.name}</Text>
        <Text style={styles.cardMeta}>
          {card.status === 'finished' ? 'Finished' : 'In progress'} · {card.players.length} players
        </Text>
      </View>
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
  deleteButton: { marginLeft: 12, padding: 4 },
  deleteIcon: { fontSize: 18 },
});