import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  API_URL,
  criarPedido,
  ApiError,
  aceitarVinculo,
  atribuirEntregadorAoPedido,
  atualizarConfiguracoes,
  buscarConfiguracoes,
  buscarDetalheDoPedido,
  buscarDadosCompartilhados,
  buscarLocalizacaoDoRastreio,
  buscarParametrosRemuneracao,
  buscarRastreio,
  consultarRotaDoPedido,
  gerarLinkDeRastreio,
  buscarUsuarioAtual,
  checkHealth,
  encerrarVinculo,
  finalizarPedido,
  listarFrota,
  listarVinculos,
  loginEmpresa,
  loginEntregador,
  reatribuirEntregadorDoPedido,
  recusarVinculo,
  registrarPosicao,
  salvarParametrosRemuneracao,
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

  it('guarda o corpo do erro para quem precisa de mais que a mensagem', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(resposta(422, { message: 'Código incorreto', tentativasRestantes: 3 })),
    );

    const erro = await finalizarPedido(7, '000000').catch((falha: unknown) => falha);

    expect(erro).toMatchObject({ status: 422, detalhes: { tentativasRestantes: 3 } });
  });

  it('manda o código do recebedor no corpo da finalização', async () => {
    const fetchSimulado = vi.fn().mockResolvedValue(resposta(200, {}));
    vi.stubGlobal('fetch', fetchSimulado);

    await finalizarPedido(7, '482913');

    expect(JSON.parse(fetchSimulado.mock.calls[0][1].body)).toEqual({ codigo: '482913' });
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
    ['atribuirEntregadorAoPedido', () => atribuirEntregadorAoPedido(7, '11144477735'), 'PATCH', '/pedidos/7/atribuir'],
    [
      'reatribuirEntregadorDoPedido',
      () => reatribuirEntregadorDoPedido(7, '11144477735'),
      'PATCH',
      '/pedidos/7/entregador',
    ],
    ['finalizarPedido', () => finalizarPedido(7, '482913'), 'POST', '/pedidos/7/finalizar'],
    ['registrarPosicao', () => registrarPosicao(7, { lat: -15.79, lng: -47.88 }), 'PUT', '/pedidos/7/localizacao'],
    ['consultarRotaDoPedido', () => consultarRotaDoPedido(7), 'GET', '/pedidos/7/rota'],
    ['buscarDetalheDoPedido', () => buscarDetalheDoPedido(7), 'GET', '/pedidos/7'],
    ['buscarRastreio', () => buscarRastreio('abc_123'), 'GET', '/rastreio/abc_123'],
    ['buscarLocalizacaoDoRastreio', () => buscarLocalizacaoDoRastreio('abc_123'), 'GET', '/rastreio/abc_123/localizacao'],
    ['buscarConfiguracoes', () => buscarConfiguracoes(), 'GET', '/empresa/configuracoes'],
    ['gerarLinkDeRastreio', () => gerarLinkDeRastreio(7), 'POST', '/pedidos/7/link-rastreio'],
    ['atualizarConfiguracoes', () => atualizarConfiguracoes({ exibirMapa: false }), 'PATCH', '/empresa/configuracoes'],
    ['buscarParametrosRemuneracao', () => buscarParametrosRemuneracao(), 'GET', '/empresa/remuneracao'],
    [
      'salvarParametrosRemuneracao',
      () => salvarParametrosRemuneracao({ taxaFixa: 800, coeficienteKm: 150 }),
      'PUT',
      '/empresa/remuneracao',
    ],
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

// E-US07: os comportamentos genéricos de requisitar são cobertos no describe acima.
describe('criarPedido', () => {
  afterEach(() => vi.unstubAllGlobals());
  it.each([{ nome: 'POST /pedido/criar' }])('$nome envia o DTO exato e devolve o pedido', async () => {
    const payload = {
      nome_recebedor: 'Carla', telefone_recebedor: '61999990000', cep: '70000000', logradouro: 'Rua A',
      numero: 10, bairro: 'Centro', cidade: 'Brasília', uf: 'DF', descricao: '',
      valor_entrega: 1500, distancia: 4200, idEmpresa: 42,
    };
    const pedido = {
      ...payload, id_pedido: 91, complemento: null, cpf_entregador: null, status: 'Pendente',
      data_criacao: '2026-10-22T12:00:00.000Z', data_inicio_entrega: null, data_finalizacao: null,
    };
    const fetchMock = vi.fn().mockResolvedValue(resposta(201, pedido));
    vi.stubGlobal('fetch', fetchMock);
    expect(await criarPedido(payload)).toEqual(pedido);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`${API_URL}/pedido/criar`, {
      method: 'POST', body: JSON.stringify(payload), credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  });
});
