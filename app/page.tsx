'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  API_URL,
  checkHealth,
  loginEmpresa,
  type LoginResponse,
} from './lib/api';

type HealthStatus = 'checando' | 'online' | 'offline';

export default function Home() {
  const [health, setHealth] = useState<HealthStatus>('checando');
  const [email, setEmail] = useState('padaria@teste.com');
  const [senha, setSenha] = useState('senha1234');
  const [resultado, setResultado] = useState<LoginResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    checkHealth()
      .then((r) => setHealth(r.database === 'up' ? 'online' : 'offline'))
      .catch(() => setHealth('offline'));
  }, []);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setResultado(null);
    setCarregando(true);
    try {
      setResultado(await loginEmpresa(email, senha));
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha no login');
    } finally {
      setCarregando(false);
    }
  }

  const healthLabel: Record<HealthStatus, string> = {
    checando: 'checando...',
    online: 'online',
    offline: 'offline',
  };
  const healthColor: Record<HealthStatus, string> = {
    checando: 'bg-zinc-400',
    online: 'bg-green-500',
    offline: 'bg-red-500',
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">VemVindo</h1>
        <p className="mt-1 text-sm text-zinc-500">Teste de conexão frontend x backend</p>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
        <span className={`h-2.5 w-2.5 rounded-full ${healthColor[health]}`} />
        <span>Backend: {healthLabel[health]}</span>
        <code className="ml-auto text-xs text-zinc-500">{API_URL}</code>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Senha
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <button
          type="submit"
          disabled={carregando}
          className="mt-1 rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {carregando ? 'Entrando...' : 'Entrar como empresa'}
        </button>
      </form>

      {erro && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {erro}
        </p>
      )}

      {resultado && (
        <div className="rounded-md bg-green-50 p-3 text-sm dark:bg-green-950">
          <p className="font-medium text-green-800 dark:text-green-300">
            Login OK: {resultado.user.nomeFantasia}
          </p>
          <p className="mt-1 break-all text-xs text-zinc-500">
            token: {resultado.accessToken.slice(0, 32)}...
          </p>
        </div>
      )}
    </main>
  );
}
