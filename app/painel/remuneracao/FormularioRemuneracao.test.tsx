import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, buscarParametrosRemuneracao, salvarParametrosRemuneracao } from '@/app/lib/api';
import FormularioRemuneracao from './FormularioRemuneracao';

vi.mock('@/app/lib/api', async (original) => ({
  ...(await original<typeof import('@/app/lib/api')>()),
  buscarParametrosRemuneracao: vi.fn(),
  salvarParametrosRemuneracao: vi.fn(),
}));

const SALVOS = { taxaFixa: 800, coeficienteKm: 150, vigenteDesde: '2026-10-01T12:00:00Z' };

function campo(rotulo: string) {
  return screen.getByLabelText(rotulo) as HTMLInputElement;
}

describe('FormularioRemuneracao', () => {
  beforeEach(() => {
    vi.mocked(buscarParametrosRemuneracao).mockResolvedValue(SALVOS);
    vi.mocked(salvarParametrosRemuneracao).mockResolvedValue({
      taxaFixa: 950,
      coeficienteKm: 210,
      vigenteDesde: '2026-10-20T15:00:00Z',
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('carrega os parâmetros vigentes em reais', async () => {
    render(<FormularioRemuneracao />);

    expect(await screen.findByText(/Valores em vigor desde/)).toBeTruthy();
    expect(campo('Valor base por entrega').value).toBe('8,00');
    expect(campo('Adicional por quilômetro').value).toBe('1,50');
  });

  it('começa vazio quando a empresa ainda não salvou parâmetros', async () => {
    vi.mocked(buscarParametrosRemuneracao).mockResolvedValue({
      taxaFixa: null,
      coeficienteKm: null,
      vigenteDesde: null,
    });
    render(<FormularioRemuneracao />);

    expect(await screen.findByText(/Nenhum parâmetro salvo ainda/)).toBeTruthy();
    expect(campo('Valor base por entrega').value).toBe('');
  });

  it('salva em centavos e mostra a confirmação', async () => {
    render(<FormularioRemuneracao />);
    await screen.findByText(/Valores em vigor desde/);

    fireEvent.change(campo('Valor base por entrega'), { target: { value: '9,50' } });
    fireEvent.change(campo('Adicional por quilômetro'), { target: { value: '2,10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar parâmetros' }));

    expect(await screen.findByText(/valem para as próximas entregas/)).toBeTruthy();
    expect(salvarParametrosRemuneracao).toHaveBeenCalledWith({ taxaFixa: 950, coeficienteKm: 210 });
  });

  it('não envia valores inválidos', async () => {
    render(<FormularioRemuneracao />);
    await screen.findByText(/Valores em vigor desde/);

    fireEvent.change(campo('Valor base por entrega'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar parâmetros' }));

    expect(await screen.findByText('O valor precisa ser maior que zero')).toBeTruthy();
    expect(salvarParametrosRemuneracao).not.toHaveBeenCalled();
  });

  it('mostra a mensagem do backend quando o salvamento falha', async () => {
    vi.mocked(salvarParametrosRemuneracao).mockRejectedValue(
      new ApiError(409, 'Os parâmetros acabaram de ser alterados; tente de novo'),
    );
    render(<FormularioRemuneracao />);
    await screen.findByText(/Valores em vigor desde/);

    fireEvent.click(screen.getByRole('button', { name: 'Salvar parâmetros' }));

    expect(await screen.findByText(/acabaram de ser alterados/)).toBeTruthy();
  });

  it('oferece tentar de novo quando não consegue carregar', async () => {
    vi.mocked(buscarParametrosRemuneracao).mockRejectedValueOnce(new Error('falha'));
    render(<FormularioRemuneracao />);

    fireEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText(/Valores em vigor desde/)).toBeTruthy();
    expect(buscarParametrosRemuneracao).toHaveBeenCalledTimes(2);
  });

  it('mostra uma mensagem genérica quando o salvamento falha fora do backend', async () => {
    vi.mocked(salvarParametrosRemuneracao).mockRejectedValue(new Error('rede caiu'));
    render(<FormularioRemuneracao />);
    await screen.findByText(/Valores em vigor desde/);

    fireEvent.click(screen.getByRole('button', { name: 'Salvar parâmetros' }));

    expect(await screen.findByText('Não foi possível salvar. Tente de novo.')).toBeTruthy();
  });

  it.each([
    ['chega', (busca: PromiseWithResolvers<typeof SALVOS>) => busca.resolve(SALVOS)],
    ['falha', (busca: PromiseWithResolvers<typeof SALVOS>) => busca.reject(new Error('falha'))],
  ])('ignora a resposta que %s depois de sair da tela', async (_, responder) => {
    const busca = Promise.withResolvers<typeof SALVOS>();
    vi.mocked(buscarParametrosRemuneracao).mockReturnValue(busca.promise);
    const erroNoConsole = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = render(<FormularioRemuneracao />);

    unmount();
    responder(busca);
    await busca.promise.catch(() => undefined);
    await new Promise((resolver) => setTimeout(resolver, 0));

    expect(erroNoConsole).not.toHaveBeenCalled();
    erroNoConsole.mockRestore();
  });
});
