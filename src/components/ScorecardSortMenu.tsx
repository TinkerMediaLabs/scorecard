import { RefObject, useEffect, useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import { ScorecardSortMode } from '../lib/scorecardSort';
import Text from './AppText';

type Rect = { x: number; y: number; width: number; height: number };

type Props = {
  visible: boolean;
  onClose: () => void;
  anchorRef: RefObject<View | null>;
  sortMode: ScorecardSortMode;
  onSelectSort: (mode: ScorecardSortMode) => void;
};

const { width: SCREEN_W } = Dimensions.get('window');
const MENU_MARGIN = 12;

export default function ScorecardSortMenu({ visible, onClose, anchorRef, sortMode, onSelectSort }: Props) {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!visible) {
      setRect(null);
      return;
    }
    const t = setTimeout(() => {
      anchorRef.current?.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          setRect({ x, y, width, height });
        }
      });
    }, 0);
    return () => clearTimeout(t);
  }, [visible, anchorRef]);

  const selectSort = (mode: ScorecardSortMode) => {
    onSelectSort(mode);
    onClose();
  };

  if (!visible || !rect) return null;

  const right = Math.max(MENU_MARGIN, SCREEN_W - (rect.x + rect.width));

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[styles.menu, { top: rect.y + rect.height + 6, right }]}>
          <Pressable onPress={() => selectSort('mostRecent')} style={styles.option}>
            <Text style={[styles.optionText, sortMode === 'mostRecent' && styles.optionTextActive]}>
              Most recent
            </Text>
          </Pressable>
          <Pressable onPress={() => selectSort('oldest')} style={[styles.option, styles.optionLast]}>
            <Text style={[styles.optionText, sortMode === 'oldest' && styles.optionTextActive]}>
              Oldest first
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  option: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  optionLast: { borderBottomWidth: 0 },
  optionText: { fontSize: 15, fontWeight: '500', color: '#333' },
  optionTextActive: { fontWeight: '700', color: '#155843' },
});