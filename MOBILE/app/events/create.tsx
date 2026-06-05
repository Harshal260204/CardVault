import { api } from '@/lib/api';
import { createSession, getApiErrorMessage } from '@/lib/api-client';
import { COLORS } from '@/lib/constants';
import { formatCaptureMode } from '@/lib/format';
import type { CaptureMode } from '@/lib/types';
import { useSessionStore } from '@/stores/session-store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const MODES: CaptureMode[] = ['visitor', 'exhibitor', 'quick_capture'];

export default function CreateEventScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ initialMode?: string }>();
  const queryClient = useQueryClient();
  const setActiveSession = useSessionStore((s) => s.setActiveSession);
  const [name, setName] = useState('');
  
  const getInitialMode = (): CaptureMode => {
    const init = params.initialMode;
    if (init === 'exhibitor' || init === 'visitor' || init === 'quick_capture') {
      return init;
    }
    return 'visitor';
  };

  const [mode, setMode] = useState<CaptureMode>(getInitialMode);
  const [eventType, setEventType] = useState('');
  const [location, setLocation] = useState('');

  const createEvent = useMutation({
    mutationFn: () =>
      createSession(api, {
        name: name.trim(),
        mode,
        eventType: eventType.trim() || undefined,
        location: location.trim() || undefined,
      }),
    onSuccess: async (session) => {
      setActiveSession(session.id, session.mode);
      await queryClient.invalidateQueries({ queryKey: ['sessions'] });
      router.replace({ pathname: '/events/[id]', params: { id: session.id } });
    },
    onError: (error) => {
      Alert.alert('Unable to create event', getApiErrorMessage(error));
    },
  });

  const submit = () => {
    if (!name.trim()) {
      Alert.alert('Event name required', 'Please enter an event name before continuing.');
      return;
    }
    createEvent.mutate();
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create event</Text>
      <Text style={styles.subtitle}>
        {params.initialMode 
          ? `Set up details for your new ${formatCaptureMode(params.initialMode as CaptureMode)} session.` 
          : 'Pick the category first so every scan is stored under the right bucket.'}
      </Text>

      <Text style={styles.label}>Event name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="AWS Meetup"
        placeholderTextColor={COLORS.muted}
        style={styles.input}
      />

      {!params.initialMode && (
        <>
          <Text style={styles.label}>Category</Text>
          <View style={styles.modeRow}>
            {MODES.map((value) => {
              const selected = value === mode;
              return (
                <Pressable key={value} style={[styles.modeChip, selected && styles.modeChipActive]} onPress={() => setMode(value)}>
                  <Text style={[styles.modeChipText, selected && styles.modeChipTextActive]}>{formatCaptureMode(value)}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      <Text style={styles.label}>Event type (optional)</Text>
      <TextInput
        value={eventType}
        onChangeText={setEventType}
        placeholder="Meetup, Expo, Conference"
        placeholderTextColor={COLORS.muted}
        style={styles.input}
      />

      <Text style={styles.label}>Location (optional)</Text>
      <TextInput
        value={location}
        onChangeText={setLocation}
        placeholder="Mumbai"
        placeholderTextColor={COLORS.muted}
        style={styles.input}
      />

      <Pressable style={styles.primary} onPress={submit} disabled={createEvent.isPending}>
        <Text style={styles.primaryText}>{createEvent.isPending ? 'Creating...' : 'Create event'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  subtitle: { color: COLORS.muted, marginTop: 6, marginBottom: 20, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    marginBottom: 16,
  },
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  modeChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  modeChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  modeChipText: { color: COLORS.text, fontSize: 13 },
  modeChipTextActive: { color: '#fff' },
  primary: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  primaryText: { color: '#fff', fontWeight: '600', textAlign: 'center', fontSize: 16 },
});
