import type { CriarPedidoRequisicao, Empresa } from './tipos';

export interface FormularioNovoPedido {
  nome_recebedor: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  itens: string;
  observacoes: string;
}

export type ErrosNovoPedido = Partial<Record<keyof FormularioNovoPedido, string>>;

const UFS = new Set('AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' '));

export function validarNovoPedido(dados: FormularioNovoPedido): ErrosNovoPedido {
  const erros: ErrosNovoPedido = {};
  const obrigatorios = {
    nome_recebedor: 'Informe o nome do recebedor.',
    telefone: 'Informe o telefone de contato.',
    cep: 'Informe o CEP.',
    logradouro: 'Informe o logradouro.',
    numero: 'Informe o número do endereço.',
    bairro: 'Informe o bairro.',
    cidade: 'Informe a cidade.',
    uf: 'Informe a UF.',
  };
  for (const [campo, mensagem] of Object.entries(obrigatorios)) {
    const chave = campo as keyof FormularioNovoPedido;
    if (!dados[chave].trim()) erros[chave] = mensagem;
  }
  if (!erros.telefone) {
    const digitos = dados.telefone.replace(/[\s()+.-]/g, '');
    if (!/^[\d\s()+.-]+$/.test(dados.telefone) || !/^[1-9]{2}(?:[2-5]\d{7}|9\d{8})$/.test(digitos)) {
      erros.telefone = 'Informe um telefone brasileiro com DDD, como (61) 99999-0000.';
    }
  }
  if (!erros.cep && !/^\d{5}-?\d{3}$/.test(dados.cep.trim())) {
    erros.cep = 'Informe um CEP com 8 dígitos, como 70000-000.';
  }
  // O banco armazena numero como Int de 32 bits; aceita-se inteiro não negativo.
  if (!erros.numero && (!/^\d+$/.test(dados.numero.trim()) || Number(dados.numero) > 2_147_483_647)) {
    erros.numero = 'Informe um número inteiro de 0 a 2147483647.';
  }
  if (!erros.uf && !UFS.has(dados.uf.trim().toUpperCase())) {
    erros.uf = 'Informe uma UF brasileira válida, como DF.';
  }
  return erros;
}

/** Une somente seções preenchidas, com rótulos e uma linha em branco entre elas.
 * Remove espaços nas extremidades e preserva quebras de linha internas.
 * Ambos vazios geram "", permitido pelo DTO atual.
 */
export function gerarDescricaoPedido(itens: string, observacoes: string): string {
  return [
    itens.trim() ? `Itens: ${itens.trim()}` : '',
    observacoes.trim() ? `Observações: ${observacoes.trim()}` : '',
  ].filter(Boolean).join('\n\n');
}

export type DadosEntregaNovoPedido = Pick<CriarPedidoRequisicao, 'valor_entrega' | 'distancia'>;

/** Recebe a empresa obtida por useSessao('ESTABELECIMENTO') e dados reais da entrega.
 * Não fornece valores padrão para distância ou preço e não realiza requisições.
 */
export function prepararCriacaoPedido(
  dados: FormularioNovoPedido,
  empresa: Empresa,
  entrega: DadosEntregaNovoPedido,
): CriarPedidoRequisicao {
  if (Object.keys(validarNovoPedido(dados)).length) throw new Error('Formulário inválido.');
  if (empresa.cargo !== 'ESTABELECIMENTO' || !Number.isInteger(empresa.id) || empresa.id <= 0) {
    throw new Error('Estabelecimento autenticado inválido.');
  }
  for (const valor of [entrega.valor_entrega, entrega.distancia]) {
    if (!Number.isInteger(valor) || valor < 0 || valor > 2_147_483_647) {
      throw new Error('Valor e distância devem ser inteiros não negativos compatíveis com o backend.');
    }
  }
  return {
    nome_recebedor: dados.nome_recebedor.trim(),
    telefone_recebedor: dados.telefone.replace(/\D/g, ''),
    cep: dados.cep.trim().replace('-', ''),
    logradouro: dados.logradouro.trim(),
    numero: Number(dados.numero),
    ...(dados.complemento.trim() ? { complemento: dados.complemento.trim() } : {}),
    bairro: dados.bairro.trim(),
    cidade: dados.cidade.trim(),
    uf: dados.uf.trim().toUpperCase(),
    descricao: gerarDescricaoPedido(dados.itens, dados.observacoes),
    valor_entrega: entrega.valor_entrega,
    distancia: entrega.distancia,
    idEmpresa: empresa.id,
  };
}
