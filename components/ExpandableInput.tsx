import CloseEye from "@/assets/images/SVG/CloseEye";
import { Feather } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import {
    responsiveFontSize
} from "react-native-responsive-dimensions";


type ExpandableInputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  isFocused?:boolean,
  onFocus?:() =>void;
  inputViewStyle?:ViewStyle
} & React.ComponentProps<typeof TextInput>;

const ExpandableInput: React.FC<ExpandableInputProps> = ({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  isFocused,
  onFocus,
  inputViewStyle,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handlePress = () => {
    setIsVisible(true);
    setTimeout(() => inputRef.current?.focus(), 100); // Focus after state update
  };

  return (
    <TouchableOpacity
      style={[
        styles.inputView,
        {
          paddingVertical: isVisible ? 8 : 14,
          borderColor: isFocused ? "#BB4471" : "#D9D9D9", // Change border color based on focus
          borderWidth: isFocused ? 1.5 : 1,
        },
        inputViewStyle
      ]}
      onPress={handlePress}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.inputLabel}>{label}</Text>
        {isVisible && (
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry && !isPasswordVisible}
            onFocus={onFocus} 
            style={styles.innerInputView}
            {...props}
          />
        )}
      </View>
     

      {secureTextEntry && (
        <TouchableOpacity
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
        >
          {isPasswordVisible ? (
            <Feather name="eye" size={24} color="#C7C7CC" />
          ) : (
            <CloseEye />
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default ExpandableInput;

const styles = StyleSheet.create({
  inputView: {
    color: "black",
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  inputLabel: {
    color: "#B3B3B3",
    fontSize: responsiveFontSize(1.92),
    fontFamily: "Poppins400",
  },
  innerInputView: {
    color: "#000",
    fontSize: responsiveFontSize(1.65),
    padding: 0,
    fontFamily: "Poppins400",
  },
}); 