import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, buscarConversaWhatsapp } from '@/app/lib/api';
import BotaoWhatsapp, { LinkWhatsapp } from './BotaoWhatsapp';

vi.mock('@/app/lib/api', async (original) => ({
  ...(await original<typeof import('@/app/lib/api')>()),
  buscarConversaWhatsapp: vi.fn(),
}));

const CONVERSA = {
  link: 'https://wa.me/5561987654321?text=Ol%C3%A1',
  contato: 'Joao Silva',
};

describe('BotaoWhatsapp', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('abre o WhatsApp do outro lado em outra aba', async () => {
    vi.mocked(buscarConversaWhatsapp).mockResolvedValue(CONVERSA);
    render(<BotaoWhatsapp idPedido={12} com="entregador" />);

    const link = await screen.findByRole('link', { name: 'Conversar com Joao Silva no WhatsApp' });

    expect(buscarConversaWhatsapp).toHaveBeenCalledWith(12, 'entregador');
    expect(link.getAttribute('href')).toBe(CONVERSA.link);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('mostra a recusa do backend quando a entrega não está em andamento', async () => {
    vi.mocked(buscarConversaWhatsapp).mockRejectedValue(
      new ApiError(409, 'A conversa pelo WhatsApp só fica disponível com a entrega em andamento'),
    );
    render(<BotaoWhatsapp idPedido={12} com="estabelecimento" />);

    expect((await screen.findByRole('status')).textContent).toMatch(/entrega em andamento/);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('esconde detalhes de falhas inesperadas', async () => {
    vi.mocked(buscarConversaWhatsapp).mockRejectedValue(new ApiError(500, 'stack interna'));
    render(<BotaoWhatsapp idPedido={12} com="entregador" />);

    expect((await screen.findByRole('status')).textContent).toBe('Não foi possível preparar a conversa agora.');
  });

  it('busca a conversa com o recebedor pela rota da empresa', async () => {
    vi.mocked(buscarConversaWhatsapp).mockResolvedValue({ ...CONVERSA, contato: 'Carla Menezes' });
    render(<BotaoWhatsapp idPedido={12} com="recebedor" variante="claro" />);

    expect(await screen.findByRole('link', { name: 'Conversar com Carla Menezes no WhatsApp' })).toBeTruthy();
    expect(buscarConversaWhatsapp).toHaveBeenCalledWith(12, 'recebedor');
  });

  it('o link pronto abre o WhatsApp sem chamar o backend', () => {
    render(<LinkWhatsapp link={CONVERSA.link} rotulo="Falar com o estabelecimento no WhatsApp" />);

    const link = screen.getByRole('link', { name: 'Falar com o estabelecimento no WhatsApp' });
    expect(link.getAttribute('href')).toBe(CONVERSA.link);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(buscarConversaWhatsapp).not.toHaveBeenCalled();
  });
});
