import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../App';
import Text from '../components/AppText';
import TextInput from '../components/AppTextInput';
import ScorecardListItem from '../components/ScorecardListItem';
import ScorecardSortMenu from '../components/ScorecardSortMenu';
import { ScorecardSortMode, sortScorecards } from '../lib/scorecardSort';
import { deleteScorecard, listPresets, loadAllScorecards } from '../lib/storage';
import { Preset, Scorecard } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

const SORT_LABELS: Record<ScorecardSortMode, string> = {
  mostRecent: 'Most Recent',
  oldest: 'Oldest First',
};

export default function HistoryScreen({ navigation }: Props) {
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [sortMode, setSortMode] = useState<ScorecardSortMode>('mostRecent');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();
  const sortButtonRef = useRef<View>(null);

  const reload = useCallback(() => {
    loadAllScorecards().then((cards) => {
      setScorecards(cards.filter((c) => c.status === 'finished'));
    });
    listPresets().then(setPresets);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const presetNameById = useMemo(() => {
    const map: Record<string, string> = {};
    presets.forEach((p) => {
      map[p.id] = p.name;
    });
    return map;
  }, [presets]);

  const sortedScorecards = useMemo(() => sortScorecards(scorecards, sortMode), [scorecards, sortMode]);
  const visibleScorecards = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return sortedScorecards;
    return sortedScorecards.filter((c) => c.name.toLowerCase().includes(trimmed));
  }, [sortedScorecards, query]);

  const handleDelete = async (id: string) => {
    await deleteScorecard(id);
    reload();
  };

  const emptyMessage = scorecards.length === 0
    ? 'No finished scorecards yet.'
    : `No scorecards match "${query.trim()}".`;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
           <MaterialCommunityIcons name="arrow-left" size={24} style={styles.arrow} />
        </Pressable>
        <Text style={styles.title}>Completed Scorecards</Text>
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
        data={visibleScorecards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.empty}>{emptyMessage}</Text>}
        renderItem={({ item }) => (
          <ScorecardListItem
            card={item}
            presetName={item.presetId ? presetNameById[item.presetId] : undefined}
            onPress={() => navigation.navigate('Scorecard', { scorecardId: item.id })}
            onDelete={() => handleDelete(item.id)}
          />
        )}
      />

      <ScorecardSortMenu
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
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
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
  list: { paddingBottom: 20 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
});