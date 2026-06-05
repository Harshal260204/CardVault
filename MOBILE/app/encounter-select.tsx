import { COLORS } from '@/lib/constants';
import type { EncounterType } from '@/lib/types';
import { useSessionStore } from '@/stores/session-store';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const ENCOUNTER_TYPES: EncounterType[] = [
  'flight',
  'b2b',
  'airport',
  'dinner',
  'referral',
  'hallway',
  'other',
];

export default function EncounterSelectScreen() {
  const router = useRouter();
  const setActiveSession = useSessionStore((s) => s.setActiveSession);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Quick capture — encounter type</Text>
      <Text style={styles.subtitle}>How did you meet this contact?</Text>
      <View style={styles.grid}>
        {ENCOUNTER_TYPES.map((type) => (
          <Pressable
            key={type}
            style={styles.tile}
            onPress={() => {
              setActiveSession(undefined, 'quick_capture', type);
              router.replace('/(tabs)/home?openScanner=1');
            }}
          >
            <Text style={styles.tileText}>{type}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20, backgroundColor: COLORS.background },
  title: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: COLORS.muted, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    minWidth: '45%',
  },
  tileText: { color: COLORS.text, textTransform: 'capitalize' },
});
