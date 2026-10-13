import { PEDIDOS_ATIVOS_EXEMPLO } from '@/app/lib/exemplos';
import type { DadosCompartilhados, PedidoAtivo } from '@/app/lib/tipos';
import { reatribuirPedidos } from './api';

export async function listarPedidosAtivos(): Promise<PedidoAtivo[]> {
  return PEDIDOS_ATIVOS_EXEMPLO;
}

export async function atribuirEntregador(
  pedido: PedidoAtivo,
  entregador: DadosCompartilhados,
): Promise<PedidoAtivo> {
  return { ...pedido, entregador: entregador.nome, status: 'ATRIBUIDO' };
}

export async function reatribuirEntregador(
  pedido: PedidoAtivo,
  entregador: DadosCompartilhados,
): Promise<PedidoAtivo> {
  return await reatribuirPedidos(pedido.id, entregador.cpf);
}
