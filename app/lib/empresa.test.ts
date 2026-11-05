import { describe, expect, it } from 'vitest';
import { cnpjValido, normalizarCnpj } from './cnpj';
import {
  EMPRESA_VAZIA,
  formatarCep,
  formatarDocumento,
  normalizarDocumento,
  paraDadosCadastrais,
  paraNovaEmpresa,
  paraValores,
  validarCadastro,
  validarEmpresa,
  type ValoresDoCadastro,
} from './empresa';

const EMPRESA = {
  nomeFantasia: 'Cantina Dona Marta',
  email: 'contato@cantina.test',
  telefone: '61930000000',
  cep: '70000000',
  logradouro: 'SQN 210 Bloco K',
  numero: '10',
  complemento: '',
  bairro: 'Asa Norte',
  cidade: 'Brasilia',
  uf: 'DF',
};

const CADASTRO: ValoresDoCadastro = {
  ...EMPRESA,
  tipoDocumento: 'CNPJ',
  documento: '11222333000181',
  razaoSocial: 'Cantina Dona Marta Ltda',
  senha: 'senhaForte1',
  confirmacaoSenha: 'senhaForte1',
};

describe('cnpj', () => {
  it.each(['11222333000181', '12ABC34501DE35'])('aceita %s', (cnpj) => {
    expect(cnpjValido(cnpj)).toBe(true);
  });

  it.each(['11222333000182', '11111111111111', '1122233300018'])('recusa %s', (cnpj) => {
    expect(cnpjValido(cnpj)).toBe(false);
  });

  it('normaliza para maiúsculas sem pontuação', () => {
    expect(normalizarCnpj('12.abc.345/01de-35')).toBe('12ABC34501DE35');
  });
});

describe('validarEmpresa', () => {
  it('não acusa nada com os dados certos', () => {
    expect(validarEmpresa(EMPRESA)).toEqual({});
  });

  it('aponta cada campo inválido', () => {
    expect(validarEmpresa({ ...EMPRESA_VAZIA, email: 'sem-arroba', telefone: '123' })).toEqual({
      nomeFantasia: 'Preencha este campo',
      logradouro: 'Preencha este campo',
      bairro: 'Preencha este campo',
      cidade: 'Preencha este campo',
      email: 'Informe um e-mail válido',
      telefone: 'Informe DDD e número (10 ou 11 dígitos)',
      cep: 'O CEP tem 8 dígitos',
      numero: 'Informe o número do endereço',
      uf: 'Escolha o estado',
    });
  });
});

describe('validarCadastro', () => {
  it('aceita CNPJ com razão social', () => {
    expect(validarCadastro(CADASTRO)).toEqual({});
  });

  it('exige razão social só para CNPJ', () => {
    expect(validarCadastro({ ...CADASTRO, razaoSocial: '' }).razaoSocial).toBeDefined();
    expect(validarCadastro({ ...CADASTRO, tipoDocumento: 'CPF', documento: '52998224725', razaoSocial: '' })).toEqual(
      {},
    );
  });

  it('valida o documento conforme o tipo', () => {
    expect(validarCadastro({ ...CADASTRO, documento: '11222333000182' }).documento).toBe('CNPJ inválido');
    expect(validarCadastro({ ...CADASTRO, tipoDocumento: 'CPF', documento: '12345678900' }).documento).toBe(
      'CPF inválido',
    );
  });

  it('confere tamanho, caracteres e confirmação da senha', () => {
    expect(validarCadastro({ ...CADASTRO, senha: 'curta', confirmacaoSenha: 'curta' }).senha).toContain('8 a 72');
    expect(validarCadastro({ ...CADASTRO, senha: 'com espaco', confirmacaoSenha: 'com espaco' }).senha).toContain(
      'sem espaços',
    );
    expect(validarCadastro({ ...CADASTRO, confirmacaoSenha: 'outra' }).confirmacaoSenha).toBe('As senhas não conferem');
  });
});

describe('conversões', () => {
  it('manda CNPJ e razão social, sem complemento vazio', () => {
    expect(paraNovaEmpresa(CADASTRO)).toEqual({
      nomeFantasia: 'Cantina Dona Marta',
      email: 'contato@cantina.test',
      telefone: '61930000000',
      cep: '70000000',
      logradouro: 'SQN 210 Bloco K',
      numero: 10,
      bairro: 'Asa Norte',
      cidade: 'Brasilia',
      uf: 'DF',
      cnpj: '11222333000181',
      razaoSocial: 'Cantina Dona Marta Ltda',
      senha: 'senhaForte1',
    });
  });

  it('cadastro por CPF não manda razão social', () => {
    const nova = paraNovaEmpresa({ ...CADASTRO, tipoDocumento: 'CPF', documento: '52998224725' });
    expect(nova.cpf).toBe('52998224725');
    expect(nova).not.toHaveProperty('cnpj');
    expect(nova).not.toHaveProperty('razaoSocial');
  });

  it('mantém o complemento preenchido e tira espaços das pontas', () => {
    expect(paraDadosCadastrais({ ...EMPRESA, complemento: ' Loja 2 ', nomeFantasia: ' Cantina ' })).toMatchObject({
      complemento: 'Loja 2',
      nomeFantasia: 'Cantina',
    });
  });

  it('preenche o formulário de edição a partir do cadastro', () => {
    expect(
      paraValores({
        nomeFantasia: 'Cantina Dona Marta',
        razaoSocial: null,
        documento: { tipo: 'CPF', numero: '52998224725' },
        email: 'contato@cantina.test',
        telefone: '61930000000',
        endereco: {
          cep: '70000000',
          logradouro: 'SQN 210 Bloco K',
          numero: 10,
          complemento: null,
          bairro: 'Asa Norte',
          cidade: 'Brasilia',
          uf: 'DF',
        },
        criadaEm: '2026-09-01T12:00:00Z',
        atualizadaEm: '2026-09-01T12:00:00Z',
      }),
    ).toEqual(EMPRESA);
  });

  it('normaliza o documento digitado conforme o tipo', () => {
    expect(normalizarDocumento('CPF', '529.982.247-25')).toBe('52998224725');
    expect(normalizarDocumento('CNPJ', '11.222.333/0001-81')).toBe('11222333000181');
  });

  it('formata documento e CEP para leitura', () => {
    expect(formatarDocumento('CNPJ', '11222333000181')).toBe('11.222.333/0001-81');
    expect(formatarDocumento('CPF', '52998224725')).toBe('529.982.247-25');
    expect(formatarCep('70000000')).toBe('70000-000');
  });
});
