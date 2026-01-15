import React from 'react';
import { View } from 'react-native';

interface ProgressProps {
  className?: string;
  value: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const sizeMap = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

export const Progress: React.FC<ProgressProps> = ({ 
  className = '', 
  value = 0,
  size = 'md',
  children,
}) => {
  const sizeClass = sizeMap[size];
  const clampedValue = Math.min(100, Math.max(0, value));
  
  return (
    <View className={`${sizeClass} w-full bg-background-200 rounded-full overflow-hidden ${className}`}>
      {children || <ProgressFilledTrack value={clampedValue} />}
    </View>
  );
};

interface ProgressFilledTrackProps {
  className?: string;
  value?: number;
}

export const ProgressFilledTrack: React.FC<ProgressFilledTrackProps> = ({ 
  className = '',
  value = 0,
}) => {
  return (
    <View 
      className={`h-full bg-primary-600 rounded-full ${className}`}
      style={{ width: `${value}%` }}
    />
  );
};

export default Progress;
