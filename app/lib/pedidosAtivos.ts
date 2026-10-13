import { PEDIDOS_ATIVOS_EXEMPLO } from '@/app/lib/exemplos';
import type { DadosCompartilhados, PedidoAtivo } from '@/app/lib/tipos';

export async function listarPedidosAtivos(): Promise<PedidoAtivo[]> {
  return PEDIDOS_ATIVOS_EXEMPLO;
}

export async function atribuirEntregador(
  pedido: PedidoAtivo,
  entregador: DadosCompartilhados,
): Promise<PedidoAtivo> {
  return { ...pedido, entregador: entregador.nome, status: 'ATRIBUIDO' };
}
