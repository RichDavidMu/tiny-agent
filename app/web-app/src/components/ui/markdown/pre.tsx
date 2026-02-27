import type { JSX } from 'react';
import type { ExtraProps } from 'react-markdown';

export function PreComponent({ children }: JSX.IntrinsicElements['pre'] & ExtraProps) {
  return <>{children}</>;
}
