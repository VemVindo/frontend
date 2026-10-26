import type { EtapaDoPedido, MarcoDoPedido, StatusPedido } from '@/app/lib/tipos';

export interface PassoDaLinhaDoTempo {
  etapa: EtapaDoPedido;
  rotulo: string;
  em: string | null;
  atual: boolean;
}

const ROTULO_DA_ETAPA: Record<EtapaDoPedido, string> = {
  CRIADO: 'Pedido criado',
  PENDENTE: 'Pedido criado',
  EM_ANDAMENTO: 'Saiu para entrega',
  FINALIZADO: 'Entregue',
  CANCELADO: 'Cancelado',
};

export function montarLinhaDoTempo(
  doServidor: MarcoDoPedido[],
  doTempoReal: MarcoDoPedido[],
  statusAtual: StatusPedido,
): PassoDaLinhaDoTempo[] {
  const horario = new Map<EtapaDoPedido, string>();
  for (const marco of [...doServidor, ...doTempoReal]) {
    if (!horario.has(marco.etapa)) horario.set(marco.etapa, marco.em);
  }

  const etapas: EtapaDoPedido[] =
    statusAtual === 'CANCELADO'
      ? ['CRIADO', ...(horario.has('EM_ANDAMENTO') ? (['EM_ANDAMENTO'] as const) : []), 'CANCELADO']
      : ['CRIADO', 'EM_ANDAMENTO', 'FINALIZADO'];

  const etapaAtual = statusAtual === 'PENDENTE' ? 'CRIADO' : statusAtual;
  return etapas.map((etapa) => ({
    etapa,
    rotulo: ROTULO_DA_ETAPA[etapa],
    em: horario.get(etapa) ?? null,
    atual: etapa === etapaAtual,
  }));
}
