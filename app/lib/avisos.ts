import type { SituacaoDoAviso } from '@/app/lib/tipos';

export const AVISO_SAIU_PARA_ENTREGA = 'Seu pedido saiu para entrega!';
export const AVISO_ENTREGADOR_PROXIMO = 'O entregador está chegando. Fique atento!';
export const TEMPO_DO_AVISO_MS = 6000;

export function avisoDaMudanca(anterior: SituacaoDoAviso | null, atual: SituacaoDoAviso): string | null {
  if (atual.entregadorProximo && !anterior?.entregadorProximo) {
    return AVISO_ENTREGADOR_PROXIMO;
  }
  if (anterior !== null && anterior.status !== 'EM_ANDAMENTO' && atual.status === 'EM_ANDAMENTO') {
    return AVISO_SAIU_PARA_ENTREGA;
  }
  return null;
}
