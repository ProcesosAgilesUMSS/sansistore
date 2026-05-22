import React from 'react';

interface Props {
  className?: string;
}

export const Divider: React.FC<Props> = ({ className = '' }) => {
  return (
    <div
      className={`
        w-px
        h-7
        bg-(--theme-border)
        shrink-0
        ${className}
      `}
    />
  );
};
