// Food item card: collapsed view + edit-in-place sheet.
// Mirrors the prototype's FoodItemCard exactly.

import { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
} from 'react-native';
import Icon from './Icon';
import Pill from './Pill';
import Sheet from './Sheet';
import Spinner from './Spinner';
import FoodItemEditor from './FoodItemEditor';
import type { FoodItem, ItemVerificationStatus } from '../types';

interface Props {
  item: FoodItem;
  original?: FoodItem;
  onEdit: (updated: FoodItem) => void;
  onDelete: () => void;
  onMultiply: (factor: number) => void;
  verification?: ItemVerificationStatus;
  isLogging: boolean;
}

export default function FoodItemCard({
  item, original, onEdit, onDelete, onMultiply, verification, isLogging,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [multiplyVal, setMultiplyVal] = useState('');

  const applyMultiply = (x: number) => {
    if (!x || x === 0) return;
    onMultiply(x);
    setMultiplyVal('');
  };

  return (
    <View style={s.card}>
      {/* Name + icon */}
      <View style={s.row1}>
        <Text style={s.name} numberOfLines={2}>{item.foodName}</Text>
        <Pill tone="primary">{item.icon}</Pill>
      </View>

      {/* Meta: date · meal · brand */}
      <View style={s.metaRow}>
        <Text style={s.metaText}>{item.date}</Text>
        <Text style={s.dot}> · </Text>
        <Text style={s.metaText}>{item.meal}</Text>
        <Text style={s.dot}> · </Text>
        <Text style={[s.metaText, { color: '#555', fontWeight: '500' }]} numberOfLines={1}>{item.brand}</Text>
      </View>

      {/* Serving + actions */}
      <View style={s.servingRow}>
        <Text style={s.servingLabel}>
          {item.serving.amount} {item.serving.unit === 'Fluid Ounce' ? 'fl oz' : item.serving.unit}
          {item.serving.descriptor ? ` (${item.serving.descriptor})` : ''}
        </Text>
        <View style={s.actionBtns}>
          <TouchableOpacity style={s.iconBtn} onPress={() => setEditing(true)}>
            <Icon name="edit" size={15} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity style={[s.iconBtn, { borderColor: '#f0bdb8' }]} onPress={onDelete}>
            <Icon name="trash" size={15} color="#c0392b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Calories */}
      <View style={s.calBox}>
        <Text style={s.calNum}>{item.calories}</Text>
        <Text style={s.calLabel}>CALORIES</Text>
      </View>

      {/* Multiplier strip */}
      <View style={s.multStrip}>
        <Text style={s.multLabel}>Multiply</Text>
        <TextInput
          style={s.multInput}
          placeholder="1.5"
          keyboardType="decimal-pad"
          value={multiplyVal}
          onChangeText={setMultiplyVal}
          onSubmitEditing={() => applyMultiply(parseFloat(multiplyVal))}
          onBlur={() => multiplyVal ? applyMultiply(parseFloat(multiplyVal)) : null}
        />
        <Text style={{ color: '#aaa', fontSize: 11 }}>or</Text>
        {[0.5, 1.5, 2].map((x) => (
          <TouchableOpacity key={x} style={s.multBtn} onPress={() => onMultiply(x)}>
            <Text style={s.multBtnText}>{x}×</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Nutrition grid */}
      <View style={s.nutGrid}>
        <NutCell label="Fat" v={`${item.fatG}g`} />
        <NutCell label="Carbs" v={`${item.carbsG}g`} />
        <NutCell label="Sat Fat" v={`${item.satFatG}g`} />
        <NutCell label="Fiber" v={`${item.fiberG}g`} />
        <NutCell label="Chol" v={`${item.cholesterolMg}mg`} />
        <NutCell label="Sugar" v={`${item.sugarG}g`} />
        <NutCell label="Sodium" v={`${item.sodiumMg.toLocaleString()}mg`} />
        <NutCell label="Protein" v={`${item.proteinG}g`} />
      </View>

      {/* Hydration */}
      {item.hydration?.isLiquid && (item.hydration.fluidOz ?? 0) > 0 && (
        <View style={s.hydrationRow}>
          <Icon name="droplet" size={14} color="#3b82f6" />
          <Text style={{ color: '#666', fontSize: 12, marginLeft: 6 }}>Hydration</Text>
          <Text style={{ fontWeight: '600', color: '#111', marginLeft: 'auto', fontSize: 12 }}>
            {item.hydration.fluidOz} fl oz
          </Text>
        </View>
      )}

      {/* Verification badge */}
      <VerificationBadge verification={verification} isLogging={isLogging} />

      {/* Edit sheet */}
      <Sheet open={editing} onClose={() => setEditing(false)} title="Edit item" heightFraction={0.9}>
        <FoodItemEditor
          item={item}
          original={original}
          onSave={(updated) => { onEdit(updated); setEditing(false); }}
          onCancel={() => setEditing(false)}
        />
      </Sheet>
    </View>
  );
}

function NutCell({ label, v }: { label: string; v: string }) {
  return (
    <View style={s.nutCell}>
      <Text style={s.nutLabel}>{label}</Text>
      <Text style={s.nutVal}>{v}</Text>
    </View>
  );
}

function VerificationBadge({ verification, isLogging }: {
  verification?: ItemVerificationStatus;
  isLogging: boolean;
}) {
  if (isLogging && !verification?.verificationComplete) {
    return (
      <View style={[s.verBox, { backgroundColor: '#f5f5f5' }]}>
        <Spinner size={12} color="#888" />
        <Text style={[s.verText, { color: '#888' }]}> Verifying with Lose It!…</Text>
      </View>
    );
  }
  if (!verification?.verificationComplete) return null;

  const level = verification.verificationLevel;
  if (level === 'verified' || level === 'accepted') {
    return (
      <View style={[s.verBox, { backgroundColor: '#edfaf3' }]}>
        <Icon name="check" size={14} color="#1d7a4a" strokeWidth={2.4} />
        <Text style={[s.verText, { color: '#1d7a4a' }]}>
          {level === 'verified' ? ' All fields verified' : ' Logged to Lose It!'}
        </Text>
      </View>
    );
  }
  if (level === 'mismatch') {
    return (
      <View style={[s.verBox, { backgroundColor: '#fefaec', flexDirection: 'column', alignItems: 'flex-start', padding: 8 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="alert" size={14} color="#8a6a00" strokeWidth={2.2} />
          <Text style={[s.verText, { color: '#8a6a00', fontWeight: '600' }]}>Nutrient mismatch</Text>
        </View>
        {verification.mismatches?.map((m, i) => (
          <Text key={i} style={{ fontSize: 11, color: '#8a6a00', paddingLeft: 20, marginTop: 2 }}>{m}</Text>
        ))}
      </View>
    );
  }
  return (
    <View style={[s.verBox, { backgroundColor: '#fdf0ee' }]}>
      <Icon name="alert" size={14} color="#c0392b" strokeWidth={2.2} />
      <Text style={[s.verText, { color: '#c0392b' }]}> Log failed</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ebe9e2',
    padding: 14,
    marginBottom: 10,
  },
  row1: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
  name: { fontWeight: '600', fontSize: 15, color: '#111', flex: 1, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' },
  metaText: { color: '#888', fontSize: 12 },
  dot: { color: '#bbb', fontSize: 12 },
  servingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  servingLabel: { color: '#666', fontSize: 13 },
  actionBtns: { flexDirection: 'row', gap: 4 },
  iconBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#f5f3ec', borderWidth: 1, borderColor: '#e6e3d9',
    alignItems: 'center', justifyContent: 'center',
  },
  calBox: {
    backgroundColor: '#faf8f1', borderWidth: 1, borderColor: '#ebe9e2',
    borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginBottom: 10,
  },
  calNum: { fontSize: 32, fontWeight: '700', color: '#111', lineHeight: 36 },
  calLabel: { fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2, fontWeight: '600' },
  multStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fafaf6', borderWidth: 1, borderColor: '#ebe9e2',
    borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, marginBottom: 10,
  },
  multLabel: { color: '#888', fontSize: 11 },
  multInput: {
    width: 50, paddingVertical: 4, paddingHorizontal: 6,
    borderWidth: 1, borderColor: '#ddd', borderRadius: 6,
    fontSize: 12, textAlign: 'center', backgroundColor: '#fff',
  },
  multBtn: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd',
    borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8,
  },
  multBtnText: { fontSize: 11, fontWeight: '600', color: '#444' },
  nutGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  nutCell: {
    width: '50%', flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 2, paddingRight: 14,
  },
  nutLabel: { color: '#888', fontSize: 12 },
  nutVal: { color: '#111', fontWeight: '600', fontSize: 12 },
  hydrationRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 8, marginTop: 8,
    borderTopWidth: 1, borderTopColor: '#f0eee8',
  },
  verBox: {
    flexDirection: 'row', alignItems: 'center',
    padding: 6, borderRadius: 8, marginTop: 10,
  },
  verText: { fontSize: 12, fontWeight: '600' },
});
