'use client';

import { AdvancedMarker, APIProvider, Map } from '@vis.gl/react-google-maps';
import { MarcadorDestino } from '@/app/components/mapa/MarcadoresDoMapa';
import { CENTRO_PADRAO, CHAVE_GOOGLE_MAPS, MAP_ID_GOOGLE_MAPS } from '@/app/lib/mapa';
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
  aoConfirmar: () => void;
  erro?: string;
}

const MENSAGENS: Record<EtapaDoLocal, string> = {
  pendente: 'Preencha o endereço e localize no mapa para conferir o ponto de entrega.',
  localizando: 'Procurando o endereço...',
  encontrado: 'Confira o pino e confirme. Se estiver no lugar errado, arraste ou toque no ponto certo.',
  aproximado: 'Achamos só a região, não a porta. Arraste o pino ou toque no local exato da entrega.',
  marcado: 'Ponto marcado. É aqui que o entregador vai chegar.',
  'nao-encontrado': 'Não encontramos esse endereço. Toque no mapa para marcar o ponto de entrega.',
  falhou: 'Não foi possível localizar agora. Toque no mapa para marcar o ponto de entrega.',
};

function MapaDoPino({ destino, tentativa, aoMarcar }: Pick<LocalNoMapaProps, 'destino' | 'tentativa' | 'aoMarcar'>) {
  return (
    <div className="h-56 overflow-hidden rounded-xl bg-mapa-fundo">
      <APIProvider apiKey={CHAVE_GOOGLE_MAPS} language="pt-BR" region="BR">
        <Map
          key={tentativa}
          mapId={MAP_ID_GOOGLE_MAPS}
          defaultCenter={destino ?? CENTRO_PADRAO}
          defaultZoom={destino ? 17 : 12}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
          clickableIcons={false}
          onClick={(evento) => {
            if (evento.detail.latLng) aoMarcar(evento.detail.latLng);
          }}
          className="h-full w-full"
        >
          {destino && (
            <AdvancedMarker
              position={destino}
              title="Ponto de entrega"
              draggable
              onDragEnd={(evento) => {
                if (evento.latLng) aoMarcar({ lat: evento.latLng.lat(), lng: evento.latLng.lng() });
              }}
              anchorLeft="-50%"
              anchorTop="-100%"
            >
              <MarcadorDestino rotulo="Entrega" />
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>
    </div>
  );
}

// O pino achado pela busca só vale depois de confirmado; arrastar ou tocar já confirma.
function BotaoConfirmar({ etapa, destino, aoConfirmar }: Pick<LocalNoMapaProps, 'etapa' | 'destino' | 'aoConfirmar'>) {
  if (!destino || (etapa !== 'encontrado' && etapa !== 'aproximado')) return null;
  return (
    <button
      type="button"
      onClick={aoConfirmar}
      data-confirmar
      className="h-9 cursor-pointer rounded-lg bg-primaria px-3 text-xs font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaria"
    >
      Confirmar este local
    </button>
  );
}

export default function LocalNoMapa({
  etapa,
  destino,
  tentativa,
  enderecoEncontrado = null,
  podeLocalizar,
  aoLocalizar,
  aoMarcar,
  aoConfirmar,
  erro = '',
}: LocalNoMapaProps) {
  if (!CHAVE_GOOGLE_MAPS) return null;
  const mapaVisivel = etapa !== 'pendente' && etapa !== 'localizando';

  return (
    <section aria-label="Ponto de entrega no mapa" data-local-no-mapa className="flex min-w-0 flex-col gap-2">
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
      {erro && (
        <p role="alert" className="text-xs text-erro">
          {erro}
        </p>
      )}
      {mapaVisivel && <MapaDoPino destino={destino} tentativa={tentativa} aoMarcar={aoMarcar} />}
      <BotaoConfirmar etapa={etapa} destino={destino} aoConfirmar={aoConfirmar} />
    </section>
  );
}
