import { afterEach, describe, expect, it, vi } from 'vitest';
import { API_URL, ApiError, buscarUsuarioAtual, loginEmpresa, sair } from './api';

function resposta(status: number, corpo?: unknown) {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('api', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('envia o cookie de sessão (credentials: include) e JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(resposta(200, { user: { id: 1 } }));
    vi.stubGlobal('fetch', fetchMock);

    await loginEmpresa('cantina@example.com', 'Vemvindo@123');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_URL}/auth/login/empresa`);
    expect(init).toMatchObject({
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(JSON.parse(init.body)).toEqual({ email: 'cantina@example.com', senha: 'Vemvindo@123' });
  });

  it('lança ApiError com status e mensagem do backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resposta(401, { message: 'Credenciais invalidas' })));

    const erro = await buscarUsuarioAtual().catch((e: unknown) => e);

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro).toMatchObject({ status: 401, message: 'Credenciais invalidas' });
  });

  it('junta as mensagens quando a validação devolve uma lista', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(resposta(400, { message: ['cpf invalido', 'senha vazia'] })),
    );

    await expect(buscarUsuarioAtual()).rejects.toThrow('cpf invalido; senha vazia');
  });

  it('usa o status como mensagem quando o corpo não é JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('erro', { status: 500 })));

    await expect(buscarUsuarioAtual()).rejects.toThrow('Erro 500');
  });

  it('trata 204 sem tentar ler o corpo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(sair()).resolves.toBeUndefined();
  });
});
