import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 24, paddingBottom: 48 },
  title: {
    color: '#211B22',
    fontFamily: 'NotoSerif600',
    fontSize: 27,
    marginTop: 16,
  },
  body: {
    color: '#625B63',
    fontFamily: 'Inter400',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
  },
  loading: { marginTop: 32 },
  section: { marginTop: 28 },
  sectionTitle: { color: '#211B22', fontFamily: 'Inter600', fontSize: 16 },
  card: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EDE8ED',
    padding: 16,
  },
  cardLocked: { backgroundColor: '#F9F7F9', opacity: 0.7 },
  cardLabel: { color: '#211B22', fontFamily: 'Inter500', fontSize: 15 },
  cardLockedNote: {
    color: '#9A929B',
    fontFamily: 'Inter400',
    fontSize: 13,
    marginTop: 4,
  },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F4F1F4',
  },
  chipSelected: { backgroundColor: '#211B22' },
  chipLabel: { color: '#625B63', fontFamily: 'Inter500', fontSize: 13 },
  chipLabelSelected: { color: '#FFFFFF' },
});
