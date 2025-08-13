import * as React from "react";
import Svg, { Rect, Defs, Pattern, Use, Image } from "react-native-svg";
const HappySvg = (props) => (
  <Svg
    width={35}
    height={28}
    viewBox="0 0 35 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    {...props}
  >
    <Rect y={0.5} width={35} height={27} fill="url(#pattern0_3784_9437)" />
    <Defs>
      <Pattern
        id="pattern0_3784_9437"
        patternContentUnits="objectBoundingBox"
        width={1}
        height={1}
      >
        <Use
          xlinkHref="#image0_3784_9437"
          transform="matrix(0.00771429 0 0 0.01 0.114286 0)"
        />
      </Pattern>
      <Image
        id="image0_3784_9437"
        width={100}
        height={100}
        xlinkHref="data:image/png;base64,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"
      />
    </Defs>
  </Svg>
);
export default HappySvg;
