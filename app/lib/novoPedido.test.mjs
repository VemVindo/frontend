import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const fonte = await readFile(new URL('./novoPedido.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(fonte, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
});
const { validarNovoPedido } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

const valido = {
  nome_recebedor: 'Carla Menezes',
  telefone: '(61) 99999-0000',
  endereco_entrega: 'Rua das Flores, 10, apartamento 2',
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

for (const campo of ['nome_recebedor', 'telefone', 'endereco_entrega']) {
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
  { campo: 'endereco_entrega', texto: 'Rua das Flores, complemento '.repeat(300) },
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
