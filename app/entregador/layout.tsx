'use client';

import Link from 'next/link';
import BotaoSair from '@/app/components/layout/BotaoSair';
import CabecalhoEntregador from '@/app/components/layout/CabecalhoEntregador';
import { TELA_PERFIL_ENTREGADOR } from '@/app/lib/rotas';
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
        acao={
          <div className="flex items-center gap-2">
            <Link
              href={TELA_PERFIL_ENTREGADOR}
              className="flex h-12 items-center rounded-[14px] border border-borda bg-superficie px-4 font-titulo text-sm font-bold text-texto hover:bg-superficie-suave"
            >
              Meu cadastro
            </Link>
            <BotaoSair cargo="ENTREGADOR" />
          </div>
        }
      />
      <main className="mx-auto w-full max-w-[1280px] px-[18px] py-5 md:px-10 md:py-6">{children}</main>
    </>
  );
}
