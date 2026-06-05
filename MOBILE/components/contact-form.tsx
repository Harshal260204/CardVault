import { COLORS } from '@/lib/constants';
import { formatCaptureMode, formatLeadLabel } from '@/lib/format';
import type { CaptureMode, EventSessionRecord, LeadQualifier } from '@/lib/types';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export interface ContactFormValues {
  fullName: string;
  company: string;
  title: string;
  emailsText: string;
  phonesText: string;
  website: string;
  linkedinUrl: string;
  leadNote: string;
  followUpDate: string;
  notes: string;
  captureMode: CaptureMode;
  eventSessionId?: string;
  leadQualifier?: LeadQualifier;
}

interface ContactFormProps {
  initialValues: ContactFormValues;
  sessions: EventSessionRecord[];
  isSubmitting?: boolean;
  submitLabel: string;
  onSubmit: (payload: {
    fullName: string;
    company?: string;
    title?: string;
    emails?: string[];
    phones?: string[];
    website?: string;
    linkedinUrl?: string;
    leadNote?: string;
    followUpDate?: string;
    notes?: string;
    captureMode?: CaptureMode;
    eventSessionId?: string;
    leadQualifier?: LeadQualifier;
  }) => void;
}

const LEAD_OPTIONS: Array<LeadQualifier | 'unqualified'> = ['unqualified', 'hot', 'warm', 'cold'];
const CAPTURE_OPTIONS: CaptureMode[] = ['visitor', 'exhibitor', 'quick_capture', 'legacy'];

export function ContactForm({
  initialValues,
  sessions,
  isSubmitting,
  submitLabel,
  onSubmit,
}: ContactFormProps) {
  const [fullName, setFullName] = useState(initialValues.fullName);
  const [company, setCompany] = useState(initialValues.company);
  const [title, setTitle] = useState(initialValues.title);
  const [emailsText, setEmailsText] = useState(initialValues.emailsText);
  const [phonesText, setPhonesText] = useState(initialValues.phonesText);
  const [website, setWebsite] = useState(initialValues.website);
  const [linkedinUrl, setLinkedinUrl] = useState(initialValues.linkedinUrl);
  const [leadNote, setLeadNote] = useState(initialValues.leadNote);
  const [followUpDate, setFollowUpDate] = useState(initialValues.followUpDate);
  const [notes, setNotes] = useState(initialValues.notes);
  const [captureMode, setCaptureMode] = useState<CaptureMode>(initialValues.captureMode);
  const [eventSessionId, setEventSessionId] = useState<string | undefined>(initialValues.eventSessionId);
  const [leadQualifier, setLeadQualifier] = useState<LeadQualifier | undefined>(initialValues.leadQualifier);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === eventSessionId),
    [sessions, eventSessionId],
  );

  const submit = () => {
    const normalizedFullName = fullName.trim();
    if (!normalizedFullName) {
      return;
    }

    onSubmit({
      fullName: normalizedFullName,
      company: company.trim() || undefined,
      title: title.trim() || undefined,
      emails: parseList(emailsText),
      phones: parseList(phonesText),
      website: website.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
      leadNote: leadNote.trim() || undefined,
      followUpDate: followUpDate.trim() || undefined,
      notes: notes.trim() || undefined,
      captureMode: selectedSession?.mode ?? captureMode,
      eventSessionId: selectedSession?.id,
      leadQualifier,
    });
  };

  return (
    <View style={styles.form}>
      <Text style={styles.label}>Full name</Text>
      <TextInput
        value={fullName}
        onChangeText={setFullName}
        placeholder="Ashok Badjatiya"
        placeholderTextColor={COLORS.muted}
        style={styles.input}
      />

      <Text style={styles.label}>Company</Text>
      <TextInput
        value={company}
        onChangeText={setCompany}
        placeholder="Company"
        placeholderTextColor={COLORS.muted}
        style={styles.input}
      />

      <Text style={styles.label}>Title</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Managing Director"
        placeholderTextColor={COLORS.muted}
        style={styles.input}
      />

      <Text style={styles.label}>Event</Text>
      <View style={styles.chipRow}>
        <Pressable
          style={[styles.chip, !eventSessionId && styles.chipActive]}
          onPress={() => setEventSessionId(undefined)}
        >
          <Text style={[styles.chipText, !eventSessionId && styles.chipTextActive]}>Standalone</Text>
        </Pressable>
        {sessions.map((session) => {
          const selected = session.id === eventSessionId;
          return (
            <Pressable
              key={session.id}
              style={[styles.chip, selected && styles.chipActive]}
              onPress={() => {
                setEventSessionId(session.id);
                setCaptureMode(session.mode);
              }}
            >
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>{session.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Category</Text>
      {selectedSession ? (
        <View style={styles.readonlyCard}>
          <Text style={styles.readonlyText}>{formatCaptureMode(selectedSession.mode)}</Text>
          <Text style={styles.readonlyHint}>Matched to the selected event</Text>
        </View>
      ) : (
        <View style={styles.chipRow}>
          {CAPTURE_OPTIONS.map((mode) => {
            const selected = mode === captureMode;
            return (
              <Pressable key={mode} style={[styles.chip, selected && styles.chipActive]} onPress={() => setCaptureMode(mode)}>
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>{formatCaptureMode(mode)}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Text style={styles.label}>Lead status</Text>
      <View style={styles.chipRow}>
        {LEAD_OPTIONS.map((option) => {
          const selected = (option === 'unqualified' ? undefined : option) === leadQualifier;
          return (
            <Pressable
              key={option}
              style={[styles.chip, selected && styles.chipActive]}
              onPress={() => setLeadQualifier(option === 'unqualified' ? undefined : option)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                {option === 'unqualified' ? 'Unqualified' : formatLeadLabel(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Emails</Text>
      <TextInput
        value={emailsText}
        onChangeText={setEmailsText}
        placeholder="name@company.com, alt@company.com"
        placeholderTextColor={COLORS.muted}
        style={[styles.input, styles.multiline]}
        multiline
      />

      <Text style={styles.label}>Phones</Text>
      <TextInput
        value={phonesText}
        onChangeText={setPhonesText}
        placeholder="+91 9999999999, +91 8888888888"
        placeholderTextColor={COLORS.muted}
        style={[styles.input, styles.multiline]}
        multiline
      />

      <Text style={styles.label}>Website</Text>
      <TextInput
        value={website}
        onChangeText={setWebsite}
        placeholder="https://company.com"
        placeholderTextColor={COLORS.muted}
        style={styles.input}
      />

      <Text style={styles.label}>LinkedIn</Text>
      <TextInput
        value={linkedinUrl}
        onChangeText={setLinkedinUrl}
        placeholder="https://linkedin.com/in/name"
        placeholderTextColor={COLORS.muted}
        autoCapitalize="none"
        style={styles.input}
      />

      <Text style={styles.label}>Follow-up date</Text>
      <TextInput
        value={followUpDate}
        onChangeText={setFollowUpDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={COLORS.muted}
        style={styles.input}
      />

      <Text style={styles.label}>Lead note</Text>
      <TextInput
        value={leadNote}
        onChangeText={setLeadNote}
        placeholder="Follow-up context or next step"
        placeholderTextColor={COLORS.muted}
        style={[styles.input, styles.notes]}
        multiline
      />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Notes about the lead"
        placeholderTextColor={COLORS.muted}
        style={[styles.input, styles.notes]}
        multiline
      />

      <Pressable style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} onPress={submit} disabled={isSubmitting}>
        <Text style={styles.submitButtonText}>{isSubmitting ? 'Saving...' : submitLabel}</Text>
      </Pressable>
    </View>
  );
}

function parseList(value: string): string[] | undefined {
  const items = value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}

const styles = StyleSheet.create({
  form: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 4 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: COLORS.text,
  },
  multiline: {
    minHeight: 78,
    textAlignVertical: 'top',
  },
  notes: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.text,
  },
  chipTextActive: {
    color: '#fff',
  },
  readonlyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  readonlyText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  readonlyHint: { marginTop: 4, color: COLORS.muted, fontSize: 12 },
  submitButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: { color: '#fff', fontWeight: '600', textAlign: 'center', fontSize: 16 },
});
