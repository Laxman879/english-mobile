import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Image,
  TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import api from '../../lib/api';
import { useTheme } from '../../lib/ThemeContext';
import ConfirmModal from '../../components/ConfirmModal';

interface Word {
  _id: string; word: string; meaning: string; image?: string;
  translations?: Record<string, string>;
  examples?: { past?: string; present?: string; future?: string };
}
interface Playlist { _id: string; name: string; }

export default function SavedScreen() {
  const { C } = useTheme();

  const [words, setWords]               = useState<Word[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [selected, setSelected]         = useState<Word | null>(null);
  const [selectMode, setSelectMode]     = useState(false);
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
  const [playlists, setPlaylists]       = useState<Playlist[]>([]);
  const [plModal, setPlModal]           = useState(false);
  const [addingToPl, setAddingToPl]     = useState(false);
  const [modal, setModal]               = useState(false);
  const [newWord, setNewWord]           = useState('');
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [confirmBulk, setConfirmBulk]   = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    api.get('/words').then(r => setWords(r.data)).finally(() => setLoading(false));
    api.get('/playlists').then(r => setPlaylists(r.data));
  }, []);

  const filtered = words.filter(w =>
    w.word.toLowerCase().includes(search.toLowerCase()) ||
    w.meaning.toLowerCase().includes(search.toLowerCase())
  );

  const speak = (text: string) => { Speech.stop(); Speech.speak(text, { language: 'en-US', rate: 0.85 }); };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(w => w._id)));
  };

  const exitSelectMode = useCallback(() => { setSelectMode(false); setSelectedIds(new Set()); }, []);

  const handleAdd = async () => {
    if (!newWord.trim()) { setError('Please enter a word.'); return; }
    setError(''); setSaving(true);
    try {
      const { data } = await api.post('/words/generate', { word: newWord.trim() });
      setWords(prev => [data, ...prev]);
      setNewWord(''); setModal(false);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to generate word.');
    } finally { setSaving(false); }
  };

  const handleDeleteWord = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/words/${confirmDeleteId}`);
      setWords(prev => prev.filter(w => w._id !== confirmDeleteId));
      if (selected?._id === confirmDeleteId) setSelected(null);
      setConfirmDeleteId(null);
    } finally { setDeleting(false); }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await Promise.all([...selectedIds].map(id => api.delete(`/words/${id}`)));
      setWords(prev => prev.filter(w => !selectedIds.has(w._id)));
      exitSelectMode(); setConfirmBulk(false);
    } finally { setBulkDeleting(false); }
  };

  const handleAddToPlaylist = async (plId: string) => {
    setAddingToPl(true);
    try {
      await Promise.all([...selectedIds].map(id =>
        api.put(`/playlists/${plId}/add-item`, { type: 'word', refId: id })
      ));
      setPlModal(false); exitSelectMode();
    } finally { setAddingToPl(false); }
  };

  if (loading) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <View>
          <Text style={{ fontSize: 9, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 2 }}>Vocabulary Vault</Text>
          <Text style={{ fontSize: 26, fontWeight: '900', color: C.text }}>Saved Words</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border }}>
          <Ionicons name="bookmark" size={14} color={C.primary} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.text }}>{words.length} words</Text>
        </View>
      </View>

      {/* Search */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: C.inputBg, borderRadius: 16, borderWidth: 1, borderColor: C.border }}>
        <Ionicons name="search" size={16} color={C.muted} style={{ marginRight: 8 }} />
        <TextInput style={{ flex: 1, fontSize: 14, color: C.text }} placeholder="Search words..." placeholderTextColor={C.muted} value={search} onChangeText={setSearch} />
        {!!search && <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color={C.muted} /></TouchableOpacity>}
      </View>

      {/* Select mode toolbar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 8 }}>
        {!selectMode ? (
          <>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border }}
              onPress={() => setSelectMode(true)}
            >
              <Ionicons name="checkmark-done-outline" size={16} color={C.primary} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.primary }}>Select</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: C.primary, borderRadius: 12 }}
              onPress={() => { setModal(true); setError(''); setNewWord(''); }}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Add Word</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border }}
              onPress={toggleSelectAll}
            >
              <Ionicons name={selectedIds.size === filtered.length ? 'checkbox' : 'square-outline'} size={16} color={C.primary} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.text2 }}>{selectedIds.size === filtered.length ? 'Deselect All' : 'Select All'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border }}
              onPress={exitSelectMode}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.text2 }}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Selection action bar */}
      {selectMode && selectedIds.size > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, padding: 10, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, flexWrap: 'wrap' }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.primary }}>{selectedIds.size} selected</Text>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: C.primarySoft, borderRadius: 10 }}
            onPress={() => setPlModal(true)}
          >
            <Ionicons name="musical-notes" size={14} color={C.primary} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: C.primary }}>Add to Playlist</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#ef444420', borderRadius: 10, marginLeft: 'auto' }}
            onPress={() => setConfirmBulk(true)}
          >
            <Ionicons name="trash-outline" size={14} color="#ef4444" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#ef4444' }}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={w => w._id}
        numColumns={2}
        columnWrapperStyle={{ gap: 10, marginBottom: 10 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 8 }}>
            <Ionicons name="bookmark-outline" size={32} color={C.muted} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: C.text2 }}>No words found</Text>
            <Text style={{ fontSize: 12, color: C.muted }}>{search ? 'Try a different search term' : 'Tap Add Word to get started'}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const telugu = item.translations?.['telugu'] || Object.values(item.translations || {})[0] || '';
          const isSel = selectedIds.has(item._id);
          return (
            <TouchableOpacity
              style={[{ flex: 1, backgroundColor: C.card, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: isSel ? C.primary : C.border }]}
              onPress={() => selectMode ? toggleSelect(item._id) : setSelected(item)}
            >
              {item.image
                ? <Image source={{ uri: item.image }} style={{ width: '100%', height: 90 }} />
                : <View style={{ width: '100%', height: 90, backgroundColor: C.primarySoft, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 28 }}>📖</Text></View>
              }
              {selectMode && (
                <View style={{ position: 'absolute', top: 6, left: 6 }}>
                  <Ionicons name={isSel ? 'checkbox' : 'square-outline'} size={20} color={isSel ? C.primary : '#fff'} />
                </View>
              )}
              <View style={{ padding: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 2 }}>{item.word}</Text>
                {!!telugu && <Text style={{ fontSize: 12, color: C.primary, fontWeight: '600', marginBottom: 2 }}>{telugu}</Text>}
                <Text style={{ fontSize: 11, color: C.muted, lineHeight: 15 }} numberOfLines={2}>{item.meaning}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* FAB */}
      {!selectMode && (
        <TouchableOpacity
          style={{ position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center', elevation: 8 }}
          onPress={() => { setModal(true); setError(''); setNewWord(''); }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Word Detail Modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' }}>
            <ScrollView style={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              {selected && (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 32, fontWeight: '900', color: C.text, flex: 1 }}>{selected.word}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' }} onPress={() => speak(selected.word)}>
                        <Ionicons name="volume-medium" size={18} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#ef444420', justifyContent: 'center', alignItems: 'center' }} onPress={() => { setConfirmDeleteId(selected._id); }}>
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                      <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.card2, justifyContent: 'center', alignItems: 'center' }} onPress={() => setSelected(null)}>
                        <Ionicons name="close" size={20} color={C.muted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {selected.image && <Image source={{ uri: selected.image }} style={{ width: '100%', height: 160, borderRadius: 16, marginBottom: 16 }} resizeMode="cover" />}
                  <Text style={{ fontSize: 14, color: C.text, lineHeight: 22, backgroundColor: C.card, padding: 14, borderRadius: 14, borderLeftWidth: 4, borderLeftColor: C.primary, marginBottom: 16 }}>{selected.meaning}</Text>
                  {selected.translations && Object.keys(selected.translations).length > 0 && (
                    <>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Translations</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                        {Object.entries(selected.translations).map(([lang, val]) => (
                          <View key={lang} style={{ minWidth: '47%', flex: 1, backgroundColor: C.card, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: C.border }}>
                            <Text style={{ fontSize: 9, fontWeight: '800', color: C.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{lang}</Text>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, textAlign: 'center' }}>{val}</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  )}
                  {selected.examples && Object.values(selected.examples).some(Boolean) && (
                    <>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Example Sentences</Text>
                      {(['past', 'present', 'future'] as const).map(tense =>
                        selected.examples?.[tense] ? (
                          <View key={tense} style={{ backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border }}>
                            <Text style={{ fontSize: 9, fontWeight: '800', color: C.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{tense}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                              <Text style={{ fontSize: 13, color: C.text, lineHeight: 20, flex: 1 }}>{selected.examples[tense]}</Text>
                              <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.primarySoft, justifyContent: 'center', alignItems: 'center' }} onPress={() => speak(selected.examples![tense]!)}>
                                <Ionicons name="volume-medium" size={14} color={C.primary} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : null
                      )}
                    </>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Word Modal */}
      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: C.text }}>Add New Word</Text>
            <Text style={{ fontSize: 13, color: C.muted, marginTop: -8 }}>AI will generate meaning & translations</Text>
            {!!error && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ef444420', borderRadius: 12, padding: 12 }}><Ionicons name="alert-circle" size={16} color="#ef4444" /><Text style={{ fontSize: 13, color: '#ef4444', flex: 1 }}>{error}</Text></View>}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.inputBg, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, height: 48 }}>
              <Ionicons name="text-outline" size={16} color={C.muted} style={{ marginRight: 8 }} />
              <TextInput style={{ flex: 1, fontSize: 14, color: C.text }} placeholder="Enter a word (e.g. serendipity)" placeholderTextColor={C.muted} value={newWord} onChangeText={setNewWord} autoCapitalize="none" autoFocus />
            </View>
            <TouchableOpacity style={[{ height: 52, backgroundColor: C.primary, borderRadius: 16, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 }, saving && { opacity: 0.6 }]} onPress={handleAdd} disabled={saving}>
              {saving && <ActivityIndicator color="#fff" size="small" />}
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>{saving ? 'Generating…' : 'Generate & Save'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModal(false)} style={{ alignItems: 'center' }}>
              <Text style={{ color: C.muted, fontSize: 13 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add to Playlist Modal */}
      <Modal visible={plModal} transparent animationType="slide" onRequestClose={() => setPlModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '60%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.primarySoft, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="musical-notes" size={18} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '900', color: C.text }}>Add to Playlist</Text>
                <Text style={{ fontSize: 11, color: C.muted }}>{selectedIds.size} word{selectedIds.size > 1 ? 's' : ''} will be added</Text>
              </View>
              <TouchableOpacity onPress={() => setPlModal(false)} style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: C.card2, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="close" size={18} color={C.muted} />
              </TouchableOpacity>
            </View>
            {playlists.length === 0 ? (
              <Text style={{ fontSize: 13, color: C.muted, textAlign: 'center', padding: 20 }}>No playlists yet. Create one first.</Text>
            ) : (
              <ScrollView>
                {playlists.map(pl => (
                  <TouchableOpacity
                    key={pl._id}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginBottom: 8, opacity: addingToPl ? 0.6 : 1 }}
                    onPress={() => handleAddToPlaylist(pl._id)}
                    disabled={addingToPl}
                  >
                    <Ionicons name="musical-notes" size={16} color={C.primary} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: C.text }}>{pl.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity onPress={() => setPlModal(false)} style={{ alignItems: 'center', paddingTop: 8 }}>
              <Text style={{ color: C.muted, fontSize: 13 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={!!confirmDeleteId}
        title="Delete this word?"
        message={`"${words.find(w => w._id === confirmDeleteId)?.word ?? ''}" will be permanently removed.`}
        onConfirm={handleDeleteWord}
        onCancel={() => setConfirmDeleteId(null)}
        loading={deleting}
      />

      <ConfirmModal
        visible={confirmBulk}
        title={`Delete ${selectedIds.size} word${selectedIds.size > 1 ? 's' : ''}?`}
        message="These words will be permanently removed from your vocabulary vault."
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmBulk(false)}
        loading={bulkDeleting}
      />
    </SafeAreaView>
  );
}
