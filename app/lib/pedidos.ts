import type { TomEtiqueta } from '@/app/components/ui/Etiqueta';
import type { StatusPedido } from '@/app/lib/tipos';

const ROTULO_STATUS: Record<StatusPedido, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

const TOM_STATUS: Record<StatusPedido, TomEtiqueta> = {
  PENDENTE: 'alerta',
  EM_ANDAMENTO: 'neutro',
  FINALIZADO: 'sucesso',
  CANCELADO: 'erro',
};

// Rótulo do botão que leva o pedido a cada status (PATCH /pedidos/:id/status).
const ACAO_DO_STATUS: Record<StatusPedido, string> = {
  PENDENTE: 'Voltar para pendente',
  EM_ANDAMENTO: 'Iniciar entrega',
  FINALIZADO: 'Finalizar entrega',
  CANCELADO: 'Cancelar entrega',
};

const STATUS_ENCERRADOS: string[] = ['FINALIZADO', 'CANCELADO'];

export const ETAPAS_DA_ENTREGA: StatusPedido[] = ['PENDENTE', 'EM_ANDAMENTO', 'FINALIZADO'];

export function rotuloDoStatus(status: string): string {
  return ROTULO_STATUS[status as StatusPedido] ?? status;
}

export function tomDoStatus(status: string): TomEtiqueta {
  return TOM_STATUS[status as StatusPedido] ?? 'neutro';
}

export function acaoDoStatus(status: StatusPedido): string {
  return ACAO_DO_STATUS[status];
}

// Em aberto = ainda aceita atribuição ou reatribuição de entregador.
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

export function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function textoDaNota(nota: number | null): string {
  if (nota === null) return 'Sem avaliação';
  return `${nota} de 5`;
}

export function formatarDistancia(metros: number): string {
  return `${(metros / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
}

export interface EnderecoDeEntrega {
  logradouro: string;
  numero: number;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
}

// Mesmo formato do endereço que o backend monta para o entregador.
export function formatarEndereco(endereco: EnderecoDeEntrega): string {
  const complemento = endereco.complemento ? `, ${endereco.complemento}` : '';
  return `${endereco.logradouro}, ${endereco.numero}${complemento} - ${endereco.bairro}, ${endereco.cidade}/${endereco.uf}`;
}
