'use client';

import AreaLogada from '@/app/components/AreaLogada';
import ListaVinculos from '@/app/components/entregador/ListaVinculos';
import PainelDadosCompartilhados from '@/app/components/entregador/PainelDadosCompartilhados';
import { TELA_DE_LOGIN } from '@/app/lib/rotas';
import { usePrivacidadeEntregador } from '@/app/lib/usePrivacidadeEntregador';
import { useSessao } from '@/app/lib/useSessao';

export default function AreaEntregador() {
  const entregador = useSessao('ENTREGADOR');
  const { dados, vinculos, ocupado, erro, responder } = usePrivacidadeEntregador(entregador !== null);
  if (!entregador) return null;

  return (
    <AreaLogada titulo="Minhas entregas" usuario={entregador.nome} telaDeLogin={TELA_DE_LOGIN.ENTREGADOR}>
      <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
        <div className="flex-1">
          {erro && <p role="alert" className="mb-4 text-[14px] text-red-500">{erro}</p>}
          {vinculos && <ListaVinculos vinculos={vinculos} ocupado={ocupado} onResponder={responder} />}
        </div>
        {dados && (
          <div className="xl:w-[380px]">
            <PainelDadosCompartilhados dados={dados} />
          </div>
        )}
      </div>
    </AreaLogada>
  );
}
