import type { PedidoAtivo } from '@/app/lib/tipos';

// Dados fixos até o endpoint do link de rastreio existir.
export const PEDIDO_EXEMPLO = {
  nomeEstabelecimento: 'Cantina Dona Marta',
  iniciaisEstabelecimento: 'CM',
  numeroPedido: '4830',
};

export const PEDIDOS_ATIVOS_EXEMPLO: PedidoAtivo[] = [
  { id: 4830, recebedor: 'Carla Menezes', entregador: 'Bruno Lima', status: 'EM_ANDAMENTO', criadoEm: '2026-10-07T14:02:00-03:00' },
  { id: 4831, recebedor: 'Rafael Nunes', entregador: 'Bruno Lima', status: 'ATRIBUIDO', criadoEm: '2026-10-07T14:20:00-03:00' },
  { id: 4832, recebedor: 'João Pereira', entregador: null, status: 'PENDENTE', criadoEm: '2026-10-07T14:31:00-03:00' },
];
