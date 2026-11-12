import type { Coordenada } from '@/app/lib/tipos';

export const CHAVE_GOOGLE_MAPS = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

export const MAP_ID_GOOGLE_MAPS = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

export const CENTRO_PADRAO: Coordenada = { lat: -15.7939, lng: -47.8828 };

export const INTERVALO_ENVIO_MS = 5_000;

export function formatarDistanciaRestante(metros: number | null): string | null {
  if (metros === null) return null;
  if (metros < 1000) {
    return `${Math.max(0, Math.round(metros / 10) * 10)} m`;
  }
  return `${(metros / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;
}

export function formatarTempoRestante(segundos: number | null): string | null {
  if (segundos === null) return null;
  if (segundos < 60) return 'menos de 1 min';
  const minutos = Math.round(segundos / 60);
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

export function horarioDeChegada(segundos: number | null, agora: Date = new Date()): string | null {
  if (segundos === null) return null;
  const chegada = new Date(agora.getTime() + segundos * 1000);
  return chegada.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function linkDeNavegacao(
  destino: Coordenada | null,
  endereco: string,
  origem: Coordenada | null = null,
): string {
  // Sem origem, o Google Maps usa a localização que ele mesmo estimar, que pode estar longe do entregador.
  const partida = origem ? `&origin=${encodeURIComponent(`${origem.lat},${origem.lng}`)}` : '';
  const alvo = destino ? `${destino.lat},${destino.lng}` : endereco;
  return `https://www.google.com/maps/dir/?api=1${partida}&destination=${encodeURIComponent(alvo)}`;
}

// Acima disso a leitura veio da rede (Wi-Fi ou IP), não do GPS, e pode estar a quarteirões do entregador.
export const PRECISAO_RUIM_M = 200;

// Uma leitura pior só substitui a melhor depois desse tempo, para o ponto não ficar parado se o GPS piorar.
export const VALIDADE_DA_LEITURA_MS = 30_000;

export interface LeituraDoGps {
  coordenada: Coordenada;
  precisaoM: number;
  em: number;
}

export function deveTrocarLeitura(atual: LeituraDoGps | null, nova: LeituraDoGps): boolean {
  if (!atual || nova.precisaoM <= atual.precisaoM) return true;
  return nova.em - atual.em >= VALIDADE_DA_LEITURA_MS;
}

export function descreverPrecisao(metros: number): string {
  const margem = formatarDistanciaRestante(Math.max(metros, 10));
  if (metros <= PRECISAO_RUIM_M) return `Margem de erro de cerca de ${margem}.`;
  return `Localização imprecisa: margem de erro de cerca de ${margem}. Use o celular com o GPS ligado; no computador o navegador estima a posição pela rede.`;
}

export function deveEnviarPosicao(ultimoEnvio: number | null, agora: number): boolean {
  return ultimoEnvio === null || agora - ultimoEnvio >= INTERVALO_ENVIO_MS;
}

export function mensagemDeErroDeLocalizacao(codigo: number): string {
  switch (codigo) {
    case 1:
      return 'A permissão de localização foi negada. Libere a localização nas configurações do navegador para compartilhar.';
    case 2:
      return 'Não foi possível obter a sua localização. Verifique se o GPS está ligado.';
    case 3:
      return 'A localização demorou para responder. Tentando de novo.';
    default:
      return 'Não foi possível obter a sua localização.';
  }
}
