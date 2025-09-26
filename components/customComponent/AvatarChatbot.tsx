import { FONT_FAMILIES } from '@/constants/fonts';
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, StyleSheet, Text, View } from "react-native";
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';


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



function GradientText({ children, style }: { children: string; style?: any }) {
  return (
    <MaskedView maskElement={<Text style={[style, { backgroundColor: "transparent" }]}>{children}</Text>}>
      <LinearGradient colors={[COLORS.gradPurple, COLORS.gradPink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}


export default function AvatarChatbot({ showMessage = true }: { showMessage?: boolean }) {
  
  const Animation = () => {
    if (Platform.OS === "web") {
      const Lottie = require("lottie-react").default;
      return (
        <Lottie
          animationData={require("../../assets/animation/auvra-character.json")}
          loop
          autoplay
          style={styles.auvraCharacter}
        />
      );
    } 
    const LottieView = require("lottie-react-native").default;
  return (
    <LottieView
      source={require("../../assets/animation/auvra-character.json")}
      autoPlay
      loop
      style={styles.auvraCharacter}
    />
  );
  };

  


  return (

    <View>
      <View style={styles.characterSection}>
        {/* Gradient background layer */}
        <LinearGradient
          colors={['#B3B3B3', '#FFFFFF']}
          locations={[0.1031, 0.95]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.gradientBackground}
        />

        {/* <View style={styles.avatarLogo}>
                
                <Animated.Image
                    source={require("../assets/images/auvra-avatar-1.png")}
                    style={[styles.image, { opacity: fadeAnim1 }]}
                    resizeMode="contain"
                />

                
                <Animated.Image
                    source={require("../assets/images/auvra-avatar-2.png")}
                    style={[styles.image, { opacity: fadeAnim2, position: "absolute" }]}
                    resizeMode="contain"
                />
            </View> */}

       

        <Animation />

        {/* <View style={styles.shadow} />  */}
        <View style={styles.shadow} />

      </View>

      {showMessage && (
        <View style={styles.introTextContainer}>
          <GradientText style={styles.introText}>How was your bloating this week?</GradientText>
        </View>
      )}

    </View>


  );
}

const styles = StyleSheet.create({
  characterSection:
  {
    width: scale(82),
    paddingTop: verticalScale(20),
    alignItems: "center",
    position: "relative",
  },
  gradientBackground: {
    position: "absolute",
    top: verticalScale(20),
    width: scale(82),
    height: scale(82),
    borderRadius: scale(41), // Half of width/height for perfect circle
    borderWidth: 8,
    borderStyle: "solid",
    borderColor: "#F7F7F8",
    // borderColor: "#000",
    zIndex: -1, // Behind the character
  },
  auvraCharacter: {
    width: scale(79),
    height: scale(79),
  },
  avatarLogo: {
    width: scale(100),
    height: scale(100),
  },
  image: {
    width: "100%",
    height: "100%",
  },
  shadow: {
    width: scale(60),         // wider than avatar
    height: verticalScale(4),        // short height = oval shape
    backgroundColor: "rgba(0,0,0,0.2)", // semi-transparent black
    borderRadius: "50%",  // round corners to make it an ellipse
    marginTop: verticalScale(12),

  },
  introTextContainer: {
    marginTop: verticalScale(20),
    marginBottom: verticalScale(15),
    maxWidth: '80%',
    width: "auto",
    borderRadius: scale(8),
    borderTopLeftRadius: 0,
    borderWidth: scale(1),
    borderColor: COLORS.outlineVariant,
    alignSelf: "flex-start",
    padding: scale(1)
  },
  introText: {
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(10),
    fontSize: moderateScale(14, 1.5),
    lineHeight: verticalScale(18),
    fontFamily: FONT_FAMILIES['Inter-Regular']
  },
})