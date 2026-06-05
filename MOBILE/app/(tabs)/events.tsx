import { api } from '@/lib/api';
import { fetchSessions, getApiErrorMessage } from '@/lib/api-client';
import { COLORS } from '@/lib/constants';
import { formatCaptureMode } from '@/lib/format';
import type { EventSessionRecord } from '@/lib/types';
import { useSessionStore } from '@/stores/session-store';
import { useQuery } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function EventsScreen() {
  const router = useRouter();
  const setActiveSession = useSessionStore((s) => s.setActiveSession);
  const sessions = useQuery({
    queryKey: ['sessions', 'mine', 'all'],
    queryFn: () => fetchSessions(api, { limit: 100, mine: true }),
  });

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>My events</Text>
      <Text style={styles.subtitle}>Events you created or joined, with contacts organized by category.</Text>

      <Pressable style={styles.createButton} onPress={() => router.push('/events/create')}>
        <Text style={styles.createButtonText}>Create event</Text>
      </Pressable>

      {sessions.isLoading ? (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 32 }} />
      ) : sessions.isError ? (
        <Text style={styles.errorText}>{getApiErrorMessage(sessions.error)}</Text>
      ) : sessions.data?.items.length ? (
        <View style={styles.list}>
          {sessions.data.items.map((session: EventSessionRecord) => (
            <View key={session.id} style={styles.card}>
              <Link href={{ pathname: '/events/[id]', params: { id: session.id } }} asChild>
                <Pressable>
                  <Text style={styles.cardTitle}>{session.name}</Text>
                  <Text style={styles.cardMeta}>
                    {formatCaptureMode(session.mode)} · {session.status} · {session.scanCount} scans
                  </Text>
                  {session.location ? <Text style={styles.cardHint}>{session.location}</Text> : null}
                </Pressable>
              </Link>
              <Pressable
                style={styles.scanButton}
                onPress={() => {
                  setActiveSession(session.id, session.mode);
                  router.push('/(tabs)/scan');
                }}
              >
                <Text style={styles.scanButtonText}>Scan in this event</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>No events yet. Create your first event to start capturing leads.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  subtitle: { color: COLORS.muted, marginTop: 6, marginBottom: 16, lineHeight: 20 },
  createButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  createButtonText: { color: '#fff', fontWeight: '600', textAlign: 'center', fontSize: 16 },
  list: { gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  cardMeta: { color: COLORS.muted, marginTop: 4 },
  cardHint: { color: COLORS.muted, marginTop: 6, fontSize: 13 },
  scanButton: {
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 10,
  },
  scanButtonText: { color: COLORS.accent, fontWeight: '600', textAlign: 'center' },
  emptyText: { color: COLORS.muted, marginTop: 16 },
  errorText: { color: '#DC2626', marginTop: 16 },
});
