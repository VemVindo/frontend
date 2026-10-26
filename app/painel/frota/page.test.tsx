import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, cadastrarEntregador, convidarEntregador, editarEntregador, listarFrota } from '@/app/lib/api';
import PaginaFrota from './page';

vi.mock('@/app/lib/api', async (original) => ({
  ...(await original<typeof import('@/app/lib/api')>()),
  cadastrarEntregador: vi.fn(),
  convidarEntregador: vi.fn(),
  listarFrota: vi.fn(),
  editarEntregador: vi.fn(),
}));

const BRUNO = {
  nome: 'Bruno Lima',
  cpf: '98765432100',
  telefone: '61910000002',
  tipoVeiculo: 'CARRO',
  placa: 'XYZ9E87',
  disponivel: true,
};

const MENSAGEM_CONVITE = 'Se o CPF for de um entregador cadastrado, ele recebera o convite no app.';

function campo(rotulo: string) {
  return screen.getByLabelText(rotulo) as HTMLInputElement;
}

function preencher(rotulo: string, valor: string) {
  fireEvent.change(campo(rotulo), { target: { value: valor } });
}

function preencherCadastro(tipoVeiculo = 'MOTO') {
  preencher('Nome completo', 'Joana Lima');
  preencher('CPF', '529.982.247-25');
  preencher('Telefone', '(61) 98888-7777');
  preencher('Tipo de veículo', tipoVeiculo);
  if (tipoVeiculo !== 'BICICLETA') preencher('Placa', 'abc-1d23');
}

describe('PaginaFrota', () => {
  beforeEach(() => {
    vi.mocked(cadastrarEntregador).mockResolvedValue({
      entregador: { cpf: '52998224725', nome: 'Joana Lima', tipoVeiculo: 'MOTO', placa: 'ABC1D23' },
      status: 'PENDENTE',
      senhaTemporaria: 'Kx7#pQ2m',
      senhaTemporariaExpiraEm: '2026-10-25T15:00:00Z',
    });
    vi.mocked(convidarEntregador).mockResolvedValue({ mensagem: MENSAGEM_CONVITE });
    vi.mocked(listarFrota).mockResolvedValue([BRUNO]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('mostra os entregadores da frota', async () => {
    render(<PaginaFrota />);

    expect(await screen.findByText('Bruno Lima')).toBeTruthy();
    expect(screen.getByText('Carro - XYZ9E87')).toBeTruthy();
  });

  it('edita o entregador e atualiza a lista', async () => {
    vi.mocked(editarEntregador).mockResolvedValue(true);
    render(<PaginaFrota />);

    fireEvent.click(await screen.findByRole('button', { name: 'Editar Bruno Lima' }));
    preencher('Nome do entregador', 'Bruno Lima Souza');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(await screen.findByText('Dados de Bruno Lima Souza atualizados.')).toBeTruthy();
    expect(screen.getByText('Bruno Lima Souza')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Salvar alterações' })).toBeNull();
  });

  it('avisa quando a frota não carrega', async () => {
    vi.mocked(listarFrota).mockRejectedValue(new ApiError(500, 'Erro'));
    render(<PaginaFrota />);

    expect(await screen.findByText('Não foi possível carregar a frota agora.')).toBeTruthy();
  });

  it('cadastra o entregador e mostra a senha temporaria uma vez', async () => {
    render(<PaginaFrota />);

    preencherCadastro();
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar entregador' }));

    expect(await screen.findByText('Kx7#pQ2m')).toBeTruthy();
    expect(cadastrarEntregador).toHaveBeenCalledWith({
      nome: 'Joana Lima',
      cpf: '52998224725',
      telefone: '61988887777',
      tipoVeiculo: 'MOTO',
      placa: 'ABC1D23',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar outro entregador' }));

    expect(screen.queryByText('Kx7#pQ2m')).toBeNull();
    expect(campo('Nome completo').value).toBe('');
  });

  it('esconde a placa e nao a envia para bicicleta', async () => {
    render(<PaginaFrota />);

    preencherCadastro('BICICLETA');

    expect(screen.queryByLabelText('Placa')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar entregador' }));
    await vi.waitFor(() => expect(cadastrarEntregador).toHaveBeenCalled());
    expect(vi.mocked(cadastrarEntregador).mock.calls[0][0]).not.toHaveProperty('placa');
  });

  it('nao envia o cadastro com campo invalido', () => {
    render(<PaginaFrota />);

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar entregador' }));

    expect(screen.getByText('Escolha o tipo de veículo')).toBeTruthy();
    expect(cadastrarEntregador).not.toHaveBeenCalled();
  });

  it('com CPF ja cadastrado, leva o CPF para o convite', async () => {
    vi.mocked(cadastrarEntregador).mockRejectedValue(
      new ApiError(409, 'Entregador ja cadastrado na plataforma; envie um convite pelo CPF'),
    );
    render(<PaginaFrota />);

    preencherCadastro();
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar entregador' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Convidar este CPF' }));

    expect(campo('CPF do entregador').value).toBe('52998224725');
    expect(document.activeElement).toBe(campo('CPF do entregador'));
    expect(campo('CPF').value).toBe('');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('mostra o erro do backend sem oferecer convite nos outros casos', async () => {
    vi.mocked(cadastrarEntregador).mockRejectedValue(new ApiError(429, 'ThrottlerException: Too Many Requests'));
    render(<PaginaFrota />);

    preencherCadastro();
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar entregador' }));

    expect((await screen.findByRole('alert')).textContent).toContain('Too Many Requests');
    expect(screen.queryByRole('button', { name: 'Convidar este CPF' })).toBeNull();
  });

  it('envia o convite pelo CPF e mostra a resposta do backend', async () => {
    render(<PaginaFrota />);

    preencher('CPF do entregador', '98765432100');
    fireEvent.click(screen.getByRole('button', { name: 'Enviar convite' }));

    expect(await screen.findByText(MENSAGEM_CONVITE)).toBeTruthy();
    expect(convidarEntregador).toHaveBeenCalledWith('98765432100');
    expect(campo('CPF do entregador').value).toBe('');
  });

  it('nao envia convite com CPF invalido', () => {
    render(<PaginaFrota />);

    preencher('CPF do entregador', '12345678900');
    fireEvent.click(screen.getByRole('button', { name: 'Enviar convite' }));

    expect(screen.getByText('CPF inválido')).toBeTruthy();
    expect(convidarEntregador).not.toHaveBeenCalled();
  });
});
