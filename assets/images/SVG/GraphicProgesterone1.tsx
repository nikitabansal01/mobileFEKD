import React from 'react';
import { Image } from 'react-native';
import Images from '../index';

interface GraphicProgesterone1Props {
  width?: number;
  height?: number;
}

const GraphicProgesterone1: React.FC<GraphicProgesterone1Props> = ({ 
  width = 68, 
  height = 54 
}) => {
  return (
    <Image
      source={Images.GraphicProgesterone1}
      style={{
        width: width,
        height: height,
        resizeMode: 'contain',
      }}
    />
  );
};

export default GraphicProgesterone1; 