import * as React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

const GraphicSparkle = (props: SvgProps) => (
  <Svg width={38} height={38} viewBox="0 0 38 38" fill="none" {...props}>
    <Path
      d="M4.70567 20.4452C13.3179 20.4557 18.5641 24.6631 20.4444 33.0676C20.4549 24.4553 24.6623 19.2091 33.0668 17.3288C24.4546 17.3183 19.2083 13.1109 17.328 4.70644C17.3176 13.3187 13.1101 18.5649 4.70567 20.4452Z"
      fill="white"
      stroke="white"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default GraphicSparkle; 