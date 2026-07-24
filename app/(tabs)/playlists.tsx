import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Modal, TextInput, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { audioPlayer, type QueueItem } from '../../lib/audioPlayer';
import api from '../../lib/api';
import { C } from '../../lib/theme';
import ConfirmModal from '../../components/ConfirmModal';

interface PlaylistItem { _id: string; type: string; refId: string; }
interface PlaylistWord { _id: string; word: string; meaning: string; translations?: Record<string, string>; }
interface PlaylistStory { _id: string; storyText: string; }
interface Playlist { _id: string; name: string; image?: string; items?: PlaylistItem[]; }
type ExpandedItem =
  | { _id: string; kind: 'word'; word: string; meaning: string }
  | { _id: string; kind: 'story'; storyText: string };

export default function PlaylistsScreen() {
  const [playlists, setPlaylists]         = useState<Playlist[]>([]);
  const [loading, setLoading]             = useState(true);
  const [expandedId, setExpandedId]       = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, ExpandedItem[]>>({});
  const [loadingExpand, setLoadingExpand] = useState(false);

  // Player state
  const [playingId, setPlayingId]   = useState<string | null>(null);
  const [playItems, setPlayItems]   = useState<ExpandedItem[]>([]);
  const [playIdx, setPlayIdx]       = useState(0);
  const [isPlaying, setIsPlaying]   = useState(false);
  const isPlayingRef                = useRef(false);
  const playItemsRef                = useRef<ExpandedItem[]>([]);
  const playIdxRef                  = useRef(0);

  // Create modal
  const [createModal, setCreateModal] = useState(false);
  const [plName, setPlName]           = useState('');
  const [creating, setCreating]       = useState(false);
  const [createError, setCreateError] = useState('');

  // Delete
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting]   = useState(false);

  // Remove item confirm
  const [removeTarget, setRemoveTarget] = useState<{ playlistId: string; item: ExpandedItem } | null>(null);
  const [removing, setRemoving]         = useState(false);

  useEffect(() => {
    api.get('/playlists').then(r => setPlaylists(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { playItemsRef.current = playItems; }, [playItems]);
  useEffect(() => { playIdxRef.current = playIdx; }, [playIdx]);

  const getTranslation = (w: PlaylistWord) => {
    if (!w.translations) return w.meaning;
    return w.translations['telugu'] || w.translations['hindi'] ||
      Object.values(w.translations)[0] || w.meaning;
  };

  // Flatten playlist items into a TTS queue. Words -> English (+ Telugu if any);
  // stories are split into <=200-char chunks (Google TTS limit).
  const buildQueue = (items: ExpandedItem[]): QueueItem[] => {
    const q: QueueItem[] = [];
    items.forEach((item, di) => {
      if (item.kind === 'story') {
        let chunk = '';
        for (const w of item.storyText.split(/\s+/)) {
          if ((chunk + ' ' + w).trim().length > 190) {
            if (chunk.trim()) q.push({ text: chunk.trim(), lang: 'en', displayIdx: di });
            chunk = w;
          } else {
            chunk = (chunk + ' ' + w).trim();
          }
        }
        if (chunk.trim()) q.push({ text: chunk.trim(), lang: 'en', displayIdx: di });
      } else {
        q.push({ text: item.word, lang: 'en', displayIdx: di });
        const telugu = (item as any).translations?.telugu || (item as any).translations?.Telugu;
        if (telugu) q.push({ text: telugu, lang: 'te', displayIdx: di });
      }
    });
    return q;
  };

  const stopPlayback = useCallback(() => {
    audioPlayer.stop();
    setIsPlaying(false); setPlayingId(null); setPlayItems([]); setPlayIdx(0);
  }, []);

  const handlePlay = useCallback(async (pl: Playlist) => {
    if (playingId === pl._id) { stopPlayback(); return; }
    await audioPlayer.stop();
    try {
      const { data } = await api.get(`/playlists/${pl._id}`);
      const items: ExpandedItem[] = [
        ...(data.stories || []).map((s: PlaylistStory) => ({ _id: s._id, kind: 'story' as const, storyText: s.storyText })),
        ...(data.words   || []).map((w: PlaylistWord)  => ({ _id: w._id, kind: 'word'  as const, word: w.word, meaning: w.meaning, translations: w.translations })),
      ];
      if (!items.length) { alert('No items in this playlist yet.'); return; }
      setPlayItems(items); setPlayIdx(0); setPlayingId(pl._id); setIsPlaying(true);
      audioPlayer.start(
        buildQueue(items),
        (di) => setPlayIdx(di),
        () => { setIsPlaying(false); setPlayingId(null); setPlayItems([]); setPlayIdx(0); },
      );
    } catch { alert('Failed to load playlist.'); }
  }, [playingId, stopPlayback]);

  const handleSkipNext = () => {
    const next = playIdx + 1;
    if (next < playItems.length) audioPlayer.skipToDisplay(next);
  };

  const handleSkipBack = () => {
    audioPlayer.skipToDisplay(Math.max(0, playIdx - 1));
  };

  const toggleExpand = useCallback(async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!expandedItems[id]) {
      setLoadingExpand(true);
      try {
        const { data } = await api.get(`/playlists/${id}`);
        const items: ExpandedItem[] = [
          ...(data.stories || []).map((s: PlaylistStory) => ({ _id: s._id, kind: 'story' as const, storyText: s.storyText })),
          ...(data.words   || []).map((w: PlaylistWord)  => ({ _id: w._id, kind: 'word'  as const, word: w.word, meaning: w.meaning })),
        ];
        setExpandedItems(prev => ({ ...prev, [id]: items }));
      } finally { setLoadingExpand(false); }
    }
  }, [expandedId, expandedItems]);

  const handleRemoveItem = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      const { data } = await api.get(`/playlists/${removeTarget.playlistId}`);
      const plItem = data.items?.find((i: PlaylistItem) => i.refId === removeTarget.item._id);
      if (!plItem) return;
      await api.delete(`/playlists/${removeTarget.playlistId}/items`, { data: { itemId: plItem._id } });
      setExpandedItems(prev => ({
        ...prev,
        [removeTarget.playlistId]: prev[removeTarget.playlistId].filter(i => i._id !== removeTarget.item._id),
      }));
      setPlaylists(prev => prev.map(p => p._id === removeTarget.playlistId
        ? { ...p, items: (p.items || []).filter(i => i._id !== plItem._id) }
        : p
      ));
      setRemoveTarget(null);
    } finally { setRemoving(false); }
  };

  const handleCreate = async () => {
    if (!plName.trim()) { setCreateError('Enter a playlist name.'); return; }
    setCreateError(''); setCreating(true);
    try {
      const { data } = await api.post('/playlists', { name: plName.trim() });
      setPlaylists(prev => [data, ...prev]);
      setPlName(''); setCreateModal(false);
    } catch (e: any) {
      setCreateError(e?.response?.data?.error || 'Failed to create.');
    } finally { setCreating(false); }
  };

  const handleDeletePlaylist = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      await api.delete(`/playlists/${confirmId}`);
      setPlaylists(prev => prev.filter(p => p._id !== confirmId));
      if (playingId === confirmId) { stopPlayback(); }
      if (expandedId === confirmId) setExpandedId(null);
      setConfirmId(null);
    } finally { setDeleting(false); }
  };

  const currentItem = playItems[playIdx];

  if (loading) return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.center}><ActivityIndicator color={C.primary} size="large" /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerSub}>Your Audio Library</Text>
          <Text style={s.heading}>Playlists</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => { setCreateModal(true); setCreateError(''); setPlName(''); }}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={s.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Now Playing bar */}
      {playingId && currentItem && (
        <View style={s.nowBar}>
          <View style={s.nowIcon}><Ionicons name="volume-high" size={18} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.nowLabel}>NOW PLAYING · {playIdx + 1} of {playItems.length}</Text>
            <Text style={s.nowWord} numberOfLines={1}>
              {currentItem.kind === 'story' ? '📖 Story' : currentItem.word}
            </Text>
            <Text style={s.nowMeaning} numberOfLines={1}>
              {currentItem.kind === 'story'
                ? currentItem.storyText.slice(0, 50) + '…'
                : currentItem.meaning}
            </Text>
          </View>
          <View style={s.nowControls}>
            <TouchableOpacity style={s.nowBtn} onPress={handleSkipBack}>
              <Ionicons name="play-skip-back" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={s.nowPlayBtn} onPress={stopPlayback}>
              <Ionicons name="pause" size={18} color={C.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={s.nowBtn} onPress={handleSkipNext}>
              <Ionicons name="play-skip-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={playlists}
        keyExtractor={p => p._id}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={{ fontSize: 32 }}>🎵</Text>
            <Text style={s.emptyText}>No playlists yet</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => { setCreateModal(true); setPlName(''); setCreateError(''); }}>
              <Ionicons name="add" size={14} color="#fff" />
              <Text style={s.emptyBtnText}>Create First Playlist</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item: pl }) => {
          const isPlaying = playingId === pl._id;
          const isExpanded = expandedId === pl._id;
          const itemCount = pl.items?.length ?? 0;
          return (
            <View style={[s.card, isPlaying && s.cardActive]}>
              {/* Card image + info */}
              <View style={s.cardTop}>
                {pl.image
                  ? <Image source={{ uri: pl.image }} style={s.cardImg} />
                  : <View style={[s.cardImg, s.cardImgFallback]}><Ionicons name="musical-notes" size={22} color={C.primary} /></View>
                }
                <View style={{ flex: 1 }}>
                  <Text style={s.cardName}>{pl.name}</Text>
                  <Text style={s.cardCount}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</Text>
                </View>
                {isPlaying && (
                  <View style={s.playingBadge}>
                    <View style={s.playingDot} />
                    <Text style={s.playingText}>Playing</Text>
                  </View>
                )}
              </View>

              {/* Actions row */}
              <View style={s.actionsRow}>
                <TouchableOpacity style={s.actionBtn} onPress={() => setConfirmId(pl._id)}>
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, isExpanded && s.actionBtnActive]} onPress={() => toggleExpand(pl._id)}>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={isExpanded ? C.primary : C.text2} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.playBtn, isPlaying && s.playBtnActive]}
                  onPress={() => handlePlay(pl)}
                >
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={16} color={isPlaying ? '#fff' : C.primary} />
                  <Text style={[s.playBtnText, isPlaying && { color: '#fff' }]}>{isPlaying ? 'Stop' : 'Play'}</Text>
                </TouchableOpacity>
              </View>

              {/* Expanded items */}
              {isExpanded && (
                <View style={s.itemsList}>
                  {loadingExpand && !expandedItems[pl._id] ? (
                    <ActivityIndicator color={C.primary} size="small" style={{ padding: 12 }} />
                  ) : !expandedItems[pl._id] || expandedItems[pl._id].length === 0 ? (
                    <Text style={s.noItems}>No items yet</Text>
                  ) : expandedItems[pl._id].map(item => (
                    <View key={item._id} style={s.itemRow}>
                      <Text style={s.itemEmoji}>{item.kind === 'story' ? '📖' : '🔤'}</Text>
                      <Text style={s.itemLabel} numberOfLines={1}>
                        {item.kind === 'story' ? item.storyText.slice(0, 40) + '…' : item.word}
                      </Text>
                      {item.kind === 'word' && <Text style={s.itemMeaning} numberOfLines={1}>{item.meaning}</Text>}
                      <TouchableOpacity onPress={() => setRemoveTarget({ playlistId: pl._id, item })}>
                        <Ionicons name="trash-outline" size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        }}
      />

      {/* Create Playlist Modal */}
      <Modal visible={createModal} transparent animationType="slide" onRequestClose={() => setCreateModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <View style={s.sheetIconWrap}><Ionicons name="musical-notes" size={18} color={C.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.sheetTitle}>New Playlist</Text>
                <Text style={s.sheetSub}>Give your playlist a name</Text>
              </View>
              <TouchableOpacity onPress={() => setCreateModal(false)} style={s.closeBtn}>
                <Ionicons name="close" size={18} color={C.muted} />
              </TouchableOpacity>
            </View>
            {!!createError && (
              <View style={s.errorBox}>
                <Ionicons name="alert-circle" size={14} color="#ef4444" />
                <Text style={s.errorText}>{createError}</Text>
              </View>
            )}
            <View style={s.inputRow}>
              <Ionicons name="musical-notes-outline" size={16} color={C.muted} style={{ marginRight: 8 }} />
              <TextInput style={s.input} placeholder="e.g. Daily Vocabulary" placeholderTextColor={C.muted}
                value={plName} onChangeText={setPlName} autoFocus />
            </View>
            <View style={s.sheetFooter}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setCreateModal(false)}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.confirmBtn, creating && { opacity: 0.6 }]} onPress={handleCreate} disabled={creating}>
                {creating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.confirmText}>Create</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmModal
        visible={!!confirmId}
        title="Delete this playlist?"
        message={`"${playlists.find(p => p._id === confirmId)?.name ?? ''}" will be permanently deleted.`}
        onConfirm={handleDeletePlaylist}
        onCancel={() => setConfirmId(null)}
        loading={deleting}
      />

      <ConfirmModal
        visible={!!removeTarget}
        title="Remove this item?"
        message={removeTarget?.item.kind === 'story' ? 'This story will be removed from the playlist.' : `"${(removeTarget?.item as any)?.word}" will be removed from the playlist.`}
        onConfirm={handleRemoveItem}
        onCancel={() => setRemoveTarget(null)}
        loading={removing}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.bg },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  headerSub:      { fontSize: 9, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 2 },
  heading:        { fontSize: 26, fontWeight: '800', color: C.text },
  addBtn:         { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  addBtnText:     { fontSize: 13, fontWeight: '700', color: '#fff' },
  // Now playing bar
  nowBar:         { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginBottom: 12, padding: 12, backgroundColor: C.primary, borderRadius: 16 },
  nowIcon:        { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  nowLabel:       { fontSize: 8, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 1, textTransform: 'uppercase' },
  nowWord:        { fontSize: 14, fontWeight: '800', color: '#fff' },
  nowMeaning:     { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  nowControls:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nowBtn:         { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  nowPlayBtn:     { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  // Playlist card
  card:           { marginHorizontal: 16, marginBottom: 12, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  cardActive:     { borderColor: C.primary },
  cardTop:        { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  cardImg:        { width: 52, height: 52, borderRadius: 12 },
  cardImgFallback:{ backgroundColor: C.primarySoft, justifyContent: 'center', alignItems: 'center' },
  cardName:       { fontSize: 15, fontWeight: '700', color: C.text },
  cardCount:      { fontSize: 11, color: C.muted, marginTop: 2 },
  playingBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primarySoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  playingDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary },
  playingText:    { fontSize: 9, fontWeight: '800', color: C.primary, textTransform: 'uppercase' },
  actionsRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  actionBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: C.card2, justifyContent: 'center', alignItems: 'center' },
  actionBtnActive:{ backgroundColor: C.primarySoft },
  playBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 36, borderRadius: 10, backgroundColor: C.primarySoft },
  playBtnActive:  { backgroundColor: C.primary },
  playBtnText:    { fontSize: 13, fontWeight: '700', color: C.primary },
  // Expanded items
  itemsList:      { borderTopWidth: 1, borderTopColor: C.border, paddingVertical: 4 },
  noItems:        { fontSize: 12, color: C.muted, textAlign: 'center', padding: 12 },
  itemRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  itemEmoji:      { fontSize: 12 },
  itemLabel:      { flex: 1, fontSize: 13, fontWeight: '600', color: C.text },
  itemMeaning:    { fontSize: 11, color: C.muted, maxWidth: 80 },
  // Empty
  emptyWrap:      { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText:      { fontSize: 14, fontWeight: '700', color: C.text2 },
  emptyBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginTop: 4 },
  emptyBtnText:   { fontSize: 13, fontWeight: '700', color: '#fff' },
  // Modal
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:          { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 14 },
  sheetHeader:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetIconWrap:  { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primarySoft, justifyContent: 'center', alignItems: 'center' },
  sheetTitle:     { fontSize: 15, fontWeight: '900', color: C.text },
  sheetSub:       { fontSize: 11, color: C.muted },
  closeBtn:       { width: 32, height: 32, borderRadius: 10, backgroundColor: C.card2, justifyContent: 'center', alignItems: 'center' },
  inputRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, height: 48 },
  input:          { flex: 1, fontSize: 14, color: C.text },
  sheetFooter:    { flexDirection: 'row', gap: 10 },
  cancelBtn:      { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  cancelText:     { fontSize: 13, fontWeight: '700', color: C.text2 },
  confirmBtn:     { flex: 1, height: 48, borderRadius: 14, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  confirmText:    { fontSize: 13, fontWeight: '800', color: '#fff' },
  errorBox:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ef444420', borderRadius: 12, padding: 10 },
  errorText:      { fontSize: 12, color: '#ef4444', flex: 1 },
});
