'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { AdvancedMarker, APIProvider, Map, Polyline, useMap } from '@vis.gl/react-google-maps';
import { MarcadorDestino, MarcadorEntregador, MarcadorOrigem } from '@/app/components/mapa/MarcadoresDoMapa';
import { CENTRO_PADRAO, CHAVE_GOOGLE_MAPS, MAP_ID_GOOGLE_MAPS } from '@/app/lib/mapa';
import type { Coordenada } from '@/app/lib/tipos';

export interface MapaEntregaProps {
  origem: Coordenada | null;
  nomeOrigem: string;
  destino: Coordenada | null;
  rotuloDestino: string;
  entregador: Coordenada | null;
  rota: string | null;
  sobreposicao?: ReactNode;
  className?: string;
}

const COR_DA_ROTA = '#6c5dd3';

const CENTRALIZADO = { anchorLeft: '-50%', anchorTop: '-50%' };

export default function MapaEntrega({
  origem,
  nomeOrigem,
  destino,
  rotuloDestino,
  entregador,
  rota,
  sobreposicao,
  className = '',
}: MapaEntregaProps) {
  if (!CHAVE_GOOGLE_MAPS) {
    return (
      <div className={`relative flex items-center justify-center bg-mapa-fundo p-6 text-center ${className}`}>
        {sobreposicao}
        <p className="max-w-xs text-xs text-texto-apoio">
          Mapa indisponível: a chave do Google Maps não está configurada. A distância e o tempo continuam aparecendo.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative bg-mapa-fundo ${className}`} role="region" aria-label="Mapa da entrega">
      <APIProvider apiKey={CHAVE_GOOGLE_MAPS} language="pt-BR" region="BR">
        <Map
          mapId={MAP_ID_GOOGLE_MAPS}
          defaultCenter={entregador ?? destino ?? CENTRO_PADRAO}
          defaultZoom={14}
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
          className="h-full w-full"
        >
          {rota && <Polyline encodedPath={rota} strokeColor={COR_DA_ROTA} strokeOpacity={1} strokeWeight={3} />}
          {origem && (
            <AdvancedMarker position={origem} title={nomeOrigem} {...CENTRALIZADO}>
              <MarcadorOrigem nome={nomeOrigem} />
            </AdvancedMarker>
          )}
          {destino && (
            <AdvancedMarker position={destino} title="Destino da entrega" {...CENTRALIZADO}>
              <MarcadorDestino rotulo={rotuloDestino} />
            </AdvancedMarker>
          )}
          {entregador && (
            <AdvancedMarker position={entregador} title="Entregador" zIndex={2} {...CENTRALIZADO}>
              <MarcadorEntregador />
            </AdvancedMarker>
          )}
          <Enquadramento pontos={[origem, destino, entregador]} />
        </Map>
      </APIProvider>
      {sobreposicao}
    </div>
  );
}

function Enquadramento({ pontos }: { pontos: (Coordenada | null)[] }) {
  const mapa = useMap();
  const enquadrados = useRef(0);
  const presentes = pontos.filter((ponto): ponto is Coordenada => ponto !== null);
  const quantidade = presentes.length;

  useEffect(() => {
    if (!mapa || quantidade === 0 || quantidade <= enquadrados.current) return;
    enquadrados.current = quantidade;
    if (quantidade === 1) {
      mapa.setCenter(presentes[0]);
      mapa.setZoom(15);
      return;
    }
    const limites = new google.maps.LatLngBounds();
    presentes.forEach((ponto) => limites.extend(ponto));
    mapa.fitBounds(limites, 56);
  }, [mapa, quantidade]);

  return null;
}
