import React from "react";

interface SpinnerProps {
  size?: number;
  color?: string;
  className?: string;
}

function Spinner({
                   size = 32,
                   color = '#ef4444',
                   className = '',
                 }: Readonly<SpinnerProps>): React.ReactElement {
  return (
    <div
      className={`inline-block animate-spin ${className}`}
      style={{
        width: size,
        height: size,
        borderWidth: size / 8,
        borderStyle: 'solid',
        borderColor: `${color} transparent ${color} transparent`,
        borderRadius: '50%',
      }}
      aria-label="Loading"
      role="alert"
    />
  );
}

export default Spinner;
