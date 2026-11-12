import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LocalNoMapa, { type LocalNoMapaProps } from './LocalNoMapa';

vi.mock('@/app/lib/mapa', async (original) => ({
  ...(await original<typeof import('@/app/lib/mapa')>()),
  CHAVE_GOOGLE_MAPS: 'chave-de-teste',
}));

// O jsdom não desenha o mapa; o mock expõe clique no mapa e arraste do pino como botões.
vi.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  Map: ({
    children,
    defaultCenter,
    onClick,
  }: {
    children: ReactNode;
    defaultCenter: { lat: number; lng: number };
    onClick: (evento: { detail: { latLng: { lat: number; lng: number } | null } }) => void;
  }) => (
    <div data-testid="mapa" data-centro={`${defaultCenter.lat},${defaultCenter.lng}`}>
      <button type="button" onClick={() => onClick({ detail: { latLng: { lat: -15.5, lng: -47.5 } } })}>
        tocar no mapa
      </button>
      <button type="button" onClick={() => onClick({ detail: { latLng: null } })}>
        tocar fora
      </button>
      {children}
    </div>
  ),
  AdvancedMarker: ({
    title,
    onDragEnd,
  }: {
    title: string;
    onDragEnd: (evento: { latLng: { lat: () => number; lng: () => number } | null }) => void;
  }) => (
    <button type="button" onClick={() => onDragEnd({ latLng: { lat: () => -15.4, lng: () => -47.4 } })}>
      {title}
    </button>
  ),
}));

function renderizar(propriedades: Partial<LocalNoMapaProps> = {}) {
  const padrao: LocalNoMapaProps = {
    etapa: 'pendente',
    destino: null,
    tentativa: 0,
    podeLocalizar: true,
    aoLocalizar: vi.fn(),
    aoMarcar: vi.fn(),
    aoConfirmar: vi.fn(),
  };
  const props = { ...padrao, ...propriedades };
  render(<LocalNoMapa {...props} />);
  return props;
}

afterEach(cleanup);

describe('LocalNoMapa', () => {
  it('pede para localizar antes de mostrar o mapa', () => {
    const { aoLocalizar } = renderizar();
    expect(screen.queryByTestId('mapa')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Localizar no mapa' }));
    expect(aoLocalizar).toHaveBeenCalledOnce();
  });

  it('bloqueia a busca com endereço incompleto ou já em andamento', () => {
    renderizar({ podeLocalizar: false });
    expect((screen.getByRole('button', { name: 'Localizar no mapa' }) as HTMLButtonElement).disabled).toBe(true);
    cleanup();
    renderizar({ etapa: 'localizando' });
    expect((screen.getByRole('button', { name: 'Localizar no mapa' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('status').textContent).toContain('Procurando');
  });

  it('mostra o pino encontrado e aceita arrastar para o ponto certo', () => {
    const { aoMarcar } = renderizar({ etapa: 'encontrado', destino: { lat: -15.6, lng: -47.6 } });
    expect(screen.getByTestId('mapa').dataset.centro).toBe('-15.6,-47.6');
    fireEvent.click(screen.getByRole('button', { name: 'Ponto de entrega' }));
    expect(aoMarcar).toHaveBeenCalledWith({ lat: -15.4, lng: -47.4 });
    expect(screen.getByRole('button', { name: 'Localizar de novo' })).toBeTruthy();
  });

  it.each(['nao-encontrado', 'falhou'] as const)('sem resultado (%s), deixa marcar tocando no mapa', (etapa) => {
    const { aoMarcar } = renderizar({ etapa });
    expect(screen.getByTestId('mapa').dataset.centro).toBe('-15.7939,-47.8828');
    expect(screen.queryByRole('button', { name: 'Ponto de entrega' })).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('Toque no mapa');
    fireEvent.click(screen.getByRole('button', { name: 'tocar fora' }));
    expect(aoMarcar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'tocar no mapa' }));
    expect(aoMarcar).toHaveBeenCalledWith({ lat: -15.5, lng: -47.5 });
  });

  it.each([
    { etapa: 'encontrado', mensagem: /Confira o pino/ },
    { etapa: 'aproximado', mensagem: /Achamos só a região/ },
    { etapa: 'marcado', mensagem: /Ponto marcado/ },
  ] as const)('com o pino ($etapa), explica o que conferir', ({ etapa, mensagem }) => {
    renderizar({ etapa, destino: { lat: -15.6, lng: -47.6 } });
    expect(screen.getByRole('status').textContent).toMatch(mensagem);
  });

  it.each(['encontrado', 'aproximado'] as const)('com o pino achado (%s), pede para confirmar', (etapa) => {
    const { aoConfirmar } = renderizar({ etapa, destino: { lat: -15.6, lng: -47.6 } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar este local' }));
    expect(aoConfirmar).toHaveBeenCalledOnce();
  });

  it('não pede confirmação sem pino ou com o ponto já marcado', () => {
    renderizar({ etapa: 'marcado', destino: { lat: -15.6, lng: -47.6 } });
    expect(screen.queryByRole('button', { name: 'Confirmar este local' })).toBeNull();
    cleanup();
    renderizar({ etapa: 'nao-encontrado' });
    expect(screen.queryByRole('button', { name: 'Confirmar este local' })).toBeNull();
  });

  it('mostra o aviso de confirmação pendente', () => {
    renderizar({ erro: 'Confirme o ponto de entrega no mapa antes de criar o pedido.' });
    expect(screen.getByRole('alert').textContent).toMatch(/Confirme o ponto/);
    cleanup();
    renderizar();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('mostra o endereço achado até o ponto ser marcado à mão', () => {
    renderizar({
      etapa: 'aproximado',
      destino: { lat: -15.6, lng: -47.6 },
      enderecoEncontrado: 'Guará, Brasília - DF',
    });
    expect(screen.getByText('Guará, Brasília - DF')).toBeTruthy();
    cleanup();

    renderizar({ etapa: 'marcado', destino: { lat: -15.6, lng: -47.6 }, enderecoEncontrado: 'Guará, Brasília - DF' });
    expect(screen.queryByText('Guará, Brasília - DF')).toBeNull();
  });
});
