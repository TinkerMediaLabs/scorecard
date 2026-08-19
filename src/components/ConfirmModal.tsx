import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Text from './AppText';

export type ConfirmModalPalette = {
  surface: string;
  border: string;
  text: string;
  mutedText: string;
  fontFamily?: string;
  fontFamilyBold?: string;
  confirmButtonColor: string;
  confirmButtonTextColor: string;
};

export const APP_PALETTE: ConfirmModalPalette = {
  surface: '#ffffff',
  border: '#e0e0e0',
  text: '#1a1a1a',
  mutedText: '#666666',
  confirmButtonColor: '#155843',
  confirmButtonTextColor: '#ffffff',
};

type Props = {
  visible: boolean;
  theme: ConfirmModalPalette;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  visible,
  theme,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  const regularFont = theme.fontFamily ? { fontFamily: theme.fontFamily } : {};
  const boldFontFamily = theme.fontFamilyBold ?? theme.fontFamily;
  const boldFont = boldFontFamily ? { fontFamily: boldFontFamily } : {};

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => {}}
        >
          <Text style={[styles.title, { color: theme.text }, boldFont]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: theme.mutedText }, regularFont]}>
            {message}
          </Text>

          <View style={styles.buttonRow}>
            <Pressable style={styles.cancelButton} onPress={onCancel}>
              <Text style={[styles.cancelText, { color: theme.mutedText }, regularFont]}>
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.confirmButton,
                { backgroundColor: destructive ? '#c0392b' : theme.confirmButtonColor },
              ]}
              onPress={onConfirm}
            >
              <Text
                style={[
                  styles.confirmText,
                  { color: destructive ? '#ffffff' : theme.confirmButtonTextColor },
                  boldFont,
                ]}
              >
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#00000066', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 320, borderRadius: 14, borderWidth: 1, padding: 22 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 20 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: 'rgba(128,128,128,0.15)' },
  cancelText: { fontSize: 15, fontWeight: '600' },
  confirmButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  confirmText: { fontSize: 15, fontWeight: '700' },
});