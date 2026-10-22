import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, criarPedido } from '@/app/lib/api';
import { useSessao } from '@/app/lib/useSessao';
import type { CriarPedidoResposta, Empresa } from '@/app/lib/tipos';
import NovoPedidoModal from './NovoPedidoModal';

vi.mock('@/app/lib/useSessao', () => ({ useSessao: vi.fn() }));
vi.mock('@/app/lib/api', async (original) => ({
  ...(await original<typeof import('@/app/lib/api')>()), criarPedido: vi.fn(),
}));

const empresa: Empresa = { id: 42, nomeFantasia: 'Empresa fictícia', email: 'teste@example.com', cargo: 'ESTABELECIMENTO' };
const entrega = { valor_entrega: 1500, distancia: 4200 };
const pedido: CriarPedidoResposta = {
  id_pedido: 91, nome_recebedor: 'Carla', telefone_recebedor: '61999990000', cep: '70000000',
  logradouro: 'Rua A', numero: 10, complemento: null, bairro: 'Centro', cidade: 'Brasília', uf: 'DF',
  descricao: '', ...entrega, idEmpresa: 42, cpf_entregador: null, status: 'Pendente',
  data_criacao: '2026-10-22T12:00:00.000Z', data_inicio_entrega: null, data_finalizacao: null,
};
const campos = {
  nome_recebedor: 'Carla', telefone: '61999990000', cep: '70000000', logradouro: 'Rua A',
  numero: '10', complemento: 'Bloco B', bairro: 'Centro', cidade: 'Brasília', uf: 'DF',
  itens: '2 refeições', observacoes: 'Portaria',
};

function preencher() {
  for (const [nome, valor] of Object.entries(campos)) {
    fireEvent.change(document.querySelector(`[name="${nome}"]`)!, { target: { value: valor } });
  }
}
function formulario() { return document.querySelector('form')!; }

const showModalOriginal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const closeOriginal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');

beforeEach(() => {
  // jsdom não implementa a abertura modal nativa; mantemos o estado open para as consultas acessíveis.
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.open = false; } });
  vi.mocked(useSessao).mockReturnValue(empresa);
  vi.mocked(criarPedido).mockResolvedValue(pedido);
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  if (showModalOriginal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', showModalOriginal);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  if (closeOriginal) Object.defineProperty(HTMLDialogElement.prototype, 'close', closeOriginal);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

describe('NovoPedidoModal', () => {
  it.each([
    { nome: 'sessão expirada', erro: new ApiError(401, 'Não autorizado'), mensagem: 'Sua sessão expirou' },
    { nome: 'perfil sem permissão', erro: new ApiError(403, 'Proibido'), mensagem: 'Sua conta não tem permissão' },
    { nome: 'erro HTTP', erro: new ApiError(500, 'Erro de teste'), mensagem: 'Não foi possível criar o pedido: Erro de teste' },
    { nome: 'rede', erro: new TypeError('Failed to fetch'), mensagem: 'Verifique sua conexão' },
  ])('preserva formulário e informa falha: $nome', async ({ erro, mensagem }) => {
    vi.mocked(criarPedido).mockRejectedValue(erro);
    const onFechar = vi.fn();
    const onCriado = vi.fn();
    render(<NovoPedidoModal aberto onFechar={onFechar} onCriado={onCriado} obterEntrega={async () => entrega} />);
    preencher();
    fireEvent.submit(formulario());
    expect((await screen.findByRole('alert')).textContent).toContain(mensagem);
    for (const [nome, valor] of Object.entries(campos)) {
      expect((document.querySelector(`[name="${nome}"]`) as HTMLInputElement).value).toBe(valor);
    }
    expect(onFechar).not.toHaveBeenCalled();
    expect(onCriado).not.toHaveBeenCalled();
    expect((screen.getByRole('button', { name: 'Criar pedido' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it.each([{ nome: 'carregamento' }])('$nome bloqueia controles e nova submissão', async () => {
    let resolver!: (pedido: CriarPedidoResposta) => void;
    vi.mocked(criarPedido).mockReturnValue(new Promise((resolve) => { resolver = resolve; }));
    const onCriado = vi.fn();
    render(<NovoPedidoModal aberto onFechar={vi.fn()} onCriado={onCriado} obterEntrega={async () => entrega} />);
    preencher();
    fireEvent.submit(formulario());
    await waitFor(() => expect(criarPedido).toHaveBeenCalledOnce());
    expect(formulario().getAttribute('aria-busy')).toBe('true');
    expect((document.querySelector('fieldset') as HTMLFieldSetElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Criando pedido...' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('status').textContent).toContain('Calculando entrega');
    fireEvent.submit(formulario());
    expect(criarPedido).toHaveBeenCalledOnce();
    expect(onCriado).not.toHaveBeenCalled();
    await act(async () => { resolver(pedido); });
  });

  it.each([{ nome: 'sucesso' }])('$nome limpa somente após confirmação e comunica o pedido', async () => {
    let resolver!: (pedido: CriarPedidoResposta) => void;
    vi.mocked(criarPedido).mockReturnValue(new Promise((resolve) => { resolver = resolve; }));
    const onFechar = vi.fn();
    const onCriado = vi.fn();
    const obterEntrega = vi.fn().mockResolvedValue(entrega);
    const props = { onFechar, onCriado, obterEntrega };
    const { rerender } = render(<NovoPedidoModal aberto {...props} />);
    preencher();
    fireEvent.submit(formulario());
    await waitFor(() => expect(criarPedido).toHaveBeenCalledOnce());
    expect(onFechar).not.toHaveBeenCalled();
    expect(onCriado).not.toHaveBeenCalled();
    expect((document.querySelector('[name="nome_recebedor"]') as HTMLInputElement).value).toBe('Carla');
    await act(async () => { resolver(pedido); });
    expect(onCriado).toHaveBeenCalledExactlyOnceWith(pedido);
    expect(onFechar).toHaveBeenCalledOnce();
    expect(obterEntrega).toHaveBeenCalledWith(expect.any(Object), empresa);
    rerender(<NovoPedidoModal aberto={false} {...props} />);
    rerender(<NovoPedidoModal aberto {...props} />);
    for (const nome of Object.keys(campos)) {
      expect((document.querySelector(`[name="${nome}"]`) as HTMLInputElement).value).toBe('');
    }
  });
});
