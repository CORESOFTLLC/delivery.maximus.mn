import React from 'react';
import { View, ViewProps } from 'react-native';

interface VStackProps extends ViewProps {
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

export const VStack: React.FC<VStackProps> = ({ 
  className = '', 
  space,
  ...props 
}) => {
  const spaceClass = space ? spaceMap[space] : '';
  return <View className={`flex-col ${spaceClass} ${className}`} {...props} />;
};

export default VStack;
