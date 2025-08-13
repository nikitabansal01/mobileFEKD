import Images from "@/assets/images";
import { SplashImage } from "@/assets/images/SVG/SplashImage";
import { responsiveFontSize2 } from "@/globalFontSizeNew";
import { useNavigation } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    ActivityIndicator,
    Animated,
    Image,
    Text,
    View,
} from "react-native";
import {
    responsiveHeight,
    responsiveWidth
} from "react-native-responsive-dimensions";

const SplashScreen = () => {
  const navigation = useNavigation();

  // Create animated values for each SVG
  const energizerAnim = useRef(new Animated.Value(0)).current;
  const rocketAnim = useRef(new Animated.Value(0)).current;
  const testosteroneAnim = useRef(new Animated.Value(0)).current;
  const coachAnim = useRef(new Animated.Value(0)).current;
  const progesteroneAnim = useRef(new Animated.Value(0)).current;
  const gnrhAnim = useRef(new Animated.Value(0)).current;
  const logo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start the animations when the component mounts
    Animated.stagger(200, [
      Animated.timing(energizerAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(rocketAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(testosteroneAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(coachAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(progesteroneAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(gnrhAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(logo, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after 4 seconds
    setTimeout(() => {
      (navigation.navigate as any)("screens/OnboardingScreen");
    }, 4000);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF" }}>
      <View style={{ position: "relative", flex: 0.8 }}>
        <Animated.View
          style={{
            position: "absolute",
            top: 60,
            left: 20,
            transform: [{ rotate: "350deg" }, { scale: energizerAnim }],
          }}
        >
          <Image
            source={SplashImage.Energizer}
            style={{ width: 70, height: 150 }}
          />
        </Animated.View>
        <Animated.View
          style={{
            position: "absolute",
            top: 10,
            right: 50,
            transform: [{ rotate: "360deg" }, { scale: rocketAnim }],
          }}
        >
          <Image
            source={SplashImage.RocketLauncher}
            style={{ width: 120, height: 80 }}
          />
        </Animated.View>
        <Animated.View
          style={{
            position: "absolute",
            bottom: 10,
            right: 0,
            transform: [{ rotate: "350deg" }, { scale: testosteroneAnim }],
          }}
        >
          <Image
            source={SplashImage.TestosteroneTitan}
            style={{ width: 150, height: 160 }}
          />
        </Animated.View>
      </View>
      <View style={{flex:0.5}}>
      <Animated.View
        style={{
          justifyContent: "center",
          alignItems: "center",
          transform: [{ scale: energizerAnim }],
        }}
      >
        <Image
          source={Images.CompanyLogo}
          style={{
            width: responsiveWidth(55.2),
            height: responsiveHeight(10.6),
          }}
        />
      </Animated.View>

      <View style={{ justifyContent: "center", alignItems: "center" }}>
        <Text
          style={{
            color: "#6E4B6F",
            fontSize: responsiveFontSize2(2.3),
            fontFamily: "Poppins400",
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          The missing piece in your{"\n"}hormone care
        </Text>
        <ActivityIndicator size="large" color="#cecedf" />
      </View>
      </View>
      <View style={{ position: "relative", flex: 0.8 }}>
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            transform: [{ rotate: "360deg" }, { scale: coachAnim }],
          }}
        >
          <Image
            source={SplashImage.Coach}
            style={{ width: 150, height: 120 }}
          />
        </Animated.View>
        <Animated.View
          style={{
            position: "absolute",
            top: 50,
            right: 0,
            transform: [{ rotate: "350deg" }, { scale: progesteroneAnim }],
          }}
        >
          <Image
            source={Images.ProgesteroneCalmer}
            style={{ width: 170, height: 150 }}
          />
        </Animated.View>
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: "20%",
            transform: [{ rotate: "350deg" }, { scale: gnrhAnim }],
          }}
        >
          <Image
            source={SplashImage.GnRHMastermind}
            style={{ width: 132, height: 132 }}
          />
        </Animated.View>
      </View>
    </View>
  );
};

export default SplashScreen; 