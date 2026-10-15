import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PARAMETROS_REMUNERACAO_EXEMPLO } from './exemplos';
import { buscarParametrosRemuneracao, salvarParametrosRemuneracao } from './parametrosRemuneracao';

async function concluir<T>(promessa: Promise<T>): Promise<T> {
  await vi.runAllTimersAsync();
  return promessa;
}

describe('parametrosRemuneracao', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('comeca com os valores de exemplo', async () => {
    await expect(concluir(buscarParametrosRemuneracao())).resolves.toEqual(PARAMETROS_REMUNERACAO_EXEMPLO);
  });

  it('devolve o que foi salvo na proxima busca', async () => {
    await concluir(salvarParametrosRemuneracao({ taxaFixa: 950, coeficienteKm: 210 }));

    await expect(concluir(buscarParametrosRemuneracao())).resolves.toEqual({ taxaFixa: 950, coeficienteKm: 210 });
  });

  it('nao deixa a tela alterar o valor guardado sem salvar', async () => {
    const buscado = await concluir(buscarParametrosRemuneracao());
    buscado.taxaFixa = 1;

    const deNovo = await concluir(buscarParametrosRemuneracao());
    expect(deNovo.taxaFixa).not.toBe(1);
  });
});
