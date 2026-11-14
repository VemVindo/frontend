import { readFile } from 'node:fs/promises';
import dns from 'node:dns';
import net from 'node:net';
import pg from 'pg';

const ARQUIVO_SQL = new URL('./limpeza.sql', import.meta.url);
const HOSTS_LOCAIS = new Set(['localhost', '127.0.0.1', '::1']);
const ESPERA_DA_CONEXAO_MS = 20_000;
const apagar = process.argv.includes('--apagar');
const enderecoDoBanco = process.env.E2E_DATABASE_URL;

// Por padrão o Node disputa IPv6 e IPv4 com 250 ms para cada um. Em rede com
// NAT64 o IPv6 não chega ao Render, e o IPv4 até o Oregon pode passar de 3 s.
// Conectar só pelo IPv4, com um limite próprio, evita o ETIMEDOUT falso.
net.setDefaultAutoSelectFamily(false);
dns.setDefaultResultOrder('ipv4first');

if (!enderecoDoBanco) {
  console.error('Defina E2E_DATABASE_URL com o endereço do banco (no Render: External Database URL).');
  process.exit(1);
}

const { hostname, pathname } = new URL(enderecoDoBanco);
const sqlSemDesfazer = (await readFile(ARQUIVO_SQL, 'utf8')).replace(/^ROLLBACK;\s*$/m, '');
const cliente = new pg.Client({
  connectionString: enderecoDoBanco,
  ssl: HOSTS_LOCAIS.has(hostname) ? false : { rejectUnauthorized: true },
  connectionTimeoutMillis: ESPERA_DA_CONEXAO_MS,
});

console.log(`Banco: ${hostname}${pathname}`);
console.log(apagar ? 'Modo: apagar de verdade' : 'Modo: prévia (nada é apagado; use --apagar para apagar)');

await cliente.connect();
try {
  const resultados = await cliente.query(sqlSemDesfazer);
  const [antes, depois] = resultados.filter((r) => r.command === 'SELECT' && r.rows.length === 1);
  const { empresas, entregadores, pedidos } = antes.rows[0];
  console.log(`Encontrados: ${empresas} empresas, ${entregadores} entregadores e ${pedidos} pedidos da suíte.`);
  const sobrou = Number(depois.rows[0].empresas_restantes) + Number(depois.rows[0].pedidos_restantes);
  if (sobrou > 0) throw new Error(`Ainda sobrariam ${sobrou} registros; nada foi apagado.`);
  await cliente.query(apagar ? 'COMMIT' : 'ROLLBACK');
  console.log(apagar ? 'Apagado.' : 'Prévia concluída, nada foi apagado.');
} catch (erro) {
  await cliente.query('ROLLBACK').catch(() => undefined);
  throw erro;
} finally {
  await cliente.end();
}
