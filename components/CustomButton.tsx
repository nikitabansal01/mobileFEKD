import React from "react";
import {
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import { responsiveFontSize } from "react-native-responsive-dimensions";


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
    fontSize: responsiveFontSize(1.92),
    fontFamily: "Inter500",
    color: "#FFF",
  },
}); 