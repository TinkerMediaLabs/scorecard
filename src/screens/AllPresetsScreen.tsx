import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../App';
import Text from '../components/AppText';
import PresetEditorModal from '../components/PresetEditorModal';
import PresetListItem from '../components/PresetListItem';
import { usePurchases } from '../contexts/PurchasesContext';
import { deletePreset, listPresets, loadAllScorecards, savePreset, saveScorecard } from '../lib/storage';
import { DEFAULT_PRESET_STATS, Preset, Scorecard, ScorecardSettings } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AllPresets'>;

export default function AllPresetsScreen({ navigation }: Props) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activeScorecardCount, setActiveScorecardCount] = useState(0);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const insets = useSafeAreaInsets();
  const { isUnlocked } = usePurchases();

  const reload = useCallback(() => {
    listPresets().then((all) =>
      setPresets([...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    );
    loadAllScorecards().then((cards) =>
      setActiveScorecardCount(cards.filter((c) => c.status === 'active').length)
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const createFromPreset = async (preset: Preset) => {
    if (!isUnlocked && activeScorecardCount >= 1) {
      navigation.navigate('Paywall');
      return;
    }
    const now = new Date().toISOString();
    const newCard: Scorecard = {
      id: Crypto.randomUUID(),
      name: `${preset.name} — ${new Date().toLocaleDateString()}`,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      players: preset.players.map((p) => ({ id: Crypto.randomUUID(), name: p.name })),
      rounds: [{ id: Crypto.randomUUID(), scores: {}, bids: {}, melds: {}, bonuses: {}, customValues: {} }],
      settings: preset.settings,
      presetId: preset.id,
    };
    await saveScorecard(newCard);
    navigation.navigate('Scorecard', { scorecardId: newCard.id });
  };

  const handleSavePreset = async ({
    name,
    settings,
    players,
  }: {
    name: string;
    settings: ScorecardSettings;
    players: Preset['players'];
  }) => {
    const preset: Preset = {
      id: editingPreset?.id ?? Crypto.randomUUID(),
      name,
      settings,
      players,
      createdAt: editingPreset?.createdAt ?? new Date().toISOString(),
      stats: editingPreset?.stats ?? DEFAULT_PRESET_STATS,
    };
    await savePreset(preset);
    setEditorVisible(false);
    setEditingPreset(null);
    reload();
  };

  const handleDeletePreset = async (id: string) => {
    await deletePreset(id);
    reload();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>All Presets</Text>
        <View style={{ width: 50 }} />
      </View>

      <FlatList
        data={presets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.empty}>No presets yet.</Text>}
        renderItem={({ item }) => (
          <PresetListItem
            preset={item}
            onPress={() => createFromPreset(item)}
            onEdit={() => {
              setEditingPreset(item);
              setEditorVisible(true);
            }}
            onDelete={() => handleDeletePreset(item.id)}
            onViewStats={() => navigation.navigate('PresetStats', { presetId: item.id })}
          />
        )}
      />

      <PresetEditorModal
        visible={editorVisible}
        onClose={() => {
          setEditorVisible(false);
          setEditingPreset(null);
        }}
        onSave={handleSavePreset}
        initialName={editingPreset?.name}
        initialSettings={editingPreset?.settings}
        initialPlayers={editingPreset?.players}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backText: { fontSize: 16, fontWeight: '600', color: '#155843', width: 60 },
  title: { fontSize: 20, fontWeight: '700' },
  list: { paddingBottom: 40 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
});