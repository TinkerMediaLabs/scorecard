import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ImageBackground, ImageSourcePropType, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootStackParamList } from '../App';
import Text from '../components/AppText';
import { listPresets } from '../lib/storage';
import { ThemePalette, THEMES } from '../lib/themes';
import { Preset, PresetGameRecord } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'PresetStats'>;

type MCIName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const RIBBON_MOST_POINTS = require('../../assets/images/stats-ribbon-most-points.png');
const RIBBON_LOWEST_POINTS = require('../../assets/images/stats-ribbon-lowest-points.png');
const RIBBON_BEST_ROUND = require('../../assets/images/stats-ribbon-best-round.png');
const RIBBON_ICON_COLOR = '#1c3d2e';

function lightenHex(hex: string, amount: number): string {
  const clean = hex.replace('#', '').slice(0, 6);
  if (clean.length < 6) return hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const blend = (channel: number) => Math.round(channel + (255 - channel) * amount);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(blend(r))}${toHex(blend(g))}${toHex(blend(b))}`;
}

export default function PresetStatsScreen({ route, navigation }: Props) {
  const { presetId } = route.params;
  const [preset, setPreset] = useState<Preset | null>(null);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      listPresets().then((presets) => {
        setPreset(presets.find((p) => p.id === presetId) ?? null);
      });
    }, [presetId])
  );

  if (!preset) {
    return (
      <View style={styles.center}>
        <Text>Loading…</Text>
      </View>
    );
  }

  const theme = THEMES[preset.settings.theme];
  const fontStyle = theme.fontFamily ? { fontFamily: theme.fontFamily } : {};
  const { stats } = preset;
  const averageWinningScore = stats.gamesPlayed ? Math.round(stats.totalWinningScore / stats.gamesPlayed) : 0;
  const averageRounds = stats.gamesPlayed ? Math.round((stats.totalRounds / stats.gamesPlayed) * 10) / 10 : 0;

  const BackgroundComponent: any = theme.backgroundImage ? ImageBackground : View;
  const backgroundProps = theme.backgroundImage
    ? { source: theme.backgroundImage, resizeMode: 'cover' as const }
    : {};

  return (
    <BackgroundComponent
      style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + 16 }]}
      {...backgroundProps}
    >
     <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          {/* <Text style={{ fontSize: 20, color: theme.text }}>←</Text> */}
     
              <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
      
        </Pressable>
        <Text style={[styles.title, fontStyle, { color: theme.text }]} numberOfLines={1}>
          {preset.name}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {stats.gamesPlayed === 0 ? (
          <View style={styles.emptyState}>
            {/* <View style={[styles.emptyIconCircle, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <MaterialCommunityIcons name="chart-bar" size={28} color={theme.mutedText} />
            </View> */}
            <Text style={[styles.emptyTitle, fontStyle, { color: theme.text }]}>No stats yet</Text>
            <Text style={[styles.empty, fontStyle, { color: theme.mutedText }]}>
              Finish a scorecard created from this preset and its stats will show up here.
            </Text>
            <Pressable
              onPress={() => navigation.goBack()}
              style={[styles.emptyButton, { backgroundColor: theme.accent }]}
            >
              <Text style={[styles.emptyButtonText, fontStyle, { color: theme.accentText }]}>Back to Presets</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <StatTile
                theme={theme}
                fontStyle={fontStyle}
                icon="cards-playing-outline"
                value={String(stats.gamesPlayed)}
                label="Games Played"
              />
              <StatTile
                theme={theme}
                fontStyle={fontStyle}
                icon="trophy-variant"
                value={String(averageWinningScore)}
                label="Avg. Winning Score"
              />
              <StatTile
                theme={theme}
                fontStyle={fontStyle}
                icon="chart-bar"
                value={String(averageRounds)}
                label="Avg. Rounds / Game"
              />
            </View>

            {stats.highestTotal && (
              <RecordCard
                theme={theme}
                fontStyle={fontStyle}
                icon="star"
                ribbonImage={RIBBON_MOST_POINTS}
                title="Most Points Scored"
                record={stats.highestTotal}
              />
            )}

            {stats.lowestTotal && (
              <RecordCard
                theme={theme}
                fontStyle={fontStyle}
                icon="medal-outline"
                ribbonImage={RIBBON_LOWEST_POINTS}
                title="Lowest Points Scored"
                record={stats.lowestTotal}
              />
            )}

            {stats.bestRound && (
              <RecordCard
                theme={theme}
                fontStyle={fontStyle}
                icon="crown"
                ribbonImage={RIBBON_BEST_ROUND}
                title={preset.settings.winCondition === 'leastPoints' ? 'Best (Lowest) Round Score' : 'Best (Highest) Round Score'}
                record={stats.bestRound}
              />
            )}
          </>
        )}
      </ScrollView>
    </BackgroundComponent>
  );
}

function StatTile({
  theme,
  fontStyle,
  icon,
  value,
  label,
}: {
  theme: ThemePalette;
  fontStyle: { fontFamily?: string };
  icon: MCIName;
  value: string;
  label: string;
}) {
  return (
    <View style={[styles.statTile, { backgroundColor: theme.surface }]}>
      <View style={[styles.statIconCircle, { backgroundColor: lightenHex(theme.accent, 0.82) }]}>
        <MaterialCommunityIcons name={icon} size={22} color={theme.accent} />
      </View>
      <Text style={[styles.statValue, fontStyle, { color: theme.accent }]}>{value}</Text>
      <Text style={[styles.statLabel, fontStyle, { color: theme.mutedText }]}>{label}</Text>
    </View>
  );
}

function RecordCard({
  theme,
  fontStyle,
  icon,
  ribbonImage,
  title,
  record,
}: {
  theme: ThemePalette;
  fontStyle: { fontFamily?: string };
  icon: MCIName;
  ribbonImage: ImageSourcePropType;
  title: string;
  record: PresetGameRecord;
}) {
  return (
    <View style={styles.recordCardShadowWrapper}>
      <View style={[styles.recordCard, { backgroundColor: theme.surface }]}>
        {/* {theme.name === 'whiteboard' ? (
          <ImageBackground source={ribbonImage} resizeMode="cover" style={styles.ribbon} imageStyle={styles.ribbonImage}>
            <View style={styles.ribbonBadge}>
              <MaterialCommunityIcons name={icon} size={20} color={RIBBON_ICON_COLOR} />
            </View>
          </ImageBackground>
        ) : ( */}
          {/* <View style={[styles.ribbon, styles.ribbonPlain, { backgroundColor: lightenHex(theme.accent, 0.75) }]}>
            <View style={styles.ribbonBadge}>
              <MaterialCommunityIcons name={icon} size={20} color={theme.accent} />
            </View>
          </View> */}
        {/* )} */}
        <View style={styles.recordBody}>
          <Text style={[styles.recordTitle, fontStyle, { color: theme.accent }]}>{title}</Text>
          <Text style={[styles.recordValue, fontStyle, { color: theme.text }]}>{record.value}</Text>
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <View style={[styles.dividerDot, { backgroundColor: theme.accent }]} />
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>
          <Text style={[styles.recordMeta, fontStyle, { color: theme.mutedText }]}>
            {record.playerName} · {record.cardName} · {new Date(record.date).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.15,
  shadowRadius: 6,
  elevation: 4,
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', flexShrink: 1 },  content: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyState: { alignItems: 'center', marginTop: 180, paddingHorizontal: 20 },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  empty: { textAlign: 'center', fontSize: 14, lineHeight: 20 },
  emptyButton: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  emptyButtonText: { fontSize: 14, fontWeight: '700' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8 },
  statTile: {
    width: '31%',
    borderRadius: 16,
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginBottom: 18,
    ...cardShadow,
  },
  statIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 4, textAlign: 'center' },

  recordCardShadowWrapper: { borderRadius: 16, marginBottom: 18, ...cardShadow },
  recordCard: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
  },
  ribbon: { width: 96, alignItems: 'center', paddingTop: 20 },
  ribbonPlain: { justifyContent: 'center', paddingTop: 0 },
  ribbonImage: { resizeMode: 'cover' },
  ribbonBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBody: { flex: 1, padding: 16 },
  recordTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 },
  recordValue: { fontSize: 32, fontWeight: '800' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8, width: '80%' },
  dividerLine: { flex: 1, height: 1 },
  dividerDot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 6, transform: [{ rotate: '45deg' }] },
  recordMeta: { fontSize: 12 },
});