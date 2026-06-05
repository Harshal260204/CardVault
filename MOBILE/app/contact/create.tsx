import { ContactForm, type ContactFormValues } from '@/components/contact-form';
import { api } from '@/lib/api';
import { createContact, fetchSessions, getApiErrorMessage } from '@/lib/api-client';
import { COLORS } from '@/lib/constants';
import type { CaptureMode } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';

export default function CreateContactScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ sessionId?: string; mode?: CaptureMode }>();
  const sessionsQuery = useQuery({
    queryKey: ['sessions', 'mine', 'active'],
    queryFn: () => fetchSessions(api, { limit: 100, mine: true, status: 'active' }),
  });

  type ContactPayload = Parameters<typeof createContact>[1];
  const createMutation = useMutation({
    mutationFn: (payload: ContactPayload) => createContact(api, payload),
    onSuccess: async (contact) => {
      await queryClient.invalidateQueries({ queryKey: ['contacts'] });
      router.replace({ pathname: '/contact/[id]', params: { id: contact.id } });
    },
    onError: (error) => Alert.alert('Unable to create contact', getApiErrorMessage(error)),
  });

  const initialValues: ContactFormValues = {
    fullName: '',
    company: '',
    title: '',
    emailsText: '',
    phonesText: '',
    website: '',
    linkedinUrl: '',
    leadNote: '',
    followUpDate: '',
    notes: '',
    captureMode: params.mode ?? 'legacy',
    eventSessionId: params.sessionId,
    leadQualifier: undefined,
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create contact</Text>
      <Text style={styles.subtitle}>Add a contact manually and optionally attach it to an event.</Text>
      <ContactForm
        initialValues={initialValues}
        sessions={sessionsQuery.data?.items ?? []}
        isSubmitting={createMutation.isPending}
        submitLabel="Create contact"
        onSubmit={(payload) => {
          if (!payload.fullName.trim()) {
            Alert.alert('Full name required', 'Please enter a name before saving.');
            return;
          }
          createMutation.mutate(payload);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  subtitle: { color: COLORS.muted, marginTop: 6, marginBottom: 20, lineHeight: 20 },
});
