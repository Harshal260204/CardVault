import { api } from '@/lib/api';
import {
  fetchContacts,
  fetchSession,
  fetchSessionMembers,
  fetchSessionStats,
  getApiErrorMessage,
  joinSession,
} from '@/lib/api-client';
import { COLORS } from '@/lib/constants';
import { formatCaptureMode, formatLeadLabel, leadColor } from '@/lib/format';
import type { CaptureMode, ContactRecord } from '@/lib/types';
import SessionMemberAvatars from '@/components/SessionMemberAvatars';
import { useSessionStore } from '@/stores/session-store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const GROUP_ORDER: CaptureMode[] = ['visitor', 'exhibitor', 'quick_capture'];

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const setActiveSession = useSessionStore((s) => s.setActiveSession);
  const sessionQuery = useQuery({
    queryKey: ['session', id],
    queryFn: () => fetchSession(api, id!),
    enabled: !!id,
  });
  const statsQuery = useQuery({
    queryKey: ['session-stats', id],
    queryFn: () => fetchSessionStats(api, id!),
    enabled: !!id,
    refetchInterval: 15000,
  });
  const membersQuery = useQuery({
    queryKey: ['session-members', id],
    queryFn: () => fetchSessionMembers(api, id!),
    enabled: !!id,
  });
  const contactsQuery = useQuery({
    queryKey: ['contacts', 'session', id],
    queryFn: () => fetchContacts(api, { sessionId: id!, limit: 100 }),
    enabled: !!id,
  });

  const joinMutation = useMutation({
    mutationFn: () => joinSession(api, id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session-members', id] });
      Alert.alert('Joined', 'You joined this event session.');
    },
    onError: (e) => Alert.alert('Could not join', getApiErrorMessage(e)),
  });

  if (sessionQuery.isLoading || contactsQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  if (sessionQuery.isError || contactsQuery.isError || !sessionQuery.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {sessionQuery.isError
            ? getApiErrorMessage(sessionQuery.error)
            : contactsQuery.isError
              ? getApiErrorMessage(contactsQuery.error)
              : 'Unable to load event.'}
        </Text>
      </View>
    );
  }

  const contacts = contactsQuery.data?.items ?? [];
  const grouped = GROUP_ORDER.map((mode) => ({
    mode,
    items: contacts.filter((contact) => contact.captureMode === mode),
  }));
  const session = sessionQuery.data;
  const stats = statsQuery.data ?? session;
  const members = membersQuery.data ?? [];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{session.name}</Text>
      <Text style={styles.subtitle}>
        {formatCaptureMode(session.mode)} · {session.status}
        {session.location ? ` · ${session.location}` : ''}
      </Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Live session stats</Text>
        <Text style={styles.summaryValue}>{stats.scanCount} scans</Text>
        <Text style={styles.summaryMeta}>
          Hot {stats.hotCount} · Warm {stats.warmCount} · Cold {stats.coldCount}
        </Text>
      </View>

      <View style={styles.teamCard}>
        <View style={styles.teamHeader}>
          <Text style={styles.teamTitle}>Team ({members.length})</Text>
          <SessionMemberAvatars sessionId={session.id} />
        </View>
        {members.map((member) => (
          <Text key={member.userId} style={styles.teamMember}>
            {member.fullName ?? member.email}
          </Text>
        ))}
        <Pressable
          style={styles.joinBtn}
          onPress={() => joinMutation.mutate()}
          disabled={joinMutation.isPending}
        >
          <Text style={styles.joinBtnText}>
            {joinMutation.isPending ? 'Joining…' : 'Join session'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          style={styles.secondary}
          onPress={() => router.push({ pathname: '/events/edit/[id]', params: { id: session.id } })}
        >
          <Text style={styles.secondaryText}>Edit event</Text>
        </Pressable>
        <Pressable
          style={styles.secondary}
          onPress={() =>
            router.push({
              pathname: '/contact/create',
              params: { sessionId: session.id, mode: session.mode },
            })
          }
        >
          <Text style={styles.secondaryText}>Add contact</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.primary}
        onPress={() => {
          setActiveSession(session.id, session.mode);
          router.push('/(tabs)/scan');
        }}
      >
        <Text style={styles.primaryText}>Scan in this event</Text>
      </Pressable>

      {grouped.map((group) => (
        <View key={group.mode} style={styles.groupSection}>
          <Text style={styles.groupTitle}>
            {formatCaptureMode(group.mode)} ({group.items.length})
          </Text>
          {group.items.length ? (
            group.items.map((contact) => <ContactCard key={contact.id} contact={contact} />)
          ) : (
            <Text style={styles.emptyText}>No contacts in this category yet.</Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function ContactCard({ contact }: { contact: ContactRecord }) {
  const router = useRouter();
  return (
    <Pressable
      style={styles.contactCard}
      onPress={() => router.push({ pathname: '/contact/[id]', params: { id: contact.id } })}
    >
      <View style={styles.contactHeader}>
        <Text style={styles.contactName}>{contact.fullName}</Text>
        <View style={[styles.badge, { backgroundColor: leadColor(contact.leadQualifier) }]}>
          <Text style={styles.badgeText}>{formatLeadLabel(contact.leadQualifier)}</Text>
        </View>
      </View>
      <Text style={styles.contactMeta}>
        {contact.company || 'No company'} · {formatCaptureMode(contact.captureMode)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  subtitle: { color: COLORS.muted, marginTop: 6, marginBottom: 16, lineHeight: 20 },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  summaryLabel: { fontSize: 12, color: COLORS.muted, marginBottom: 4 },
  summaryValue: { fontSize: 28, fontWeight: '700', color: COLORS.text },
  summaryMeta: { marginTop: 6, color: COLORS.muted, fontSize: 13 },
  teamCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  teamHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  teamTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  teamMember: { fontSize: 13, color: COLORS.muted, marginBottom: 4 },
  joinBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  joinBtnText: { color: COLORS.accent, fontWeight: '600' },
  primary: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  primaryText: { color: '#fff', fontWeight: '600', textAlign: 'center', fontSize: 16 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  secondary: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
  },
  secondaryText: { color: COLORS.text, fontWeight: '600', textAlign: 'center' },
  groupSection: { marginBottom: 20 },
  groupTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  emptyText: { color: COLORS.muted },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  contactHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'center' },
  contactName: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.text },
  contactMeta: { marginTop: 6, color: COLORS.muted },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  errorText: { color: '#DC2626', textAlign: 'center' },
});
