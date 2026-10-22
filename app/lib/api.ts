import type {
  ConfiguracoesDaEmpresa,
  Coordenada,
  DadosCompartilhados,
  LinkDeRastreio,
  Empresa,
  Entregador,
  PedidoAtivo,
  PaginaDoRecebedor,
  ParametrosRemuneracao,
  PedidoDoEntregador,
  RemuneracaoDaEmpresa,
  RespostaLogin,
  StatusDisponiveis,
  StatusPedido,
  TrocaDeEntregador,
  Vinculo,
  VisaoDaEntrega,
} from '@/app/lib/tipos';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly detalhes: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function requisitar<T>(caminho: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${caminho}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      message?: string | string[];
    } & Record<string, unknown>;
    const mensagem = Array.isArray(body.message)
      ? body.message.join('; ')
      : body.message;
    throw new ApiError(res.status, mensagem ?? `Erro ${res.status}`, body);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export async function checkHealth(): Promise<{ database: string }> {
  return requisitar('/health/db', { method: 'GET' });
}

export async function loginEmpresa(
  email: string,
  senha: string,
): Promise<RespostaLogin<Empresa>> {
  return requisitar('/auth/login/empresa', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
}

export async function loginEntregador(
  cpf: string,
  senha: string,
): Promise<RespostaLogin<Entregador>> {
  return requisitar('/auth/login/entregador', {
    method: 'POST',
    body: JSON.stringify({ cpf, senha }),
  });
}

export async function buscarUsuarioAtual(): Promise<Empresa | Entregador> {
  return requisitar('/auth/minhas-infos', { method: 'GET' });
}

export async function trocarSenhaEntregador(
  senhaAtual: string,
  novaSenha: string,
  cienteDadosCompartilhados: boolean,
): Promise<RespostaLogin<Entregador>> {
  return requisitar('/auth/entregador/trocar-senha', {
    method: 'POST',
    body: JSON.stringify({ senhaAtual, novaSenha, cienteDadosCompartilhados }),
  });
}

export async function sair(): Promise<void> {
  return requisitar('/auth/sair', { method: 'POST' });
}

export async function buscarDadosCompartilhados(): Promise<{ dados: DadosCompartilhados }> {
  return requisitar('/entregador/dados-compartilhados', { method: 'GET' });
}

export async function listarVinculos(): Promise<Vinculo[]> {
  return requisitar('/entregador/vinculos', { method: 'GET' });
}

export async function aceitarVinculo(id: number): Promise<void> {
  return requisitar(`/entregador/vinculos/${id}/aceitar`, { method: 'POST' });
}

export async function recusarVinculo(id: number): Promise<void> {
  return requisitar(`/entregador/vinculos/${id}/recusar`, { method: 'POST' });
}

export async function encerrarVinculo(id: number): Promise<void> {
  return requisitar(`/entregador/vinculos/${id}/encerrar`, { method: 'POST' });
}

export async function listarFrota(): Promise<DadosCompartilhados[]> {
  return requisitar('/entregadores', { method: 'GET' });
}

export async function listarPedidosDaEmpresa(): Promise<PedidoAtivo[]> {
  return requisitar('/pedidos', { method: 'GET' });
}

// Atribui (pedido PENDENTE) ou reatribui (EM_ANDAMENTO): o backend decide pelo status.
// E-US08: primeiro entregador de um pedido pendente.
export async function atribuirEntregadorAoPedido(id: number, cpfEntregador: string): Promise<PedidoAtivo> {
  return requisitar(`/pedidos/${id}/atribuir`, {
    method: 'PATCH',
    body: JSON.stringify({ cpfEntregador }),
  });
}

// E-US11: troca o entregador e registra o anterior no histórico.
export async function reatribuirEntregadorDoPedido(id: number, cpfEntregador: string): Promise<PedidoAtivo> {
  return requisitar(`/pedidos/${id}/entregador`, {
    method: 'PATCH',
    body: JSON.stringify({ cpfEntregador }),
  });
}

export async function listarHistoricoDeEntregadores(id: number): Promise<TrocaDeEntregador[]> {
  return requisitar(`/pedidos/${id}/historico-entregadores`, { method: 'GET' });
}

export async function listarPedidosDoEntregador(): Promise<PedidoDoEntregador[]> {
  return requisitar('/pedidos/minhas-entregas', { method: 'GET' });
}

export async function obterStatusDisponiveis(id: number): Promise<StatusDisponiveis> {
  return requisitar(`/pedidos/${id}/status-disponiveis`, { method: 'GET' });
}

export async function atualizarStatusDoPedido(id: number, status: StatusPedido): Promise<PedidoAtivo> {
  return requisitar(`/pedidos/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function finalizarPedido(id: number, codigo: string): Promise<PedidoAtivo> {
  return requisitar(`/pedidos/${id}/finalizar`, {
    method: 'POST',
    body: JSON.stringify({ codigo }),
  });
}

export async function registrarPosicao(
  id: number,
  posicao: Coordenada & { precisao?: number },
): Promise<VisaoDaEntrega> {
  return requisitar(`/pedidos/${id}/localizacao`, {
    method: 'PUT',
    body: JSON.stringify(posicao),
  });
}

export async function consultarRotaDoPedido(id: number): Promise<VisaoDaEntrega> {
  return requisitar(`/pedidos/${id}/rota`, { method: 'GET' });
}

// O token vem do link do recebedor e vai na URL como recebido.
export async function buscarRastreio(token: string): Promise<PaginaDoRecebedor> {
  return requisitar(`/rastreio/${encodeURIComponent(token)}`, { method: 'GET' });
}

export async function buscarLocalizacaoDoRastreio(token: string): Promise<VisaoDaEntrega> {
  return requisitar(`/rastreio/${encodeURIComponent(token)}/localizacao`, { method: 'GET' });
}

export async function gerarLinkDeRastreio(id: number): Promise<LinkDeRastreio> {
  return requisitar(`/pedidos/${id}/link-rastreio`, { method: 'POST' });
}

export async function buscarConfiguracoes(): Promise<ConfiguracoesDaEmpresa> {
  return requisitar('/empresa/configuracoes', { method: 'GET' });
}

export async function buscarParametrosRemuneracao(): Promise<RemuneracaoDaEmpresa> {
  return requisitar('/empresa/remuneracao', { method: 'GET' });
}

// E-US15: os novos valores valem para as próximas entregas.
export async function salvarParametrosRemuneracao(parametros: ParametrosRemuneracao): Promise<RemuneracaoDaEmpresa> {
  return requisitar('/empresa/remuneracao', {
    method: 'PUT',
    body: JSON.stringify(parametros),
  });
}

export async function atualizarConfiguracoes(
  configuracoes: ConfiguracoesDaEmpresa,
): Promise<ConfiguracoesDaEmpresa> {
  return requisitar('/empresa/configuracoes', {
    method: 'PATCH',
    body: JSON.stringify(configuracoes),
  });
}

export { API_URL };
