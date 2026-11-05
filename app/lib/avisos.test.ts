import { describe, expect, it } from 'vitest';
import { AVISO_ENTREGADOR_PROXIMO, AVISO_SAIU_PARA_ENTREGA, avisoDaMudanca } from './avisos';
import type { SituacaoDoAviso } from './tipos';

const PENDENTE: SituacaoDoAviso = { status: 'PENDENTE', entregadorProximo: false };
const A_CAMINHO: SituacaoDoAviso = { status: 'EM_ANDAMENTO', entregadorProximo: false };
const PERTO: SituacaoDoAviso = { status: 'EM_ANDAMENTO', entregadorProximo: true };
const FINALIZADO: SituacaoDoAviso = { status: 'FINALIZADO', entregadorProximo: false };

describe('avisoDaMudanca', () => {
  it.each([
    ['saiu para entrega', PENDENTE, A_CAMINHO, AVISO_SAIU_PARA_ENTREGA],
    ['o entregador chegou perto', A_CAMINHO, PERTO, AVISO_ENTREGADOR_PROXIMO],
    ['abriu a página com o entregador já perto', null, PERTO, AVISO_ENTREGADOR_PROXIMO],
    ['saiu para entrega já perto', PENDENTE, PERTO, AVISO_ENTREGADOR_PROXIMO],
    ['abriu a página com a entrega já em andamento', null, A_CAMINHO, null],
    ['nada mudou', A_CAMINHO, A_CAMINHO, null],
    ['o entregador continua perto', PERTO, PERTO, null],
    ['o entregador se afastou', PERTO, A_CAMINHO, null],
    ['a entrega terminou', PERTO, FINALIZADO, null],
  ])('quando %s', (_caso, anterior, atual, esperado) => {
    expect(avisoDaMudanca(anterior, atual)).toBe(esperado);
  });
});
