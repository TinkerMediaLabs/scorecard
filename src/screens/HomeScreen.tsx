import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../App';
import Text from '../components/AppText';
import BottomSheetModal from '../components/BottomSheetModal';
import PresetEditorModal from '../components/PresetEditorModal';
import PresetListItem from '../components/PresetListItem';
import ScorecardListItem from '../components/ScorecardListItem';
import {
  clearAllData,
  clearHistory,
  deletePreset,
  deleteScorecard,
  listPresets,
  loadAllScorecards,
  savePreset,
  saveScorecard,
} from '../lib/storage';
import { DEFAULT_PRESET_STATS, DEFAULT_SETTINGS, Preset, Scorecard, ScorecardSettings } from '../types';

const PRIVACY_POLICY_URL = 'https://www.tinkermedia.net/scorecard-app/privacy-policy/';
const TERMS_OF_USE_URL = 'https://www.tinkermedia.net/scorecard-app/terms/';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [manageDataVisible, setManageDataVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const reload = useCallback(() => {
    loadAllScorecards().then((cards) => {
      const active = cards
        .filter((c) => c.status === 'active')
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      setScorecards(active);
    });
    listPresets().then(setPresets);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const createNewScorecard = async () => {
    const now = new Date().toISOString();
    const newCard: Scorecard = {
      id: Crypto.randomUUID(),
      name: new Date().toLocaleDateString(),
      status: 'active',
      createdAt: now,
      updatedAt: now,
      players: [
        { id: Crypto.randomUUID(), name: 'Player 1' },
        { id: Crypto.randomUUID(), name: 'Player 2' },
      ],
      rounds: [{ id: Crypto.randomUUID(), scores: {}, bids: {}, melds: {}, bonuses: {}, customValues: {} }],
      settings: DEFAULT_SETTINGS,
    };
    await saveScorecard(newCard);
    navigation.navigate('Scorecard', { scorecardId: newCard.id });
  };

 const createFromPreset = async (preset: Preset) => {
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

  const handleDelete = async (id: string) => {
    await deleteScorecard(id);
    reload();
  };

  const confirmClearHistory = () => {
    Alert.alert(
      'Clear History?',
      'This permanently deletes every finished scorecard. Active scorecards and preset stats are unaffected. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear History',
          style: 'destructive',
          onPress: async () => {
            await clearHistory();
            reload();
          },
        },
      ]
    );
  };

  const confirmClearAllData = () => {
    Alert.alert(
      'Clear All Data?',
      'This permanently deletes every scorecard, preset, and stat. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            reload();
          },
        },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    setMenuVisible(false);
    Linking.openURL(PRIVACY_POLICY_URL);
  };

  const openTermsOfUse = () => {
    setMenuVisible(false);
    Linking.openURL(TERMS_OF_USE_URL);
  };

return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>OmniScore</Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)} hitSlop={10}>
          <Text style={styles.menuIcon}>•••</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.newButton} onPress={createNewScorecard}>
        <Text style={styles.newButtonText}>+ New Scorecard</Text>
      </TouchableOpacity>

      <FlatList
        data={scorecards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <View style={styles.presetsSection}>
              <View style={styles.presetsHeaderRow}>
                <Text style={styles.presetsTitle}>Presets</Text>
                <TouchableOpacity
                  onPress={() => {
                    setEditingPreset(null);
                    setEditorVisible(true);
                  }}
                >
                  <Text style={styles.presetsAddLink}>+ New Preset</Text>
                </TouchableOpacity>
              </View>

              {presets.length === 0 ? (
                <Text style={styles.presetsEmpty}>
                  No presets yet — save one from a scorecard's Settings, or create one here.
                </Text>
              ) : (
                presets.map((preset) => (
                  <PresetListItem
                    key={preset.id}
                    preset={preset}
                    onPress={() => createFromPreset(preset)}
                    onEdit={() => {
                      setEditingPreset(preset);
                      setEditorVisible(true);
                    }}
                    onDelete={() => handleDeletePreset(preset.id)}
                    onViewStats={() => navigation.navigate('PresetStats', { presetId: preset.id })}
                  />
                ))
              )}
            </View>

            <Text style={styles.scorecardsTitle}>Active Scorecards</Text>
          </>
        }
        ListEmptyComponent={<Text style={styles.empty}>No scorecards yet.</Text>}
        ListFooterComponent={<View style={styles.footer}></View>}
        renderItem={({ item }) => (
          <ScorecardListItem
            card={item}
            onPress={() => navigation.navigate('Scorecard', { scorecardId: item.id })}
            onDelete={() => handleDelete(item.id)}
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
      />

      <BottomSheetModal visible={menuVisible} onClose={() => setMenuVisible(false)}>
        <SheetOption
          label="History"
          onPress={() => {
            setMenuVisible(false);
            navigation.navigate('History');
          }}
        />
        <SheetOption
          label="Manage Data"
          onPress={() => {
            setMenuVisible(false);
            setManageDataVisible(true);
          }}
        />
        <SheetOption label="Privacy Policy" onPress={openPrivacyPolicy} />
        <SheetOption label="Terms of Use" onPress={openTermsOfUse} last />
      </BottomSheetModal>

      <BottomSheetModal visible={manageDataVisible} onClose={() => setManageDataVisible(false)}>
        <SheetOption
          label="Clear History"
          onPress={() => {
            setManageDataVisible(false);
            confirmClearHistory();
          }}
        />
        <SheetOption
          label="Clear All Data (Factory Reset)"
          destructive
          last
          onPress={() => {
            setManageDataVisible(false);
            confirmClearAllData();
          }}
        />
      </BottomSheetModal>
    </View>
  );
}

function SheetOption({
  label,
  onPress,
  destructive,
  last,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  last?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.sheetOption, last && styles.sheetOptionLast]}>
      <Text style={[styles.sheetOptionText, destructive && styles.sheetOptionTextDestructive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '700' },
  menuIcon: { fontSize: 22, fontWeight: '900', color: '#333', paddingHorizontal: 8, letterSpacing: 1 },
  newButton: { backgroundColor: '#155843', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 24 },
  newButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  list: { paddingBottom: 20 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  presetsSection: { marginBottom: 24 },
  presetsHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  presetsTitle: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase' },
  presetsAddLink: { fontSize: 14, fontWeight: '600', color: '#155843' },
  presetsEmpty: { fontSize: 13, color: '#888' },
  scorecardsTitle: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 10 },
  sheetOption: { paddingVertical: 16, borderBottomWidth: 1, borderColor: '#eee' },
  sheetOptionLast: { borderBottomWidth: 0 },
  sheetOptionText: { fontSize: 16, fontWeight: '600', color: '#155843', textAlign: 'center' },
  sheetOptionTextDestructive: { color: '#c0392b' },
  footer: { height: 100 },
});