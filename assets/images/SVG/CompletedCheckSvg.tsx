import * as React from "react";
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { moderateScale } from "react-native-size-matters";

interface CompletedCheckSvgProps {
    size?: number;
    /** Use gradient or solid color */
    useGradient?: boolean;
    /** Solid color (used when useGradient is false) */
    color?: string;
}

/**
 * Premium Completed Checkmark Icon
 * 
 * A beautiful gradient checkmark in a circle - matches AUVRA brand colors.
 * Use for completed actions, success states, and achievements.
 */
const CompletedCheckSvg: React.FC<CompletedCheckSvgProps> = ({
    size = moderateScale(24),
    useGradient = true,
    color = "#C17EC9",
}) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
    >
        <Defs>
            {/* AUVRA Brand Gradient - Purple to Pink to Coral */}
            <LinearGradient id="completedGradient" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#A29AEA" />
                <Stop offset="35%" stopColor="#C17EC9" />
                <Stop offset="55%" stopColor="#D482B9" />
                <Stop offset="75%" stopColor="#E98BAC" />
                <Stop offset="100%" stopColor="#FDC6D1" />
            </LinearGradient>
        </Defs>

        {/* Circle Background */}
        <Circle
            cx="12"
            cy="12"
            r="11"
            fill={useGradient ? "url(#completedGradient)" : color}
        />

        {/* White Checkmark */}
        <Path
            d="M7.5 12.5L10.5 15.5L16.5 9"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    </Svg>
);

/**
 * Outline version - checkmark with ring border (no fill)
 */
export const CompletedCheckOutlineSvg: React.FC<CompletedCheckSvgProps> = ({
    size = moderateScale(24),
    useGradient = true,
    color = "#C17EC9",
}) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
    >
        <Defs>
            <LinearGradient id="completedOutlineGradient" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#A29AEA" />
                <Stop offset="35%" stopColor="#C17EC9" />
                <Stop offset="55%" stopColor="#D482B9" />
                <Stop offset="75%" stopColor="#E98BAC" />
                <Stop offset="100%" stopColor="#FDC6D1" />
            </LinearGradient>
        </Defs>

        {/* Circle Border */}
        <Circle
            cx="12"
            cy="12"
            r="10.5"
            stroke={useGradient ? "url(#completedOutlineGradient)" : color}
            strokeWidth="2"
            fill="none"
        />

        {/* Gradient Checkmark */}
        <Path
            d="M7.5 12.5L10.5 15.5L16.5 9"
            stroke={useGradient ? "url(#completedOutlineGradient)" : color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    </Svg>
);

/**
 * Star burst version - for achievements and special completions
 */
export const CompletedStarSvg: React.FC<CompletedCheckSvgProps> = ({
    size = moderateScale(28),
    useGradient = true,
    color = "#C17EC9",
}) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
    >
        <Defs>
            <LinearGradient id="starGradient" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#A29AEA" />
                <Stop offset="50%" stopColor="#C17EC9" />
                <Stop offset="100%" stopColor="#FDC6D1" />
            </LinearGradient>
        </Defs>

        {/* Star/Burst Background */}
        <Path
            d="M14 0L16.5 10L28 11L17.5 15.5L20 28L14 19.5L8 28L10.5 15.5L0 11L11.5 10L14 0Z"
            fill={useGradient ? "url(#starGradient)" : color}
        />

        {/* White Checkmark */}
        <Path
            d="M10 14L12.5 16.5L18 11"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    </Svg>
);

export default CompletedCheckSvg;
