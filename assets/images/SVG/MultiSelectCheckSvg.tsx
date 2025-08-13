import * as React from "react";
import Svg, { G, Path } from "react-native-svg";
const MultiSelectCheckSvg = ({color="black",opacity=0.3}) => (
  <Svg
    width={20}
    height={20}
    viewBox="0 0 20 20"
    fill="none"
  >
    <G opacity={opacity}>
      <Path
        d="M13.75 6.875L8.5 13.125L6.25 10.625"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15.625 2.5H4.375C3.33947 2.5 2.5 3.33947 2.5 4.375V15.625C2.5 16.6605 3.33947 17.5 4.375 17.5H15.625C16.6605 17.5 17.5 16.6605 17.5 15.625V4.375C17.5 3.33947 16.6605 2.5 15.625 2.5Z"
        stroke={color}
        strokeLinejoin="round"
      />
    </G>
  </Svg>
);
export default MultiSelectCheckSvg;
