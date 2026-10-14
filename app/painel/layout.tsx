'use client';

import NavPainel from '@/app/components/layout/NavPainel';
import { useSessao } from '@/app/lib/useSessao';

export default function LayoutPainel({ children }: LayoutProps<'/painel'>) {
  const empresa = useSessao('ESTABELECIMENTO');
  if (!empresa) return null;

  return (
    <>
      <NavPainel />
      <main className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-[42px] md:py-9">{children}</main>
    </>
  );
}
