import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from "react-native";
import React from "react";
import { responsiveFontSize } from "react-native-responsive-dimensions";
import { responsiveFontSize2 } from "@/globalFontSizeNew";

export type Props = {
  title: String;
  onPress?: () => void;
  buttonStyle?: ViewStyle;
  buttonTextStyle?: TextStyle;
  icon?: React.ReactNode;
  disable?:boolean
};
const CustomButton = ({
  title,
  onPress,
  buttonStyle,
  buttonTextStyle,
  icon,
  disable
}: Props) => {
  return (
    <TouchableOpacity
    disabled={disable}
      onPress={onPress}
      style={[styles.buttonView, buttonStyle]}
    >
      <Text style={[styles.title, buttonTextStyle]}>{title}</Text>
      {icon && <View>{icon}</View>}
    </TouchableOpacity>
  );
};

export default CustomButton;
const styles = StyleSheet.create({
  buttonView: {
    backgroundColor: "#BB4471",
    borderColor: "#BB4471",
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 21,
  },
  title: {
    fontSize: responsiveFontSize2(1.92),
    fontFamily: "Inter500",
    color: "#FFF",
  },
}); 