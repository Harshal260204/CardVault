import { api } from '@/lib/api';
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  getApiErrorMessage,
  markNotificationRead,
} from '@/lib/api-client';
import { COLORS } from '@/lib/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function NotificationsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const notifications = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchNotifications(api, { limit: 50 }),
    refetchInterval: 30000,
  });
  const unread = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => fetchUnreadNotificationCount(api),
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead(api, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.count}>{unread.data ?? 0} unread</Text>
      </View>

      {notifications.isLoading ? (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 24 }} />
      ) : notifications.isError ? (
        <Text style={styles.error}>{getApiErrorMessage(notifications.error)}</Text>
      ) : notifications.data?.items.length ? (
        notifications.data.items.map((item) => (
          <Pressable
            key={item.id}
            style={[styles.card, !item.isRead && styles.cardUnread]}
            onPress={() => !item.isRead && markRead.mutate(item.id)}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardBody}>{item.body}</Text>
            <Text style={styles.cardMeta}>{new Date(item.createdAt).toLocaleString()}</Text>
          </Pressable>
        ))
      ) : (
        <Text style={styles.empty}>No notifications yet.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  header: { marginBottom: 16 },
  back: { color: COLORS.accent, marginBottom: 8, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  count: { marginTop: 4, color: COLORS.muted },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardUnread: {
    borderColor: COLORS.accent,
    backgroundColor: '#EFF6FF',
  },
  cardTitle: { fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  cardBody: { color: COLORS.text, lineHeight: 20 },
  cardMeta: { marginTop: 8, fontSize: 12, color: COLORS.muted },
  empty: { color: COLORS.muted, textAlign: 'center', marginTop: 24 },
  error: { color: '#DC2626', marginTop: 24 },
});
