'use client';

import MapaDoPino from '@/app/components/mapa/MapaDoPino';
import { MarcadorOrigem } from '@/app/components/mapa/MarcadoresDoMapa';
import { CHAVE_GOOGLE_MAPS } from '@/app/lib/mapa';
import type { Coordenada } from '@/app/lib/tipos';
import type { EtapaDoPino } from './usePinoDaEmpresa';

export interface PinoDaEmpresaProps {
  etapa: EtapaDoPino;
  pino: Coordenada | null;
  tentativa: number;
  enderecoEncontrado: string | null;
  podeLocalizar: boolean;
  desabilitado: boolean;
  aoLocalizar: () => void;
  aoMarcar: (ponto: Coordenada) => void;
  aoManter: () => void;
}

const MENSAGENS: Record<EtapaDoPino, string> = {
  localizando: 'Procurando o endereço da empresa no mapa...',
  salvo: 'As entregas saem deste ponto. Para mudar, arraste o pino ou toque no lugar certo.',
  encontrado: 'Confira o pino. Se estiver no lugar errado, arraste ou toque no ponto certo.',
  aproximado: 'Achamos só a região, não a porta. Arraste o pino até a entrada da empresa.',
  marcado: 'Ponto marcado. As entregas vão sair daqui.',
  'nao-encontrado': 'Não encontramos esse endereço. Toque no mapa para marcar onde fica a empresa.',
  falhou: 'Não foi possível localizar agora. Toque no mapa para marcar onde fica a empresa.',
  desatualizado:
    'O endereço mudou. Localize de novo para conferir o pino. Se salvar sem confirmar, o ponto será recalculado pelo endereço novo.',
};

export default function PinoDaEmpresa({
  etapa,
  pino,
  tentativa,
  enderecoEncontrado,
  podeLocalizar,
  desabilitado,
  aoLocalizar,
  aoMarcar,
  aoManter,
}: PinoDaEmpresaProps) {
  if (!CHAVE_GOOGLE_MAPS) return null;
  const desatualizado = etapa === 'desatualizado';
  const botao =
    'h-8 shrink-0 cursor-pointer rounded-lg border border-primaria px-3 text-xs font-semibold text-primaria disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-primaria';

  return (
    <section aria-label="Ponto de saída das entregas" className="flex min-w-0 flex-col gap-2">
      <span className="text-xs text-texto-corpo">Ponto de saída das entregas</span>
      <p role="status" aria-live="polite" className="text-xs text-texto-apoio">
        {MENSAGENS[etapa]}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={aoLocalizar}
          disabled={desabilitado || !podeLocalizar || etapa === 'localizando'}
          className={botao}
        >
          {desatualizado ? 'Localizar pelo endereço novo' : 'Localizar pelo endereço'}
        </button>
        {desatualizado && pino && (
          <button type="button" onClick={aoManter} disabled={desabilitado} className={botao}>
            Manter o ponto atual
          </button>
        )}
      </div>
      {enderecoEncontrado && (etapa === 'encontrado' || etapa === 'aproximado') && (
        <p className="text-xs text-texto-corpo">
          Encontrado: <span className="font-semibold">{enderecoEncontrado}</span>
        </p>
      )}
      {etapa !== 'localizando' && (
        <MapaDoPino
          pino={pino}
          tentativa={tentativa}
          titulo="Ponto de saída das entregas"
          marcador={<MarcadorOrigem nome="Empresa" />}
          aoMarcar={aoMarcar}
        />
      )}
    </section>
  );
}
