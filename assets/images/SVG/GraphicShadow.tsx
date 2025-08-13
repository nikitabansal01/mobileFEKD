import React from 'react';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

type GraphicShadowProps = {
    width?: number;
    height?: number;
};

const GraphicShadow = ({ width = 92, height = 12 }: GraphicShadowProps) => (
    <Svg width={width} height={height} fill="none">
        <Rect
            opacity="0.4"
            width="100%"
            height="100%"
            rx="6"
            fill="url(#paint0_radial_8132_34139)"
        />
        <Defs>
            <RadialGradient
                id="paint0_radial_8132_34139"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform={`translate(${width / 2} ${height / 2}) rotate(90) scale(${height / 2} ${width / 2})`}
            >
                <Stop stopColor="#B6B6B6" />
                <Stop offset="1" stopColor="#B6B6B6" stopOpacity="0" />
            </RadialGradient>
        </Defs>
    </Svg>
);

export default GraphicShadow; 