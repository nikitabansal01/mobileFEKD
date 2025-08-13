import * as React from "react";
import Svg, { Path } from "react-native-svg";
const PriceArrow = (props) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={34}
    height={32}
    viewBox="0 0 34 32"
    fill="none"
    {...props}
  >
    <Path
      d="M1.82646 29.6738C10.8563 26.7436 18.7281 20.509 23.9697 12.6926C25.2374 10.8023 28.0626 5.66542 27.5848 2.84899C27.468 2.16028 18.0519 5.32864 16.9294 5.55916C12.5745 6.45356 25.3758 2.62359 29.7713 1.95659C30.6861 1.81778 30.745 7.80773 30.7699 8.169C30.8275 9.004 30.8437 16.4167 31.728 14.9482"
      stroke="#BB4471"
      strokeWidth={3}
      strokeLinecap="round"
    />
  </Svg>
);
export default PriceArrow;
