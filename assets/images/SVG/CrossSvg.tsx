import * as React from "react";
import Svg, { Path } from "react-native-svg";
const CrossSvg = ({size=18,color="#000"}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 18 18"
    fill="none"
  
  >
    <Path
      d="M17 17L1 1M17 1L1 17"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);
export default CrossSvg;
