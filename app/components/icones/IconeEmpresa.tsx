import type { SVGProps } from 'react';

export default function IconeEmpresa(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 10l1.5-5h13L20 10" />
      <path d="M4 10h16v1.5a2.5 2.5 0 01-5 0 2.5 2.5 0 01-5 0 2.5 2.5 0 01-5 0V10z" />
      <path d="M5.5 13.5V20h13v-6.5" />
      <path d="M10 20v-4h4v4" />
    </svg>
  );
}
