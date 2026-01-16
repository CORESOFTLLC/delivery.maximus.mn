/**
 * What3Words Icon Component
 * 
 * What3Words брэндийн 3 зураас бүхий icon
 * Улаан өнгө (#E11D48) нь What3Words брэндийн өнгө
 */
import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface What3WordsIconProps {
  size?: number;
  color?: string;
}

export function What3WordsIcon({ size = 16, color = '#E11D48' }: What3WordsIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 3 vertical lines representing /// */}
      <Path
        d="M4 4L8 20"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M10 4L14 20"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M16 4L20 20"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </Svg>
  );
}
