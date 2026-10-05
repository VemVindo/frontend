'use client';

import AreaLogada from '@/app/components/AreaLogada';
import { TELA_DE_LOGIN, useSessao } from '@/app/lib/useSessao';

export default function AreaEntregador() {
  const entregador = useSessao('ENTREGADOR');
  if (!entregador) return null;

  return (
    <AreaLogada titulo="Minhas entregas" usuario={entregador.nome} telaDeLogin={TELA_DE_LOGIN.ENTREGADOR}>
      <p className="text-[#1D1B2E]">As entregas atribuídas a você vão aparecer aqui.</p>
    </AreaLogada>
  );
}
