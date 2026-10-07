'use client';

import ListaVinculos from '@/app/components/entregador/ListaVinculos';
import PainelDadosCompartilhados from '@/app/components/entregador/PainelDadosCompartilhados';
import Card from '@/app/components/ui/Card';
import { usePrivacidadeEntregador } from '@/app/lib/usePrivacidadeEntregador';

export default function PaginaEntregador() {
  const { dados, vinculos, ocupado, erro, responder } = usePrivacidadeEntregador(true);

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-start">
      <div className="flex flex-1 flex-col gap-5">
        <Card titulo="Entregas realizadas" descricao="Histórico de hoje">
          <p className="text-xs text-texto-apoio">Nenhuma entrega por enquanto.</p>
        </Card>
        {erro && <p role="alert" className="text-[13px] text-erro">{erro}</p>}
        {vinculos && <ListaVinculos vinculos={vinculos} ocupado={ocupado} onResponder={responder} />}
      </div>
      {dados && (
        <div className="md:w-[380px]">
          <PainelDadosCompartilhados dados={dados} />
        </div>
      )}
    </div>
  );
}
