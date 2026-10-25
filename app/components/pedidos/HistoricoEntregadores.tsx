'use client';

import { useEffect, useState } from 'react';
import Card from '@/app/components/ui/Card';
import { ApiError, listarHistoricoDeEntregadores } from '@/app/lib/api';
import { formatarDataHora } from '@/app/lib/pedidos';
import type { TrocaDeEntregador } from '@/app/lib/tipos';

export interface HistoricoEntregadoresProps {
  idPedido: number;
}

export default function HistoricoEntregadores({ idPedido }: HistoricoEntregadoresProps) {
  const [trocas, setTrocas] = useState<TrocaDeEntregador[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    listarHistoricoDeEntregadores(idPedido)
      .then((lista) => {
        if (!cancelado) setTrocas(lista);
      })
      .catch((err: unknown) => {
        if (cancelado) return;
        setErro(
          err instanceof ApiError && err.status === 404
            ? 'Pedido não encontrado no seu estabelecimento.'
            : 'Não foi possível carregar o histórico agora.',
        );
      });
    return () => {
      cancelado = true;
    };
  }, [idPedido]);

  return (
    <Card
      titulo="Histórico de entregadores"
      descricao="Cada atribuição e reatribuição do pedido, da mais antiga à mais recente."
    >
      {erro && (
        <p role="alert" className="text-xs text-erro">
          {erro}
        </p>
      )}
      {!trocas && !erro && <p className="text-xs text-texto-apoio">Carregando histórico...</p>}
      {trocas?.length === 0 && <p className="text-xs text-texto-apoio">O pedido ainda não teve entregador.</p>}
      {trocas && trocas.length > 0 && (
        <ol className="flex flex-col gap-[10px]">
          {trocas.map((troca) => (
            <li
              key={`${troca.data}-${troca.novo}`}
              className="flex items-center justify-between gap-3 rounded-[8px] border border-borda px-[13px] py-3 text-xs text-texto-corpo"
            >
              <span>
                {troca.anterior ? (
                  <>
                    {troca.anterior} <span className="text-texto-apoio">para</span> {troca.novo}
                  </>
                ) : (
                  <>
                    <span className="text-texto-apoio">Atribuído a</span> {troca.novo}
                  </>
                )}
              </span>
              <span className="text-[11px] text-texto-apoio">{formatarDataHora(troca.data)}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
