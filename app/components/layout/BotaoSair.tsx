'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Botao from '@/app/components/ui/Botao';
import { sair } from '@/app/lib/api';
import { TELA_DE_LOGIN } from '@/app/lib/rotas';
import type { Cargo } from '@/app/lib/tipos';

export interface BotaoSairProps {
  cargo: Cargo;
  larguraTotal?: boolean;
}

export default function BotaoSair({ cargo, larguraTotal }: BotaoSairProps) {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);

  async function handleSair() {
    setSaindo(true);
    await sair().catch(() => undefined);
    router.replace(TELA_DE_LOGIN[cargo]);
  }

  return (
    <Botao variante="claro" onClick={handleSair} disabled={saindo} larguraTotal={larguraTotal}>
      Sair
    </Botao>
  );
}
