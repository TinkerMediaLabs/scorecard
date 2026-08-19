import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from './AppText';
import ConfirmModal, { APP_PALETTE } from './ConfirmModal';
import SwipeableCard, { SwipeAction } from './SwipeableCard';

import { Preset } from '../types';

type Props = {
  preset: Preset;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewStats: () => void;
};

export default function PresetListItem({ preset, onPress, onEdit, onDelete, onViewStats }: Props) {
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const confirmDelete = () => {
    setDeleteConfirmVisible(true);
  };

  const handleConfirmDelete = () => {
    setDeleteConfirmVisible(false);
    onDelete();
  };

  const actions: SwipeAction[] = [
    { key: 'delete', label: 'Delete', icon: 'trash', color: '#981321', onPress: confirmDelete },
    { key: 'edit', label: 'Edit', icon: 'pencil', color: '#6c757d', onPress: onEdit },
    { key: 'stats', label: 'Statistics', icon: 'trophy', color: '#cf8918', onPress: onViewStats },
    { key: 'new', label: 'New Card', icon: 'plus-circle', color: '#14872f', onPress: onPress },
  ];

  return (
    <>
      <SwipeableCard actions={actions} onPress={onPress} cardStyle={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{preset.name}</Text>
          <Text style={styles.cardMeta}>Tap to start a new scorecard</Text>
        </View>
      </SwipeableCard>

      <ConfirmModal
        visible={deleteConfirmVisible}
        theme={APP_PALETTE}
        title="Delete Preset?"
        message={`"${preset.name}" will be permanently deleted. Scorecards already created from it are unaffected.`}
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
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e6f2ee', borderRadius: 10, padding: 16 },
  cardName: { fontSize: 16, fontWeight: '600' },
  cardMeta: { fontSize: 13, color: '#666', marginTop: 4 },
});