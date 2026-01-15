import React from 'react';
import { View, ViewProps } from 'react-native';

interface HStackProps extends ViewProps {
  className?: string;
  space?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const spaceMap = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-6',
  '2xl': 'gap-8',
};

export const HStack: React.FC<HStackProps> = ({ 
  className = '', 
  space,
  ...props 
}) => {
  const spaceClass = space ? spaceMap[space] : '';
  return <View className={`flex-row ${spaceClass} ${className}`} {...props} />;
};

export default HStack;
