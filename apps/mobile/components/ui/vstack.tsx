import React from 'react';
import { View, ViewProps, ViewStyle } from 'react-native';

interface VStackProps extends ViewProps {
  className?: string;
  space?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const spaceStyleMap: Record<string, ViewStyle> = {
  xs: { gap: 4 },
  sm: { gap: 8 },
  md: { gap: 12 },
  lg: { gap: 16 },
  xl: { gap: 24 },
  '2xl': { gap: 32 },
};

export const VStack: React.FC<VStackProps> = ({ 
  className = '', 
  space,
  style,
  ...props 
}) => {
  const spaceStyle = space ? spaceStyleMap[space] : {};
  return (
    <View 
      className={`flex-col ${className}`} 
      style={[spaceStyle, style]}
      {...props} 
    />
  );
};

export default VStack;
