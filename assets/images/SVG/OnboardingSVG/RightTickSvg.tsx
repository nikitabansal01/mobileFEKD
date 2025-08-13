import * as React from "react";
import Svg, { Path } from "react-native-svg";

export type Props={
  size?:number,
  color?:string
}
const RightTickSvg = ({size=14,color="#6E4B6F"}:Props) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 14 11"
    fill="none"
  >
    <Path
      d="M2 5.5L5.5 9L12.5 1.5"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default RightTickSvg;
