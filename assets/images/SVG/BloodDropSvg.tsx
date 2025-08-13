import * as React from "react";
import Svg, { Rect, Defs, Pattern, Use, Image,NumberProp } from "react-native-svg";

interface BloodDropSvgProps {
  size: NumberProp;
}
const BloodDropSvg : React.FC<BloodDropSvgProps> = ({ size })  => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
  >
    <Rect x={0.5} width={size} height={size} fill="url(#pattern0_3722_10252)" />
    <Defs>
      <Pattern
        id="pattern0_3722_10252"
        patternContentUnits="objectBoundingBox"
        width={1}
        height={1}
      >
        <Use
          xlinkHref="#image0_3722_10252"
          transform="matrix(0.00631313 0 0 0.00757576 0.210104 0.157578)"
        />
      </Pattern>
      <Image
        id="image0_3722_10252"
        width={90}
        height={90}
        xlinkHref="data:image/png;base64,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"
      />
    </Defs>
  </Svg>
);
export default BloodDropSvg;
