import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listarPedidosDaEmpresa } from '@/app/lib/api';
import type { NovoPedidoModalProps } from '@/app/components/pedidos/NovoPedidoModal';
import type { CriarPedidoResposta, PedidoAtivo } from '@/app/lib/tipos';
import PaginaPedidosAtivos from './page';

vi.mock('@/app/lib/api', async (original) => ({
  ...(await original<typeof import('@/app/lib/api')>()),
  listarPedidosDaEmpresa: vi.fn(),
}));

const modalSimulado = vi.hoisted(() => ({ propriedades: null as NovoPedidoModalProps | null }));
vi.mock('@/app/components/pedidos/NovoPedidoModal', () => ({
  default: (propriedades: NovoPedidoModalProps) => {
    modalSimulado.propriedades = propriedades;
    return propriedades.aberto ? (
      <div role="dialog" aria-label="Novo pedido">
        <button onClick={propriedades.onFechar}>Fechar novo pedido</button>
      </div>
    ) : null;
  },
}));

const pedidoAtivo: PedidoAtivo = {
  id: 7,
  recebedor: 'Recebedora inicial',
  entregador: null,
  status: 'PENDENTE',
  valorEntrega: 1500,
  nota: null,
  finalizadoEm: null,
  criadoEm: '2026-10-22T12:00:00Z',
};
const pedidoFinalizado: PedidoAtivo = {
  ...pedidoAtivo,
  id: 8,
  recebedor: 'Recebedor finalizado',
  status: 'FINALIZADO',
  finalizadoEm: '2026-10-22T14:00:00Z',
  entregador: 'Entregador fictício',
};
const pedidoReconsultado: PedidoAtivo = { ...pedidoAtivo, id: 9, recebedor: 'Nova recebedora' };
// Fixture restrita ao teste de callback: a página deve buscar a listagem, sem mapear o DTO.
const pedidoCriado: CriarPedidoResposta = {
  id_pedido: 9,
  nome_recebedor: 'Nova recebedora',
  telefone_recebedor: '61999990000',
  cep: '70000000',
  logradouro: 'Rua A',
  numero: 10,
  complemento: null,
  bairro: 'Centro',
  cidade: 'Brasília',
  uf: 'DF',
  descricao: '',
  valor_entrega: 1500,
  distancia: 4200,
  idEmpresa: 42,
  cpf_entregador: null,
  status: 'PENDENTE',
  data_criacao: '2026-10-22T12:00:00Z',
  data_inicio_entrega: null,
  data_finalizacao: null,
};

beforeEach(() => {
  vi.mocked(listarPedidosDaEmpresa).mockResolvedValue([pedidoAtivo, pedidoFinalizado]);
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  modalSimulado.propriedades = null;
});

function abrirModal(versao = 'desktop') {
  // jsdom não aplica media queries: selecionamos os dois controles nos seus contêineres responsivos.
  const botoes = screen.getAllByRole('button', { name: '+ Novo pedido' });
  const botao = botoes.find((elemento) =>
    elemento.parentElement?.classList.contains(versao === 'desktop' ? 'md:block' : 'md:hidden'),
  );
  expect(botao).toBeTruthy();
  fireEvent.click(botao!);
}

async function renderizarPaginaComPedidos() {
  render(<PaginaPedidosAtivos />);
  await screen.findAllByText(pedidoAtivo.recebedor);
}

describe('Pedidos: integração do novo pedido', () => {
  it.each(['desktop', 'mobile'])(
    'abre a mesma instância pelo botão %s, sem habilitar cálculo fictício',
    async (versao) => {
      await renderizarPaginaComPedidos();
      expect(screen.queryByRole('dialog', { name: 'Novo pedido' })).toBeNull();
      abrirModal(versao);
      expect(screen.getAllByRole('dialog', { name: 'Novo pedido' })).toHaveLength(1);
      expect(modalSimulado.propriedades?.onCriado).toEqual(expect.any(Function));
      expect(listarPedidosDaEmpresa).toHaveBeenCalledOnce();
    },
  );

  it('fechamento usa onFechar e permite reabrir', async () => {
    await renderizarPaginaComPedidos();
    abrirModal();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar novo pedido' }));
    expect(screen.queryByRole('dialog', { name: 'Novo pedido' })).toBeNull();
    abrirModal('mobile');
    expect(screen.getByRole('dialog', { name: 'Novo pedido' })).toBeTruthy();
  });

  it('preserva listagem e abas ao abrir e fechar', async () => {
    await renderizarPaginaComPedidos();
    abrirModal();
    expect(screen.getAllByText(pedidoAtivo.recebedor)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar novo pedido' }));
    fireEvent.click(screen.getByRole('button', { name: 'Finalizados' }));
    expect(screen.getAllByText(pedidoFinalizado.recebedor)).toBeTruthy();
    expect(screen.queryAllByText(pedidoAtivo.recebedor)).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Ativos' }));
    expect(screen.getAllByText(pedidoAtivo.recebedor)).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Atribuir' })).toBeTruthy();
    expect(listarPedidosDaEmpresa).toHaveBeenCalledOnce();
  });

  it('reconsulta a API após criação confirmada pelo callback', async () => {
    await renderizarPaginaComPedidos();
    vi.mocked(listarPedidosDaEmpresa).mockResolvedValueOnce([pedidoAtivo, pedidoFinalizado, pedidoReconsultado]);
    abrirModal();
    // Simula somente a notificação do filho; não envia POST nem calcula valores de entrega.
    fireEvent.click(screen.getByRole('button', { name: 'Fechar novo pedido' }));
    await act(async () => {
      modalSimulado.propriedades?.onCriado?.(pedidoCriado);
    });
    expect(await screen.findAllByText(pedidoReconsultado.recebedor)).toBeTruthy();
    expect(screen.getAllByText(pedidoAtivo.recebedor)).toBeTruthy();
    expect(screen.getByText('Pedido criado com sucesso.')).toBeTruthy();
    expect(listarPedidosDaEmpresa).toHaveBeenCalledTimes(2);
  });

  it('mantém a lista e informa erro na atualização após callback', async () => {
    await renderizarPaginaComPedidos();
    vi.mocked(listarPedidosDaEmpresa).mockRejectedValueOnce(new Error('rede'));
    await act(async () => {
      modalSimulado.propriedades?.onCriado?.(pedidoCriado);
    });
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain('Não foi possível carregar os pedidos'),
    );
    expect(screen.getAllByText(pedidoAtivo.recebedor)).toBeTruthy();
    expect(listarPedidosDaEmpresa).toHaveBeenCalledTimes(2);
  });

  it.each(['desktop', 'mobile'])('abre pelo botão %s com listagem vazia', async (versao) => {
    vi.mocked(listarPedidosDaEmpresa).mockResolvedValueOnce([]);
    render(<PaginaPedidosAtivos />);
    await screen.findByText('Nenhum pedido ativo no momento.');
    abrirModal(versao);
    expect(screen.getAllByRole('dialog', { name: 'Novo pedido' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Fechar novo pedido' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('preserva o filtro de finalizados após abrir o modal e atualizar a listagem', async () => {
    await renderizarPaginaComPedidos();
    fireEvent.click(screen.getByRole('button', { name: 'Finalizados' }));
    fireEvent.change(screen.getByLabelText('Concluído de'), { target: { value: '2026-10-23' } });
    expect(screen.queryAllByText(pedidoFinalizado.recebedor)).toHaveLength(0);
    expect(screen.getByText('Nenhum pedido finalizado nesse período.')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Ativos' }));
    abrirModal();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar novo pedido' }));
    await act(async () => {
      modalSimulado.propriedades?.onCriado?.(pedidoCriado);
    });
    await waitFor(() => expect(listarPedidosDaEmpresa).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole('button', { name: 'Finalizados' }));
    expect((screen.getByLabelText('Concluído de') as HTMLInputElement).value).toBe('2026-10-23');
    expect(screen.queryAllByText(pedidoFinalizado.recebedor)).toHaveLength(0);
    fireEvent.change(screen.getByLabelText('Concluído de'), { target: { value: '' } });
    expect(screen.getAllByText(pedidoFinalizado.recebedor).length).toBeGreaterThan(0);
  });
});
