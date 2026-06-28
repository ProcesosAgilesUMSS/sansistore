import React from 'react';

interface Props {
  label: string;
  value: number;

  dim?: boolean;
  blue?: boolean;
}

export const Metric: React.FC<Props> = ({ label, value, dim, blue }) => {
  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-widest opacity-40 text-(--theme-text) mb-1">
        {label}
      </p>

      <span
        className={`text-sm font-mono font-medium ${
          dim
            ? 'opacity-50 text-(--theme-text)'
            : blue
              ? 'text-(--theme-info)'
              : 'text-(--theme-text)'
        }`}
      >
        {value}
      </span>
    </div>
  );
};
