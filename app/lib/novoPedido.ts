import { UFS } from './empresa';
import type {
  Coordenada,
  CriarPedidoRequisicao,
  CriarPedidoResposta,
  Empresa,
  EnderecoParaLocalizar,
  TipoRotaEntrega,
} from './tipos';

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
  tipo_veiculo: TipoRotaEntrega | '';
}

export type ErrosNovoPedido = Partial<Record<keyof FormularioNovoPedido, string>>;

const UFS_VALIDAS: ReadonlySet<string> = new Set(UFS);

function telefoneValido(telefone: string): boolean {
  const digitos = telefone.replace(/[\s()+.-]/g, '');
  return /^[\d\s()+.-]+$/.test(telefone) && /^[1-9]{2}(?:[2-5]\d{7}|9\d{8})$/.test(digitos);
}
function numeroValido(numero: string): boolean {
  return /^\d+$/.test(numero.trim()) && Number(numero) > 0 && Number(numero) <= 2_147_483_647;
}
function validarVeiculo(veiculo: FormularioNovoPedido['tipo_veiculo'], erros: ErrosNovoPedido): void {
  if (!erros.tipo_veiculo && veiculo !== 'DRIVE' && veiculo !== 'BICYCLE') {
    erros.tipo_veiculo = 'Selecione um tipo de veículo válido.';
  }
}

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
    tipo_veiculo: 'Selecione o tipo de veículo.',
  };
  for (const [campo, mensagem] of Object.entries(obrigatorios)) {
    const chave = campo as keyof FormularioNovoPedido;
    if (!dados[chave].trim()) erros[chave] = mensagem;
  }
  if (!erros.telefone) {
    if (!telefoneValido(dados.telefone)) {
      erros.telefone = 'Informe um telefone brasileiro com DDD, como (61) 99999-0000.';
    }
  }
  if (!erros.cep && !/^\d{5}-?\d{3}$/.test(dados.cep.trim())) {
    erros.cep = 'Informe um CEP com 8 dígitos, como 70000-000.';
  }
  if (!erros.numero && !numeroValido(dados.numero)) {
    erros.numero = 'Informe um número inteiro de 1 a 2147483647.';
  }
  if (!erros.uf && !UFS_VALIDAS.has(dados.uf.trim().toUpperCase())) {
    erros.uf = 'Informe uma UF brasileira válida, como DF.';
  }
  validarVeiculo(dados.tipo_veiculo, erros);
  return erros;
}

export const CAMPOS_DO_ENDERECO: ReadonlySet<keyof FormularioNovoPedido> = new Set([
  'cep',
  'logradouro',
  'numero',
  'bairro',
  'cidade',
  'uf',
]);

export function enderecoParaLocalizar(dados: FormularioNovoPedido): EnderecoParaLocalizar | null {
  const erros = validarNovoPedido(dados);
  if ([...CAMPOS_DO_ENDERECO].some((campo) => erros[campo])) return null;
  return {
    cep: dados.cep.trim().replace('-', ''),
    logradouro: dados.logradouro.trim(),
    numero: Number(dados.numero),
    bairro: dados.bairro.trim(),
    cidade: dados.cidade.trim(),
    uf: dados.uf.trim().toUpperCase(),
  };
}

/** Une somente seções preenchidas, com rótulos e uma linha em branco entre elas.
 * Remove espaços nas extremidades e preserva quebras de linha internas.
 * Ambos vazios geram "", permitido pelo DTO atual.
 */
export function gerarDescricaoPedido(itens: string, observacoes: string): string {
  return [itens.trim() ? `Itens: ${itens.trim()}` : '', observacoes.trim() ? `Observações: ${observacoes.trim()}` : '']
    .filter(Boolean)
    .join('\n\n');
}

export function prepararCriacaoPedido(
  dados: FormularioNovoPedido,
  empresa: Empresa,
  destino: Coordenada | null = null,
): CriarPedidoRequisicao {
  if (Object.keys(validarNovoPedido(dados)).length) throw new Error('Formulário inválido.');
  if (empresa.cargo !== 'ESTABELECIMENTO' || !Number.isInteger(empresa.id) || empresa.id <= 0) {
    throw new Error('Estabelecimento autenticado inválido.');
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
    tipo_veiculo: dados.tipo_veiculo as TipoRotaEntrega,
    ...(destino ? { destino_lat: destino.lat, destino_lng: destino.lng } : {}),
  };
}

type ResultadoEnvioPedido = { estado: 'bloqueado' | 'ocupado' } | { estado: 'criado'; pedido: CriarPedidoResposta };

export function criarFluxoEnvioPedido(enviar: (dados: CriarPedidoRequisicao) => Promise<CriarPedidoResposta>) {
  let enviando = false;
  return async (
    dados: FormularioNovoPedido,
    empresa: Empresa | null,
    destino: Coordenada | null = null,
  ): Promise<ResultadoEnvioPedido> => {
    if (enviando) return { estado: 'ocupado' };
    if (!empresa) return { estado: 'bloqueado' };
    if (Object.keys(validarNovoPedido(dados)).length) throw new Error('Formulário inválido.');
    enviando = true;
    try {
      const rascunho = Object.freeze({ ...dados });
      const pedido = await enviar(prepararCriacaoPedido(rascunho, empresa, destino));
      return { estado: 'criado', pedido };
    } finally {
      enviando = false;
    }
  };
}
