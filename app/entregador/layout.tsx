'use client';

import BotaoSair from '@/app/components/layout/BotaoSair';
import CabecalhoEntregador from '@/app/components/layout/CabecalhoEntregador';
import { iniciais } from '@/app/lib/texto';
import { useSessao } from '@/app/lib/useSessao';

export default function LayoutEntregador({ children }: LayoutProps<'/entregador'>) {
  const entregador = useSessao('ENTREGADOR');
  if (!entregador) return null;

  return (
    <>
      <CabecalhoEntregador
        nome={entregador.nome}
        iniciais={iniciais(entregador.nome)}
        acao={<BotaoSair cargo="ENTREGADOR" />}
      />
      <main className="mx-auto w-full max-w-[1280px] px-[18px] py-5 md:px-10 md:py-6">{children}</main>
    </>
  );
}
