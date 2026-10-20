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

// R-US02: o caminho normal mostra as três etapas, as futuras sem horário.
// Pedido cancelado troca o "Entregue" pelo cancelamento e só mostra a saída
// para entrega se ela aconteceu.
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
