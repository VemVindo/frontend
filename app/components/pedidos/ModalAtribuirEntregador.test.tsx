import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, atribuirEntregadorAoPedido, listarFrota, reatribuirEntregadorDoPedido } from '@/app/lib/api';
import type { PedidoAtivo } from '@/app/lib/tipos';
import ModalAtribuirEntregador from './ModalAtribuirEntregador';

vi.mock('@/app/lib/api', async (original) => ({
  ...(await original<typeof import('@/app/lib/api')>()),
  listarFrota: vi.fn(),
  atribuirEntregadorAoPedido: vi.fn(),
  reatribuirEntregadorDoPedido: vi.fn(),
}));

const PENDENTE: PedidoAtivo = {
  id: 7,
  recebedor: 'Carla',
  entregador: null,
  status: 'PENDENTE',
  criadoEm: '2026-10-19T12:00:00-03:00',
};
const EM_ANDAMENTO: PedidoAtivo = { ...PENDENTE, entregador: 'Bruno Lima', status: 'EM_ANDAMENTO' };

describe('ModalAtribuirEntregador', () => {
  beforeEach(() => {
    vi.mocked(listarFrota).mockResolvedValue([
      { nome: 'Ana Souza', cpf: '11144477735', telefone: '11999990001', tipoVeiculo: 'MOTO', placa: null, disponivel: true },
      { nome: 'Caio Reis', cpf: '52998224725', telefone: '11999990002', tipoVeiculo: 'MOTO', placa: null, disponivel: false },
    ]);
    vi.mocked(atribuirEntregadorAoPedido).mockResolvedValue({ ...PENDENTE, entregador: 'Ana Souza' });
    vi.mocked(reatribuirEntregadorDoPedido).mockResolvedValue({ ...EM_ANDAMENTO, entregador: 'Ana Souza' });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('lista só os entregadores disponíveis', async () => {
    render(<ModalAtribuirEntregador pedido={PENDENTE} onFechar={vi.fn()} onAtribuido={vi.fn()} />);

    expect(await screen.findByText('Ana Souza')).toBeTruthy();
    expect(screen.queryByText('Caio Reis')).toBeNull();
  });

  it('usa a rota de atribuição no primeiro entregador', async () => {
    const onAtribuido = vi.fn();
    render(<ModalAtribuirEntregador pedido={PENDENTE} onFechar={vi.fn()} onAtribuido={onAtribuido} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Atribuir' }));

    await vi.waitFor(() => expect(onAtribuido).toHaveBeenCalled());
    expect(atribuirEntregadorAoPedido).toHaveBeenCalledWith(7, '11144477735');
    expect(reatribuirEntregadorDoPedido).not.toHaveBeenCalled();
  });

  it('usa a rota de reatribuição para trocar o entregador', async () => {
    const onAtribuido = vi.fn();
    render(
      <ModalAtribuirEntregador pedido={EM_ANDAMENTO} modo="reatribuir" onFechar={vi.fn()} onAtribuido={onAtribuido} />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Reatribuir' }));

    await vi.waitFor(() => expect(onAtribuido).toHaveBeenCalled());
    expect(reatribuirEntregadorDoPedido).toHaveBeenCalledWith(7, '11144477735');
    expect(atribuirEntregadorAoPedido).not.toHaveBeenCalled();
  });

  it('mostra a mensagem do backend quando a atribuição é recusada', async () => {
    vi.mocked(atribuirEntregadorAoPedido).mockRejectedValue(
      new ApiError(409, 'Só é possível atribuir um pedido pendente e sem entregador'),
    );
    render(<ModalAtribuirEntregador pedido={PENDENTE} onFechar={vi.fn()} onAtribuido={vi.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Atribuir' }));

    expect((await screen.findByRole('alert')).textContent).toContain('pendente e sem entregador');
  });
});
