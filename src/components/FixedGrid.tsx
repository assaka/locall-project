// Fix for MUI v7 Grid compatibility
import { Grid as MuiGrid, GridProps } from '@mui/material';
import React from 'react';

interface FixedGridProps extends Omit<GridProps, 'item' | 'container'> {
  item?: boolean;
  container?: boolean;
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
  xl?: number | boolean;
}

export const Grid: React.FC<FixedGridProps> = ({ 
  item, 
  container, 
  xs, 
  sm, 
  md, 
  lg, 
  xl, 
  children, 
  ...props 
}) => {
  const gridProps: any = { ...props };
  
  if (container) {
    gridProps.container = true;
  }
  
  if (item) {
    gridProps.item = true;
  }
  
  if (xs !== undefined) gridProps.xs = xs;
  if (sm !== undefined) gridProps.sm = sm;
  if (md !== undefined) gridProps.md = md;
  if (lg !== undefined) gridProps.lg = lg;
  if (xl !== undefined) gridProps.xl = xl;

  return <MuiGrid {...gridProps}>{children}</MuiGrid>;
};
