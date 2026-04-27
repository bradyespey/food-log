// Bottom sheet modal.
import {
  Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback,
  StyleSheet, ScrollView, Dimensions,
} from 'react-native';

const { height: SCREEN_H } = Dimensions.get('window');

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  heightFraction?: number; // 0–1, default 0.7
}

export default function Sheet({ open, onClose, title, children, heightFraction = 0.7 }: SheetProps) {
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

const s = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
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
    borderBottomColor: '#f0eee8',
  },
  title: { fontWeight: '600', fontSize: 17, color: '#111' },
  done: { color: '#c06030', fontSize: 15, fontWeight: '600' },
});
