'use client';

import MapaDoPino from '@/app/components/mapa/MapaDoPino';
import { MarcadorDestino } from '@/app/components/mapa/MarcadoresDoMapa';
import { CHAVE_GOOGLE_MAPS } from '@/app/lib/mapa';
import type { Coordenada } from '@/app/lib/tipos';

export type EtapaDoLocal =
  'pendente' | 'localizando' | 'encontrado' | 'aproximado' | 'marcado' | 'nao-encontrado' | 'falhou';

export interface LocalNoMapaProps {
  etapa: EtapaDoLocal;
  destino: Coordenada | null;
  tentativa: number;
  enderecoEncontrado?: string | null;
  podeLocalizar: boolean;
  aoLocalizar: () => void;
  aoMarcar: (ponto: Coordenada) => void;
}

const MENSAGENS: Record<EtapaDoLocal, string> = {
  pendente: 'O endereço será localizado ao criar o pedido. Você também pode localizá-lo agora para conferir o ponto.',
  localizando: 'Procurando o endereço...',
  encontrado: 'Confira o pino. Se estiver no lugar errado, arraste ou toque no ponto certo.',
  aproximado: 'Achamos só a região, não a porta. Arraste o pino ou toque no local exato da entrega.',
  marcado: 'Ponto marcado. É aqui que o entregador vai chegar.',
  'nao-encontrado': 'Não encontramos esse endereço. Toque no mapa para marcar o ponto de entrega.',
  falhou: 'Não foi possível localizar agora. Toque no mapa para marcar o ponto de entrega.',
};

export default function LocalNoMapa({
  etapa,
  destino,
  tentativa,
  enderecoEncontrado = null,
  podeLocalizar,
  aoLocalizar,
  aoMarcar,
}: LocalNoMapaProps) {
  if (!CHAVE_GOOGLE_MAPS) return null;
  const mapaVisivel = etapa !== 'pendente' && etapa !== 'localizando';

  return (
    <section aria-label="Ponto de entrega no mapa" className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <p role="status" aria-live="polite" className="text-xs text-texto-apoio">
          {MENSAGENS[etapa]}
        </p>
        <button
          type="button"
          onClick={aoLocalizar}
          disabled={!podeLocalizar || etapa === 'localizando'}
          className="h-8 shrink-0 cursor-pointer rounded-lg border border-primaria px-3 text-xs font-semibold text-primaria disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-primaria"
        >
          {mapaVisivel ? 'Localizar de novo' : 'Localizar no mapa'}
        </button>
      </div>
      {enderecoEncontrado && etapa !== 'marcado' && (
        <p className="text-xs text-texto-corpo">
          Encontrado: <span className="font-semibold">{enderecoEncontrado}</span>
        </p>
      )}
      {mapaVisivel && (
        <MapaDoPino
          pino={destino}
          tentativa={tentativa}
          titulo="Ponto de entrega"
          marcador={<MarcadorDestino rotulo="Entrega" />}
          aoMarcar={aoMarcar}
        />
      )}
    </section>
  );
}
