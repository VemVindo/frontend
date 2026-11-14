import { PRODUCAO, URL_DA_API, URL_DO_FRONT } from './ambiente';

const ESPERA_DO_RENDER_MS = 3 * 60_000;
const INTERVALO_MS = 5_000;

async function respondeu(endereco: string): Promise<boolean> {
  try {
    return (await fetch(endereco, { signal: AbortSignal.timeout(INTERVALO_MS * 6) })).ok;
  } catch {
    return false;
  }
}

async function esperarNoAr(endereco: string): Promise<void> {
  const limite = Date.now() + ESPERA_DO_RENDER_MS;
  while (Date.now() < limite) {
    if (await respondeu(endereco)) return;
    await new Promise((continuar) => setTimeout(continuar, INTERVALO_MS));
  }
  throw new Error(`${endereco} não respondeu em ${ESPERA_DO_RENDER_MS / 60_000} minutos`);
}

export default async function preparar(): Promise<void> {
  if (!PRODUCAO) return;
  await Promise.all([esperarNoAr(`${URL_DA_API}/health/db`), esperarNoAr(`${URL_DO_FRONT}/`)]);
}
