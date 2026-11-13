const PAUSA_COM_TELA_MS = 350;

export const URL_DO_FRONT = process.env.E2E_URL_FRONT ?? 'http://localhost:3000';
export const URL_DA_API = process.env.E2E_URL_API ?? 'http://localhost:8000';
export const NAVEGADOR = process.env.E2E_NAVEGADOR ?? 'chrome';
export const SEM_TELA = process.env.E2E_SEM_TELA === '1';
export const PAUSA_ENTRE_ACOES_MS = Number(process.env.E2E_PAUSA_MS ?? (SEM_TELA ? 0 : PAUSA_COM_TELA_MS));
export const ESPERA_MAXIMA_MS = Number(process.env.E2E_ESPERA_MS ?? 15_000);
