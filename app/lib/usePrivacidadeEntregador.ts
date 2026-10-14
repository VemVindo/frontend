'use client';

import { useEffect, useState } from 'react';
import { buscarDadosCompartilhados, listarVinculos } from '@/app/lib/api';
import type { DadosCompartilhados, Vinculo } from '@/app/lib/tipos';
import { ERRO_ACAO, EXECUTAR_ACAO, type AcaoVinculo } from '@/app/lib/vinculos';

function carregar() {
  return Promise.all([buscarDadosCompartilhados(), listarVinculos()]);
}

export function usePrivacidadeEntregador(habilitado: boolean) {
  const [dados, setDados] = useState<DadosCompartilhados | null>(null);
  const [vinculos, setVinculos] = useState<Vinculo[] | null>(null);
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function aplicar([compartilhados, lista]: Awaited<ReturnType<typeof carregar>>) {
    setDados(compartilhados.dados);
    setVinculos(lista);
  }

  useEffect(() => {
    if (!habilitado) return;
    let cancelado = false;
    carregar()
      .then((resultado) => {
        if (!cancelado) aplicar(resultado);
      })
      .catch(() => {
        if (!cancelado) setErro('Não foi possível carregar seus dados agora.');
      });
    return () => {
      cancelado = true;
    };
  }, [habilitado]);

  async function responder(id: number, acao: AcaoVinculo) {
    setOcupado(id);
    setErro(null);
    try {
      await EXECUTAR_ACAO[acao](id);
      aplicar(await carregar());
    } catch {
      setErro(ERRO_ACAO[acao]);
    } finally {
      setOcupado(null);
    }
  }

  return { dados, vinculos, ocupado, erro, responder };
}
