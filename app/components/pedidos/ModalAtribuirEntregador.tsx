'use client';

import { useEffect, useState } from 'react';
import IconeFechar from '@/app/components/icones/IconeFechar';
import Avatar from '@/app/components/ui/Avatar';
import Botao from '@/app/components/ui/Botao';
import { listarFrota } from '@/app/lib/api';
import { rotuloDoVeiculo } from '@/app/lib/dadosCompartilhados';
import { atribuirEntregador } from '@/app/lib/pedidosAtivos';
import { iniciais } from '@/app/lib/texto';
import type { DadosCompartilhados, PedidoAtivo } from '@/app/lib/tipos';

export interface ModalAtribuirEntregadorProps {
  pedido: PedidoAtivo;
  onFechar: () => void;
  onAtribuido: (pedido: PedidoAtivo) => void;
  modo?: 'atribuir' | 'reatribuir';
}

export default function ModalAtribuirEntregador({
  pedido,
  onFechar,
  onAtribuido,
  modo = 'atribuir',
}: ModalAtribuirEntregadorProps) {
  const [disponiveis, setDisponiveis] = useState<DadosCompartilhados[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [atribuindo, setAtribuindo] = useState(false);

  useEffect(() => {
    let cancelado = false;
    listarFrota()
      .then((frota) => {
        if (!cancelado) setDisponiveis(frota.filter((entregador) => entregador.disponivel));
      })
      .catch(() => {
        if (!cancelado) setErro('Não foi possível carregar os entregadores agora.');
      });
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    function fecharComEsc(evento: KeyboardEvent) {
      if (evento.key === 'Escape') onFechar();
    }
    document.addEventListener('keydown', fecharComEsc);
    return () => document.removeEventListener('keydown', fecharComEsc);
  }, [onFechar]);

  async function atribuir(entregador: DadosCompartilhados) {
    setAtribuindo(true);
    setErro(null);
    try {
      onAtribuido(await atribuirEntregador(pedido, entregador));
    } catch {
      setErro('Não foi possível atribuir o entregador agora.');
      setAtribuindo(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div aria-hidden onClick={onFechar} className="absolute inset-0 bg-sobreposicao/55" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-atribuir-entregador"
        className="relative flex w-full max-w-[520px] flex-col gap-4 rounded-[20px] bg-superficie p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="titulo-atribuir-entregador" className="font-titulo text-lg font-bold">
            {modo === 'reatribuir' ? 'Reatribuir entregador' : 'Atribuir entregador'} #{pedido.id}
          </h2>
          <button type="button" aria-label="Fechar" onClick={onFechar} className="cursor-pointer text-texto">
            <IconeFechar className="size-5" />
          </button>
        </div>

        <p className="text-xs text-texto-apoio">
          {modo === 'reatribuir'
            ? 'Selecione um entregador disponível para reassumir este pedido.'
            : 'Selecione um entregador disponível para este pedido.'}
        </p>

        {erro && <p role="alert" className="text-xs text-erro">{erro}</p>}
        {!disponiveis && !erro && <p className="text-xs text-texto-apoio">Carregando entregadores...</p>}
        {disponiveis?.length === 0 && (
          <p className="text-xs text-texto-apoio">Nenhum entregador disponível no momento.</p>
        )}

        {disponiveis && disponiveis.length > 0 && (
          <ul className="flex max-h-[260px] flex-col gap-[10px] overflow-y-auto">
            {disponiveis.map((entregador) => (
              <li
                key={entregador.cpf}
                className="flex items-center gap-3 rounded-[8px] border border-borda px-[11px] py-2"
              >
                <Avatar iniciais={iniciais(entregador.nome)} tamanho={32} />
                <span className="flex flex-1 flex-col gap-1">
                  <span className="text-xs text-texto-corpo">{entregador.nome}</span>
                  <span className="text-[11px] text-texto-apoio">
                    {rotuloDoVeiculo(entregador.tipoVeiculo)}, disponível
                  </span>
                </span>
                <button
                  type="button"
                  disabled={atribuindo}
                  onClick={() => atribuir(entregador)}
                  className="cursor-pointer text-xs font-semibold text-destaque hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {modo === 'reatribuir' ? 'Reatribuir' : 'Atribuir'}
                </button>
              </li>
            ))}
          </ul>
        )}

        <Botao variante="claro" larguraTotal onClick={onFechar}>
          Cancelar
        </Botao>
      </div>
    </div>
  );
}
