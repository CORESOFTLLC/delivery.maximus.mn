import React from 'react';
import { View, ViewProps } from 'react-native';

interface BoxProps extends ViewProps {
  className?: string;
}

export const Box: React.FC<BoxProps> = ({ className = '', ...props }) => {
  return <View className={className} {...props} />;
};

export default Box;
