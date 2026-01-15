import React from 'react';
import { View, Text } from 'react-native';
import { SvgProps } from 'react-native-svg';

interface IconProps {
  as: React.ComponentType<SvgProps>;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  color?: string;
}

const sizeMap = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  '2xl': 32,
};

export const Icon: React.FC<IconProps> = ({ 
  as: IconComponent, 
  size = 'md',
  className = '',
  color,
}) => {
  const iconSize = sizeMap[size];
  
  // Extract color from className if present
  let iconColor = color || '#374151'; // default typography-700
  
  if (className.includes('text-success')) {
    iconColor = '#22c55e';
  } else if (className.includes('text-error')) {
    iconColor = '#ef4444';
  } else if (className.includes('text-primary')) {
    iconColor = '#2563eb';
  } else if (className.includes('text-white')) {
    iconColor = '#ffffff';
  } else if (className.includes('text-typography-400')) {
    iconColor = '#9ca3af';
  } else if (className.includes('text-typography-500')) {
    iconColor = '#6b7280';
  } else if (className.includes('text-typography-900')) {
    iconColor = '#111827';
  } else if (className.includes('text-typography-950')) {
    iconColor = '#030712';
  }
  
  return <IconComponent size={iconSize} color={iconColor} />;
};

export default Icon;
