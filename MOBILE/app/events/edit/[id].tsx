import { api } from '@/lib/api';
import { closeSession, deleteSession, fetchSession, getApiErrorMessage, updateSession } from '@/lib/api-client';
import { COLORS } from '@/lib/constants';
import { formatCaptureMode } from '@/lib/format';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({
    queryKey: ['session', id],
    queryFn: () => fetchSession(api, id!),
    enabled: !!id,
  });

  const [name, setName] = useState('');
  const [eventType, setEventType] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!sessionQuery.data) return;
    setName(sessionQuery.data.name ?? '');
    setEventType(sessionQuery.data.eventType ?? '');
    setLocation(sessionQuery.data.location ?? '');
    setStartDate(sessionQuery.data.startDate ?? '');
    setEndDate(sessionQuery.data.endDate ?? '');
  }, [sessionQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateSession(api, id!, {
        name: name.trim(),
        eventType: eventType.trim() || undefined,
        location: location.trim() || undefined,
        startDate: startDate.trim() || undefined,
        endDate: endDate.trim() || undefined,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sessions'] }),
        queryClient.invalidateQueries({ queryKey: ['session', id] }),
      ]);
      router.replace({ pathname: '/events/[id]', params: { id: id! } });
    },
    onError: (error) => Alert.alert('Unable to update event', getApiErrorMessage(error)),
  });

  const closeMutation = useMutation({
    mutationFn: () => closeSession(api, id!),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sessions'] }),
        queryClient.invalidateQueries({ queryKey: ['session', id] }),
      ]);
      router.replace({ pathname: '/events/[id]', params: { id: id! } });
    },
    onError: (error) => Alert.alert('Unable to close event', getApiErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSession(api, id!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sessions'] });
      router.replace('/(tabs)/events');
    },
    onError: (error) => Alert.alert('Unable to delete event', getApiErrorMessage(error)),
  });

  if (sessionQuery.isLoading || !sessionQuery.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>{sessionQuery.isLoading ? 'Loading event...' : 'Unable to load event.'}</Text>
      </View>
    );
  }

  const session = sessionQuery.data;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Edit event</Text>
      <Text style={styles.subtitle}>Category is fixed after creation: {formatCaptureMode(session.mode)}</Text>

      <Text style={styles.label}>Event name</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Event name" placeholderTextColor={COLORS.muted} />

      <Text style={styles.label}>Event type</Text>
      <TextInput value={eventType} onChangeText={setEventType} style={styles.input} placeholder="Meetup, Expo, Conference" placeholderTextColor={COLORS.muted} />

      <Text style={styles.label}>Location</Text>
      <TextInput value={location} onChangeText={setLocation} style={styles.input} placeholder="Location" placeholderTextColor={COLORS.muted} />

      <Text style={styles.label}>Start date</Text>
      <TextInput value={startDate} onChangeText={setStartDate} style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.muted} />

      <Text style={styles.label}>End date</Text>
      <TextInput value={endDate} onChangeText={setEndDate} style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.muted} />

      <Pressable
        style={[styles.primaryButton, saveMutation.isPending && styles.disabledButton]}
        onPress={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
      >
        <Text style={styles.primaryButtonText}>{saveMutation.isPending ? 'Saving...' : 'Save changes'}</Text>
      </Pressable>

      {session.status !== 'closed' ? (
        <Pressable
          style={[styles.secondaryButton, closeMutation.isPending && styles.disabledButton]}
          onPress={() =>
            Alert.alert('Close event', 'You will no longer be able to scan into this event.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Close event', onPress: () => closeMutation.mutate() },
            ])
          }
          disabled={closeMutation.isPending}
        >
          <Text style={styles.secondaryButtonText}>{closeMutation.isPending ? 'Closing...' : 'Close event'}</Text>
        </Pressable>
      ) : null}

      <Pressable
        style={[styles.dangerButton, deleteMutation.isPending && styles.disabledButton]}
        onPress={() =>
          Alert.alert('Delete event', 'This hides the event from the app. Existing records stay in the database.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete event', style: 'destructive', onPress: () => deleteMutation.mutate() },
          ])
        }
        disabled={deleteMutation.isPending}
      >
        <Text style={styles.dangerButtonText}>{deleteMutation.isPending ? 'Deleting...' : 'Delete event'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: 20 },
  loadingText: { color: COLORS.muted },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  subtitle: { color: COLORS.muted, marginTop: 6, marginBottom: 20, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 4 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', textAlign: 'center', fontSize: 16 },
  secondaryButton: {
    backgroundColor: '#fff',
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  secondaryButtonText: { color: COLORS.text, fontWeight: '600', textAlign: 'center', fontSize: 16 },
  dangerButton: {
    backgroundColor: '#fff5f5',
    borderColor: COLORS.error,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  dangerButtonText: { color: COLORS.error, fontWeight: '600', textAlign: 'center', fontSize: 16 },
  disabledButton: { opacity: 0.7 },
});
