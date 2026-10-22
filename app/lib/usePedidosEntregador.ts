'use client';

import { useCallback, useEffect, useState } from 'react';
import { listarPedidosDoEntregador } from '@/app/lib/api';
import type { PedidoDoEntregador } from '@/app/lib/tipos';

const INTERVALO_DE_ATUALIZACAO_MS = 15_000;

export function usePedidosEntregador() {
  const [pedidos, setPedidos] = useState<PedidoDoEntregador[] | null>(null);
  const [erro, setErro] = useState(false);

  const recarregar = useCallback(async () => {
    try {
      setPedidos(await listarPedidosDoEntregador());
      setErro(false);
    } catch {
      setErro(true);
    }
  }, []);

  useEffect(() => {
    let cancelado = false;
    function carregar() {
      listarPedidosDoEntregador()
        .then((lista) => {
          if (cancelado) return;
          setPedidos(lista);
          setErro(false);
        })
        .catch(() => {
          if (cancelado) return;
          setErro(true);
        });
    }
    carregar();
    const intervalo = setInterval(carregar, INTERVALO_DE_ATUALIZACAO_MS);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, []);

  return { pedidos, erro, recarregar };
}
