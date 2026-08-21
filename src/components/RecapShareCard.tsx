import { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemePalette } from '../lib/themes';
import { Player } from '../types';
import Text from './AppText';

export type RecapLeaderboardEntry = {
  player: Player;
  rank: number;
  label: string;
};

type Props = {
  winnerName: string;
  leaderboard: RecapLeaderboardEntry[];
  roundsPlayed: number;
  bestRoundLabel: string;
  dateLabel: string;
  gameName: string;
  theme: ThemePalette;
};

const CARD_WIDTH = 900;

const RecapShareCard = forwardRef<View, Props>(
  ({ winnerName, leaderboard, roundsPlayed, bestRoundLabel, dateLabel, gameName, theme }, ref) => {
    const regularFont = theme.fontFamily ? { fontFamily: theme.fontFamily } : {};
    const boldFontFamily = theme.fontFamilyBold ?? theme.fontFamily;
    const boldFont = boldFontFamily ? { fontFamily: boldFontFamily } : {};

    return (
      <View ref={ref} collapsable={false} style={[styles.frame, { backgroundColor: theme.background }]}>
        <View
          style={[
            styles.photo,
            { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 2 },
          ]}
        >
          <Text style={styles.trophy}>🏆</Text>
          <Text style={[styles.winnerLabel, { color: theme.accent }, boldFont]}>WINNER</Text>
          <Text style={[styles.winnerName, { color: theme.text }, boldFont]} numberOfLines={1}>
            {winnerName}
          </Text>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.leaderboard}>
            {leaderboard.map((entry) => (
              <View key={entry.player.id} style={[styles.leaderboardRow, { borderColor: theme.border }]}>
                <Text style={[styles.rank, { color: theme.accent }, boldFont]}>{entry.rank}.</Text>
                <Text style={[styles.playerName, { color: theme.text }, boldFont]} numberOfLines={1}>
                  {entry.player.name}
                </Text>
                <Text style={[styles.playerScore, { color: theme.text }, boldFont]}>{entry.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={[styles.statValue, { color: theme.text }, boldFont]}>{roundsPlayed}</Text>
              <Text style={[styles.statLabel, { color: theme.mutedText }, regularFont]}>Rounds</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={[styles.statValue, { color: theme.text }, boldFont]}>{bestRoundLabel}</Text>
              <Text style={[styles.statLabel, { color: theme.mutedText }, regularFont]}>Best Round</Text>
            </View>
          </View>
        </View>

        <View style={styles.caption}>
          <Text style={[styles.captionBrand, { color: theme.accent }, boldFont]} numberOfLines={1}>
            {gameName}
          </Text>
          <Text style={[styles.captionDate, { color: theme.mutedText }, regularFont]}>{dateLabel}</Text>
        </View>
      </View>
    );
  }
);

export default RecapShareCard;

const styles = StyleSheet.create({
  frame: {
    width: CARD_WIDTH,
    padding: 24,
    borderRadius: 4,
  },
  photo: {
    borderRadius: 4,
    paddingVertical: 48,
    paddingHorizontal: 36,
    alignItems: 'center',
  },
  trophy: { fontSize: 72, marginBottom: 10 },
  winnerLabel: { fontSize: 24, fontWeight: '800', letterSpacing: 4 },
  winnerName: { fontSize: 52, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  divider: { width: '70%', height: 1, marginVertical: 28 },
  leaderboard: { width: '100%' },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rank: { width: 44, fontSize: 24 },
  playerName: { flex: 1, fontSize: 26 },
  playerScore: { fontSize: 24 },
  statsRow: { flexDirection: 'row', marginTop: 32, gap: 48 },
  statBlock: { alignItems: 'center' },
  statValue: { fontSize: 32 },
  statLabel: { fontSize: 15, marginTop: 6, textTransform: 'uppercase' },
  caption: { paddingTop: 28, alignItems: 'center' },
  captionBrand: { fontSize: 32, maxWidth: CARD_WIDTH - 80, textAlign: 'center' },
  captionDate: { fontSize: 17, marginTop: 6 },
});