const PAUSA_COM_TELA_MS = 350;
const ESPERA_LOCAL_MS = 15_000;
const ESPERA_EM_PRODUCAO_MS = 30_000;

export const PRODUCAO = process.env.E2E_PRODUCAO === '1';

function enderecoObrigatorio(variavel: string, padraoLocal: string): string {
  const valor = process.env[variavel];
  if (valor) return valor.replace(/\/+$/, '');
  if (PRODUCAO) throw new Error(`Com E2E_PRODUCAO=1, defina ${variavel} com o endereço publicado`);
  return padraoLocal;
}

export const URL_DO_FRONT = enderecoObrigatorio('E2E_URL_FRONT', 'http://localhost:3000');
export const URL_DA_API = enderecoObrigatorio('E2E_URL_API', 'http://localhost:8000');
export const NAVEGADOR = process.env.E2E_NAVEGADOR ?? 'chrome';
export const SEM_TELA = process.env.E2E_SEM_TELA === '1';
export const CELULAR = process.env.E2E_CELULAR === '1';
export const JANELA = CELULAR ? { largura: 390, altura: 844 } : { largura: 1440, altura: 900 };
export const ENDERECO_DO_BANCO = process.env.E2E_DATABASE_URL ?? '';
export const PAUSA_ENTRE_ACOES_MS = Number(process.env.E2E_PAUSA_MS ?? (SEM_TELA ? 0 : PAUSA_COM_TELA_MS));
export const ESPERA_MAXIMA_MS = Number(
  process.env.E2E_ESPERA_MS ?? (PRODUCAO ? ESPERA_EM_PRODUCAO_MS : ESPERA_LOCAL_MS),
);

export const MARCA_DOS_DADOS = 'e2e-selenium';

export function emailDeTeste(papel: string, sufixo: string): string {
  return `${MARCA_DOS_DADOS}-${papel}-${sufixo}@example.com`;
}
