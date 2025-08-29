import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { moderateScale } from 'react-native-size-matters';

// Back button icon component
const BackButton = ({ color = 'black', ...props }) => (
  <Svg
    width={moderateScale(10)}
    height={moderateScale(18)}
    viewBox="0 0 10 18"
    fill="none"
    {...props}
  >
    <Path
      d="M9.756 1.766L8.341 0.353 0.636 8.056a1.416 1.416 0 00-.392.942c0 .344.13.676.392.942l7.705 7.707 1.414-1.413L2.523 9l7.233-7.234z"
      fill={color}
    />
  </Svg>
);

export default BackButton; 