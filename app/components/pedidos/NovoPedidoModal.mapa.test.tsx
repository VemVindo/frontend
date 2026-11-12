import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { criarPedido, localizarEndereco } from '@/app/lib/api';
import { useSessao } from '@/app/lib/useSessao';
import type { CriarPedidoResposta, Empresa, EnderecoLocalizado } from '@/app/lib/tipos';
import NovoPedidoModal from './NovoPedidoModal';

vi.mock('@/app/lib/useSessao', () => ({ useSessao: vi.fn() }));
vi.mock('@/app/lib/api', async (original) => ({
  ...(await original<typeof import('@/app/lib/api')>()),
  criarPedido: vi.fn(),
  localizarEndereco: vi.fn(),
}));
vi.mock('@/app/lib/mapa', async (original) => ({
  ...(await original<typeof import('@/app/lib/mapa')>()),
  CHAVE_GOOGLE_MAPS: 'chave-de-teste',
}));
vi.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  Map: ({
    children,
    onClick,
  }: {
    children: ReactNode;
    onClick: (evento: { detail: { latLng: { lat: number; lng: number } } }) => void;
  }) => (
    <div data-testid="mapa">
      <button type="button" onClick={() => onClick({ detail: { latLng: { lat: -15.5, lng: -47.5 } } })}>
        tocar no mapa
      </button>
      {children}
    </div>
  ),
  AdvancedMarker: ({ title }: { title: string }) => <span>{title}</span>,
}));

const empresa: Empresa = {
  id: 42,
  nomeFantasia: 'Empresa fictícia',
  email: 'teste@example.com',
  cargo: 'ESTABELECIMENTO',
};
const campos = {
  nome_recebedor: 'Carla',
  telefone: '61999990000',
  cep: '70000000',
  logradouro: 'Rua A',
  numero: '10',
  bairro: 'Centro',
  cidade: 'Brasília',
  uf: 'DF',
  tipo_veiculo: 'DRIVE',
};

function achado(dados: Partial<EnderecoLocalizado> = {}): EnderecoLocalizado {
  return {
    coordenada: { lat: -15.6, lng: -47.6 },
    precisao: 'exato',
    enderecoEncontrado: 'Rua A, 10 - Centro, Brasília - DF',
    ...dados,
  };
}

function preencher() {
  for (const [nome, valor] of Object.entries(campos)) {
    fireEvent.change(document.querySelector(`[name="${nome}"]`)!, { target: { value: valor } });
  }
}
function botaoLocalizar() {
  return screen.getByRole('button', { name: /Localizar/ });
}
function enviar() {
  fireEvent.submit(document.querySelector('form')!);
}

beforeEach(() => {
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
  vi.mocked(criarPedido).mockResolvedValue({ id_pedido: 91 } as CriarPedidoResposta);
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('NovoPedidoModal com ponto no mapa', () => {
  it('localiza o endereço e envia o ponto conferido no cadastro', async () => {
    vi.mocked(localizarEndereco).mockResolvedValue(achado());
    render(<NovoPedidoModal aberto onFechar={vi.fn()} />);
    expect((botaoLocalizar() as HTMLButtonElement).disabled).toBe(true);
    preencher();
    fireEvent.click(botaoLocalizar());
    expect(await screen.findByText('Ponto de entrega')).toBeTruthy();
    expect(localizarEndereco).toHaveBeenCalledWith({
      cep: '70000000',
      logradouro: 'Rua A',
      numero: 10,
      bairro: 'Centro',
      cidade: 'Brasília',
      uf: 'DF',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar este local' }));
    enviar();
    await waitFor(() => expect(criarPedido).toHaveBeenCalledOnce());
    expect(vi.mocked(criarPedido).mock.calls[0][0]).toMatchObject({ destino_lat: -15.6, destino_lng: -47.6 });
  });

  it('não cria o pedido antes de localizar e confirmar o pino', async () => {
    vi.mocked(localizarEndereco).mockResolvedValue(achado({ precisao: 'aproximado' }));
    render(<NovoPedidoModal aberto onFechar={vi.fn()} />);
    preencher();
    enviar();
    expect((await screen.findByRole('alert')).textContent).toMatch(/Confirme o ponto de entrega/);
    expect(document.activeElement).toBe(botaoLocalizar());

    fireEvent.click(botaoLocalizar());
    const confirmar = await screen.findByRole('button', { name: 'Confirmar este local' });
    expect(screen.queryByRole('alert')).toBeNull();
    enviar();
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(criarPedido).not.toHaveBeenCalled();

    fireEvent.click(confirmar);
    expect(screen.queryByRole('alert')).toBeNull();
    enviar();
    await waitFor(() => expect(criarPedido).toHaveBeenCalledOnce());
  });

  it('arrastar o pino também confirma o local', async () => {
    vi.mocked(localizarEndereco).mockResolvedValue(achado({ precisao: 'aproximado' }));
    render(<NovoPedidoModal aberto onFechar={vi.fn()} />);
    preencher();
    fireEvent.click(botaoLocalizar());
    fireEvent.click(await screen.findByRole('button', { name: 'tocar no mapa' }));
    expect(screen.queryByRole('button', { name: 'Confirmar este local' })).toBeNull();
    enviar();
    await waitFor(() => expect(criarPedido).toHaveBeenCalledOnce());
  });

  it('sem resultado, usa o ponto tocado no mapa', async () => {
    vi.mocked(localizarEndereco).mockResolvedValue(
      achado({ coordenada: null, precisao: null, enderecoEncontrado: null }),
    );
    render(<NovoPedidoModal aberto onFechar={vi.fn()} />);
    preencher();
    fireEvent.click(botaoLocalizar());
    fireEvent.click(await screen.findByRole('button', { name: 'tocar no mapa' }));
    enviar();
    await waitFor(() => expect(criarPedido).toHaveBeenCalledOnce());
    expect(vi.mocked(criarPedido).mock.calls[0][0]).toMatchObject({ destino_lat: -15.5, destino_lng: -47.5 });
  });

  it('descarta o pino confirmado quando o endereço muda', async () => {
    vi.mocked(localizarEndereco).mockResolvedValue(achado());
    render(<NovoPedidoModal aberto onFechar={vi.fn()} />);
    preencher();
    fireEvent.click(botaoLocalizar());
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar este local' }));
    fireEvent.change(document.querySelector('[name="numero"]')!, { target: { value: '12' } });
    expect(screen.queryByTestId('mapa')).toBeNull();
    enviar();
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(criarPedido).not.toHaveBeenCalled();
  });

  it('ignora a resposta de uma busca feita para o endereço antigo', async () => {
    let responder!: (valor: EnderecoLocalizado) => void;
    vi.mocked(localizarEndereco).mockReturnValue(new Promise((resolver) => (responder = resolver)));
    render(<NovoPedidoModal aberto onFechar={vi.fn()} />);
    preencher();
    fireEvent.click(botaoLocalizar());
    fireEvent.change(document.querySelector('[name="numero"]')!, { target: { value: '12' } });
    responder(achado());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Localizar no mapa' })).toBeTruthy());
    expect(screen.queryByTestId('mapa')).toBeNull();
  });

  it('falha na busca não impede marcar no mapa', async () => {
    vi.mocked(localizarEndereco).mockRejectedValue(new TypeError('Failed to fetch'));
    render(<NovoPedidoModal aberto onFechar={vi.fn()} />);
    preencher();
    fireEvent.click(botaoLocalizar());
    expect(await screen.findByText(/Não foi possível localizar agora/)).toBeTruthy();
    expect(screen.getByTestId('mapa')).toBeTruthy();
  });

  it('mostra o endereço achado e pede ajuste quando só a região foi encontrada', async () => {
    vi.mocked(localizarEndereco).mockResolvedValue(
      achado({ precisao: 'aproximado', enderecoEncontrado: 'Centro, Brasília - DF, 70000-000' }),
    );
    render(<NovoPedidoModal aberto onFechar={vi.fn()} />);
    preencher();
    fireEvent.click(botaoLocalizar());
    expect(await screen.findByText(/Achamos só a região/)).toBeTruthy();
    expect(screen.getByText('Centro, Brasília - DF, 70000-000')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'tocar no mapa' }));
    expect(screen.getByText(/Ponto marcado/)).toBeTruthy();
    expect(screen.queryByText('Centro, Brasília - DF, 70000-000')).toBeNull();
  });

  it('confirma o endereço exato que o Google achou', async () => {
    vi.mocked(localizarEndereco).mockResolvedValue(achado());
    render(<NovoPedidoModal aberto onFechar={vi.fn()} />);
    preencher();
    fireEvent.click(botaoLocalizar());
    expect(await screen.findByText(/Confira o pino/)).toBeTruthy();
    expect(screen.getByText('Rua A, 10 - Centro, Brasília - DF')).toBeTruthy();
  });
});
