import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import EtaSemMapa from './EtaSemMapa';
import { MarcadorDestino, MarcadorEntregador, MarcadorOrigem } from './MarcadoresDoMapa';
import PilulaTrajeto from './PilulaTrajeto';

describe('componentes do mapa', () => {
  afterEach(cleanup);

  it('a pílula some sem tempo ou distância', () => {
    const { container } = render(<PilulaTrajeto distanciaRestanteM={null} duracaoRestanteS={780} />);
    expect(container.innerHTML).toBe('');
  });

  it('a pílula mostra tempo e distância como no protótipo', () => {
    render(<PilulaTrajeto distanciaRestanteM={1200} duracaoRestanteS={480} />);
    expect(screen.getByText('8 min · 1,2 km restantes')).toBeTruthy();
  });

  it('sem nome do entregador, o texto do ETA usa "O entregador"', () => {
    render(<EtaSemMapa nomeEntregador={null} distanciaRestanteM={1200} duracaoRestanteS={480} />);
    expect(screen.getByText('O entregador está a caminho · 1,2 km restantes')).toBeTruthy();
  });

  it('usa os SVGs do Figma nos tamanhos originais', () => {
    render(
      <>
        <MarcadorOrigem nome="Cantina Dona Marta" />
        <MarcadorDestino />
        <MarcadorEntregador />
      </>,
    );

    const fontes = Array.from(document.querySelectorAll('img')).map((img) => [
      img.getAttribute('src'),
      img.getAttribute('width'),
      img.getAttribute('height'),
    ]);
    expect(fontes).toEqual([
      ['/mapa/marcador-origem.svg', '20.9', '23.6842'],
      ['/mapa/marcador-destino.svg', '27.2816', '30.5299'],
      ['/mapa/marcador-halo.svg', '52', '55'],
      ['/mapa/marcador-entregador.svg', '33.8983', '33.8983'],
    ]);
    expect(screen.getByText('Cantina Dona Marta')).toBeTruthy();
    expect(screen.getByText('Você')).toBeTruthy();
  });
});
