import type {
  DadosCompartilhados,
  Empresa,
  Entregador,
  RespostaLogin,
  Vinculo,
} from '@/app/lib/tipos';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
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
    };
    const mensagem = Array.isArray(body.message)
      ? body.message.join('; ')
      : body.message;
    throw new ApiError(res.status, mensagem ?? `Erro ${res.status}`);
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

export { API_URL };
