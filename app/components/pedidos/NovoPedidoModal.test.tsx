import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, criarPedido } from '@/app/lib/api';
import { useSessao } from '@/app/lib/useSessao';
import type { CriarPedidoResposta, Empresa } from '@/app/lib/tipos';
import NovoPedidoModal from './NovoPedidoModal';

vi.mock('@/app/lib/useSessao', () => ({ useSessao: vi.fn() }));
vi.mock('@/app/lib/api', async (original) => ({
  ...(await original<typeof import('@/app/lib/api')>()),
  criarPedido: vi.fn(),
}));

const empresa: Empresa = {
  id: 42,
  nomeFantasia: 'Empresa fictícia',
  email: 'teste@example.com',
  cargo: 'ESTABELECIMENTO',
};
const entrega = { valor_entrega: 1500, distancia: 4200 };
const pedido: CriarPedidoResposta = {
  id_pedido: 91,
  nome_recebedor: 'Carla',
  telefone_recebedor: '61999990000',
  cep: '70000000',
  logradouro: 'Rua A',
  numero: 10,
  complemento: null,
  bairro: 'Centro',
  cidade: 'Brasília',
  uf: 'DF',
  descricao: '',
  ...entrega,
  idEmpresa: 42,
  cpf_entregador: null,
  status: 'PENDENTE',
  data_criacao: '2026-10-22T12:00:00.000Z',
  data_inicio_entrega: null,
  data_finalizacao: null,
};
const camposDoFormulario = {
  nome_recebedor: 'Carla',
  telefone: '61999990000',
  cep: '70000000',
  logradouro: 'Rua A',
  numero: '10',
  complemento: 'Bloco B',
  bairro: 'Centro',
  cidade: 'Brasília',
  uf: 'DF',
  itens: '2 refeições',
  observacoes: 'Portaria',
  tipo_veiculo: 'DRIVE',
};

function preencherFormulario() {
  for (const [nome, valor] of Object.entries(camposDoFormulario)) {
    fireEvent.change(document.querySelector(`[name="${nome}"]`)!, { target: { value: valor } });
  }
}
function obterFormulario() {
  return document.querySelector('form')!;
}

const descritorDeAberturaOriginal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const descritorDeFechamentoOriginal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');

beforeEach(() => {
  // jsdom não implementa a abertura modal nativa; mantemos o estado open para as consultas acessíveis.
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = true;
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = false;
    },
  });
  vi.mocked(useSessao).mockReturnValue(empresa);
  vi.mocked(criarPedido).mockResolvedValue(pedido);
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  if (descritorDeAberturaOriginal)
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', descritorDeAberturaOriginal);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  if (descritorDeFechamentoOriginal)
    Object.defineProperty(HTMLDialogElement.prototype, 'close', descritorDeFechamentoOriginal);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

describe('NovoPedidoModal', () => {
  it.each([
    { nome: 'sessão expirada', erro: new ApiError(401, 'Não autorizado'), mensagem: 'Sua sessão expirou' },
    { nome: 'perfil sem permissão', erro: new ApiError(403, 'Proibido'), mensagem: 'Sua conta não tem permissão' },
    {
      nome: 'erro HTTP',
      erro: new ApiError(500, 'Erro de teste'),
      mensagem: 'Não foi possível criar o pedido: Erro de teste',
    },
    {
      nome: 'parâmetros ausentes',
      erro: new ApiError(409, 'Parâmetros de remuneração não configurados'),
      mensagem: 'Configure os parâmetros de remuneração',
    },
    {
      nome: 'outro conflito',
      erro: new ApiError(409, 'Entregador indisponível'),
      mensagem: 'Não foi possível criar o pedido: Entregador indisponível',
    },
    { nome: 'rede', erro: new TypeError('Failed to fetch'), mensagem: 'Verifique sua conexão' },
  ])('preserva formulário e informa falha: $nome', async ({ erro, mensagem }) => {
    vi.mocked(criarPedido).mockRejectedValue(erro);
    const onFechar = vi.fn();
    const onCriado = vi.fn();
    render(<NovoPedidoModal aberto onFechar={onFechar} onCriado={onCriado} />);
    preencherFormulario();
    fireEvent.submit(obterFormulario());
    expect((await screen.findByRole('alert')).textContent).toContain(mensagem);
    for (const [nome, valor] of Object.entries(camposDoFormulario)) {
      expect((document.querySelector(`[name="${nome}"]`) as HTMLInputElement).value).toBe(valor);
    }
    expect(onFechar).not.toHaveBeenCalled();
    expect(onCriado).not.toHaveBeenCalled();
    expect((screen.getByRole('button', { name: 'Criar pedido' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('carregamento bloqueia controles e nova submissão', async () => {
    let resolver!: (pedido: CriarPedidoResposta) => void;
    vi.mocked(criarPedido).mockReturnValue(
      new Promise((resolverPromessa) => {
        resolver = resolverPromessa;
      }),
    );
    const onCriado = vi.fn();
    render(<NovoPedidoModal aberto onFechar={vi.fn()} onCriado={onCriado} />);
    preencherFormulario();
    fireEvent.submit(obterFormulario());
    await waitFor(() => expect(criarPedido).toHaveBeenCalledOnce());
    expect(obterFormulario().getAttribute('aria-busy')).toBe('true');
    expect((document.querySelector('fieldset') as HTMLFieldSetElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Criando pedido...' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('status').textContent).toContain('Calculando entrega');
    fireEvent.submit(obterFormulario());
    expect(criarPedido).toHaveBeenCalledOnce();
    expect(onCriado).not.toHaveBeenCalled();
    await act(async () => {
      resolver(pedido);
    });
  });

  it('sucesso limpa somente após confirmação e comunica o pedido', async () => {
    let resolver!: (pedido: CriarPedidoResposta) => void;
    vi.mocked(criarPedido).mockReturnValue(
      new Promise((resolverPromessa) => {
        resolver = resolverPromessa;
      }),
    );
    const onFechar = vi.fn();
    const onCriado = vi.fn();
    const propriedadesDoModal = { onFechar, onCriado };
    const { rerender } = render(<NovoPedidoModal aberto {...propriedadesDoModal} />);
    preencherFormulario();
    fireEvent.submit(obterFormulario());
    await waitFor(() => expect(criarPedido).toHaveBeenCalledOnce());
    expect(onFechar).not.toHaveBeenCalled();
    expect(onCriado).not.toHaveBeenCalled();
    expect((document.querySelector('[name="nome_recebedor"]') as HTMLInputElement).value).toBe('Carla');
    await act(async () => {
      resolver(pedido);
    });
    expect(onCriado).toHaveBeenCalledExactlyOnceWith(pedido);
    expect(onFechar).toHaveBeenCalledOnce();
    expect(criarPedido).toHaveBeenCalledWith(expect.objectContaining({ tipo_veiculo: 'DRIVE' }));
    rerender(<NovoPedidoModal aberto={false} {...propriedadesDoModal} />);
    rerender(<NovoPedidoModal aberto {...propriedadesDoModal} />);
    for (const nome of Object.keys(camposDoFormulario)) {
      expect((document.querySelector(`[name="${nome}"]`) as HTMLInputElement).value).toBe('');
    }
  });

  it.each(['DRIVE', 'BICYCLE'])('envia o veículo selecionado %s sem dados financeiros', async (veiculo) => {
    render(<NovoPedidoModal aberto onFechar={vi.fn()} />);
    preencherFormulario();
    fireEvent.change(screen.getByLabelText('Tipo de veículo'), { target: { value: veiculo } });
    fireEvent.submit(obterFormulario());
    await waitFor(() => expect(criarPedido).toHaveBeenCalledOnce());
    const corpo = vi.mocked(criarPedido).mock.calls[0][0];
    expect(corpo.tipo_veiculo).toBe(veiculo);
    expect(corpo).not.toHaveProperty('idEmpresa');
    expect(corpo).not.toHaveProperty('valor_entrega');
    expect(corpo).not.toHaveProperty('distancia');
  });

  it.each(['veículo ausente', 'sessão ausente'])('bloqueia envio com %s', async (cenario) => {
    if (cenario === 'sessão ausente') vi.mocked(useSessao).mockReturnValue(null);
    render(<NovoPedidoModal aberto onFechar={vi.fn()} />);
    preencherFormulario();
    if (cenario === 'veículo ausente')
      fireEvent.change(screen.getByLabelText('Tipo de veículo'), { target: { value: '' } });
    fireEvent.submit(obterFormulario());
    expect(criarPedido).not.toHaveBeenCalled();
    if (cenario === 'veículo ausente') {
      expect(screen.getByText('Selecione o tipo de veículo.')).toBeDefined();
      expect(document.activeElement).toBe(screen.getByLabelText('Tipo de veículo'));
    } else expect(screen.getByRole('status').textContent).toContain('Aguardando a sessão');
  });

  it.each(['botão', 'Escape', 'backdrop'])('fecha pelo %s e restaura o foco', (mecanismo) => {
    const origem = document.createElement('button');
    document.body.appendChild(origem);
    origem.focus();
    const onFechar = vi.fn();
    const { rerender, unmount } = render(<NovoPedidoModal aberto onFechar={onFechar} />);
    expect(document.activeElement?.getAttribute('name')).toBe('nome_recebedor');
    const dialogo = screen.getByRole('dialog');
    if (mecanismo === 'botão') fireEvent.click(screen.getByRole('button', { name: 'Fechar novo pedido' }));
    else if (mecanismo === 'Escape') fireEvent(dialogo, new Event('cancel', { bubbles: false, cancelable: true }));
    else fireEvent.click(dialogo, { clientX: -1, clientY: -1 });
    expect(onFechar).toHaveBeenCalledOnce();
    rerender(<NovoPedidoModal aberto={false} onFechar={onFechar} />);
    expect(document.activeElement).toBe(origem);
    unmount();
    origem.remove();
  });
});
