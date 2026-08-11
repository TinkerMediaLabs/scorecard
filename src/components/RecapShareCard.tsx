import { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
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
};

const CARD_WIDTH = 900;

const RecapShareCard = forwardRef<View, Props>(
  ({ winnerName, leaderboard, roundsPlayed, bestRoundLabel, dateLabel }, ref) => {
    return (
      <View ref={ref} collapsable={false} style={styles.frame}>
        <View style={styles.photo}>
          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.winnerLabel}>WINNER</Text>
          <Text style={styles.winnerName} numberOfLines={1}>{winnerName}</Text>

          <View style={styles.divider} />

          <View style={styles.leaderboard}>
            {leaderboard.map((entry) => (
              <View key={entry.player.id} style={styles.leaderboardRow}>
                <Text style={styles.rank}>{entry.rank}.</Text>
                <Text style={styles.playerName} numberOfLines={1}>{entry.player.name}</Text>
                <Text style={styles.playerScore}>{entry.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{roundsPlayed}</Text>
              <Text style={styles.statLabel}>Rounds</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{bestRoundLabel}</Text>
              <Text style={styles.statLabel}>Best Round</Text>
            </View>
          </View>
        </View>

        <View style={styles.caption}>
          <Text style={styles.captionBrand}>Scorecard</Text>
          <Text style={styles.captionDate}>{dateLabel}</Text>
        </View>
      </View>
    );
  }
);

export default RecapShareCard;

const styles = StyleSheet.create({
  frame: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 4,
  },
  photo: {
    backgroundColor: '#173326',
    borderRadius: 4,
    paddingVertical: 48,
    paddingHorizontal: 36,
    alignItems: 'center',
  },
  trophy: { fontSize: 64, marginBottom: 8 },
  winnerLabel: { fontSize: 20, fontWeight: '800', letterSpacing: 4, color: '#ffd23f' },
  winnerName: { fontSize: 44, fontWeight: '800', color: '#ffffff', marginTop: 8, textAlign: 'center' },
  divider: { width: '70%', height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 24 },
  leaderboard: { width: '100%' },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  rank: { width: 36, fontSize: 20, fontWeight: '700', color: '#ffd23f' },
  playerName: { flex: 1, fontSize: 22, color: '#ffffff', fontWeight: '600' },
  playerScore: { fontSize: 20, color: '#ffffff', fontWeight: '700' },
  statsRow: { flexDirection: 'row', marginTop: 28, gap: 40 },
  statBlock: { alignItems: 'center' },
  statValue: { fontSize: 26, fontWeight: '800', color: '#ffffff' },
  statLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4, textTransform: 'uppercase' },
  caption: { paddingTop: 24, alignItems: 'center' },
  captionBrand: { fontSize: 28, fontWeight: '800', color: '#173326' },
  captionDate: { fontSize: 14, color: '#888', marginTop: 4 },
});