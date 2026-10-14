import type { TomEtiqueta } from '@/app/components/ui/Etiqueta';
import type { StatusPedido } from '@/app/lib/tipos';

const ROTULO_STATUS: Record<StatusPedido, string> = {
  PENDENTE: 'Pendente',
  ATRIBUIDO: 'Atribuído',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

const TOM_STATUS: Record<StatusPedido, TomEtiqueta> = {
  PENDENTE: 'alerta',
  ATRIBUIDO: 'neutro',
  EM_ANDAMENTO: 'neutro',
  CONCLUIDO: 'sucesso',
  CANCELADO: 'erro',
};

const STATUS_ENCERRADOS: string[] = ['CONCLUIDO', 'CANCELADO'];

export const ETAPAS_DA_ENTREGA: StatusPedido[] = ['ATRIBUIDO', 'EM_ANDAMENTO', 'CONCLUIDO'];

export function rotuloDoStatus(status: string): string {
  return ROTULO_STATUS[status as StatusPedido] ?? status;
}

export function tomDoStatus(status: string): TomEtiqueta {
  return TOM_STATUS[status as StatusPedido] ?? 'neutro';
}

export function pedidoEmAberto(status: string): boolean {
  return !STATUS_ENCERRADOS.includes(status);
}

export function etapaAlcancada(statusAtual: string, etapa: StatusPedido): boolean {
  const posicaoAtual = ETAPAS_DA_ENTREGA.indexOf(statusAtual as StatusPedido);
  return posicaoAtual >= ETAPAS_DA_ENTREGA.indexOf(etapa);
}

export function formatarDataHora(dataIso: string): string {
  return new Date(dataIso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
