import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../App';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import PresetEditorModal from '../components/PresetEditorModal';
import PresetListItem from '../components/PresetListItem';
import PresetSortMenu from '../components/PresetSortMenu';
import { usePurchases } from '../contexts/PurchasesContext';
import { PresetSortMode, sortPresets } from '../lib/presetSort';
import { deletePreset, listPresets, loadAllScorecards, savePreset, saveScorecard } from '../lib/storage';
import { DEFAULT_PRESET_STATS, Preset, Scorecard, ScorecardSettings } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AllPresets'>;

const SORT_LABELS: Record<PresetSortMode, string> = {
  mostRecent: 'Most Recent',
  mostPlayed: 'Most Played',
};

export default function AllPresetsScreen({ navigation }: Props) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [sortMode, setSortMode] = useState<PresetSortMode>('mostRecent');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [activeScorecardCount, setActiveScorecardCount] = useState(0);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const insets = useSafeAreaInsets();
  const { isUnlocked } = usePurchases();
  const sortButtonRef = useRef<View>(null);

  const reload = useCallback(() => {
    listPresets().then(setPresets);
    loadAllScorecards().then((cards) =>
      setActiveScorecardCount(cards.filter((c) => c.status === 'active').length)
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const sortedPresets = useMemo(() => sortPresets(presets, sortMode), [presets, sortMode]);
  const visiblePresets = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return sortedPresets;
    return sortedPresets.filter((p) => p.name.toLowerCase().includes(trimmed));
  }, [sortedPresets, query]);

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
    const isNewPreset = !editingPreset;
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
    if (isNewPreset) {
      setSortMode('mostRecent');
    }
  };

  const handleDeletePreset = async (id: string) => {
    await deletePreset(id);
    reload();
  };

  const emptyMessage = presets.length === 0
    ? 'No preset scorecards yet.'
    : `No presets match "${query.trim()}".`;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <MaterialCommunityIcons name="arrow-left" size={24} style={styles.arrow} />
        </Pressable>
        <Text style={styles.title}>Preset Scorecards</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Pressable onPress={() => query.length > 0 && setQuery('')} hitSlop={8} disabled={query.length === 0}>
            <FontAwesome name={query.length > 0 ? 'times-circle' : 'search'} size={16} color="#999" />
          </Pressable>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            placeholderTextColor="#999"
            style={styles.searchInput}
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>

        <View ref={sortButtonRef} collapsable={false}>
          <Pressable onPress={() => setSortMenuVisible(true)} hitSlop={8} style={styles.sortTrigger}>
            <Text style={styles.sortTriggerText}>{SORT_LABELS[sortMode]}</Text>
            <FontAwesome name="sort" size={13} color="#155843" style={styles.sortTriggerIcon} />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={visiblePresets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.empty}>{emptyMessage}</Text>}
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

      <PresetSortMenu
        visible={sortMenuVisible}
        onClose={() => setSortMenuVisible(false)}
        anchorRef={sortButtonRef}
        sortMode={sortMode}
        onSelectSort={setSortMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 0, marginBottom: 16 },
  backText: { fontSize: 20, fontWeight: '600', color: '#155843' },
  title: { fontSize: 20, fontWeight: '700' },
  arrow: {marginRight: 10},
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#000', paddingVertical: 0 },
  sortTrigger: { flexDirection: 'row', alignItems: 'center' },
  sortTriggerText: { fontSize: 14, fontWeight: '600', color: '#155843' },
  sortTriggerIcon: { marginLeft: 6 },
  list: { paddingBottom: 40 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
});