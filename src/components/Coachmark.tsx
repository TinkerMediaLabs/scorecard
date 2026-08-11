import { RefObject, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Text from './AppText';

type Rect = { x: number; y: number; width: number; height: number };

type Props = {
  visible: boolean;
  text: string;
  targetRef: RefObject<View | null>;
  stepLabel: string;
  isLast: boolean;
  onNext: () => void;
  onSkip: () => void;
};

export default function Coachmark({ visible, text, targetRef, stepLabel, isLast, onNext, onSkip }: Props) {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!visible) {
      setRect(null);
      return;
    }
    const measure = () => {
      targetRef.current?.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          setRect({ x, y, width, height });
        }
      });
    };
    const t = setTimeout(measure, 80);
    return () => clearTimeout(t);
  }, [visible, targetRef]);

  if (!visible || !rect) return null;

  const padding = 6;
  const tooltipBelow = rect.y < 260;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onSkip}>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Pressable style={styles.backdrop} onPress={onSkip} />

        <View
          pointerEvents="none"
          style={[
            styles.highlightBox,
            {
              left: rect.x - padding,
              top: rect.y - padding,
              width: rect.width + padding * 2,
              height: rect.height + padding * 2,
            },
          ]}
        />

        <View
          style={[
            styles.tooltip,
            tooltipBelow
              ? { top: rect.y + rect.height + padding + 14 }
              : { top: Math.max(rect.y - 130, 60) },
          ]}
        >
          <Text style={styles.stepLabel}>{stepLabel}</Text>
          <Text style={styles.tooltipText}>{text}</Text>
          <View style={styles.tooltipActions}>
            <Pressable onPress={onSkip} hitSlop={8}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
            <Pressable onPress={onNext} style={styles.nextButton}>
              <Text style={styles.nextButtonText}>{isLast ? 'Got it' : 'Next'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },  highlightBox: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#ffd23f',
    backgroundColor: 'transparent',
  },
  tooltip: {
    position: 'absolute',
    left: 24,
    right: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  stepLabel: { fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 4 },
  tooltipText: { fontSize: 15, color: '#222', marginBottom: 14, lineHeight: 20 },
  tooltipActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skipText: { fontSize: 14, color: '#888', fontWeight: '600' },
  nextButton: { backgroundColor: '#155843', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  nextButtonText: { color: '#fff', fontWeight: '700' },
});