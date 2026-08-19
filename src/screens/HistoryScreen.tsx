import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../App';
import Text from '../components/AppText';
import ScorecardListItem from '../components/ScorecardListItem';
import { deleteScorecard, loadAllScorecards } from '../lib/storage';
import { Scorecard } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

export default function HistoryScreen({ navigation }: Props) {
  const [scorecards, setScorecards] = useState<Scorecard[]>([]);
  const insets = useSafeAreaInsets();

  const reload = useCallback(() => {
    loadAllScorecards().then((cards) => {
      const finished = cards
        .filter((c) => c.status === 'finished')
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      setScorecards(finished);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const handleDelete = async (id: string) => {
    await deleteScorecard(id);
    reload();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
           <MaterialCommunityIcons name="arrow-left" size={24} style={styles.arrow} />
        </Pressable>
        <Text style={styles.title}>Completed Scorecards</Text>
      </View>

      <FlatList
        data={scorecards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.empty}>No finished scorecards yet.</Text>}
        renderItem={({ item }) => (
          <ScorecardListItem
            card={item}
            onPress={() => navigation.navigate('Scorecard', { scorecardId: item.id })}
            onDelete={() => handleDelete(item.id)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '700' },
  list: { paddingBottom: 20 },
  empty: { textAlign: 'center', color: '#888', marginTop: 40 },
  arrow: {marginRight: 10},
});