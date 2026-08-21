import { FontAwesome6 } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from './AppText';
import ConfirmModal, { APP_PALETTE } from './ConfirmModal';
import SwipeableCard, { SwipeAction } from './SwipeableCard';

import { Scorecard } from '../types';

type Props = {
  card: Scorecard;
  presetName?: string | null;
  onPress: () => void;
  onDelete: () => void;
};

export default function ScorecardListItem({ card, presetName, onPress, onDelete }: Props) {
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const confirmDelete = () => {
    setDeleteConfirmVisible(true);
  };

  const handleConfirmDelete = () => {
    setDeleteConfirmVisible(false);
    onDelete();
  };

  const actions: SwipeAction[] = [
    { key: 'delete', label: 'Delete', icon: 'trash', color: '#B94A48', onPress: confirmDelete },
  ];

  // Any card linked to a preset shows the gem + preset name instead of its status word
  // ("In progress" or "Finished"), regardless of whether it's still active or completed.
  // A card with no preset falls back to plain status text (or just the player count if active).
  const showPresetMeta = !!presetName;

  return (
    <>
      <SwipeableCard actions={actions} onPress={onPress} cardStyle={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{card.name}</Text>
          {showPresetMeta ? (
            <View style={styles.presetMetaRow}>
              <FontAwesome6 name="gem" size={11} color="#155843" style={styles.presetMetaIcon} />
              <Text style={styles.presetMetaText} numberOfLines={1}>
                {presetName}
              </Text>
              <Text style={styles.cardMeta}> · {card.players.length} players</Text>
            </View>
          ) : (
            <Text style={styles.cardMeta}>
              {card.status === 'finished' ? 'Finished · ' : ''}
              {card.players.length} players
            </Text>
          )}
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
  presetMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  presetMetaIcon: { marginRight: 4 },
  presetMetaText: { fontSize: 13, fontWeight: '600', color: '#155843', flexShrink: 1 },
});