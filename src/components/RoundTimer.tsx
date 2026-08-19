import { useAudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DONE_SOUNDS, TICKER_SOUNDS, WARNING_SOUND } from '../lib/sounds';
import { ThemePalette } from '../lib/themes';
import { DoneSound, TickerSound } from '../types';

import Text from '../components/AppText';

type Props = {
  theme: ThemePalette;
  roundSeconds: number;
  warningEnabled: boolean;
  doneSound: DoneSound;
  tickerSound: TickerSound;
};

const TICK_MS = 250;
const WARNING_AT_MS = 15000;
const LOW_TIME_AT_MS = 10000;

export default function RoundTimer({ theme, roundSeconds, warningEnabled, doneSound, tickerSound }: Props) {
  const [remainingMs, setRemainingMs] = useState(roundSeconds * 1000);
  const [isRunning, setIsRunning] = useState(false);
  const warnedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doneSource = doneSound === 'none' ? null : DONE_SOUNDS[doneSound];
  const tickerSource = tickerSound === 'none' ? null : TICKER_SOUNDS[tickerSound];

  const donePlayer = useAudioPlayer(doneSource);
  const tickerPlayer = useAudioPlayer(tickerSource);
  const warningPlayer = useAudioPlayer(WARNING_SOUND);

  useEffect(() => {
    setRemainingMs(roundSeconds * 1000);
    setIsRunning(false);
    warnedRef.current = false;
  }, [roundSeconds]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemainingMs((prev) => {
        const next = prev - TICK_MS;

        if (warningEnabled && !warnedRef.current && next <= WARNING_AT_MS && next > 0) {
          warnedRef.current = true;
          warningPlayer.seekTo(0);
          warningPlayer.play();
        }

        if (next <= 0) {
          setIsRunning(false);
          tickerPlayer.pause();
          if (doneSource) {
            donePlayer.seekTo(0);
            donePlayer.play();
          }
          return 0;
        }

        return next;
      });
    }, TICK_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, warningEnabled, doneSource]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const toggle = () => {
    if (remainingMs <= 0) return;
    const next = !isRunning;
    setIsRunning(next);
    if (tickerSource) {
      if (next) {
        tickerPlayer.loop = true;
        tickerPlayer.play();
      } else {
        tickerPlayer.pause();
      }
    }
  };

  const reset = () => {
    setIsRunning(false);
    setRemainingMs(roundSeconds * 1000);
    warnedRef.current = false;
    tickerPlayer.pause();
    tickerPlayer.seekTo(0);
  };

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const isLowTime = isRunning && remainingMs <= LOW_TIME_AT_MS;

  const barBackgroundColor = isLowTime ? '#b31914' : isRunning ? '#198a2c' : theme.surface;
  const timeColor = isRunning ? '#ffffff' : theme.text;
  const resetTextColor = isRunning ? '#ffffff' : theme.timerResetButton.textColor;
  const resetBorderColor = isRunning ? '#ffffff' : theme.border;
  const toggleBackgroundColor = isLowTime ? '#000000' : theme.timerStartButton.backgroundColor;
  const toggleTextColor = isLowTime ? '#ffffff' : theme.timerStartButton.textColor;

  return (
    <View style={[styles.container, { backgroundColor: barBackgroundColor, borderColor: theme.border }]}>
      <Text style={[styles.time, { color: timeColor, fontFamily: theme.fontFamily }]}>{display}</Text>
      <View style={styles.buttons}>
        <Pressable onPress={toggle} style={[styles.button, { backgroundColor: toggleBackgroundColor }]}>
          <Text
            style={{
              color: toggleTextColor,
              fontSize: theme.timerStartButton.fontSize,
              fontWeight: theme.timerStartButton.fontWeight,
              fontFamily: theme.fontFamily
            }}
          >
            {isRunning ? 'Pause' : 'Start'}
          </Text>
        </Pressable>
        <Pressable
          onPress={reset}
          style={[
            styles.button,
            styles.resetButton,
            { borderColor: resetBorderColor, backgroundColor: theme.timerResetButton.backgroundColor },
          ]}
        >
          <Text
            style={{
              color: resetTextColor,
              fontSize: theme.timerResetButton.fontSize,
              fontWeight: theme.timerResetButton.fontWeight,
              fontFamily: theme.fontFamily
            }}
          >
            Reset
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  time: { fontSize: 24, fontWeight: '700' },
  buttons: { flexDirection: 'row' },
  button: { paddingVertical: 6, paddingHorizontal: 34, borderRadius: 8, marginLeft: 8 },
  resetButton: { borderWidth: 1 },
});