import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../lib/theme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmModal({ visible, title, message, onConfirm, onCancel, loading }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={s.overlay}>
        <View style={s.box}>
          <View style={s.iconWrap}>
            <Ionicons name="trash-outline" size={24} color="#ef4444" />
          </View>
          <Text style={s.title}>{title}</Text>
          <Text style={s.message}>{message}</Text>
          <View style={s.row}>
            <TouchableOpacity style={s.cancelBtn} onPress={onCancel} disabled={loading}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.deleteBtn} onPress={onConfirm} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.deleteText}>Delete</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  box:        { backgroundColor: C.card, borderRadius: 24, padding: 24, width: '100%', alignItems: 'center', gap: 12 },
  iconWrap:   { width: 52, height: 52, borderRadius: 26, backgroundColor: '#ef444420', justifyContent: 'center', alignItems: 'center' },
  title:      { fontSize: 17, fontWeight: '800', color: C.text, textAlign: 'center' },
  message:    { fontSize: 13, color: C.text2, textAlign: 'center', lineHeight: 20 },
  row:        { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  cancelBtn:  { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '700', color: C.text2 },
  deleteBtn:  { flex: 1, height: 48, borderRadius: 14, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' },
  deleteText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
