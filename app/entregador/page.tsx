'use client';

import ListaPedidosEntregador from '@/app/components/entregador/ListaPedidosEntregador';
import ListaVinculos from '@/app/components/entregador/ListaVinculos';
import PainelDadosCompartilhados from '@/app/components/entregador/PainelDadosCompartilhados';
import { usePedidosEntregador } from '@/app/lib/usePedidosEntregador';
import { usePrivacidadeEntregador } from '@/app/lib/usePrivacidadeEntregador';

export default function PaginaEntregador() {
  const { dados, vinculos, ocupado, erro, responder } = usePrivacidadeEntregador(true);
  const { pedidos, erro: erroPedidos } = usePedidosEntregador();

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-start">
      <div className="flex flex-1 flex-col gap-5">
        {erroPedidos && (
          <p role="alert" className="text-[13px] text-erro">
            Não foi possível carregar suas entregas agora.
          </p>
        )}
        {pedidos && <ListaPedidosEntregador pedidos={pedidos} />}
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
