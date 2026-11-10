'use client';

import { useState } from 'react';
import { ApiError, removerEntregador } from '@/app/lib/api';
import type { DadosCompartilhados } from '@/app/lib/tipos';
import type { ResultadoDaRemocaoDoEntregador } from '@/app/lib/tiposRemocaoEntregador';

function mensagemDaRemocao(nome: string, resultado: ResultadoDaRemocaoDoEntregador): string {
  const partes: string[] = [];
  if (resultado.reatribuidos.length > 0) {
    const quantidade = resultado.reatribuidos.length;
    partes.push(`${quantidade} ${quantidade === 1 ? 'pedido foi reatribuído' : 'pedidos foram reatribuídos'}`);
  }
  if (resultado.pendentes.length > 0) {
    const quantidade = resultado.pendentes.length;
    partes.push(`${quantidade} ${quantidade === 1 ? 'pedido voltou' : 'pedidos voltaram'} para a fila`);
  }
  return partes.length > 0 ? `${nome} foi removido da frota. ${partes.join('; ')}.` : `${nome} foi removido da frota.`;
}

export default function useRemocaoEntregador(onRemovido: (cpf: string) => void) {
  const [paraRemover, setParaRemover] = useState<DadosCompartilhados | null>(null);
  const [removendo, setRemovendo] = useState(false);
  const [erroDaRemocao, setErroDaRemocao] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  function escolher(entregador: DadosCompartilhados) {
    setParaRemover(entregador);
    setErroDaRemocao(null);
  }

  function fechar() {
    if (!removendo) setParaRemover(null);
  }

  async function confirmar() {
    if (!paraRemover || removendo) return;
    setRemovendo(true);
    setErroDaRemocao(null);
    try {
      const resultado = await removerEntregador(paraRemover.cpf);
      onRemovido(paraRemover.cpf);
      setAviso(mensagemDaRemocao(paraRemover.nome, resultado));
      setParaRemover(null);
    } catch (falha) {
      setErroDaRemocao(
        falha instanceof ApiError ? falha.message : 'Não foi possível remover o entregador agora. Tente novamente.',
      );
    } finally {
      setRemovendo(false);
    }
  }

  return { paraRemover, removendo, erroDaRemocao, aviso, escolher, fechar, confirmar };
}
