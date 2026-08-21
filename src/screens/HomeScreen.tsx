import { FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../App';
import Text from '../components/AppText';
import BottomSheetModal from '../components/BottomSheetModal';
import Coachmark from '../components/Coachmark';
import ConfirmModal, { APP_PALETTE } from '../components/ConfirmModal';
import PresetEditorModal from '../components/PresetEditorModal';
import PresetListItem from '../components/PresetListItem';
import PresetSortMenu from '../components/PresetSortMenu';
import ScorecardListItem from '../components/ScorecardListItem';
import { usePurchases } from '../contexts/PurchasesContext';
import { useTour } from '../contexts/TourContext';
import { PresetSortMode, sortPresets } from '../lib/presetSort';
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
const MAX_RECENT_PRESETS = 4;
const HEADER_ROW_HEIGHT = 36;
const HEADER_COLLAPSE_DISTANCE = 60;

const SORT_LABELS: Record<PresetSortMode, string> = {
  mostRecent: 'Most Recent',
  mostPlayed: 'Most Played',
};

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList as new () => FlatList<Scorecard>);

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [sortMode, setSortMode] = useState<PresetSortMode>('mostRecent');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [manageDataVisible, setManageDataVisible] = useState(false);
  const [clearHistoryConfirmVisible, setClearHistoryConfirmVisible] = useState(false);
  const [clearAllConfirmVisible, setClearAllConfirmVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const tour = useTour();
  const { isUnlocked } = usePurchases();
  const newScorecardRef = useRef<View>(null);
  const newPresetRef = useRef<View>(null);
  const sortButtonRef = useRef<View>(null);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [0, HEADER_COLLAPSE_DISTANCE], [HEADER_ROW_HEIGHT, 0], Extrapolation.CLAMP),
    opacity: interpolate(scrollY.value, [0, HEADER_COLLAPSE_DISTANCE * 0.6], [1, 0], Extrapolation.CLAMP),
    marginBottom: interpolate(scrollY.value, [0, HEADER_COLLAPSE_DISTANCE], [20, 0], Extrapolation.CLAMP),
  }));

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

  const sortedPresets = useMemo(() => sortPresets(presets, sortMode), [presets, sortMode]);
  const recentPresets = sortedPresets.slice(0, MAX_RECENT_PRESETS);

  const createNewScorecard = async () => {
    if (!isUnlocked && scorecards.length >= 1) {
      navigation.navigate('Paywall');
      return;
    }
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
    if (!isUnlocked && scorecards.length >= 1) {
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

  const handleDelete = async (id: string) => {
    await deleteScorecard(id);
    reload();
  };

  const confirmClearHistory = () => {
    setClearHistoryConfirmVisible(true);
  };

  const handleConfirmClearHistory = async () => {
    setClearHistoryConfirmVisible(false);
    await clearHistory();
    reload();
  };

  const confirmClearAllData = () => {
    setClearAllConfirmVisible(true);
  };

  const handleConfirmClearAll = async () => {
    setClearAllConfirmVisible(false);
    await clearAllData();
    reload();
  };

  const openPrivacyPolicy = () => {
    setMenuVisible(false);
    WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL);
  };

  const openTermsOfUse = () => {
    setMenuVisible(false);
    WebBrowser.openBrowserAsync(TERMS_OF_USE_URL);
  };

return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <Animated.View style={[styles.headerRow, headerAnimatedStyle]}>
        <Text style={[styles.title, {fontSize: 22}]}>Let's Play!</Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)} hitSlop={10}>
          <Text style={[styles.menuIcon]}>Options</Text>
        </TouchableOpacity>
      </Animated.View>

      <View ref={newScorecardRef} collapsable={false}>
        <TouchableOpacity style={styles.newButton} onPress={createNewScorecard}>
          <Text style={styles.newButtonText}>+ New Scorecard</Text>
        </TouchableOpacity>
      </View>

      <AnimatedFlatList
        data={scorecards}
        keyExtractor={(item: Scorecard) => item.id}
        contentContainerStyle={styles.list}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.presetsSection}>
              <View style={styles.presetsHeaderRow}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Preset Scorecards</Text>
                <View ref={sortButtonRef} collapsable={false}>
                  <TouchableOpacity onPress={() => setSortMenuVisible(true)} hitSlop={8} style={styles.sortTrigger}>
                    <Text style={styles.sortTriggerText}>{SORT_LABELS[sortMode]}</Text>
                    <FontAwesome name="sort" size={13} color="#155843" style={styles.sortTriggerIcon} />
                  </TouchableOpacity>
                </View>
              </View>

              {recentPresets.length === 0 ? (
                <Text style={styles.presetsEmpty}>
                  No presets yet — save one from a scorecard's Settings, or create one here.
                </Text>
              ) : (
                recentPresets.map((preset) => (
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

              <View ref={newPresetRef} collapsable={false}>
                <TouchableOpacity
                  style={styles.newPresetTile}
                  onPress={() => {
                    if (!isUnlocked && presets.length >= 1) {
                      navigation.navigate('Paywall');
                      return;
                    }
                    setEditingPreset(null);
                    setEditorVisible(true);
                  }}
                >
                  <Text style={styles.newPresetTileText}>+ New Preset</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Active Scorecards</Text>
          </>
        }
        ListEmptyComponent={<Text style={styles.empty}>No scorecards yet.</Text>}
        ListFooterComponent={<View style={styles.footer}></View>}
        renderItem={({ item }: { item: Scorecard }) => (
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
        initialPlayers={editingPreset?.players}
      />

      <PresetSortMenu
        visible={sortMenuVisible}
        onClose={() => setSortMenuVisible(false)}
        anchorRef={sortButtonRef}
        sortMode={sortMode}
        onSelectSort={setSortMode}
        onViewAll={() => navigation.navigate('AllPresets')}
      />

      <BottomSheetModal visible={menuVisible} onClose={() => setMenuVisible(false)}>

           {/* {!isUnlocked && (
          <SheetOption
            label="Unlock Everything"
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate('Paywall');
            }}
          />
        )} */}
        <SheetOption
          label="Completed Scorecards"
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

      <ConfirmModal
        visible={clearHistoryConfirmVisible}
        theme={APP_PALETTE}
        title="Clear History?"
        message="This permanently deletes every finished scorecard. Active scorecards and preset stats are unaffected. This cannot be undone."
        confirmLabel="Clear History"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleConfirmClearHistory}
        onCancel={() => setClearHistoryConfirmVisible(false)}
      />

      <ConfirmModal
        visible={clearAllConfirmVisible}
        theme={APP_PALETTE}
        title="Clear All Data?"
        message="This permanently deletes every scorecard, preset, and stat. This cannot be undone."
        confirmLabel="Clear Everything"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleConfirmClearAll}
        onCancel={() => setClearAllConfirmVisible(false)}
      />

      <Coachmark
        visible={tour.active && tour.step === 'newScorecard'}
        targetRef={newScorecardRef}
        text="Tap here to start a new scorecard and begin tracking scores."
        stepLabel={`Step ${tour.stepIndex + 1} of ${tour.totalSteps}`}
        isLast={false}
        onNext={tour.next}
        onSkip={tour.skip}
      />
      <Coachmark
        visible={tour.active && tour.step === 'newPreset'}
        targetRef={newPresetRef}
        text="Save your favorite game settings as a preset here, so you can reuse them instantly next time."
        stepLabel={`Step ${tour.stepIndex + 1} of ${tour.totalSteps}`}
        isLast={false}
        onNext={tour.next}
        onSkip={tour.skip}
      />
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' },
  title: { fontSize: 28, fontWeight: '700' },
  menuIcon: { fontSize: 16, fontWeight: '700', color: '#666666', paddingHorizontal: 8, letterSpacing: 1 },
  newButton: { backgroundColor: '#155843', borderRadius: 12, paddingVertical: 18, alignItems: 'center', marginVertical: 16 },
  newButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  list: { paddingBottom: 20 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  presetsSection: { marginBottom: 24 },
  presetsHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 20 },
  sortTrigger: { flexDirection: 'row', alignItems: 'center' },
  sortTriggerText: { fontSize: 14, fontWeight: '600', color: '#155843' },
  sortTriggerIcon: { marginLeft: 6 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a1a', marginBottom: 10 },
  presetsEmpty: { fontSize: 13, color: '#888', marginTop: 16, marginBottom: 24 },
  newPresetTile: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#c9c9c9',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  newPresetTileText: { fontSize: 15, fontWeight: '600', color: '#155843' },
  sheetOption: { paddingVertical: 16, borderBottomWidth: 1, borderColor: '#eee' },
  sheetOptionLast: { borderBottomWidth: 0 },
  sheetOptionText: { fontSize: 16, fontWeight: '600', color: '#000', textAlign: 'center' },
  sheetOptionTextDestructive: { color: '#c0392b' },
  footer: { height: 100 },
});