// Drafts list — shows all drafts or today's only.

import { useCallback, useState } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDrafts, type MealDraft } from '../context/DraftsContext';
import { useTheme, type AppTheme } from '../context/ThemeContext';
import Pill from '../components/Pill';
import Icon from '../components/Icon';
import type { RootStackParamList } from '../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function todayMMDD() {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

function relTime(ts: number | { toDate?: () => Date } | undefined): string {
  if (!ts) return '';
  const date = typeof ts === 'object' && 'toDate' in ts && ts.toDate ? ts.toDate() : new Date(ts as number);
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

interface Props {
  todayOnly?: boolean;
  title?: string;
}

export default function DraftsScreen({ todayOnly = false, title }: Props) {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const s = styles(theme);
  const { drafts, draftsLoaded, localPhotos, newDraft, deleteDraft } = useDrafts();
  const [editMode, setEditMode] = useState(false);

  const visibleDrafts = drafts.filter((d) => d.status !== 'capturing');
  const filtered = todayOnly ? visibleDrafts.filter((d) => d.date === todayMMDD()) : visibleDrafts;

  const handleNew = useCallback(async () => {
    const id = await newDraft();
    nav.navigate('Capture', { draftId: id });
  }, [newDraft, nav]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete draft?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteDraft(id) },
    ]);
  }, [deleteDraft]);

  const handleClearAll = useCallback(() => {
    if (filtered.length === 0) return;
    Alert.alert(
      `Delete all ${filtered.length} draft${filtered.length !== 1 ? 's' : ''}?`,
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete all',
          style: 'destructive',
          onPress: () => {
            filtered.forEach((d) => void deleteDraft(d.id));
            setEditMode(false);
          },
        },
      ],
    );
  }, [filtered, deleteDraft]);

  if (!draftsLoaded) return <View style={s.center}><ActivityIndicator color={theme.primary} /></View>;

  const screenTitle = title ?? (todayOnly ? 'Today' : 'Drafts');
  const subtitle = todayOnly
    ? `${todayMMDD()} · ${filtered.length} meals`
    : `${filtered.length} pending`;

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={s.h1}>{screenTitle}</Text>
          <Text style={s.sub}>{subtitle}</Text>
        </View>
        <View style={s.headerBtns}>
          {filtered.length > 0 && (
            <TouchableOpacity style={s.editBtn} onPress={() => setEditMode(!editMode)}>
              <Text style={[s.editBtnText, editMode && { color: theme.primary }]}>
                {editMode ? 'Done' : 'Edit'}
              </Text>
            </TouchableOpacity>
          )}
          {editMode && filtered.length > 1 && (
            <TouchableOpacity style={s.clearBtn} onPress={handleClearAll}>
              <Text style={s.clearBtnText}>Clear all</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.addBtn} onPress={handleNew}>
            <Icon name="plus" size={20} color="#fff" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(d) => d.id}
        contentContainerStyle={filtered.length === 0 ? s.emptyList : undefined}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📷</Text>
            <Text style={s.emptyTitle}>No drafts yet</Text>
            <Text style={s.emptyBody}>Tap + to capture a meal — analyze now or save for later.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={handleNew}>
              <Text style={s.emptyBtnText}>Capture meal</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <DraftRow
            draft={item}
            thumbUri={localPhotos[item.id]?.[0]?.uri}
            photoCount={localPhotos[item.id]?.length ?? 0}
            editMode={editMode}
            onOpen={() => !editMode && nav.navigate('DraftDetail', { draftId: item.id })}
            onDelete={() => handleDelete(item.id)}
          />
        )}
      />
    </View>
  );
}

function DraftRow({ draft, thumbUri, photoCount, editMode, onOpen, onDelete }: {
  draft: MealDraft; thumbUri?: string; photoCount: number;
  editMode: boolean; onOpen: () => void; onDelete: () => void;
}) {
  const { theme } = useTheme();
  const s = styles(theme);
  const tone = draft.status === 'logged' ? 'success' : draft.status === 'analyzed' ? 'primary' : 'neutral';
  const statusLabel = ({ capturing: 'Capturing', pending: 'Pending', analyzed: 'Analyzed', logged: 'Logged', discarded: 'Discarded' })[draft.status] ?? 'Pending';

  return (
    <TouchableOpacity style={s.row} onPress={onOpen} onLongPress={onDelete} activeOpacity={editMode ? 1 : 0.7}>
      {editMode && (
        <TouchableOpacity style={s.deleteCircle} onPress={onDelete}>
          <Icon name="x" size={12} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      )}
      <View style={s.thumb}>
        {thumbUri ? (
          <Image source={{ uri: thumbUri }} style={s.thumbImg} />
        ) : (
          <View style={[s.thumbImg, s.thumbEmpty]}>
            <Icon name="camera" size={20} color={theme.textSubtle} />
          </View>
        )}
        {photoCount > 1 && (
          <View style={s.thumbCount}>
            <Text style={s.thumbCountText}>+{photoCount - 1}</Text>
          </View>
        )}
      </View>
      <View style={s.rowBody}>
        <View style={s.rowLine1}>
          <Text style={s.rowMeal}>{draft.meal || 'Meal'}</Text>
          <Text style={s.rowDate}>{draft.date ?? ''}</Text>
        </View>
        <Text style={s.rowBrand} numberOfLines={1}>{draft.brand || draft.note || 'No description'}</Text>
        <View style={s.rowLine3}>
          <Pill tone={tone}>{statusLabel}</Pill>
          <Text style={s.rowAge}>{relTime(draft.createdAt as unknown as { toDate: () => Date })}</Text>
        </View>
      </View>
      {!editMode && <Icon name="chevron" size={16} color={theme.textSubtle} />}
    </TouchableOpacity>
  );
}

const styles = (theme: AppTheme) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface,
  },
  h1: { fontSize: 26, fontWeight: '700', color: theme.text, letterSpacing: -0.3 },
  sub: { fontSize: 12, color: theme.textSubtle, marginTop: 2 },
  headerBtns: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  editBtnText: { fontSize: 14, fontWeight: '600', color: theme.textMuted },
  clearBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  clearBtnText: { fontSize: 14, fontWeight: '600', color: theme.destructive },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
  emptyList: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', padding: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: theme.text, marginBottom: 6 },
  emptyBody: { fontSize: 13, color: theme.textMuted, lineHeight: 19, marginBottom: 18, textAlign: 'center' },
  emptyBtn: { backgroundColor: theme.chipActive, borderRadius: 9, paddingVertical: 11, paddingHorizontal: 22 },
  emptyBtnText: { color: theme.chipActiveText, fontSize: 14, fontWeight: '600' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 18,
    borderBottomWidth: 1, borderBottomColor: theme.borderSoft, backgroundColor: theme.surface,
  },
  deleteCircle: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: theme.destructive, alignItems: 'center', justifyContent: 'center',
    marginRight: -4,
  },
  thumb: { width: 56, height: 56, borderRadius: 8, overflow: 'hidden', backgroundColor: theme.surfaceAlt, position: 'relative' },
  thumbImg: { width: 56, height: 56 },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surfaceAlt },
  thumbCount: { position: 'absolute', right: 3, bottom: 3, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  thumbCountText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  rowBody: { flex: 1, minWidth: 0 },
  rowLine1: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  rowMeal: { fontWeight: '600', fontSize: 15, color: theme.text },
  rowDate: { fontSize: 12, color: theme.textSubtle, fontFamily: 'Courier' },
  rowBrand: { fontSize: 13, color: theme.textMuted, marginTop: 1 },
  rowLine3: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  rowAge: { fontSize: 11, color: theme.textSubtle },
});
