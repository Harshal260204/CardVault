import { ContactForm, type ContactFormValues } from '@/components/contact-form';
import { api } from '@/lib/api';
import { fetchContact, fetchSessions, getApiErrorMessage, updateContact } from '@/lib/api-client';
import { COLORS } from '@/lib/constants';
import type { CaptureMode } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function EditContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const contactQuery = useQuery({
    queryKey: ['contact', id],
    queryFn: () => fetchContact(api, id!),
    enabled: !!id,
  });
  const sessionsQuery = useQuery({
    queryKey: ['sessions', 'mine', 'active'],
    queryFn: () => fetchSessions(api, { limit: 100, mine: true, status: 'active' }),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateContact>[2]) => updateContact(api, id!, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['contacts'] }),
        queryClient.invalidateQueries({ queryKey: ['contact', id] }),
      ]);
      router.replace({ pathname: '/contact/[id]', params: { id: id! } });
    },
    onError: (error) => Alert.alert('Unable to update contact', getApiErrorMessage(error)),
  });

  if (contactQuery.isLoading || !contactQuery.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>{contactQuery.isLoading ? 'Loading contact...' : 'Unable to load contact.'}</Text>
      </View>
    );
  }

  const contact = contactQuery.data;
  const initialValues: ContactFormValues = {
    fullName: contact.fullName,
    company: contact.company ?? '',
    title: contact.title ?? '',
    emailsText: contact.emails.join(', '),
    phonesText: contact.phones.join(', '),
    website: contact.website ?? '',
    linkedinUrl: contact.linkedinUrl ?? '',
    leadNote: contact.leadNote ?? '',
    followUpDate: contact.followUpDate ?? '',
    notes: contact.notes ?? '',
    captureMode: (contact.captureMode ?? 'legacy') as CaptureMode,
    eventSessionId: contact.eventSessionId ?? undefined,
    leadQualifier: contact.leadQualifier ?? undefined,
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Edit contact</Text>
      <Text style={styles.subtitle}>Update lead details, category, and event assignment.</Text>
      <ContactForm
        initialValues={initialValues}
        sessions={sessionsQuery.data?.items ?? []}
        isSubmitting={updateMutation.isPending}
        submitLabel="Save contact"
        onSubmit={(payload) => {
          if (!payload.fullName.trim()) {
            Alert.alert('Full name required', 'Please enter a name before saving.');
            return;
          }
          updateMutation.mutate(payload);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: 20 },
  loadingText: { color: COLORS.muted },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  subtitle: { color: COLORS.muted, marginTop: 6, marginBottom: 20, lineHeight: 20 },
});
