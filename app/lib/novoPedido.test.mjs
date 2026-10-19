import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';

const fonte = await readFile(new URL('./novoPedido.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(fonte, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
});
const { validarNovoPedido, gerarDescricaoPedido, prepararCriacaoPedido, criarFluxoEnvioPedido } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

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

const resposta = { id_pedido: 91, status: 'Pendente' };
for (const cenario of ['sucesso', 'falha no cálculo', 'falha HTTP', 'falha de rede']) {
  test(`fluxo com mocks: ${cenario}`, async () => {
    const chamadas = [];
    const falha = new Error(cenario);
    const fluxo = criarFluxoEnvioPedido(async (payload) => {
      chamadas.push(payload);
      if (cenario === 'falha HTTP' || cenario === 'falha de rede') throw falha;
      return resposta;
    });
    const obter = async () => {
      if (cenario === 'falha no cálculo') throw falha;
      return entrega;
    };
    const dados = Object.freeze({ ...valido });
    if (cenario === 'sucesso') {
      assert.deepEqual(await fluxo(dados, empresa, obter), { estado: 'criado', pedido: resposta });
      assert.deepEqual(chamadas, [prepararCriacaoPedido(valido, empresa, entrega)]);
    } else {
      await assert.rejects(fluxo(dados, empresa, obter), (erro) => erro === falha);
      // Uma falha libera a trava para tentativa posterior explícita.
      await assert.rejects(fluxo(dados, empresa, obter), (erro) => erro === falha);
      assert.equal(chamadas.length, cenario === 'falha no cálculo' ? 0 : 2);
    }
    assert.deepEqual(dados, valido);
  });
}
for (const cenario of ['sem sessão', 'sem cálculo', 'cálculo incompleto', 'formulário inválido']) {
  test(`bloqueia requisição: ${cenario}`, async () => {
    let chamadas = 0;
    const fluxo = criarFluxoEnvioPedido(async () => { chamadas++; return resposta; });
    const executar = () => fluxo(
      cenario === 'formulário inválido' ? { ...valido, cep: '' } : valido,
      cenario === 'sem sessão' ? null : empresa,
      cenario === 'sem cálculo' ? undefined : async () => cenario === 'cálculo incompleto' ? {} : entrega,
    );
    if (cenario === 'sem sessão' || cenario === 'sem cálculo') {
      assert.deepEqual(await executar(), { estado: 'bloqueado' });
    } else {
      await assert.rejects(executar());
    }
    assert.equal(chamadas, 0);
  });
}
for (const etapa of ['cálculo', 'POST']) {
  test(`impede envio repetido durante ${etapa}`, async () => {
    let liberar;
    const pendente = new Promise((resolve) => { liberar = resolve; });
    let chamadas = 0;
    const fluxo = criarFluxoEnvioPedido(async () => {
      chamadas++;
      if (etapa === 'POST') await pendente;
      return resposta;
    });
    const obter = async () => {
      if (etapa === 'cálculo') await pendente;
      return entrega;
    };
    const primeiro = fluxo(valido, empresa, obter);
    await Promise.resolve();
    assert.deepEqual(await fluxo(valido, empresa, obter), { estado: 'ocupado' });
    liberar();
    assert.deepEqual(await primeiro, { estado: 'criado', pedido: resposta });
    assert.equal(chamadas, 1);
    assert.equal((await fluxo(valido, empresa, obter)).estado, 'criado');
    assert.equal(chamadas, 2);
  });
}

const fonteApi = await readFile(new URL('./api.ts', import.meta.url), 'utf8');
const apiCompilada = ts.transpileModule(fonteApi, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const { criarPedido, ApiError, API_URL } = await import(`data:text/javascript;base64,${Buffer.from(apiCompilada).toString('base64')}`);
for (const status of [201, 400, 401, 403, 500, 'rede']) {
  test(`API com fetch mockado: ${status}`, async () => {
    const fetchOriginal = globalThis.fetch;
    const payload = prepararCriacaoPedido(valido, empresa, entrega);
    let chamadas = 0;
    globalThis.fetch = async (url, init) => {
      chamadas++;
      assert.equal(url, `${API_URL}/pedido/criar`);
      assert.equal(init.method, 'POST');
      assert.equal(init.credentials, 'include');
      assert.equal(init.headers['Content-Type'], 'application/json');
      assert.deepEqual(JSON.parse(init.body), payload);
      if (status === 'rede') throw new TypeError('Failed to fetch');
      return new Response(JSON.stringify(status === 201 ? resposta : { message: ['Erro de teste'] }), { status });
    };
    try {
      if (status === 201) {
        assert.deepEqual(await criarPedido(payload), resposta);
      } else {
        await assert.rejects(criarPedido(payload), (erro) => status === 'rede'
          ? erro instanceof TypeError
          : erro instanceof ApiError && erro.status === status && erro.message === 'Erro de teste');
      }
      assert.equal(chamadas, 1);
    } finally {
      globalThis.fetch = fetchOriginal;
    }
  });
}
