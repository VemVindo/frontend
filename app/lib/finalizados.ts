import type { PedidoAtivo, PeriodoDeConclusao } from '@/app/lib/tipos';

export const PERIODO_INICIAL: PeriodoDeConclusao = { de: '', ate: '' };

export function periodoDeConclusaoInvalido(periodo: PeriodoDeConclusao): boolean {
  return periodo.de !== '' && periodo.ate !== '' && periodo.de > periodo.ate;
}

function diaDaData(dataIso: string): string {
  const data = new Date(dataIso);
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function filtrarPorConclusao(pedidos: PedidoAtivo[], periodo: PeriodoDeConclusao): PedidoAtivo[] {
  if (periodo.de === '' && periodo.ate === '') return pedidos;

  return pedidos.filter((pedido) => {
    if (pedido.finalizadoEm === null) return false;
    const dia = diaDaData(pedido.finalizadoEm);
    if (periodo.de !== '' && dia < periodo.de) return false;
    if (periodo.ate !== '' && dia > periodo.ate) return false;
    return true;
  });
}
