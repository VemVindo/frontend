import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, cadastrarEmpresa } from '@/app/lib/api';
import PaginaCadastro from './page';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('@/app/lib/api', async (original) => ({
  ...(await original<typeof import('@/app/lib/api')>()),
  cadastrarEmpresa: vi.fn(),
}));

function preencher(rotulo: string, valor: string) {
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });
}

function preencherTudo() {
  preencher('CNPJ', '11.222.333/0001-81');
  preencher('Razão social', 'Cantina Dona Marta Ltda');
  preencher('Nome fantasia', 'Cantina Dona Marta');
  preencher('E-mail', 'contato@cantina.test');
  preencher('Telefone', '(61) 93000-0000');
  preencher('CEP', '70000-000');
  preencher('Logradouro', 'SQN 210 Bloco K');
  preencher('Número', '10');
  preencher('Bairro', 'Asa Norte');
  preencher('Cidade', 'Brasilia');
  preencher('UF', 'DF');
  preencher('Senha', 'senhaForte1');
  preencher('Confirme a senha', 'senhaForte1');
}

describe('PaginaCadastro', () => {
  beforeEach(() => {
    vi.mocked(cadastrarEmpresa).mockResolvedValue({
      tokenAcesso: 't',
      expiraEm: '2026-10-21T00:00:00Z',
      usuario: { id: 1, nomeFantasia: 'Cantina Dona Marta', email: 'contato@cantina.test', cargo: 'ESTABELECIMENTO' },
    } as never);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('cadastra por CNPJ e entra no painel', async () => {
    render(<PaginaCadastro />);
    preencherTudo();

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/painel'));
    expect(cadastrarEmpresa).toHaveBeenCalledWith(
      expect.objectContaining({ cnpj: '11222333000181', telefone: '61930000000', cep: '70000000', numero: 10 }),
    );
  });

  it('com CPF esconde a razão social', () => {
    render(<PaginaCadastro />);

    fireEvent.click(screen.getByLabelText('CPF (produtor)'));

    expect(screen.getByLabelText('CPF')).toBeTruthy();
    expect(screen.queryByLabelText('Razão social')).toBeNull();
  });

  it('não envia com campos inválidos e mostra os erros', () => {
    render(<PaginaCadastro />);

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(screen.getByText('CNPJ inválido')).toBeTruthy();
    expect(screen.getAllByText('Preencha este campo').length).toBeGreaterThan(0);
    expect(cadastrarEmpresa).not.toHaveBeenCalled();
  });

  it('mostra a recusa do backend, como e-mail já cadastrado', async () => {
    vi.mocked(cadastrarEmpresa).mockRejectedValue(new ApiError(409, 'E-mail ja cadastrado'));
    render(<PaginaCadastro />);
    preencherTudo();

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect((await screen.findByRole('alert')).textContent).toBe('E-mail ja cadastrado');
    expect(replace).not.toHaveBeenCalled();
  });
});
