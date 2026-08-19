import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from './AppText';
import ConfirmModal, { APP_PALETTE } from './ConfirmModal';
import SwipeableCard, { SwipeAction } from './SwipeableCard';

import { Scorecard } from '../types';

type Props = {
  card: Scorecard;
  onPress: () => void;
  onDelete: () => void;
};

export default function ScorecardListItem({ card, onPress, onDelete }: Props) {
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const confirmDelete = () => {
    setDeleteConfirmVisible(true);
  };

  const handleConfirmDelete = () => {
    setDeleteConfirmVisible(false);
    onDelete();
  };

  const actions: SwipeAction[] = [
    { key: 'delete', label: 'Delete', icon: 'trash', color: '#dc3545', onPress: confirmDelete },
  ];

  return (
    <>
      <SwipeableCard actions={actions} onPress={onPress} cardStyle={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{card.name}</Text>
          <Text style={styles.cardMeta}>
            {card.status === 'finished' ? 'Finished' : 'In progress'} · {card.players.length} players
          </Text>
        </View>
      </SwipeableCard>

      <ConfirmModal
        visible={deleteConfirmVisible}
        theme={APP_PALETTE}
        title="Delete Scorecard?"
        message={`"${card.name}" will be permanently deleted.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 10, padding: 16 },
  cardName: { fontSize: 16, fontWeight: '600' },
  cardMeta: { fontSize: 13, color: '#666', marginTop: 4 },
});