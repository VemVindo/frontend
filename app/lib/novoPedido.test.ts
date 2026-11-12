import { describe, expect, it } from 'vitest';
import {
  enderecoParaLocalizar,
  gerarDescricaoPedido,
  prepararCriacaoPedido,
  validarNovoPedido,
  type FormularioNovoPedido,
} from './novoPedido';
import type { Empresa } from './tipos';

const formulario: FormularioNovoPedido = {
  nome_recebedor: ' Carla ',
  telefone: '(61) 99999-0000',
  cep: ' 70000-000 ',
  logradouro: ' Rua A ',
  numero: '0010',
  complemento: ' Bloco B ',
  bairro: ' Centro ',
  cidade: ' Brasília ',
  uf: ' df ',
  tipo_veiculo: 'DRIVE',
  itens: ' 2 refeições ',
  observacoes: ' Portaria ',
};
const empresa: Empresa = {
  id: 42,
  nomeFantasia: 'Empresa fictícia',
  email: 'teste@example.com',
  cargo: 'ESTABELECIMENTO',
};

describe('validarNovoPedido', () => {
  it.each([
    'nome_recebedor',
    'telefone',
    'cep',
    'logradouro',
    'numero',
    'bairro',
    'cidade',
    'uf',
    'tipo_veiculo',
  ] as const)('exige %s sem aceitar espaços em branco', (campo) => {
    expect(validarNovoPedido({ ...formulario, [campo]: ' \t\n ' })).toEqual({ [campo]: expect.any(String) });
  });

  it.each([
    { campo: 'telefone', valor: '(61) 99999-0000', valido: true },
    { campo: 'telefone', valor: '1134567890', valido: true },
    { campo: 'telefone', valor: '999990000', valido: false },
    { campo: 'telefone', valor: '61abc999990000', valido: false },
    { campo: 'cep', valor: '70000-000', valido: true },
    { campo: 'cep', valor: '7000000', valido: false },
    { campo: 'uf', valor: ' df ', valido: true },
    { campo: 'uf', valor: 'XX', valido: false },
    { campo: 'numero', valor: '0', valido: false },
    { campo: 'numero', valor: '1', valido: true },
    { campo: 'tipo_veiculo', valor: 'DRIVE', valido: true },
    { campo: 'tipo_veiculo', valor: 'BICYCLE', valido: true },
    { campo: 'tipo_veiculo', valor: 'MOTO', valido: false },
    { campo: 'numero', valor: '2147483647', valido: true },
    { campo: 'numero', valor: '-1', valido: false },
    { campo: 'numero', valor: '1.5', valido: false },
    { campo: 'numero', valor: '2147483648', valido: false },
  ] as const)('$campo: $valor (válido: $valido)', ({ campo, valor, valido }) => {
    const esperado = valido ? {} : { [campo]: expect.any(String) };
    expect(validarNovoPedido({ ...formulario, [campo]: valor })).toEqual(esperado);
  });
});

describe('gerarDescricaoPedido', () => {
  it.each([
    { itens: ' \n ', observacoes: '\t', esperado: '' },
    { itens: '', observacoes: ' Portaria ', esperado: 'Observações: Portaria' },
    {
      itens: ' item 1\nitem 2 ',
      observacoes: ' bloco A\nporta 2 ',
      esperado: 'Itens: item 1\nitem 2\n\nObservações: bloco A\nporta 2',
    },
  ])('combina opcionais: $esperado', ({ itens, observacoes, esperado }) => {
    expect(gerarDescricaoPedido(itens, observacoes)).toBe(esperado);
  });
});

describe('prepararCriacaoPedido', () => {
  it.each([
    {
      nome: 'completo',
      complemento: ' Bloco B ',
      itens: ' 2 refeições ',
      observacoes: ' Portaria ',
      id: 42,
      tipoVeiculo: 'DRIVE' as const,
      camposOpcionaisEsperados: { complemento: 'Bloco B' },
      descricao: 'Itens: 2 refeições\n\nObservações: Portaria',
    },
    {
      nome: 'sem opcionais',
      complemento: '',
      itens: '',
      observacoes: '',
      id: 87,
      tipoVeiculo: 'BICYCLE' as const,
      camposOpcionaisEsperados: {},
      descricao: '',
    },
  ])(
    'gera somente o DTO aceito: $nome',
    ({ complemento, itens, observacoes, id, tipoVeiculo, camposOpcionaisEsperados, descricao }) => {
      const formularioOriginal = { ...formulario, complemento, itens, observacoes, tipo_veiculo: tipoVeiculo };
      const dadosDoFormulario = Object.freeze({ ...formularioOriginal });
      expect(prepararCriacaoPedido(dadosDoFormulario, { ...empresa, id })).toEqual({
        nome_recebedor: 'Carla',
        telefone_recebedor: '61999990000',
        cep: '70000000',
        logradouro: 'Rua A',
        numero: 10,
        ...camposOpcionaisEsperados,
        bairro: 'Centro',
        cidade: 'Brasília',
        uf: 'DF',
        descricao,
        tipo_veiculo: tipoVeiculo,
      });
      expect(dadosDoFormulario).toEqual(formularioOriginal);
    },
  );

  it.each([
    { nome: 'cargo diferente', usuario: { ...empresa, cargo: 'ENTREGADOR' } },
    { nome: 'ID fracionário', usuario: { ...empresa, id: 1.5 } },
    { nome: 'ID zero', usuario: { ...empresa, id: 0 } },
  ])('recusa estabelecimento inválido: $nome', ({ usuario }) => {
    // Simula dados externos inválidos, inclusive cargo incompatível com o tipo Empresa.
    expect(() => prepararCriacaoPedido(formulario, usuario as Empresa)).toThrow(
      'Estabelecimento autenticado inválido.',
    );
  });

  it.each([
    { nome: 'ausente', valor: undefined },
    { nome: 'negativo', valor: -1 },
    { nome: 'fracionário', valor: 0.5 },
    { nome: 'fora de Int', valor: 2147483648 },
  ])('não encaminha metadados financeiros externos: $nome', ({ valor }) => {
    const dadosExternos = { ...formulario, valor_entrega: valor, distancia: valor, idEmpresa: valor };
    expect(prepararCriacaoPedido(dadosExternos, empresa)).toEqual(prepararCriacaoPedido(formulario, empresa));
    expect(prepararCriacaoPedido(dadosExternos, empresa)).not.toHaveProperty('valor_entrega');
    expect(prepararCriacaoPedido(dadosExternos, empresa)).not.toHaveProperty('distancia');
    expect(prepararCriacaoPedido(dadosExternos, empresa)).not.toHaveProperty('idEmpresa');
  });
});

describe('enderecoParaLocalizar', () => {
  it('normaliza só os campos usados na busca do endereço', () => {
    expect(enderecoParaLocalizar(formulario)).toEqual({
      cep: '70000000',
      logradouro: 'Rua A',
      numero: 10,
      bairro: 'Centro',
      cidade: 'Brasília',
      uf: 'DF',
    });
  });

  it('não busca com o endereço incompleto, mesmo que o resto do formulário falte', () => {
    expect(enderecoParaLocalizar({ ...formulario, nome_recebedor: '', telefone: '' })).not.toBeNull();
    expect(enderecoParaLocalizar({ ...formulario, numero: 'abc' })).toBeNull();
    expect(enderecoParaLocalizar({ ...formulario, uf: 'XX' })).toBeNull();
    expect(enderecoParaLocalizar({ ...formulario, bairro: ' ' })).toBeNull();
  });
});

describe('prepararCriacaoPedido com ponto no mapa', () => {
  it('envia a coordenada marcada e omite quando não houver pino', () => {
    const comPino = prepararCriacaoPedido(formulario, empresa, { lat: -15.6, lng: -47.7 });
    expect(comPino).toMatchObject({ destino_lat: -15.6, destino_lng: -47.7 });
    expect(prepararCriacaoPedido(formulario, empresa)).not.toHaveProperty('destino_lat');
    expect(prepararCriacaoPedido(formulario, empresa, null)).not.toHaveProperty('destino_lng');
  });
});
