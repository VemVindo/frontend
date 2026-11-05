import { cnpjValido, normalizarCnpj } from '@/app/lib/cnpj';
import { cpfValido, somenteDigitosCpf } from '@/app/lib/cpf';
import type { CadastroDaEmpresa, DadosCadastraisDaEmpresa, NovaEmpresa, TipoDocumento } from '@/app/lib/tipos';

export const UFS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;

const TAMANHO_MINIMO_SENHA = 8;
const TAMANHO_MAXIMO_SENHA = 72;
const SENHA_SO_TECLADO = /^[\x21-\x7E]*$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ValoresDaEmpresa {
  nomeFantasia: string;
  email: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface ValoresDoCadastro extends ValoresDaEmpresa {
  tipoDocumento: TipoDocumento;
  documento: string;
  razaoSocial: string;
  senha: string;
  confirmacaoSenha: string;
}

export type ErrosDoFormulario<T> = Partial<Record<keyof T, string>>;

export const EMPRESA_VAZIA: ValoresDaEmpresa = {
  nomeFantasia: '',
  email: '',
  telefone: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
};

export function somenteDigitos(texto: string, maximo: number): string {
  return texto.replace(/\D/g, '').slice(0, maximo);
}

export function normalizarDocumento(tipo: TipoDocumento, texto: string): string {
  return tipo === 'CNPJ' ? normalizarCnpj(texto) : somenteDigitosCpf(texto);
}

export function validarEmpresa(valores: ValoresDaEmpresa): ErrosDoFormulario<ValoresDaEmpresa> {
  const erros: ErrosDoFormulario<ValoresDaEmpresa> = {};
  const obrigatorios = ['nomeFantasia', 'logradouro', 'bairro', 'cidade'] as const;
  for (const campo of obrigatorios) {
    if (!valores[campo].trim()) erros[campo] = 'Preencha este campo';
  }
  if (!EMAIL.test(valores.email.trim())) erros.email = 'Informe um e-mail válido';
  if (!/^\d{10,11}$/.test(valores.telefone)) erros.telefone = 'Informe DDD e número (10 ou 11 dígitos)';
  if (!/^\d{8}$/.test(valores.cep)) erros.cep = 'O CEP tem 8 dígitos';
  if (!/^[1-9]\d*$/.test(valores.numero)) erros.numero = 'Informe o número do endereço';
  if (!(UFS as readonly string[]).includes(valores.uf)) erros.uf = 'Escolha o estado';
  return erros;
}

export function validarCadastro(valores: ValoresDoCadastro): ErrosDoFormulario<ValoresDoCadastro> {
  const erros: ErrosDoFormulario<ValoresDoCadastro> = validarEmpresa(valores);
  if (valores.tipoDocumento === 'CNPJ') {
    if (!cnpjValido(valores.documento)) erros.documento = 'CNPJ inválido';
    if (!valores.razaoSocial.trim()) erros.razaoSocial = 'A razão social é obrigatória para CNPJ';
  } else if (!cpfValido(valores.documento)) {
    erros.documento = 'CPF inválido';
  }
  if (valores.senha.length < TAMANHO_MINIMO_SENHA || valores.senha.length > TAMANHO_MAXIMO_SENHA) {
    erros.senha = `A senha precisa ter de ${TAMANHO_MINIMO_SENHA} a ${TAMANHO_MAXIMO_SENHA} caracteres`;
  } else if (!SENHA_SO_TECLADO.test(valores.senha)) {
    erros.senha = 'Use letras sem acento, números e símbolos, sem espaços';
  }
  if (valores.confirmacaoSenha !== valores.senha) erros.confirmacaoSenha = 'As senhas não conferem';
  return erros;
}

export function paraDadosCadastrais(valores: ValoresDaEmpresa): DadosCadastraisDaEmpresa {
  const complemento = valores.complemento.trim();
  return {
    nomeFantasia: valores.nomeFantasia.trim(),
    email: valores.email.trim(),
    telefone: valores.telefone,
    cep: valores.cep,
    logradouro: valores.logradouro.trim(),
    numero: Number(valores.numero),
    ...(complemento ? { complemento } : {}),
    bairro: valores.bairro.trim(),
    cidade: valores.cidade.trim(),
    uf: valores.uf,
  };
}

export function paraNovaEmpresa(valores: ValoresDoCadastro): NovaEmpresa {
  return {
    ...paraDadosCadastrais(valores),
    ...(valores.tipoDocumento === 'CNPJ'
      ? { cnpj: valores.documento, razaoSocial: valores.razaoSocial.trim() }
      : { cpf: valores.documento }),
    senha: valores.senha,
  };
}

export function paraValores(cadastro: CadastroDaEmpresa): ValoresDaEmpresa {
  const { endereco } = cadastro;
  return {
    nomeFantasia: cadastro.nomeFantasia,
    email: cadastro.email,
    telefone: cadastro.telefone,
    cep: endereco.cep,
    logradouro: endereco.logradouro,
    numero: String(endereco.numero),
    complemento: endereco.complemento ?? '',
    bairro: endereco.bairro,
    cidade: endereco.cidade,
    uf: endereco.uf,
  };
}

export function formatarDocumento(tipo: TipoDocumento, numero: string): string {
  if (tipo === 'CPF') return numero.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  return numero.replace(/^(\w{2})(\w{3})(\w{3})(\w{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function formatarCep(cep: string): string {
  return cep.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}
