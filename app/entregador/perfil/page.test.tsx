import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, atualizarPerfilDoEntregador, buscarPerfilDoEntregador } from '@/app/lib/api';
import { TELA_INICIAL, TELA_TROCAR_SENHA } from '@/app/lib/rotas';
import type { PerfilDoEntregador } from '@/app/lib/tipos';
import PaginaPerfilDoEntregador from './page';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('@/app/lib/api', async (original) => ({
  ...(await original<typeof import('@/app/lib/api')>()),
  buscarPerfilDoEntregador: vi.fn(),
  atualizarPerfilDoEntregador: vi.fn(),
}));

const PERFIL: PerfilDoEntregador = {
  nome: 'Joana Lima',
  cpf: '52998224725',
  telefone: '61988887777',
  tipoVeiculo: 'CARRO',
  placa: 'ABC1234',
};

describe('PaginaPerfilDoEntregador', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('carrega o cadastro e oferece voltar para as entregas', async () => {
    vi.mocked(buscarPerfilDoEntregador).mockResolvedValue(PERFIL);
    render(<PaginaPerfilDoEntregador />);

    expect(screen.getByRole('heading', { name: 'Meu cadastro' })).toBeTruthy();
    expect(screen.getByText('Carregando cadastro...')).toBeTruthy();
    expect(((await screen.findByLabelText('Nome completo')) as HTMLInputElement).value).toBe('Joana Lima');
    expect(screen.getByRole('link', { name: 'Voltar para as entregas' }).getAttribute('href')).toBe(
      TELA_INICIAL.ENTREGADOR,
    );
  });

  it('avisa quando o cadastro não carrega', async () => {
    vi.mocked(buscarPerfilDoEntregador).mockRejectedValue(new ApiError(500, 'erro'));
    render(<PaginaPerfilDoEntregador />);

    expect((await screen.findByRole('alert')).textContent).toBe('Não foi possível carregar seu cadastro agora.');
    expect(replace).not.toHaveBeenCalled();
  });

  it('com senha temporária, manda trocar a senha ao abrir', async () => {
    vi.mocked(buscarPerfilDoEntregador).mockRejectedValue(new ApiError(403, 'troque a senha'));
    render(<PaginaPerfilDoEntregador />);

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith(TELA_TROCAR_SENHA));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('com senha temporária, manda trocar a senha ao salvar', async () => {
    vi.mocked(buscarPerfilDoEntregador).mockResolvedValue(PERFIL);
    vi.mocked(atualizarPerfilDoEntregador).mockRejectedValue(new ApiError(403, 'troque a senha'));
    render(<PaginaPerfilDoEntregador />);

    fireEvent.change(await screen.findByLabelText('Nome completo'), { target: { value: 'Joana Souza' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith(TELA_TROCAR_SENHA));
  });

  it('mantém os dados salvos na tela', async () => {
    vi.mocked(buscarPerfilDoEntregador).mockResolvedValue(PERFIL);
    vi.mocked(atualizarPerfilDoEntregador).mockResolvedValue({ ...PERFIL, nome: 'Joana Souza' });
    render(<PaginaPerfilDoEntregador />);

    fireEvent.change(await screen.findByLabelText('Nome completo'), { target: { value: 'Joana Souza' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByRole('status')).toBeTruthy();
    expect((screen.getByLabelText('Nome completo') as HTMLInputElement).value).toBe('Joana Souza');
  });

  it('ignora a resposta que chega depois de sair da tela', async () => {
    let responder: (perfil: PerfilDoEntregador) => void = () => undefined;
    let falhar: (erro: unknown) => void = () => undefined;
    vi.mocked(buscarPerfilDoEntregador)
      .mockReturnValueOnce(new Promise((resolver) => (responder = resolver)))
      .mockReturnValueOnce(new Promise((_resolver, rejeitar) => (falhar = rejeitar)));

    render(<PaginaPerfilDoEntregador />).unmount();
    render(<PaginaPerfilDoEntregador />).unmount();
    responder(PERFIL);
    falhar(new ApiError(403, 'troque a senha'));
    await new Promise((resolver) => setTimeout(resolver, 0));

    expect(replace).not.toHaveBeenCalled();
  });
});
