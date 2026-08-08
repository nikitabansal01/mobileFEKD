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
  card: {
    backgroundColor: '#F9F7F9',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  cardTitle: { color: '#211B22', fontFamily: 'Inter600', fontSize: 16 },
  cardBody: {
    color: '#625B63',
    fontFamily: 'Inter400',
    fontSize: 14,
    marginTop: 4,
  },
  cardValue: {
    color: '#211B22',
    fontFamily: 'NotoSerif600',
    fontSize: 22,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#211B22',
    fontFamily: 'Inter600',
    fontSize: 16,
    marginTop: 28,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EDE8ED',
  },
  rowLabel: { color: '#211B22', fontFamily: 'Inter400', fontSize: 15, flex: 1 },
  rowValue: { color: '#211B22', fontFamily: 'Inter500', fontSize: 15 },
  rowMuted: { color: '#9A929B', fontFamily: 'Inter400' },
  insufficientBadge: {
    color: '#9A929B',
    fontFamily: 'Inter400',
    fontSize: 12,
    marginLeft: 8,
  },
});
