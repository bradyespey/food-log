// Edit-in-place editor for a single food item (inside a Sheet).
// Mirrors the prototype's FoodItemEditor exactly.

import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import type { FoodItem } from '../types';
import { ICON_OPTIONS, SERVING_UNIT_OPTIONS } from '../lib/foodNormalize';
import { useTheme, type AppTheme } from '../context/ThemeContext';

const BRAND_OPTIONS = ['Homemade'];

interface Props {
  item: FoodItem;
  original?: FoodItem;
  onSave: (updated: FoodItem) => void;
  onCancel: () => void;
}

export default function FoodItemEditor({ item, original, onSave, onCancel }: Props) {
  const { theme } = useTheme();
  const s = styles(theme);
  const [edit, setEdit] = useState<FoodItem>(item);
  const upd = (patch: Partial<FoodItem>) => setEdit((e) => ({ ...e, ...patch }));

  return (
    <ScrollView style={s.root} keyboardShouldPersistTaps="handled">
      <Field label="Food name">
        <TextInput
          style={s.input}
          placeholderTextColor={theme.textSubtle}
          value={edit.foodName}
          onChangeText={(v) => upd({ foodName: v })}
        />
      </Field>

      <Field label="Brand">
        <View style={s.chipRow}>
          {BRAND_OPTIONS.map((o) => (
            <TouchableOpacity
              key={o}
              style={[s.chip, edit.brand === o && s.chipActive]}
              onPress={() => upd({ brand: o })}
            >
              <Text style={[s.chipText, edit.brand === o && s.chipTextActive]}>{o}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={[s.input, { marginTop: 8 }]}
          placeholderTextColor={theme.textSubtle}
          value={edit.brand}
          onChangeText={(v) => upd({ brand: v })}
        />
      </Field>

      <Field label="Type">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s.chipRow}>
            {ICON_OPTIONS.map((o) => (
              <TouchableOpacity
                key={o}
                style={[s.chip, edit.icon === o && s.chipActive]}
                onPress={() => upd({ icon: o })}
              >
                <Text style={[s.chipText, edit.icon === o && s.chipTextActive]}>{o}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Field>

      <View style={s.row}>
        <Field label="Amount" style={{ flex: 1, marginRight: 8 }}>
          <TextInput
            style={s.input}
            placeholderTextColor={theme.textSubtle}
            value={String(edit.serving.amount)}
            keyboardType="decimal-pad"
            onChangeText={(v) =>
              upd({ serving: { ...edit.serving, amount: parseFloat(v) || 0 } })
            }
          />
        </Field>
        <Field label="Unit" style={{ flex: 1 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={s.chipRow}>
              {SERVING_UNIT_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o}
                  style={[s.chip, edit.serving.unit === o && s.chipActive]}
                  onPress={() => upd({ serving: { ...edit.serving, unit: o } })}
                >
                  <Text style={[s.chipText, edit.serving.unit === o && s.chipTextActive]}>{o}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Field>
      </View>

      <Field label="Calories">
        <TextInput
          style={[s.input, s.calInput]}
          placeholderTextColor={theme.textSubtle}
          value={String(edit.calories)}
          keyboardType="number-pad"
          onChangeText={(v) => upd({ calories: parseInt(v) || 0 })}
        />
      </Field>

      <View style={s.grid}>
        <NumField label="Fat (g)" value={edit.fatG} onChange={(v) => upd({ fatG: v })} />
        <NumField label="Carbs (g)" value={edit.carbsG} onChange={(v) => upd({ carbsG: v })} />
        <NumField label="Sat Fat (g)" value={edit.satFatG} onChange={(v) => upd({ satFatG: v })} />
        <NumField label="Fiber (g)" value={edit.fiberG} onChange={(v) => upd({ fiberG: v })} />
        <NumField label="Chol (mg)" value={edit.cholesterolMg} onChange={(v) => upd({ cholesterolMg: v })} int />
        <NumField label="Sugar (g)" value={edit.sugarG} onChange={(v) => upd({ sugarG: v })} />
        <NumField label="Sodium (mg)" value={edit.sodiumMg} onChange={(v) => upd({ sodiumMg: v })} int />
        <NumField label="Protein (g)" value={edit.proteinG} onChange={(v) => upd({ proteinG: v })} />
      </View>

      {edit.hydration?.isLiquid && (
        <Field label="Hydration (fl oz)">
          <TextInput
            style={s.input}
            placeholderTextColor={theme.textSubtle}
            value={String(edit.hydration.fluidOz ?? 0)}
            keyboardType="decimal-pad"
            onChangeText={(v) =>
              upd({ hydration: { ...edit.hydration!, fluidOz: parseFloat(v) || 0 } })
            }
          />
        </Field>
      )}

      <View style={s.actions}>
        {original && (
          <TouchableOpacity onPress={() => { setEdit(original); }}>
            <Text style={s.resetBtn}>Reset to original</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
          <Text style={s.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.saveBtn} onPress={() => onSave(edit)}>
          <Text style={s.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: object }) {
  const { theme } = useTheme();
  const s = styles(theme);
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function NumField({ label, value, onChange, int }: {
  label: string; value: number; onChange: (v: number) => void; int?: boolean;
}) {
  const { theme } = useTheme();
  const s = styles(theme);
  return (
    <Field label={label} style={{ flex: 1, minWidth: '46%', marginRight: 8 }}>
      <TextInput
        style={s.input}
        placeholderTextColor={theme.textSubtle}
        value={String(value)}
        keyboardType="decimal-pad"
        onChangeText={(v) => onChange(int ? (parseInt(v) || 0) : (parseFloat(v) || 0))}
      />
    </Field>
  );
}

const styles = (theme: AppTheme) => StyleSheet.create({
  root: { padding: 16, paddingBottom: 40 },
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: theme.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6,
  },
  input: {
    padding: 11, borderRadius: 8, borderWidth: 1, borderColor: theme.border,
    backgroundColor: theme.input, fontSize: 15, color: theme.text,
  },
  calInput: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  chipRow: { flexDirection: 'row', gap: 6, paddingBottom: 4 },
  chip: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16,
    backgroundColor: theme.chip, borderWidth: 1, borderColor: theme.border,
  },
  chipActive: { backgroundColor: theme.chipActive, borderColor: theme.chipActive },
  chipText: { color: theme.textMuted, fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: theme.chipActiveText },
  actions: {
    flexDirection: 'row', gap: 8, marginTop: 16,
    paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.borderSoft,
    alignItems: 'center',
  },
  resetBtn: { color: theme.primary, fontSize: 13, fontWeight: '600' },
  cancelBtn: {
    backgroundColor: theme.surfaceAlt, borderWidth: 1, borderColor: theme.border,
    borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: theme.textMuted },
  saveBtn: { backgroundColor: theme.chipActive, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18 },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: theme.chipActiveText },
});
