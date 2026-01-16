import React from 'react';
import { Text, TextProps } from 'react-native';

interface HeadingProps extends TextProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

const sizeMap = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
  '2xl': 'text-4xl',
  '3xl': 'text-5xl',
};

export const Heading: React.FC<HeadingProps> = ({ 
  className = '', 
  size = 'lg',
  style,
  ...props 
}) => {
  const sizeClass = sizeMap[size];
  return (
    <Text 
      className={`${sizeClass} font-bold text-typography-900 ${className}`}
      style={[{ fontFamily: 'GIP-Bold' }, style]} 
      {...props} 
    />
  );
};

export default Heading;
