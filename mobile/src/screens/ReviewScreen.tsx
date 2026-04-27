// Review screen — editable FoodItemCards + Log to Lose It!

import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDrafts } from '../context/DraftsContext';
import { useTheme, type AppTheme } from '../context/ThemeContext';
import FoodItemCard from '../components/FoodItemCard';
import Icon from '../components/Icon';
import Spinner from '../components/Spinner';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Review'>;

export default function ReviewScreen({ route, navigation }: Props) {
  const { draftId } = route.params;
  const { theme } = useTheme();
  const s = styles(theme);
  const {
    drafts, analyses,
    editItem, deleteItem, multiplyItem, setLogWater, logToLoseIt, finishLoggedDraft,
  } = useDrafts();

  const draft = drafts.find((d) => d.id === draftId);
  const a = analyses[draftId];

  if (!draft || !a) {
    navigation.goBack();
    return null;
  }

  const { items, originalItems, verification, isLogging, logged, logWater } = a;
  const totalCal = items.reduce((s, i) => s + i.calories, 0);
  const verifiedCount = Object.values(verification).filter(
    (v) => v?.verificationComplete && v?.verificationLevel !== 'failed',
  ).length;
  const allDone = items.length > 0 && verifiedCount === items.length;

  const handleLog = async () => {
    try {
      await logToLoseIt(draftId);
    } catch (e) {
      Alert.alert('Logging failed', (e as Error).message);
    }
  };

  const handleDone = async () => {
    await finishLoggedDraft(draftId);
    navigation.navigate('Tabs');
  };

  return (
    <View style={s.root}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={s.headerWrap}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} disabled={isLogging}>
            <Icon name="back" size={20} color={theme.textMuted} />
          </TouchableOpacity>
          <View>
            <Text style={s.headTitle}>{logged ? 'Logged' : 'Review results'}</Text>
            <Text style={s.headSub}>
              {items.length} item{items.length !== 1 ? 's' : ''} · {totalCal} cal
              {isLogging ? ` · Verifying ${verifiedCount}/${items.length}` : ''}
            </Text>
          </View>
          <View style={{ width: 32 }} />
        </View>
      </SafeAreaView>

      {/* Items */}
      <ScrollView style={s.body} contentContainerStyle={s.bodyContent}>
        {items.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 40 }}>🤔</Text>
            <Text style={s.emptyTitle}>No items left</Text>
            <Text style={s.emptyBody}>You deleted them all. Go back and re-analyze if needed.</Text>
          </View>
        ) : (
          items.map((item, idx) => (
            <FoodItemCard
              key={idx}
              item={item}
              original={originalItems[idx]}
              onEdit={(updated) => editItem(draftId, idx, updated)}
              onDelete={() => deleteItem(draftId, idx)}
              onMultiply={(x) => multiplyItem(draftId, idx, x)}
              verification={verification[idx]}
              isLogging={isLogging}
            />
          ))
        )}
      </ScrollView>

      {/* Footer */}
      <SafeAreaView edges={['bottom']} style={s.footerWrap}>
        {/* Water toggle */}
        <View style={s.waterRow}>
          <Icon name="droplet" size={14} color="#3b82f6" />
          <Text style={s.waterLabel}>Also log water</Text>
          <Switch
            value={logWater}
            onValueChange={(v) => setLogWater(draftId, v)}
            disabled={isLogging || logged}
            thumbColor="#fff"
            trackColor={{ false: theme.disabled, true: '#3b82f6' }}
          />
        </View>

        {/* Log button */}
        {logged && allDone ? (
          <TouchableOpacity
            style={[s.logBtn, { backgroundColor: '#1d7a4a' }]}
            onPress={handleDone}
          >
            <Icon name="check" size={16} color={theme.primaryText} strokeWidth={2.4} />
            <Text style={[s.logBtnText, { color: theme.primaryText }]}>Done</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.logBtn, (isLogging || items.length === 0) && s.logBtnDisabled]}
            onPress={handleLog}
            disabled={isLogging || items.length === 0}
          >
            {isLogging ? (
              <>
                <Spinner size={16} color={theme.chipActiveText} />
                <Text style={s.logBtnText}>Logging…</Text>
              </>
            ) : (
              <>
                <Icon name="upload" size={16} color={theme.chipActiveText} strokeWidth={2.2} />
                <Text style={s.logBtnText}>
                  {logged ? 'Re-log to Lose It!' : 'Log to Lose It!'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = (theme: AppTheme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  headerWrap: { backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: theme.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  headTitle: { fontSize: 16, fontWeight: '700', color: theme.text, textAlign: 'center' },
  headSub: { fontSize: 11, color: theme.textSubtle, textAlign: 'center', marginTop: 1 },
  body: { flex: 1 },
  bodyContent: { padding: 14, paddingBottom: 16 },
  empty: { alignItems: 'center', padding: 40 },
  emptyTitle: { fontWeight: '600', fontSize: 16, color: theme.text, marginTop: 8 },
  emptyBody: { fontSize: 13, color: theme.textMuted, marginTop: 4, textAlign: 'center' },
  footerWrap: { backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border },
  waterRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.surfaceSoft, borderRadius: 8,
    marginHorizontal: 14, marginTop: 10, marginBottom: 8,
    paddingVertical: 7, paddingHorizontal: 10,
    borderWidth: 1, borderColor: theme.border,
  },
  waterLabel: { flex: 1, fontSize: 13, color: theme.textMuted, fontWeight: '500' },
  logBtn: {
    marginHorizontal: 14, marginBottom: 10, padding: 14,
    backgroundColor: theme.chipActive, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  logBtnDisabled: { backgroundColor: theme.disabled },
  logBtnText: { color: theme.chipActiveText, fontSize: 15, fontWeight: '700' },
});
