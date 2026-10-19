import type { Coordenada } from '@/app/lib/tipos';

export const CHAVE_GOOGLE_MAPS = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

// Os marcadores avançados exigem um Map ID; o DEMO_MAP_ID do Google serve
// para desenvolvimento.
export const MAP_ID_GOOGLE_MAPS = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

// Centro de Brasília, usado só até a primeira coordenada chegar.
export const CENTRO_PADRAO: Coordenada = { lat: -15.7939, lng: -47.8828 };

// O navegador entrega posições a cada poucos segundos; o backend só precisa
// de uma a cada INTERVALO_ENVIO_MS.
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

// Maps URLs: abre a navegação do app do Google Maps, sem chave e sem custo.
export function linkDeNavegacao(destino: Coordenada | null, endereco: string): string {
  const alvo = destino ? `${destino.lat},${destino.lng}` : endereco;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(alvo)}`;
}

export function deveEnviarPosicao(ultimoEnvio: number | null, agora: number): boolean {
  return ultimoEnvio === null || agora - ultimoEnvio >= INTERVALO_ENVIO_MS;
}

// Códigos do GeolocationPositionError: 1 permissão negada, 2 posição
// indisponível, 3 tempo esgotado.
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
