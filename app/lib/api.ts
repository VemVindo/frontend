const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export interface Empresa {
  id: number;
  nomeFantasia: string;
  email: string;
  role: 'ESTABELECIMENTO';
}

export interface Entregador {
  cpf: string;
  nome: string;
  role: 'ENTREGADOR';
  senhaTemporaria: boolean;
}

export interface LoginResponse<Usuario> {
  user: Usuario;
}

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
): Promise<LoginResponse<Empresa>> {
  return requisitar('/auth/login/empresa', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
}

export async function loginEntregador(
  cpf: string,
  senha: string,
): Promise<LoginResponse<Entregador>> {
  return requisitar('/auth/login/entregador', {
    method: 'POST',
    body: JSON.stringify({ cpf, senha }),
  });
}

export async function buscarUsuarioAtual(): Promise<Empresa | Entregador> {
  return requisitar('/auth/me', { method: 'GET' });
}

export async function trocarSenhaEntregador(
  senhaAtual: string,
  novaSenha: string,
): Promise<LoginResponse<Entregador>> {
  return requisitar('/auth/entregador/trocar-senha', {
    method: 'POST',
    body: JSON.stringify({ senhaAtual, novaSenha }),
  });
}

export async function sair(): Promise<void> {
  return requisitar('/auth/logout', { method: 'POST' });
}

export { API_URL };
