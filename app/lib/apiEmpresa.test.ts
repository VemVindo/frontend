import { afterEach, describe, expect, it, vi } from 'vitest';
import { API_URL, atualizarCadastroDaEmpresa, buscarCadastroDaEmpresa, cadastrarEmpresa } from './api';

const DADOS = {
  nomeFantasia: 'Cantina Dona Marta',
  email: 'contato@cantina.test',
  telefone: '61930000000',
  cep: '70000000',
  logradouro: 'SQN 210 Bloco K',
  numero: 10,
  bairro: 'Asa Norte',
  cidade: 'Brasilia',
  uf: 'DF',
};

describe('api da empresa', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ['cadastrarEmpresa', () => cadastrarEmpresa({ ...DADOS, cpf: '52998224725', senha: 'senhaForte1' }), 'POST', '/auth/cadastrar/empresa'],
    ['buscarCadastroDaEmpresa', () => buscarCadastroDaEmpresa(), 'GET', '/empresa/cadastro'],
    ['atualizarCadastroDaEmpresa', () => atualizarCadastroDaEmpresa(DADOS), 'PUT', '/empresa/cadastro'],
  ])('%s chama %s %s', async (_nome, chamar, metodo, caminho) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await chamar();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${API_URL}${caminho}`);
    expect(init.method).toBe(metodo);
    expect(init.credentials).toBe('include');
  });

  it('manda os dados da edição no corpo, sem documento', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await atualizarCadastroDaEmpresa(DADOS);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual(DADOS);
  });
});
