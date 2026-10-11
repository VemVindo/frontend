'use client';

import { useEffect, useState } from 'react';
import { listarPedidosDoEntregador } from '@/app/lib/api';
import type { PedidoDoEntregador } from '@/app/lib/tipos';

const INTERVALO_DE_ATUALIZACAO_MS = 15_000;

const PEDIDOS_ENTREGADOR_EXEMPLO: PedidoDoEntregador[] = [
  {
    id: 4830,
    status: 'EM_ANDAMENTO',
    empresa: 'Padaria Pão Quente',
    recebedor: 'Carla Menezes',
    endereco: 'SQN 210 BL. K, apto 304 - 1,2 km restantes',
    criadoEm: '2026-10-09T08:15:00-03:00',
    iniciadoEm: '2026-10-09T08:40:00-03:00',
    finalizadoEm: null,
  },
  {
    id: 4835,
    status: 'CONCLUIDO',
    empresa: 'Padaria Pão Quente',
    recebedor: 'João Pereira',
    endereco: 'SHIN QI 9 - 3,4 km',
    criadoEm: '2026-10-08T18:10:00-03:00',
    iniciadoEm: '2026-10-08T18:25:00-03:00',
    finalizadoEm: '2026-10-08T18:55:00-03:00',
  },
  {
    id: 4831,
    status: 'CONCLUIDO',
    empresa: 'Padaria Pão Quente',
    recebedor: 'Rafael Nunes',
    endereco: '706 Sul - 2,1 km',
    criadoEm: '2026-10-08T14:30:00-03:00',
    iniciadoEm: '2026-10-08T14:52:00-03:00',
    finalizadoEm: '2026-10-08T15:14:00-03:00',
  },
];

export function usePedidosEntregador() {
  const [pedidos, setPedidos] = useState<PedidoDoEntregador[] | null>(null);
  const [erro, setErro] = useState(false);

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
          setPedidos(PEDIDOS_ENTREGADOR_EXEMPLO);
          setErro(false);
        });
    }
    carregar();
    const intervalo = setInterval(carregar, INTERVALO_DE_ATUALIZACAO_MS);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, []);

  return { pedidos, erro };
}
