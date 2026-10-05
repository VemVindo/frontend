'use client';

import AreaLogada from '@/app/components/AreaLogada';
import { TELA_DE_LOGIN, useSessao } from '@/app/lib/useSessao';

export default function Painel() {
  const empresa = useSessao('ESTABELECIMENTO');
  if (!empresa) return null;

  return (
    <AreaLogada titulo="Painel" usuario={empresa.nomeFantasia} telaDeLogin={TELA_DE_LOGIN.ESTABELECIMENTO}>
      <p className="text-[#1D1B2E]">Pedidos, frota e métricas do estabelecimento vão aparecer aqui.</p>
    </AreaLogada>
  );
}
