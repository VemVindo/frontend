import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, atualizarCadastroDaEmpresa, buscarCadastroDaEmpresa } from '@/app/lib/api';
import type { CadastroDaEmpresa } from '@/app/lib/tipos';
import PaginaEmpresa from './page';

vi.mock('@/app/lib/api', async (original) => ({
  ...(await original<typeof import('@/app/lib/api')>()),
  buscarCadastroDaEmpresa: vi.fn(),
  atualizarCadastroDaEmpresa: vi.fn(),
}));

const CADASTRO: CadastroDaEmpresa = {
  nomeFantasia: 'Cantina Dona Marta',
  razaoSocial: 'Cantina Dona Marta Ltda',
  documento: { tipo: 'CNPJ', numero: '11222333000181' },
  email: 'contato@cantina.test',
  telefone: '61930000000',
  endereco: {
    cep: '70000000',
    logradouro: 'SQN 210 Bloco K',
    numero: 10,
    complemento: null,
    bairro: 'Asa Norte',
    cidade: 'Brasilia',
    uf: 'DF',
  },
  criadaEm: '2026-09-01T12:00:00Z',
  atualizadaEm: '2026-09-01T12:00:00Z',
};

describe('PaginaEmpresa', () => {
  beforeEach(() => {
    vi.mocked(buscarCadastroDaEmpresa).mockResolvedValue(CADASTRO);
    vi.mocked(atualizarCadastroDaEmpresa).mockResolvedValue({
      ...CADASTRO,
      telefone: '61940000000',
      atualizadaEm: '2026-10-20T15:00:00Z',
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('mostra os dados em modo leitura, com documento e datas', async () => {
    render(<PaginaEmpresa />);

    expect(await screen.findByText('11.222.333/0001-81')).toBeTruthy();
    expect(screen.getByText('Cantina Dona Marta Ltda')).toBeTruthy();
    expect(screen.getByText('(61) 93000-0000')).toBeTruthy();
    expect(screen.getByText(/CEP 70000-000/)).toBeTruthy();
    expect(screen.getByText(/Cadastro criado em/)).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('edita, salva e volta para a leitura com os novos dados', async () => {
    render(<PaginaEmpresa />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));

    fireEvent.change(screen.getByLabelText(/Telefone/), { target: { value: '61940000000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Dados atualizados.')).toBeTruthy();
    expect(screen.getByText('(61) 94000-0000')).toBeTruthy();
    expect(atualizarCadastroDaEmpresa).toHaveBeenCalledWith(expect.objectContaining({ telefone: '61940000000' }));
  });

  it('cancelar descarta o que foi digitado', async () => {
    render(<PaginaEmpresa />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));

    fireEvent.change(screen.getByLabelText('Nome fantasia'), { target: { value: 'Outro nome' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByText('Cantina Dona Marta')).toBeTruthy();
    expect(screen.queryByText('Outro nome')).toBeNull();
    expect(atualizarCadastroDaEmpresa).not.toHaveBeenCalled();
  });

  it('não salva dados inválidos', async () => {
    render(<PaginaEmpresa />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'invalido' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(screen.getByText('Informe um e-mail válido')).toBeTruthy();
    expect(atualizarCadastroDaEmpresa).not.toHaveBeenCalled();
  });

  it('mostra a recusa do backend e continua editando', async () => {
    vi.mocked(atualizarCadastroDaEmpresa).mockRejectedValue(new ApiError(409, 'E-mail ja cadastrado'));
    render(<PaginaEmpresa />);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect((await screen.findByRole('alert')).textContent).toBe('E-mail ja cadastrado');
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeTruthy();
  });

  it('avisa quando não consegue carregar', async () => {
    vi.mocked(buscarCadastroDaEmpresa).mockRejectedValue(new Error('falha'));
    render(<PaginaEmpresa />);

    expect(await screen.findByText('Não foi possível carregar os dados')).toBeTruthy();
  });
});
