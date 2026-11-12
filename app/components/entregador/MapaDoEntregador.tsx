'use client';

import IconeLocalizacao from '@/app/components/icones/IconeLocalizacao';
import IconeNavegar from '@/app/components/icones/IconeNavegar';
import MapaEntrega from '@/app/components/mapa/MapaEntrega';
import PilulaTrajeto from '@/app/components/mapa/PilulaTrajeto';
import ResumoTrajeto from '@/app/components/mapa/ResumoTrajeto';
import { descreverPrecisao, linkDeNavegacao, PRECISAO_RUIM_M } from '@/app/lib/mapa';
import { primeiroNome } from '@/app/lib/texto';
import type { PedidoDoEntregador } from '@/app/lib/tipos';
import { useCompartilharLocalizacao } from '@/app/lib/useCompartilharLocalizacao';

export interface MapaDoEntregadorProps {
  pedido: PedidoDoEntregador;
}

const TEXTO_DO_ESTADO = {
  parado: 'Localização não compartilhada',
  solicitando: 'Obtendo a sua localização...',
  compartilhando: 'Compartilhando a localização com o recebedor',
} as const;

const ACAO =
  'font-titulo flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-[16px] px-3 py-3 text-center text-sm font-bold transition-colors cursor-pointer';

function AvisoDePrecisao({ metros }: { metros: number | null }) {
  if (metros === null || metros <= PRECISAO_RUIM_M) return null;
  return <p className="text-sm text-erro">{descreverPrecisao(metros)}</p>;
}

export default function MapaDoEntregador({ pedido }: MapaDoEntregadorProps) {
  const emAndamento = pedido.status === 'EM_ANDAMENTO';
  const { estado, erro, posicao, precisao, visao, iniciar, parar } = useCompartilharLocalizacao(pedido.id, emAndamento);

  const destino = visao?.destino ?? null;
  const entregador = posicao ?? visao?.entregador ?? null;
  const compartilhando = estado === 'compartilhando';

  if (!emAndamento) {
    return (
      <p className="rounded-[18px] bg-superficie p-4 text-sm text-texto-apoio ring-1 ring-borda">
        O mapa e o compartilhamento da localização ficam disponíveis com a entrega em andamento.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <MapaEntrega
        origem={visao?.origem ?? null}
        nomeOrigem={pedido.empresa}
        destino={destino}
        rotuloDestino={primeiroNome(pedido.recebedor)}
        entregador={entregador}
        rota={visao?.rota ?? null}
        sobreposicao={
          <PilulaTrajeto
            distanciaRestanteM={visao?.distanciaRestanteM ?? null}
            duracaoRestanteS={visao?.duracaoRestanteS ?? null}
            className="absolute left-[9px] top-1.5 md:hidden"
          />
        }
        className="h-[279px] w-full overflow-hidden md:h-[375px] md:max-w-[627px]"
      />

      <div className="flex flex-col gap-4 rounded-[18px] bg-superficie p-4 ring-1 ring-borda md:p-5">
        <p
          role="status"
          className={`flex items-center gap-2 text-sm font-semibold ${compartilhando ? 'text-sucesso-texto' : 'text-texto-corpo'}`}
        >
          <span aria-hidden className={`size-2.5 rounded-full ${compartilhando ? 'bg-sucesso' : 'bg-texto-suave'}`} />
          {TEXTO_DO_ESTADO[estado]}
        </p>
        {compartilhando && <AvisoDePrecisao metros={precisao} />}
        {erro && (
          <p role="alert" className="text-sm text-erro">
            {erro}
          </p>
        )}

        <ResumoTrajeto
          distanciaRestanteM={visao?.distanciaRestanteM ?? null}
          duracaoRestanteS={visao?.duracaoRestanteS ?? null}
          estimado={visao?.estimado ?? true}
          mensagemSemDados="A distância e o tempo aparecem quando a localização for compartilhada."
        />

        <div className="grid grid-cols-2 gap-3">
          {estado === 'parado' ? (
            <button
              type="button"
              onClick={iniciar}
              className={`${ACAO} bg-primaria text-white hover:bg-primaria-escura`}
            >
              <IconeLocalizacao className="size-6" />
              Compartilhar localização
            </button>
          ) : (
            <button
              type="button"
              onClick={parar}
              className={`${ACAO} border border-borda bg-superficie text-texto hover:bg-superficie-suave`}
            >
              <IconeLocalizacao className="size-6 text-texto-apoio" />
              Parar de compartilhar
            </button>
          )}
          <a
            href={linkDeNavegacao(destino, pedido.endereco, entregador)}
            target="_blank"
            rel="noopener noreferrer"
            className={`${ACAO} bg-primaria-clara text-primaria-escura hover:bg-lilas`}
          >
            <IconeNavegar className="size-6" />
            Abrir no Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
