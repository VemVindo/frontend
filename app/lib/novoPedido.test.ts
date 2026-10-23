import { describe, expect, it } from 'vitest';
import { gerarDescricaoPedido, prepararCriacaoPedido, validarNovoPedido, type FormularioNovoPedido } from './novoPedido';
import type { Empresa } from './tipos';

const formulario: FormularioNovoPedido = {
  nome_recebedor: ' Carla ', telefone: '(61) 99999-0000', cep: ' 70000-000 ',
  logradouro: ' Rua A ', numero: '0010', complemento: ' Bloco B ',
  bairro: ' Centro ', cidade: ' Brasília ', uf: ' df ', itens: ' 2 refeições ', observacoes: ' Portaria ',
};
const empresa: Empresa = { id: 42, nomeFantasia: 'Empresa fictícia', email: 'teste@example.com', cargo: 'ESTABELECIMENTO' };
const entrega = { valor_entrega: 1500, distancia: 4200 };

describe('validarNovoPedido', () => {
  it.each(['nome_recebedor', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'cidade', 'uf'] as const)(
    'exige %s sem aceitar espaços em branco', (campo) => {
      expect(validarNovoPedido({ ...formulario, [campo]: ' \t\n ' })).toEqual({ [campo]: expect.any(String) });
    },
  );

  it.each([
    { campo: 'telefone', valor: '(61) 99999-0000', valido: true },
    { campo: 'telefone', valor: '1134567890', valido: true },
    { campo: 'telefone', valor: '999990000', valido: false },
    { campo: 'telefone', valor: '61abc999990000', valido: false },
    { campo: 'cep', valor: '70000-000', valido: true },
    { campo: 'cep', valor: '7000000', valido: false },
    { campo: 'uf', valor: ' df ', valido: true },
    { campo: 'uf', valor: 'XX', valido: false },
    { campo: 'numero', valor: '0', valido: true },
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
    { itens: ' item 1\nitem 2 ', observacoes: ' bloco A\nporta 2 ', esperado: 'Itens: item 1\nitem 2\n\nObservações: bloco A\nporta 2' },
  ])('combina opcionais: $esperado', ({ itens, observacoes, esperado }) => {
    expect(gerarDescricaoPedido(itens, observacoes)).toBe(esperado);
  });
});

describe('prepararCriacaoPedido', () => {
  it.each([
    { nome: 'completo', complemento: ' Bloco B ', itens: ' 2 refeições ', observacoes: ' Portaria ', id: 42,
      extras: { complemento: 'Bloco B' }, descricao: 'Itens: 2 refeições\n\nObservações: Portaria' },
    { nome: 'sem opcionais', complemento: '', itens: '', observacoes: '', id: 87,
      extras: {}, descricao: '' },
  ])('gera somente o DTO aceito: $nome', ({ complemento, itens, observacoes, id, extras, descricao }) => {
    const original = { ...formulario, complemento, itens, observacoes };
    const dados = Object.freeze({ ...original });
    expect(prepararCriacaoPedido(dados, { ...empresa, id }, entrega)).toEqual({
      nome_recebedor: 'Carla', telefone_recebedor: '61999990000', cep: '70000000',
      logradouro: 'Rua A', numero: 10, ...extras, bairro: 'Centro', cidade: 'Brasília', uf: 'DF',
      descricao, valor_entrega: 1500, distancia: 4200, idEmpresa: id,
    });
    expect(dados).toEqual(original);
  });

  it.each([
    { nome: 'cargo diferente', usuario: { ...empresa, cargo: 'ENTREGADOR' } },
    { nome: 'ID fracionário', usuario: { ...empresa, id: 1.5 } },
    { nome: 'ID zero', usuario: { ...empresa, id: 0 } },
  ])('recusa estabelecimento inválido: $nome', ({ usuario }) => {
    // Simula dados externos inválidos, inclusive cargo incompatível com o tipo Empresa.
    expect(() => prepararCriacaoPedido(formulario, usuario as Empresa, entrega))
      .toThrow('Estabelecimento autenticado inválido.');
  });

  it.each([
    { nome: 'ausente', valor: undefined },
    { nome: 'negativo', valor: -1 },
    { nome: 'fracionário', valor: 0.5 },
    { nome: 'fora de Int', valor: 2147483648 },
  ])('recusa valor e distância: $nome', ({ valor }) => {
    // Entrada inválida simulada na fronteira externa; a tipagem não valida JSON em runtime.
    expect(() => prepararCriacaoPedido(formulario, empresa, { ...entrega, valor_entrega: valor as number })).toThrow();
    expect(() => prepararCriacaoPedido(formulario, empresa, { ...entrega, distancia: valor as number })).toThrow();
  });
});
