import React from 'react';

export function Skeleton({ height = 44 }: { height?: number }) {
  return <div className="skeleton" style={{ height }} />;
}


