import { api } from '@/lib/api';
import { fetchSessions, getApiErrorMessage, submitOcrJob } from '@/lib/api-client';
import { captureLog } from '@/lib/capture-logger';
import { COLORS } from '@/lib/constants';
import { formatCaptureMode } from '@/lib/format';
import { randomUuid } from '@/lib/uuid';
import type { EventSessionRecord } from '@/lib/types';
import { useSessionStore } from '@/stores/session-store';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Link, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function ScanScreen() {
  const router = useRouter();
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const activeMode = useSessionStore((s) => s.activeMode);
  const activeEncounterType = useSessionStore((s) => s.activeEncounterType);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);
  const [sessionId, setSessionId] = useState<string | undefined>(activeSessionId);
  const [uploading, setUploading] = useState(false);

  const sessions = useQuery({
    queryKey: ['sessions', 'mine', 'active'],
    queryFn: () => fetchSessions(api, { limit: 50, status: 'active', mine: true }),
  });

  useEffect(() => {
    if (activeSessionId) {
      setSessionId(activeSessionId);
    }
  }, [activeSessionId]);

  const availableSessions = sessions.data?.items ?? [];
  const selectedSession = useMemo(
    () => availableSessions.find((session) => session.id === sessionId),
    [availableSessions, sessionId],
  );

  const isQuickCapture = activeMode === 'quick_capture' && !selectedSession;
  const isScanAllowed = !!selectedSession || isQuickCapture;

  const pickAndUpload = async (useCamera: boolean) => {
    if (!isScanAllowed) {
      Alert.alert(
        'Select capture mode',
        'Choose an active event, or start Quick Capture from the Home screen.',
      );
      return;
    }

    const source = useCamera ? 'camera' : 'gallery';
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      captureLog.permissionDenied(source);
      Alert.alert('Permission needed', 'Allow camera or photo access to scan cards.');
      return;
    }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.85 });
    if (result.canceled || !result.assets[0]) {
      captureLog.pickCancelled(source);
      return;
    }

    const asset = result.assets[0];
    captureLog.pickSelected(source, asset);

    const idempotencyKey = randomUuid();
    setUploading(true);
    try {
      const targetMode = selectedSession?.mode ?? activeMode;
      const job = await submitOcrJob(
        api,
        {
          uri: asset.uri,
          name: asset.fileName ?? 'card.jpg',
          type: asset.mimeType ?? 'image/jpeg',
        },
        {
          captureMode: targetMode,
          sessionId: selectedSession?.id,
          clientIdempotencyKey: idempotencyKey,
        },
      );
      router.push({ pathname: '/ocr-review', params: { jobId: job.id } });
    } catch (e) {
      Alert.alert('Upload failed', getApiErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Scan business card</Text>
      <Text style={styles.subtitle}>
        Scan into an active event, or use Quick Capture for standalone contacts.
      </Text>

      {isQuickCapture ? (
        <View style={styles.quickBanner}>
          <Text style={styles.quickBannerTitle}>Quick Capture</Text>
          <Text style={styles.quickBannerText}>
            {activeEncounterType
              ? `Encounter: ${activeEncounterType}`
              : 'No event linked — saves directly to your contact list.'}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Link href="/events/create" asChild>
          <Pressable style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>Create event</Text>
          </Pressable>
        </Link>
        <Pressable
          style={styles.secondaryAction}
          onPress={() => router.push('/encounter-select')}
        >
          <Text style={styles.secondaryActionText}>Quick capture</Text>
        </Pressable>
      </View>

      {!isQuickCapture ? (
        <>
          <Text style={styles.label}>Choose an active event</Text>
          {sessions.isLoading ? (
            <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 20 }} />
          ) : sessions.isError ? (
            <Text style={styles.errorText}>{getApiErrorMessage(sessions.error)}</Text>
          ) : availableSessions.length ? (
            <View style={styles.sessionList}>
              {availableSessions.map((s: EventSessionRecord) => {
                const selected = sessionId === s.id;
                return (
                  <Pressable
                    key={s.id}
                    style={[styles.sessionCard, selected && styles.sessionCardActive]}
                    onPress={() => {
                      setSessionId(s.id);
                      setActiveSession(s.id, s.mode);
                    }}
                  >
                    <Text style={[styles.sessionTitle, selected && styles.sessionTitleActive]}>{s.name}</Text>
                    <Text style={[styles.sessionMeta, selected && styles.sessionMetaActive]}>
                      {formatCaptureMode(s.mode)} · {s.scanCount} scans
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyText}>You don&apos;t have any active events yet.</Text>
          )}
        </>
      ) : null}

      {uploading ? (
        <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 32 }} />
      ) : (
        <>
          <Pressable
            style={[styles.primary, !isScanAllowed && styles.disabled]}
            onPress={() => pickAndUpload(true)}
            disabled={!isScanAllowed}
          >
            <Text style={styles.primaryText}>Take photo</Text>
          </Pressable>
          <Pressable
            style={[styles.secondary, !isScanAllowed && styles.disabled]}
            onPress={() => pickAndUpload(false)}
            disabled={!isScanAllowed}
          >
            <Text style={styles.secondaryText}>Choose from gallery</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  subtitle: { color: COLORS.muted, marginTop: 6, marginBottom: 16, lineHeight: 20 },
  quickBanner: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  quickBannerTitle: { fontWeight: '700', color: '#16A34A', marginBottom: 4 },
  quickBannerText: { color: '#15803D', fontSize: 13 },
  actions: { gap: 10, marginBottom: 20 },
  primaryAction: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 14,
  },
  primaryActionText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
  secondaryAction: {
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#fff',
  },
  secondaryActionText: { color: COLORS.accent, fontWeight: '600', textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  sessionList: { gap: 10, marginBottom: 20 },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sessionCardActive: {
    borderColor: COLORS.accent,
    backgroundColor: '#EFF6FF',
  },
  sessionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  sessionTitleActive: { color: COLORS.accent },
  sessionMeta: { marginTop: 4, color: COLORS.muted, fontSize: 13 },
  sessionMetaActive: { color: COLORS.accent },
  primary: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  primaryText: { color: '#fff', fontWeight: '600', textAlign: 'center', fontSize: 16 },
  secondary: {
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
  },
  secondaryText: { color: COLORS.accent, fontWeight: '600', textAlign: 'center', fontSize: 16 },
  disabled: { opacity: 0.5 },
  emptyText: { color: COLORS.muted, marginBottom: 20 },
  errorText: { color: '#DC2626', marginBottom: 20 },
});
