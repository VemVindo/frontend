import type { SVGProps } from 'react';

export default function IconeNavegar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 11l18-8-8 18-2-8-8-2z" />
    </svg>
  );
}
