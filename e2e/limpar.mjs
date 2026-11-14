import { readFile } from 'node:fs/promises';
import pg from 'pg';

const ARQUIVO_SQL = new URL('./limpeza.sql', import.meta.url);
const HOSTS_LOCAIS = new Set(['localhost', '127.0.0.1', '::1']);
const apagar = process.argv.includes('--apagar');
const enderecoDoBanco = process.env.E2E_DATABASE_URL;

if (!enderecoDoBanco) {
  console.error('Defina E2E_DATABASE_URL com o endereço do banco (no Render: External Database URL).');
  process.exit(1);
}

const { hostname, pathname } = new URL(enderecoDoBanco);
const sqlSemDesfazer = (await readFile(ARQUIVO_SQL, 'utf8')).replace(/^ROLLBACK;\s*$/m, '');
const cliente = new pg.Client({
  connectionString: enderecoDoBanco,
  ssl: HOSTS_LOCAIS.has(hostname) ? false : { rejectUnauthorized: true },
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
