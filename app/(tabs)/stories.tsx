import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Modal, TextInput, KeyboardAvoidingView,
  Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import api from '../../lib/api';
import { C } from '../../lib/theme';
import ConfirmModal from '../../components/ConfirmModal';

interface Story { _id: string; storyText: string; image?: string; }
interface Word  { _id: string; word: string; }

const GENRES = [
  { id: 'adventure',  label: 'Adventure',  emoji: '🏔️' },
  { id: 'romance',    label: 'Romance',     emoji: '💕' },
  { id: 'mystery',    label: 'Mystery',     emoji: '🔍' },
  { id: 'fantasy',    label: 'Fantasy',     emoji: '🧙' },
  { id: 'sci-fi',     label: 'Sci-Fi',      emoji: '🚀' },
  { id: 'horror',     label: 'Horror',      emoji: '👻' },
  { id: 'comedy',     label: 'Comedy',      emoji: '😂' },
  { id: 'drama',      label: 'Drama',       emoji: '🎭' },
  { id: 'thriller',   label: 'Thriller',    emoji: '😰' },
  { id: 'nature',     label: 'Nature',      emoji: '🌿' },
  { id: 'friendship', label: 'Friendship',  emoji: '🤝' },
  { id: 'daily life', label: 'Daily Life',  emoji: '☀️' },
];
const WORD_COUNTS = [50, 100, 200, 300, 400, 500];

export default function StoriesScreen() {
  const [stories, setStories]       = useState<Story[]>([]);
  const [selected, setSelected]     = useState<Story | null>(null);
  const [loading, setLoading]       = useState(true);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [loopOne, setLoopOne]       = useState(false);
  const isPlayingRef                = useRef(false);
  const loopRef                     = useRef(false);

  const [modal, setModal]           = useState(false);
  const [allWords, setAllWords]     = useState<Word[]>([]);
  const [pickedIds, setPickedIds]   = useState<Set<string>>(new Set());
  const [wordSearch, setWordSearch] = useState('');
  const [dropOpen, setDropOpen]     = useState(false);
  const [genre, setGenre]           = useState('');
  const [wordCount, setWordCount]   = useState(100);
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState('');
  const [saving, setSaving]         = useState(false);
  const [savedStoryId, setSavedStoryId] = useState<string | null>(null);
  const [selectMode, setSelectMode]   = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [creatingPl, setCreatingPl]   = useState(false);
  const [plName, setPlName]           = useState('');
  const [plModal, setPlModal]         = useState(false);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { loopRef.current = loopOne; }, [loopOne]);

  useEffect(() => {
    api.get('/stories')
      .then(r => { setStories(r.data); if (r.data.length) setSelected(r.data[0]); })
      .finally(() => setLoading(false));
    return () => { Speech.stop(); };
  }, []);

  const openModal = async () => {
    setError(''); setPickedIds(new Set()); setGenre(''); setWordCount(100);
    setWordSearch(''); setDropOpen(false);
    const { data } = await api.get('/words');
    setAllWords(data);
    setModal(true);
  };

  const filteredWords = allWords.filter(w => w.word.toLowerCase().includes(wordSearch.toLowerCase()));

  const toggleWord = (id: string) => {
    setPickedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleAll = () => {
    setPickedIds(prev => prev.size === filteredWords.length ? new Set() : new Set(filteredWords.map(w => w._id)));
  };

  const startStory = useCallback((story: Story) => {
    Speech.stop(); setIsPlaying(true); isPlayingRef.current = true;
    const speak = () => Speech.speak(story.storyText, {
      language: 'en-US', rate: 0.85,
      onDone: () => { if (loopRef.current && isPlayingRef.current) speak(); else setIsPlaying(false); },
      onError: () => setIsPlaying(false),
    });
    speak();
  }, []);

  const pause = useCallback(() => { setIsPlaying(false); isPlayingRef.current = false; Speech.stop(); }, []);
  const handleSelect = useCallback((story: Story) => { pause(); setSelected(story); }, [pause]);

  const handleGenerate = async () => {
    if (pickedIds.size === 0) { setError('Select at least one word.'); return; }
    if (!genre) { setError('Pick a genre.'); return; }
    setError(''); setGenerating(true);
    try {
      const words = allWords.filter(w => pickedIds.has(w._id)).map(w => w.word);
      const { data } = await api.post('/stories/generate', { words, genre, wordCount });
      setStories(prev => [data, ...prev]);
      setSelected(data);
      setSavedStoryId(null);
      setModal(false);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAsPlaylist = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const storyIndex = stories.findIndex(s => s._id === selected._id);
      const name = `Story ${storyIndex + 1} — ${genre || 'AI Story'}`;
      const playlist = await api.post('/playlists', { name, image: selected.image });
      await api.post(`/playlists/${playlist.data._id}/items`, { type: 'story', refId: selected._id });
      setSavedStoryId(selected._id);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const toggleSelectMode = () => {
    setSelectMode(v => !v);
    setSelectedIds(new Set());
  };

  const toggleStory = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleCreatePlaylistFromStories = async () => {
    if (!plName.trim() || selectedIds.size === 0) return;
    setCreatingPl(true);
    try {
      const firstStory = stories.find(s => selectedIds.has(s._id));
      const { data: pl } = await api.post('/playlists', { name: plName.trim(), image: firstStory?.image });
      for (const id of selectedIds) {
        await api.post(`/playlists/${pl._id}/items`, { type: 'story', refId: id });
      }
      setPlModal(false);
      setSelectMode(false);
      setSelectedIds(new Set());
      setPlName('');
    } catch {
    } finally {
      setCreatingPl(false);
    }
  };

  const [confirmId, setConfirmId]   = useState<string | null>(null);
  const [deleting, setDeleting]     = useState(false);

  const handleDeleteStory = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      await api.delete(`/stories/${confirmId}`);
      setStories(prev => {
        const next = prev.filter(s => s._id !== confirmId);
        if (selected?._id === confirmId) setSelected(next[0] ?? null);
        return next;
      });
    } finally {
      setDeleting(false);
      setConfirmId(null);
    }
  };

  const selectedLabels = allWords.filter(w => pickedIds.has(w._id)).map(w => w.word);

  if (loading) return <SafeAreaView style={s.root} edges={['top']}><View style={s.center}><ActivityIndicator color={C.primary} size="large" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <Text style={s.heading}>Stories</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {stories.length > 0 && (
            <TouchableOpacity style={[s.selectBtn, selectMode && s.selectBtnActive]} onPress={toggleSelectMode}>
              <Ionicons name={selectMode ? 'close' : 'checkmark-done-outline'} size={16} color={selectMode ? '#fff' : C.primary} />
              <Text style={[s.selectBtnText, selectMode && { color: '#fff' }]}>{selectMode ? 'Cancel' : 'Select'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.addBtn} onPress={openModal}>
            <Ionicons name="sparkles" size={16} color="#fff" />
            <Text style={s.addBtnText}>Generate</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Select mode bar */}
      {selectMode && (
        <View style={s.selectBar}>
          <Text style={s.selectBarText}>{selectedIds.size} stor{selectedIds.size === 1 ? 'y' : 'ies'} selected</Text>
          <TouchableOpacity
            style={[s.createPlBtn, selectedIds.size === 0 && s.createPlBtnDisabled]}
            onPress={() => { if (selectedIds.size > 0) setPlModal(true); }}
            disabled={selectedIds.size === 0}
          >
            <Ionicons name="musical-notes" size={14} color="#fff" />
            <Text style={s.createPlBtnText}>Create Playlist</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={stories} keyExtractor={st => st._id} horizontal
        showsHorizontalScrollIndicator={false} style={s.tabs}
        ListEmptyComponent={<Text style={s.empty}>No stories yet. Tap Generate!</Text>}
        renderItem={({ item, index }) => {
          const isSelected = selectedIds.has(item._id);
          return (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
              <TouchableOpacity
                style={[s.tab, !selectMode && selected?._id === item._id && s.tabActive, selectMode && isSelected && s.tabSelected]}
                onPress={() => selectMode ? toggleStory(item._id) : handleSelect(item)}
              >
                {selectMode && (
                  <Ionicons name={isSelected ? 'checkbox' : 'square-outline'} size={14} color={isSelected ? C.primary : C.muted} />
                )}
                <Text style={[s.tabText, !selectMode && selected?._id === item._id && s.tabTextActive, selectMode && isSelected && s.tabTextActive]}>
                  Story {index + 1}
                </Text>
              </TouchableOpacity>
              {!selectMode && (
                <TouchableOpacity style={s.tabDeleteBtn} onPress={() => setConfirmId(item._id)}>
                  <Ionicons name="close-circle" size={18} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {selected && <ScrollView style={s.storyScroll} contentContainerStyle={s.storyContent}><Text style={s.storyText}>{selected.storyText}</Text></ScrollView>}

      {selected && (
        <View style={s.player}>
          <TouchableOpacity style={s.loopBtn} onPress={() => setLoopOne(v => !v)}>
            <Ionicons name="repeat-sharp" size={20} color={loopOne ? '#f97316' : '#484f58'} />
            <Text style={[s.loopLabel, { color: loopOne ? '#f97316' : '#484f58' }]}>{loopOne ? 'Loop On' : 'Loop Off'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.playBtn} onPress={isPlaying ? pause : () => startStory(selected)}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={30} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={s.saveBtn} onPress={handleSaveAsPlaylist} disabled={saving || savedStoryId === selected._id}>
            {saving
              ? <ActivityIndicator size="small" color={C.primary} />
              : <Ionicons name={savedStoryId === selected._id ? 'checkmark-circle' : 'add-circle-outline'} size={20} color={savedStoryId === selected._id ? C.primary : C.muted} />
            }
            <Text style={[s.saveBtnText, savedStoryId === selected._id && { color: C.primary }]}>
              {savedStoryId === selected._id ? 'Saved!' : 'Playlist'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ConfirmModal
        visible={!!confirmId}
        title="Delete this story?"
        message="This story will be permanently deleted."
        onConfirm={handleDeleteStory}
        onCancel={() => setConfirmId(null)}
        loading={deleting}
      />

      {/* Generate Modal */}
      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}>
          <View style={s.sheet}>
            {/* Header */}
            <View style={s.sheetHeaderRow}>
              <View style={s.sheetIconWrap}><Ionicons name="sparkles" size={18} color={C.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.sheetTitle}>Generate Story</Text>
                <Text style={s.sheetSub}>Pick a genre and words</Text>
              </View>
              <TouchableOpacity onPress={() => setModal(false)} style={s.closeBtn}>
                <Ionicons name="close" size={18} color={C.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {!!error && <View style={s.errorBox}><Ionicons name="alert-circle" size={14} color="#ef4444" /><Text style={s.errorText}>{error}</Text></View>}

              {/* Genre */}
              <Text style={s.sectionLabel}>CHOOSE GENRE</Text>
              <View style={s.genreGrid}>
                {GENRES.map(g => (
                  <TouchableOpacity key={g.id} style={[s.genreCard, genre === g.id && s.genreCardActive]} onPress={() => setGenre(g.id)}>
                    <Text style={s.genreEmoji}>{g.emoji}</Text>
                    <Text style={[s.genreLabel, genre === g.id && s.genreLabelActive]}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Word count */}
              <Text style={s.sectionLabel}>STORY LENGTH</Text>
              <View style={s.chipRow}>
                {WORD_COUNTS.map(n => (
                  <TouchableOpacity key={n} style={[s.chip, wordCount === n && s.chipActive]} onPress={() => setWordCount(n)}>
                    <Text style={[s.chipText, wordCount === n && s.chipTextActive]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Word dropdown */}
              <View style={s.dropLabelRow}>
                <Text style={s.sectionLabel}>SELECT WORDS</Text>
                {pickedIds.size > 0 && <View style={s.countBadge}><Text style={s.countBadgeText}>{pickedIds.size} selected</Text></View>}
              </View>

              {/* Dropdown trigger */}
              <TouchableOpacity style={[s.dropTrigger, dropOpen && s.dropTriggerOpen]} onPress={() => setDropOpen(v => !v)}>
                <View style={{ flex: 1 }}>
                  {pickedIds.size === 0 ? (
                    <Text style={s.dropPlaceholder}>Choose words for your story…</Text>
                  ) : (
                    <View style={s.selectedTagsRow}>
                      {selectedLabels.slice(0, 4).map(w => (
                        <View key={w} style={s.selectedTag}><Text style={s.selectedTagText}>{w}</Text></View>
                      ))}
                      {selectedLabels.length > 4 && (
                        <View style={s.moreTag}><Text style={s.moreTagText}>+{selectedLabels.length - 4}</Text></View>
                      )}
                    </View>
                  )}
                </View>
                <Ionicons name={dropOpen ? 'chevron-up' : 'chevron-down'} size={16} color={C.muted} />
              </TouchableOpacity>

              {/* Dropdown panel */}
              {dropOpen && (
                <View style={s.dropPanel}>
                  {/* Search */}
                  <View style={s.dropSearch}>
                    <Ionicons name="search" size={14} color={C.muted} />
                    <TextInput
                      style={s.dropSearchInput}
                      placeholder="Search words…"
                      placeholderTextColor={C.muted}
                      value={wordSearch}
                      onChangeText={setWordSearch}
                      autoFocus
                    />
                    {!!wordSearch && <TouchableOpacity onPress={() => setWordSearch('')}><Ionicons name="close" size={14} color={C.muted} /></TouchableOpacity>}
                  </View>

                  {/* Select all */}
                  {filteredWords.length > 0 && (
                    <TouchableOpacity style={s.selectAllRow} onPress={toggleAll}>
                      <Ionicons
                        name={pickedIds.size === filteredWords.length && filteredWords.length > 0 ? 'checkbox' : 'square-outline'}
                        size={16}
                        color={pickedIds.size === filteredWords.length && filteredWords.length > 0 ? C.primary : C.muted}
                      />
                      <Text style={s.selectAllText}>
                        {pickedIds.size === filteredWords.length && filteredWords.length > 0 ? 'Deselect All' : 'Select All'}
                      </Text>
                      <Text style={s.selectAllCount}>{filteredWords.length} words</Text>
                    </TouchableOpacity>
                  )}

                  {/* Word list */}
                  <ScrollView style={s.dropList} nestedScrollEnabled>
                    {allWords.length === 0 ? (
                      <Text style={s.dropEmpty}>No saved words yet.</Text>
                    ) : filteredWords.length === 0 ? (
                      <Text style={s.dropEmpty}>No words match your search.</Text>
                    ) : filteredWords.map(w => {
                      const sel = pickedIds.has(w._id);
                      return (
                        <TouchableOpacity key={w._id} style={[s.dropItem, sel && s.dropItemActive]} onPress={() => toggleWord(w._id)}>
                          <Ionicons name={sel ? 'checkbox' : 'square-outline'} size={16} color={sel ? C.primary : C.muted} />
                          <Text style={[s.dropItemText, sel && s.dropItemTextActive]}>{w.word}</Text>
                          {sel && <Ionicons name="checkmark-circle" size={14} color={C.primary} style={{ marginLeft: 'auto' }} />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              <View style={{ height: 16 }} />
            </ScrollView>

            {/* Footer */}
            <View style={s.sheetFooter}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setModal(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.generateBtn, generating && s.generateBtnDisabled]} onPress={handleGenerate} disabled={generating}>
                {generating && <ActivityIndicator color="#fff" size="small" />}
                <Ionicons name="sparkles" size={14} color="#fff" />
                <Text style={s.generateBtnText}>{generating ? 'Generating…' : 'Generate'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Create Playlist from Stories Modal */}
      <Modal visible={plModal} transparent animationType="slide" onRequestClose={() => setPlModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}>
          <View style={[s.sheet, { maxHeight: '50%' }]}>
            <View style={s.sheetHeaderRow}>
              <View style={s.sheetIconWrap}><Ionicons name="musical-notes" size={18} color={C.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.sheetTitle}>Create Playlist</Text>
                <Text style={s.sheetSub}>{selectedIds.size} stor{selectedIds.size === 1 ? 'y' : 'ies'} selected</Text>
              </View>
              <TouchableOpacity onPress={() => setPlModal(false)} style={s.closeBtn}>
                <Ionicons name="close" size={18} color={C.muted} />
              </TouchableOpacity>
            </View>
            <Text style={s.sectionLabel}>PLAYLIST NAME</Text>
            <View style={s.inputRow}>
              <Ionicons name="musical-notes-outline" size={16} color={C.muted} style={{ marginRight: 8 }} />
              <TextInput
                style={s.input}
                placeholder="e.g. My Story Collection"
                placeholderTextColor={C.muted}
                value={plName}
                onChangeText={setPlName}
                autoFocus
              />
            </View>
            <View style={s.sheetFooter}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setPlModal(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.generateBtn, creatingPl && s.generateBtnDisabled]} onPress={handleCreatePlaylistFromStories} disabled={creatingPl}>
                {creatingPl ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.generateBtnText}>Create Playlist</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: C.bg },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  heading:          { fontSize: 26, fontWeight: '800', color: C.text },
  addBtn:           { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  addBtnText:       { fontSize: 13, fontWeight: '700', color: '#fff' },
  empty:            { color: C.muted, textAlign: 'center', marginTop: 20, paddingHorizontal: 16 },
  tabs:             { paddingHorizontal: 12, paddingBottom: 8, flexGrow: 0 },
  tab:              { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  tabDeleteBtn:     { paddingHorizontal: 4, paddingVertical: 8 },
  tabActive:        { backgroundColor: C.primarySoft, borderColor: C.primary },
  tabText:          { fontSize: 12, fontWeight: '600', color: C.muted },
  tabTextActive:    { color: C.primary },
  storyScroll:      { flex: 1 },
  storyContent:     { padding: 20, paddingBottom: 40 },
  storyText:        { fontSize: 16, color: C.text, lineHeight: 28 },
  player:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderTopWidth: 1, borderColor: C.border, paddingHorizontal: 24, paddingVertical: 16 },
  loopBtn:          { alignItems: 'center', gap: 3, minWidth: 60 },
  loopLabel:        { fontSize: 9, fontWeight: '700' },
  playBtn:          { width: 60, height: 60, borderRadius: 30, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  wordCount:        { fontSize: 11, color: C.muted, minWidth: 60, textAlign: 'right' },
  saveBtn:          { alignItems: 'center', gap: 3, minWidth: 60 },
  saveBtnText:      { fontSize: 9, fontWeight: '700', color: C.muted },
  selectBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: C.primary },
  selectBtnActive:  { backgroundColor: C.primary },
  selectBtnText:    { fontSize: 12, fontWeight: '700', color: C.primary },
  selectBar:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.primarySoft, borderBottomWidth: 1, borderBottomColor: C.border },
  selectBarText:    { fontSize: 13, fontWeight: '700', color: C.primary },
  createPlBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: C.primary, borderRadius: 12 },
  createPlBtnDisabled: { opacity: 0.4 },
  createPlBtnText:  { fontSize: 12, fontWeight: '700', color: '#fff' },
  tabSelected:      { backgroundColor: C.primarySoft, borderColor: C.primary },
  inputRow:         { flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, height: 48 },
  input:            { flex: 1, fontSize: 14, color: C.text },
  // Modal
  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:            { backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '92%' },
  sheetHeaderRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  sheetIconWrap:    { width: 36, height: 36, borderRadius: 10, backgroundColor: C.primarySoft, justifyContent: 'center', alignItems: 'center' },
  sheetTitle:       { fontSize: 15, fontWeight: '900', color: C.text },
  sheetSub:         { fontSize: 11, color: C.muted },
  closeBtn:         { width: 32, height: 32, borderRadius: 10, backgroundColor: C.card2, justifyContent: 'center', alignItems: 'center' },
  sectionLabel:     { fontSize: 9, fontWeight: '800', color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10, marginTop: 4 },
  // Genre grid
  genreGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  genreCard:        { width: '22%', alignItems: 'center', padding: 10, borderRadius: 16, borderWidth: 2, borderColor: C.border, backgroundColor: C.card2 },
  genreCardActive:  { borderColor: C.primary, backgroundColor: C.primarySoft },
  genreEmoji:       { fontSize: 20, marginBottom: 4 },
  genreLabel:       { fontSize: 9, fontWeight: '700', color: C.text2, textAlign: 'center' },
  genreLabelActive: { color: C.primary },
  // Word count chips
  chipRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip:             { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12, borderWidth: 2, borderColor: C.border, backgroundColor: C.card2 },
  chipActive:       { borderColor: C.primary, backgroundColor: C.primarySoft },
  chipText:         { fontSize: 12, fontWeight: '700', color: C.text2 },
  chipTextActive:   { color: C.primary },
  // Dropdown
  dropLabelRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  countBadge:       { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: C.primarySoft, borderRadius: 99 },
  countBadgeText:   { fontSize: 10, fontWeight: '700', color: C.primary },
  dropTrigger:      { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 16, borderWidth: 2, borderColor: C.border, backgroundColor: C.card2, marginBottom: 4 },
  dropTriggerOpen:  { borderColor: C.primary, backgroundColor: C.inputBg },
  dropPlaceholder:  { fontSize: 13, color: C.muted },
  selectedTagsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  selectedTag:      { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: C.primary, borderRadius: 99 },
  selectedTagText:  { fontSize: 10, fontWeight: '700', color: '#fff' },
  moreTag:          { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: C.card, borderRadius: 99, borderWidth: 1, borderColor: C.border },
  moreTagText:      { fontSize: 10, fontWeight: '700', color: C.muted },
  dropPanel:        { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 8 },
  dropSearch:       { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, margin: 8, backgroundColor: C.card2, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  dropSearchInput:  { flex: 1, fontSize: 13, color: C.text },
  selectAllRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.card2 },
  selectAllText:    { flex: 1, fontSize: 12, fontWeight: '600', color: C.text2 },
  selectAllCount:   { fontSize: 10, color: C.muted },
  dropList:         { maxHeight: 180 },
  dropItem:         { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  dropItemActive:   { backgroundColor: C.primarySoft },
  dropItemText:     { fontSize: 13, fontWeight: '600', color: C.text },
  dropItemTextActive: { color: C.primary },
  dropEmpty:        { fontSize: 12, color: C.muted, textAlign: 'center', padding: 20 },
  // Footer
  sheetFooter:      { flexDirection: 'row', gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  cancelBtn:        { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  cancelBtnText:    { fontSize: 13, fontWeight: '700', color: C.text2 },
  generateBtn:      { flex: 1, height: 48, borderRadius: 14, backgroundColor: C.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText:  { fontSize: 13, fontWeight: '800', color: '#fff' },
  errorBox:         { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ef444420', borderRadius: 12, padding: 10, marginBottom: 12 },
  errorText:        { fontSize: 12, color: '#ef4444', flex: 1 },
});
