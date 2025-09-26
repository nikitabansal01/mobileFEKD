import { Ionicons } from "@expo/vector-icons";
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { scale, verticalScale } from 'react-native-size-matters';
import { FONT_FAMILIES } from '../../constants/fonts';

// Responsive dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isAndroid = Platform.OS === 'android';
const isIOS = Platform.OS === 'ios';

// Font scaling system using react-native-size-matters
const FONT_SIZES = {
  // From Figma: Header text (14px Noto Serif) - "Weekly Check-in"
  header: scale(14),
};

const COLORS = {
    // Figma Light theme tokens sampled from variables
    surface: "#FEF7FF",
    onSurface: "#1D1B20",
    surfaceDivider: "#E6E0E9",
    outlineVariant: "#D7D5DE",   //make it more light
    primaryContainer: "#EADDFF",
    onPrimaryContainer: "#4F378A",
    greyMedium: "#6F6F6F",
    greyLight: "#949494",
    white: "#FFFFFF",
};

interface ChatbotHeaderProps {
  onClose: () => void;
}

export default function ChatbotHeader({ onClose }: ChatbotHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity 
        accessibilityRole="button" 
        accessibilityLabel="Close" 
        style={styles.closeBtn}
        onPress={onClose}
        activeOpacity={0.7}
        hitSlop={{ top: verticalScale(10), bottom: verticalScale(10), left: scale(10), right: scale(10) }}
      >
        <Ionicons name="close-outline" size={scale(32)} color={COLORS.greyMedium} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>Weekly Check-in</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: verticalScale(60),
    justifyContent: 'center',
    zIndex: 10,
    // backgroundColor: COLORS.surface,
    width: '100%',
  },
  closeBtn: {
    position: 'absolute',
    left: scale(16),
    top: '50%',
    transform: [{ translateY: -scale(16) }],
    width: scale(32),
    height: scale(32),
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: scale(32),
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.header,
    fontFamily: FONT_FAMILIES['NotoSerif-Regular'],
    color: COLORS.onSurface,
    textAlign: 'center',
  },
});
