'use client';

import { useEffect, useState } from 'react';
import Botao from '@/app/components/ui/Botao';
import { ApiError, atualizarStatusDoPedido, obterStatusDisponiveis } from '@/app/lib/api';
import { acaoDoStatus, rotuloDoStatus } from '@/app/lib/pedidos';
import type { StatusPedido } from '@/app/lib/tipos';

export interface AcoesDeStatusProps {
  idPedido: number;
  statusAtual: StatusPedido;
  onAlterado: () => void;
}

// Os botões vêm de GET /pedidos/:id/status-disponiveis: o front não repete a
// máquina de estados do backend.
export default function AcoesDeStatus({ idPedido, statusAtual, onAlterado }: AcoesDeStatusProps) {
  const [disponiveis, setDisponiveis] = useState<StatusPedido[] | null>(null);
  const [confirmando, setConfirmando] = useState<StatusPedido | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    obterStatusDisponiveis(idPedido)
      .then((resposta) => {
        if (!cancelado) setDisponiveis(resposta.statusDisponiveis);
      })
      .catch(() => {
        if (!cancelado) setErro('Não foi possível carregar as ações do pedido.');
      });
    return () => {
      cancelado = true;
    };
  }, [idPedido, statusAtual]);

  async function confirmar(status: StatusPedido) {
    setEnviando(true);
    setErro(null);
    try {
      await atualizarStatusDoPedido(idPedido, status);
      setConfirmando(null);
      onAlterado();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível alterar o status agora.');
    } finally {
      setEnviando(false);
    }
  }

  const aviso = erro && (
    <p role="alert" className="text-[13px] text-erro">
      {erro}
    </p>
  );
  if (!disponiveis || disponiveis.length === 0) {
    return aviso || null;
  }

  if (confirmando) {
    return (
      <div className="flex flex-col gap-3 rounded-[18px] bg-superficie p-4 ring-1 ring-borda">
        {aviso}
        <p className="text-sm text-texto-apoio">
          Mudar o pedido para <span className="font-semibold text-texto">{rotuloDoStatus(confirmando)}</span>?
        </p>
        <div className="flex gap-3">
          <Botao variante="secundario" className="flex-1" disabled={enviando} onClick={() => setConfirmando(null)}>
            Voltar
          </Botao>
          <Botao className="flex-1" disabled={enviando} onClick={() => confirmar(confirmando)}>
            Confirmar
          </Botao>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {aviso}
      {disponiveis.map((status) => (
        <Botao key={status} larguraTotal className="h-14 text-base" onClick={() => setConfirmando(status)}>
          {acaoDoStatus(status)}
        </Botao>
      ))}
    </div>
  );
}
