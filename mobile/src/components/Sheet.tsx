// Bottom sheet modal.
import {
  Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback,
  StyleSheet, ScrollView, Dimensions,
} from 'react-native';
import { useTheme, type AppTheme } from '../context/ThemeContext';

const { height: SCREEN_H } = Dimensions.get('window');

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  heightFraction?: number; // 0–1, default 0.7
}

export default function Sheet({ open, onClose, title, children, heightFraction = 0.7 }: SheetProps) {
  const { theme } = useTheme();
  const s = styles(theme);

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.scrim} />
      </TouchableWithoutFeedback>
      <View style={[s.sheet, { height: SCREEN_H * heightFraction }]}>
        <View style={s.grabber} />
        {title && (
          <View style={s.header}>
            <Text style={s.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={s.done}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = (theme: AppTheme) => StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.overlay,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.border,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSoft,
  },
  title: { fontWeight: '600', fontSize: 17, color: theme.text },
  done: { color: theme.primary, fontSize: 15, fontWeight: '600' },
});
