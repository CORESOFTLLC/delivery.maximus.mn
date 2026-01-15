import React from 'react';
import { ScrollView as RNScrollView, ScrollViewProps } from 'react-native';

interface StyledScrollViewProps extends ScrollViewProps {
  className?: string;
}

export const ScrollView: React.FC<StyledScrollViewProps> = ({ 
  className = '', 
  ...props 
}) => {
  return <RNScrollView className={className} {...props} />;
};

export default ScrollView;
