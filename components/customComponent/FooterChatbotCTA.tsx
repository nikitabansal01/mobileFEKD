import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Dimensions, Image, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import { FONT_FAMILIES } from '../../constants/fonts';

// Responsive dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isAndroid = Platform.OS === 'android';
const isIOS = Platform.OS === 'ios';

// Font scaling system using react-native-size-matters
const FONT_SIZES = {
  // From Figma: Button text (12px Inter Regular) - for "tap", "yap", "type" labels
  button: moderateScale(12, 1.5),
  
  // From Figma: Message text (14px Inter Regular)
  message: moderateScale(14, 1.5),
  
  // Additional sizes for UI elements
  caption: moderateScale(10, 1.5),
  small: moderateScale(11, 1.5),
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
    // Custom gradient colors sampled from screenshot (purple→pink)
    gradPurple: "#A78BFA",
    gradPink: "#F0A3C2",
};

type Mode = "idle" | "tap" | "yap" | "type";

export default function FooterChatbotCTA({
    setMode, 
    disabled = false,
    isRecording = false,
    recordingComplete = false,
    onStartRecording,
    onStopRecording,
    onSendRecording
}: {
    setMode: React.Dispatch<React.SetStateAction<Mode>>; 
    disabled?: boolean;
    isRecording?: boolean;
    recordingComplete?: boolean;
    onStartRecording?: () => void;
    onStopRecording?: () => void;
    onSendRecording?: () => void;
}) {

    return (
        <View>
            {/* Bottom Buttons row: tap / yap / type */}
            <View style={[styles.bottomContainer, disabled ? { opacity: 0.5 } : undefined]}>
                <View style={styles.btn55Container}>
                    <TouchableOpacity style={[styles.btn50, disabled && styles.btnDisabled]} disabled={disabled} onPress={() => setMode("tap")}>
                        <Ionicons name="checkmark-circle-outline" style={{fontSize: moderateScale(24, 1.5)}} color={COLORS.onPrimaryContainer} />
                    </TouchableOpacity>
                    <Text style={styles.btnLabel}>tap</Text>
                </View>

                {/* Center 80 */}
                <View style={styles.btn80Container}>
                    {!disabled && isRecording ? (
                        <Pressable
                            style={styles.btn80}
                            onPressIn={onStartRecording}
                            onPressOut={onStopRecording}
                        >
                            <LinearGradient
                                colors={[COLORS.gradPurple, COLORS.gradPink]}
                                style={styles.btn80Gradient}
                            >
                                <Image
                                source={require("../../assets/images/yap-icon-white.png")} // local image
                                style={{ width: scale(50), height: scale(50) }}
                                resizeMode="contain"
                            />
                                {/* <Ionicons name="mic" size={30} color={COLORS.white} /> */}
                            </LinearGradient>
                        </Pressable>
                    ) : !disabled && recordingComplete ? (
                        <TouchableOpacity style={styles.btn80} onPress={onSendRecording}>
                            <LinearGradient
                                colors={[COLORS.gradPurple, COLORS.gradPink]}
                                style={styles.btn80Gradient}
                            >
                                <Ionicons name="send" size={30} color={COLORS.white} />
                            </LinearGradient>
                        </TouchableOpacity>
                    ) : !disabled ? (
                        <Pressable
                            style={styles.btn80}
                            onPressIn={onStartRecording}
                            onPressOut={onStopRecording}
                        >
                            <Image
                                source={require("../../assets/images/yap-icon.png")} // local image
                                style={{ width: scale(50), height: scale(50) }}
                                resizeMode="contain"
                            />
                        </Pressable>
                    ) : (
                        <TouchableOpacity style={[styles.btn80, disabled && styles.btnDisabled]} disabled={disabled} onPress={() => setMode("idle")}>
                            <Image
                                source={require("../../assets/images/yap-icon.png")} // local image
                                style={{ width: scale(40), height: verticalScale(40) }}
                                resizeMode="contain"
                            />
                        </TouchableOpacity>
                    )}
                    <Text style={styles.btnLabelCenter}>
                        {!disabled && isRecording ? "recording" : 
                         !disabled && recordingComplete ? "send" : "yap"}
                    </Text>
                </View>

                {/* Right 50 */}
                <View style={styles.btn55Container}>
                    <TouchableOpacity style={[styles.btn50, disabled && styles.btnDisabled]} disabled={disabled} onPress={()=>{setMode("type")}}> 
                        <Ionicons name="chatbubble-ellipses-outline" style={{fontSize: moderateScale(24, 1.5)}} color={COLORS.onPrimaryContainer} />
                    </TouchableOpacity>
                    <Text style={styles.btnLabel}>type</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    bottomContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingHorizontal: scale(54),
        paddingBottom: verticalScale(20),
        marginTop: verticalScale(10),
    },
    btn55Container: {
        alignItems: "center",
        width: scale(55)
    },
    btn50: {
        width: scale(50),
        height: scale(50),
        borderRadius: scale(25),
        backgroundColor: COLORS.white,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: verticalScale(3) },
        elevation: 4,
    },
    btnLabel: {
        marginTop: verticalScale(9),
        color: COLORS.onSurface,
        fontSize: FONT_SIZES.button,
        fontFamily: FONT_FAMILIES['Inter-Regular'],
        textAlign: 'center',
        includeFontPadding: isAndroid ? false : undefined,
        textAlignVertical: isAndroid ? 'center' : undefined,
    },
    btn80Container: {
        alignItems: "center",
        width: scale(80)
    },
    btn80: {
        width: scale(80),
        height: scale(80),
        borderRadius: scale(70),
        backgroundColor: COLORS.white,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: verticalScale(6) },
        elevation: 8,
    },
    btn80Gradient: {
        width: '100%',
        height: '100%',
        borderRadius: scale(70),
        alignItems: "center",
        justifyContent: "center",
    },
    btnLabelCenter: {
        marginTop: verticalScale(9),
        color: COLORS.onSurface,
        fontSize: FONT_SIZES.button,
        textAlign: "center",
        width: scale(80),
        fontFamily: FONT_FAMILIES['Inter-Regular'],
        includeFontPadding: isAndroid ? false : undefined,
        textAlignVertical: isAndroid ? 'center' : undefined,
    },
    btnDisabled: {
        backgroundColor: COLORS.white,
        elevation: 0,        // remove Android shadow
        shadowOpacity: 0,    // remove iOS shadow
        shadowRadius: 0.3,
        shadowOffset: { width: 0, height: 0 },
    },
});
