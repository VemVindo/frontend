import pg from 'pg';
import { ENDERECO_DO_BANCO } from './ambiente';

const HOSTS_LOCAIS = new Set(['localhost', '127.0.0.1', '::1']);
const VALIDADE_DA_SENHA_TEMPORARIA = "interval '48 hours'";

async function executar(sql: string, parametros: unknown[]): Promise<number> {
  const { hostname } = new URL(ENDERECO_DO_BANCO);
  const cliente = new pg.Client({
    connectionString: ENDERECO_DO_BANCO,
    ssl: HOSTS_LOCAIS.has(hostname) ? false : { rejectUnauthorized: true },
  });
  await cliente.connect();
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
