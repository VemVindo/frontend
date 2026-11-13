'use client';

import { AdvancedMarker, APIProvider, Map } from '@vis.gl/react-google-maps';
import type { ReactNode } from 'react';
import { CENTRO_PADRAO, CHAVE_GOOGLE_MAPS, MAP_ID_GOOGLE_MAPS } from '@/app/lib/mapa';
import type { Coordenada } from '@/app/lib/tipos';

export interface MapaDoPinoProps {
  pino: Coordenada | null;
  // Trocar a tentativa recria o mapa e recentraliza no pino novo.
  tentativa: number;
  titulo: string;
  marcador: ReactNode;
  aoMarcar: (ponto: Coordenada) => void;
}

// Mapa em que o pino é arrastável e um toque no mapa muda o pino de lugar.
export default function MapaDoPino({ pino, tentativa, titulo, marcador, aoMarcar }: MapaDoPinoProps) {
  return (
    <div className="h-56 overflow-hidden rounded-xl bg-mapa-fundo">
      <APIProvider apiKey={CHAVE_GOOGLE_MAPS} language="pt-BR" region="BR">
        <Map
          key={tentativa}
          mapId={MAP_ID_GOOGLE_MAPS}
          defaultCenter={pino ?? CENTRO_PADRAO}
          defaultZoom={pino ? 17 : 12}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
          clickableIcons={false}
          onClick={(evento) => {
            if (evento.detail.latLng) aoMarcar(evento.detail.latLng);
          }}
          className="h-full w-full"
        >
          {pino && (
            <AdvancedMarker
              position={pino}
              title={titulo}
              draggable
              onDragEnd={(evento) => {
                if (evento.latLng) aoMarcar({ lat: evento.latLng.lat(), lng: evento.latLng.lng() });
              }}
              anchorLeft="-50%"
              anchorTop="-100%"
            >
              {marcador}
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
