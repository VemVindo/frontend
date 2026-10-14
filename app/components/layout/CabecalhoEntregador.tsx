'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import Avatar from '@/app/components/ui/Avatar';

export interface CabecalhoEntregadorProps {
  nome: string;
  iniciais: string;
  veiculo?: string;
  acao?: ReactNode;
}

export default function CabecalhoEntregador({ nome, iniciais, veiculo, acao }: CabecalhoEntregadorProps) {
  const router = useRouter();

  return (
    <header className="bg-superficie">
      <div className="mx-auto flex h-[70px] md:h-[76px] max-w-[1280px] items-center gap-3 px-[18px] md:px-9">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex shrink-0 items-center gap-3 text-left"
          aria-label="Voltar para a página anterior"
        >
          <Avatar iniciais={iniciais} variante="escuro" tamanho={42} />
          <div>
            <p className="font-titulo font-bold text-[15px]">{nome}</p>
            {veiculo && <p className="text-[11px] text-texto-suave">{veiculo}</p>}
          </div>
        </button>

        <div className="ml-auto flex items-center">{acao}</div>
      </div>
    </header>
  );
}
