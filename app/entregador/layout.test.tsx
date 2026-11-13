import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TELA_PERFIL_ENTREGADOR } from '@/app/lib/rotas';
import { useSessao } from '@/app/lib/useSessao';
import LayoutEntregador from './layout';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), back: vi.fn() }) }));
vi.mock('@/app/lib/useSessao', () => ({ useSessao: vi.fn() }));

type Props = Parameters<typeof LayoutEntregador>[0];

function renderizar() {
  return render(<LayoutEntregador {...({ children: <p>conteúdo</p> } as Props)} />);
}

describe('LayoutEntregador', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('mostra o link para o cadastro ao lado do botão de sair', () => {
    vi.mocked(useSessao).mockReturnValue({ id: 1, nome: 'Joana Lima', cargo: 'ENTREGADOR' } as never);
    renderizar();

    expect(screen.getByRole('link', { name: 'Meu cadastro' }).getAttribute('href')).toBe(TELA_PERFIL_ENTREGADOR);
    expect(screen.getByRole('button', { name: 'Sair' })).toBeTruthy();
    expect(screen.getByText('conteúdo')).toBeTruthy();
  });

  it('não mostra nada enquanto a sessão não chega', () => {
    vi.mocked(useSessao).mockReturnValue(null);
    const { container } = renderizar();

    expect(container.innerHTML).toBe('');
  });
});
