import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  API_URL,
  ApiError,
  aceitarVinculo,
  atualizarCadastroDaEmpresa,
  atualizarConfiguracoes,
  buscarCadastroDaEmpresa,
  buscarConfiguracoes,
  buscarDadosCompartilhados,
  buscarLocalizacaoDoRastreio,
  buscarRastreio,
  consultarRotaDoPedido,
  gerarLinkDeRastreio,
  buscarUsuarioAtual,
  cadastrarEmpresa,
  checkHealth,
  encerrarVinculo,
  listarFrota,
  listarVinculos,
  loginEmpresa,
  loginEntregador,
  recusarVinculo,
  registrarPosicao,
  sair,
  trocarSenhaEntregador,
} from './api';

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

  // Contrato com o backend: se uma rota mudar de um lado, o teste avisa.
  it.each([
    ['checkHealth', () => checkHealth(), 'GET', '/health/db'],
    ['loginEntregador', () => loginEntregador('12345678909', 'x'), 'POST', '/auth/login/entregador'],
    ['buscarUsuarioAtual', () => buscarUsuarioAtual(), 'GET', '/auth/minhas-infos'],
    ['trocarSenhaEntregador', () => trocarSenhaEntregador('a', 'b', true), 'POST', '/auth/entregador/trocar-senha'],
    ['sair', () => sair(), 'POST', '/auth/sair'],
    ['buscarDadosCompartilhados', () => buscarDadosCompartilhados(), 'GET', '/entregador/dados-compartilhados'],
    ['listarVinculos', () => listarVinculos(), 'GET', '/entregador/vinculos'],
    ['aceitarVinculo', () => aceitarVinculo(3), 'POST', '/entregador/vinculos/3/aceitar'],
    ['recusarVinculo', () => recusarVinculo(3), 'POST', '/entregador/vinculos/3/recusar'],
    ['encerrarVinculo', () => encerrarVinculo(3), 'POST', '/entregador/vinculos/3/encerrar'],
    ['listarFrota', () => listarFrota(), 'GET', '/entregadores'],
    ['buscarCadastroDaEmpresa', () => buscarCadastroDaEmpresa(), 'GET', '/empresa/cadastro'],
    [
      'atualizarCadastroDaEmpresa',
      () =>
        atualizarCadastroDaEmpresa({
          nomeFantasia: 'X',
          email: 'a@b.c',
          telefone: '61930000000',
          cep: '70000000',
          logradouro: 'Rua',
          numero: 1,
          bairro: 'B',
          cidade: 'C',
          uf: 'DF',
        }),
      'PUT',
      '/empresa/cadastro',
    ],
    [
      'cadastrarEmpresa',
      () =>
        cadastrarEmpresa({
          nomeFantasia: 'X',
          email: 'a@b.c',
          telefone: '61930000000',
          cep: '70000000',
          logradouro: 'Rua',
          numero: 1,
          bairro: 'B',
          cidade: 'C',
          uf: 'DF',
          cpf: '52998224725',
          senha: 'senhaForte1',
        }),
      'POST',
      '/auth/cadastrar/empresa',
    ],
    ['registrarPosicao', () => registrarPosicao(7, { lat: -15.79, lng: -47.88 }), 'PUT', '/pedidos/7/localizacao'],
    ['consultarRotaDoPedido', () => consultarRotaDoPedido(7), 'GET', '/pedidos/7/rota'],
    ['buscarRastreio', () => buscarRastreio('abc_123'), 'GET', '/rastreio/abc_123'],
    ['buscarLocalizacaoDoRastreio', () => buscarLocalizacaoDoRastreio('abc_123'), 'GET', '/rastreio/abc_123/localizacao'],
    ['buscarConfiguracoes', () => buscarConfiguracoes(), 'GET', '/empresa/configuracoes'],
    ['gerarLinkDeRastreio', () => gerarLinkDeRastreio(7), 'POST', '/pedidos/7/link-rastreio'],
    ['atualizarConfiguracoes', () => atualizarConfiguracoes({ exibirMapa: false }), 'PATCH', '/empresa/configuracoes'],
  ])('%s chama %s %s', async (_nome, chamar, metodo, caminho) => {
    const fetchMock = vi.fn().mockResolvedValue(resposta(200, {}));
    vi.stubGlobal('fetch', fetchMock);

    await chamar();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_URL}${caminho}`);
    expect(init.method).toBe(metodo);
  });

  it('manda a posição e a precisão no corpo', async () => {
    const fetchMock = vi.fn().mockResolvedValue(resposta(200, {}));
    vi.stubGlobal('fetch', fetchMock);

    await registrarPosicao(7, { lat: -15.79, lng: -47.88, precisao: 12 });

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ lat: -15.79, lng: -47.88, precisao: 12 });
  });

  it('codifica o token do link na URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(resposta(200, {}));
    vi.stubGlobal('fetch', fetchMock);

    await buscarRastreio('a/b?c');

    expect(fetchMock.mock.calls[0][0]).toBe(`${API_URL}/rastreio/a%2Fb%3Fc`);
  });
});
