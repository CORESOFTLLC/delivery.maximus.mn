import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

interface TextProps extends RNTextProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const sizeMap = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
};

export const Text: React.FC<TextProps> = ({ 
  className = '', 
  size = 'md',
  ...props 
}) => {
  const sizeClass = sizeMap[size];
  return <RNText className={`${sizeClass} text-typography-900 ${className}`} {...props} />;
};

export default Text;
