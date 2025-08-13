import { Dimensions, PixelRatio, Platform } from "react-native";

const { height, width } = Dimensions.get("window");
const baseWidth = 400;
const scale = width / baseWidth;

export const responsiveFontSize2 = (f: number) => {
  return fontCalculation(height, width, f);
};

const fontCalculation = (height: number, width: number, val: number) => {
  const widthDimension = height > width ? width : height;
  const aspectRatioBasedHeight = (16 / 9) * widthDimension;
  return normalize(
    Math.sqrt(
      Math.pow(aspectRatioBasedHeight, 2) + Math.pow(widthDimension, 2)
    ),
    val
  );
};

const normalize = (max: number, size: number) => {
  const newSize = (size / 100) * max * scale;
  if (Platform.OS === "web") {
    return Math.round(PixelRatio.roundToNearestPixel(newSize *0.2));
  }
  if (width > 768) {
    return Math.round(PixelRatio.roundToNearestPixel(newSize * 0.4));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};
