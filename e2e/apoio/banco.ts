import dns from 'node:dns';
import net from 'node:net';
import pg from 'pg';
import { ENDERECO_DO_BANCO } from './ambiente';

const HOSTS_LOCAIS = new Set(['localhost', '127.0.0.1', '::1']);
const VALIDADE_DA_SENHA_TEMPORARIA = "interval '48 hours'";
const ESPERA_DA_CONEXAO_MS = 20_000;
const TENTATIVAS_DE_CONEXAO = 3;

// Por padrão o Node disputa IPv6 e IPv4 com 250 ms para cada um. Em rede com
// NAT64 o IPv6 não chega ao Render, e o IPv4 até o Oregon pode passar de 3 s.
// Conectar só pelo IPv4, com um limite próprio, evita o ETIMEDOUT falso.
net.setDefaultAutoSelectFamily(false);
dns.setDefaultResultOrder('ipv4first');

async function conectar(): Promise<pg.Client> {
  const { hostname } = new URL(ENDERECO_DO_BANCO);
  for (let tentativa = 1; ; tentativa++) {
    const cliente = new pg.Client({
      connectionString: ENDERECO_DO_BANCO,
      ssl: HOSTS_LOCAIS.has(hostname) ? false : { rejectUnauthorized: true },
      connectionTimeoutMillis: ESPERA_DA_CONEXAO_MS,
    });
    try {
      await cliente.connect();
      return cliente;
    } catch (erro) {
      await cliente.end().catch(() => undefined);
      if (tentativa >= TENTATIVAS_DE_CONEXAO) throw erro;
    }
  }
}

async function executar(sql: string, parametros: unknown[]): Promise<number> {
  const cliente = await conectar();
  try {
    return (await cliente.query(sql, parametros)).rowCount ?? 0;
  } finally {
    await cliente.end();
  }
}

export async function vencerSenhaTemporaria(cpf: string): Promise<void> {
  const alterados = await executar(
    `UPDATE "Entregador" SET senha_temporaria_expira_em = now() - interval '1 minute' WHERE cpf = $1 AND senha_temporaria`,
    [cpf],
  );
  if (alterados !== 1) throw new Error('O entregador nao esta com senha temporaria');
}

export async function renovarSenhaTemporaria(cpf: string): Promise<void> {
  await executar(
    `UPDATE "Entregador" SET senha_temporaria_expira_em = now() + ${VALIDADE_DA_SENHA_TEMPORARIA} WHERE cpf = $1 AND senha_temporaria`,
    [cpf],
  );
}
