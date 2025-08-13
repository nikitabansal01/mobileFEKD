import * as React from "react";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
const StoryDashBorderSvg =  ({ width, height }: { width: number; height: number }) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 70 70"
    fill="none"
  >
    <Circle
      cx={35}
      cy={35}
      r={34.3438}
      stroke="url(#paint0_linear_4428_13434)"
      strokeWidth={1.3125}
      strokeLinecap="round"
      strokeDasharray="38.5 7"
    />
    <Defs>
      <LinearGradient
        id="paint0_linear_4428_13434"
        x1={56}
        y1={6.125}
        x2={13.125}
        y2={58.625}
        gradientUnits="userSpaceOnUse"
      >
        <Stop stopColor="#F293B7" />
        <Stop offset={0.5} stopColor="#BB4471" stopOpacity={0.49} />
        <Stop offset={1} stopColor="#6E4B6F" />
      </LinearGradient>
    </Defs>
  </Svg>
);
export default StoryDashBorderSvg;
