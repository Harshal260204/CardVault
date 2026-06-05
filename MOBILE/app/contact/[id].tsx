import { api } from '@/lib/api';
import { deleteContact, fetchContact, getApiErrorMessage } from '@/lib/api-client';
import { COLORS } from '@/lib/constants';
import { formatLeadLabel, leadColor } from '@/lib/format';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => fetchContact(api, id!),
    enabled: !!id,
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteContact(api, id!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contacts'] });
      router.replace('/(tabs)/contacts');
    },
    onError: (error) => Alert.alert('Unable to delete contact', getApiErrorMessage(error)),
  });

  if (isLoading || !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.name}>{data.fullName}</Text>
      {data.title ? <Text style={styles.meta}>{data.title}</Text> : null}
      {data.company ? <Text style={styles.meta}>{data.company}</Text> : null}
      <View style={[styles.badge, { backgroundColor: leadColor(data.leadQualifier) }]}>
        <Text style={styles.badgeText}>{formatLeadLabel(data.leadQualifier)}</Text>
      </View>
      <View style={styles.actionRow}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push({ pathname: '/contact/edit/[id]', params: { id: data.id } })}
        >
          <Text style={styles.secondaryButtonText}>Edit contact</Text>
        </Pressable>
        <Pressable
          style={styles.dangerButton}
          onPress={() =>
            Alert.alert('Delete contact', 'This contact will be removed from the mobile app.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
            ])
          }
        >
          <Text style={styles.dangerButtonText}>{deleteMutation.isPending ? 'Deleting...' : 'Delete'}</Text>
        </Pressable>
      </View>
      {data.emails.map((e: string) => (
        <Text key={e} style={styles.line}>
          {e}
        </Text>
      ))}
      {data.phones.map((p: string) => (
        <Text key={p} style={styles.line}>
          {p}
        </Text>
      ))}
      {data.website ? <Text style={styles.line}>{data.website}</Text> : null}
      {data.linkedinUrl ? <Text style={styles.line}>{data.linkedinUrl}</Text> : null}
      {data.followUpDate ? <Text style={styles.line}>Follow-up: {data.followUpDate}</Text> : null}
      {data.leadNote ? <Text style={styles.notes}>{data.leadNote}</Text> : null}
      {data.notes ? <Text style={styles.notes}>{data.notes}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  meta: { fontSize: 15, color: COLORS.muted, marginTop: 4 },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginVertical: 16,
  },
  badgeText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  secondaryButtonText: { color: COLORS.text, fontWeight: '600', textAlign: 'center' },
  dangerButton: {
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 12,
    justifyContent: 'center',
    backgroundColor: '#fff5f5',
  },
  dangerButtonText: { color: COLORS.error, fontWeight: '600', textAlign: 'center' },
  line: { fontSize: 16, color: COLORS.text, marginBottom: 8 },
  notes: { fontSize: 15, color: COLORS.text, marginTop: 8, lineHeight: 22 },
});
