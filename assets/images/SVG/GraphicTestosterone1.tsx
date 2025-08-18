import React from 'react';
import { Image } from 'react-native';
import Images from '../index';

interface GraphicTestosterone1Props {
  width?: number;
  height?: number;
}

const GraphicTestosterone1: React.FC<GraphicTestosterone1Props> = ({ 
  width = 68, 
  height = 54 
}) => {
  return (
    <Image
      source={Images.GraphicTestosterone1}
      style={{
        width: width,
        height: height,
        resizeMode: 'contain',
      }}
    />
  );
};

export default GraphicTestosterone1; 