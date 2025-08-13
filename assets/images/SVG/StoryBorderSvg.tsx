import * as React from "react";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
const StoryBorderSvg = ({ width, height }: { width: number; height: number }) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 70 71"
  >
    <Circle
      cx={35}
      cy={35.5}
      r={34.3438}
      fill="white"
      stroke="url(#paint0_linear_4428_13425)"
      strokeWidth={1.3125}
    />
    <Defs>
      <LinearGradient
        id="paint0_linear_4428_13425"
        x1={56}
        y1={6.625}
        x2={13.125}
        y2={59.125}
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#F293B7" />
        <Stop offset={0.5} stopColor="#BB4471" stopOpacity={0.49} />
        <Stop offset={1} stopColor="#6E4B6F" />
      </LinearGradient>
    </Defs>
  </Svg>
);
export default StoryBorderSvg;
