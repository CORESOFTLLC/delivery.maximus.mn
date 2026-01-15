import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'elevated' | 'outline' | 'ghost' | 'filled';
}

const sizeMap = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

const variantMap = {
  elevated: 'bg-white shadow-md',
  outline: 'bg-white border border-typography-200',
  ghost: 'bg-transparent',
  filled: 'bg-background-50',
};

export const Card: React.FC<CardProps> = ({ 
  className = '', 
  size = 'md',
  variant = 'elevated',
  ...props 
}) => {
  const sizeClass = sizeMap[size];
  const variantClass = variantMap[variant];
  
  return (
    <View 
      className={`rounded-xl ${sizeClass} ${variantClass} ${className}`}
      {...props} 
    />
  );
};

export default Card;
