import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const fonte = await readFile(new URL('./novoPedido.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(fonte, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
});
const { validarNovoPedido, gerarDescricaoPedido, prepararCriacaoPedido } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

const valido = {
  nome_recebedor: 'Carla Menezes',
  telefone: '(61) 99999-0000',
  cep: '70000-000', logradouro: 'Rua das Flores', numero: '10',
  complemento: 'apartamento 2', bairro: 'Centro', cidade: 'Brasília', uf: 'DF',
  itens: '2 refeições e 1 suco',
  observacoes: '',
};

const cenariosValidos = [
  { nome: 'sem observações', observacoes: '' },
  { nome: 'com observações contendo somente espaços', observacoes: '   ' },
  { nome: 'com instruções de entrega nas observações', observacoes: 'Portaria, bloco B' },
];

for (const { nome, observacoes } of cenariosValidos) {
  test(`aceita formulário válido ${nome}`, () => {
    assert.deepEqual(validarNovoPedido({ ...valido, observacoes }), {});
  });
}

for (const campo of ['nome_recebedor', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'cidade', 'uf']) {
  for (const valor of ['', '   ', '\t\n']) {
    test(`rejeita campo obrigatório ${campo} com ${JSON.stringify(valor)}`, () => {
      const erros = validarNovoPedido({ ...valido, [campo]: valor });
      assert.deepEqual(Object.keys(erros), [campo]);
      assert.equal(typeof erros[campo], 'string');
    });
  }
}

for (const itens of ['', '   ', '\t\n', '2 refeições e 1 suco']) {
  test(`aceita itens opcionais com ${JSON.stringify(itens)}`, () => {
    assert.deepEqual(validarNovoPedido({ ...valido, itens }), {});
  });
}

for (const telefone of ['61999990000', '(61) 99999-0000', '61 99999 0000', '(11) 3456-7890', '1134567890']) {
  test(`aceita telefone brasileiro ${telefone}`, () => {
    assert.deepEqual(validarNovoPedido({ ...valido, telefone }), {});
  });
}

for (const telefone of ['999990000', '00999990000', '6199999000', '6112345678', '619999900000', '61abc999990000', '+55 (61) 99999-0000']) {
  test(`rejeita telefone fora do formato nacional ${telefone}`, () => {
    assert.deepEqual(Object.keys(validarNovoPedido({ ...valido, telefone })), ['telefone']);
  });
}

const textosLongos = [
  { campo: 'nome_recebedor', texto: 'Carla Menezes '.repeat(200) },
  { campo: 'logradouro', texto: 'Rua das Flores, complemento '.repeat(300) },
  { campo: 'itens', texto: 'item '.repeat(1000) },
  { campo: 'observacoes', texto: 'Texto longo '.repeat(500) },
];

for (const { campo, texto } of textosLongos) {
  test(`aceita ${campo} com ${texto.length} caracteres sem modificar o rascunho`, () => {
    const original = { ...valido, [campo]: texto };
    const dados = Object.freeze({ ...original });
    assert.deepEqual(validarNovoPedido(dados), {});
    assert.deepEqual(dados, original);
    assert.equal(dados[campo].length, texto.length);
    assert.ok(Object.isFrozen(dados));
  });
}

for (const campo of ['complemento', 'itens', 'observacoes']) {
  for (const valor of ['', '   ', '\t\n', 'Texto opcional']) {
    test(`aceita opcional ${campo} com ${JSON.stringify(valor)}`, () => {
      assert.deepEqual(validarNovoPedido({ ...valido, [campo]: valor }), {});
    });
  }
}

const formatos = [
  { campo: 'cep', validos: ['70000000', '70000-000', ' 70000-000 '], invalidos: ['7000000', '700000000', '7000-0000', 'abcdefgh', '70000 000'] },
  { campo: 'numero', validos: ['0', '10', '0010', ' 10 ', '2147483647'], invalidos: ['-1', '1.5', '1e2', 'Infinity', 'NaN', '10A', '2147483648'] },
  { campo: 'uf', validos: 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ').concat(['df', ' sp ']), invalidos: ['XX', 'D', 'DFX', '12', 'Distrito Federal'] },
];
for (const { campo, validos, invalidos } of formatos) {
  for (const valor of validos) {
    test(`aceita ${campo} ${JSON.stringify(valor)}`, () => {
      assert.deepEqual(validarNovoPedido({ ...valido, [campo]: valor }), {});
    });
  }
  for (const valor of invalidos) {
    test(`rejeita ${campo} ${JSON.stringify(valor)}`, () => {
      assert.deepEqual(Object.keys(validarNovoPedido({ ...valido, [campo]: valor })), [campo]);
    });
  }
}

const descricoes = [
  ['', '', ''],
  [' \n ', '\t', ''],
  [' 2 refeições ', '', 'Itens: 2 refeições'],
  ['', ' Portaria ', 'Observações: Portaria'],
  ['2 refeições', 'Portaria', 'Itens: 2 refeições\n\nObservações: Portaria'],
  [' item 1\nitem 2 ', ' bloco A\nporta 2 ', 'Itens: item 1\nitem 2\n\nObservações: bloco A\nporta 2'],
];
for (const [itens, observacoes, esperado] of descricoes) {
  test(`gera descrição ${JSON.stringify([itens, observacoes])}`, () => {
    assert.equal(gerarDescricaoPedido(itens, observacoes), esperado);
  });
}

const empresa = Object.freeze({ id: 42, nomeFantasia: 'Empresa de teste', email: 'teste@example.com', cargo: 'ESTABELECIMENTO' });
const entrega = Object.freeze({ valor_entrega: 1500, distancia: 4200 });
for (const complemento of ['', '   ', ' apartamento 2 ']) {
  for (const [itens, observacoes, descricao] of descricoes) {
    test(`monta payload sem propriedades extras ${JSON.stringify([complemento, itens, observacoes])}`, () => {
      const original = { ...valido, complemento, itens, observacoes, nome_recebedor: ' Carla Menezes ', uf: ' df ' };
      const dados = Object.freeze({ ...original });
      assert.deepEqual(prepararCriacaoPedido(dados, empresa, entrega), {
        nome_recebedor: 'Carla Menezes', telefone_recebedor: '61999990000',
        cep: '70000000', logradouro: 'Rua das Flores', numero: 10,
        ...(complemento.trim() ? { complemento: 'apartamento 2' } : {}),
        bairro: 'Centro', cidade: 'Brasília', uf: 'DF', descricao,
        valor_entrega: 1500, distancia: 4200, idEmpresa: 42,
      });
      assert.deepEqual(dados, original);
    });
  }
}
for (const campo of ['valor_entrega', 'distancia']) {
  for (const valor of [undefined, null, -1, 1.5, NaN, Infinity, 2147483648]) {
    test(`não prepara entrega inválida ${campo} ${String(valor)}`, () => {
      assert.throws(() => prepararCriacaoPedido(valido, empresa, { ...entrega, [campo]: valor }));
    });
  }
}
for (const usuario of [{ ...empresa, id: 0 }, { ...empresa, id: -1 }, { ...empresa, id: 1.5 }, { ...empresa, cargo: 'ENTREGADOR' }]) {
  test(`rejeita estabelecimento inválido ${JSON.stringify(usuario)}`, () => {
    assert.throws(() => prepararCriacaoPedido(valido, usuario, entrega));
  });
}
for (const campo of ['nome_recebedor', 'telefone', 'cep', 'logradouro', 'numero', 'bairro', 'cidade', 'uf']) {
  test(`não monta payload com formulário inválido em ${campo}`, () => {
    assert.throws(() => prepararCriacaoPedido({ ...valido, [campo]: '' }, empresa, entrega));
  });
}
