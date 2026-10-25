'use client';

import Botao from '@/app/components/ui/Botao';
import MapaEntrega from '@/app/components/mapa/MapaEntrega';
import PilulaTrajeto from '@/app/components/mapa/PilulaTrajeto';
import ResumoTrajeto from '@/app/components/mapa/ResumoTrajeto';
import { linkDeNavegacao } from '@/app/lib/mapa';
import { primeiroNome } from '@/app/lib/texto';
import type { PedidoDoEntregador } from '@/app/lib/tipos';
import { useCompartilharLocalizacao } from '@/app/lib/useCompartilharLocalizacao';

export interface MapaDoEntregadorProps {
  pedido: PedidoDoEntregador;
}

const TEXTO_DO_ESTADO = {
  parado: 'Localização não compartilhada.',
  solicitando: 'Obtendo a sua localização...',
  compartilhando: 'Compartilhando a localização com o recebedor.',
} as const;

export default function MapaDoEntregador({ pedido }: MapaDoEntregadorProps) {
  const emAndamento = pedido.status === 'EM_ANDAMENTO';
  const { estado, erro, posicao, visao, iniciar, parar } = useCompartilharLocalizacao(pedido.id, emAndamento);

  const destino = visao?.destino ?? null;
  const entregador = posicao ?? visao?.entregador ?? null;

  if (!emAndamento) {
    return (
      <p className="rounded-[18px] bg-superficie p-4 text-xs text-texto-apoio ring-1 ring-borda">
        O mapa e o compartilhamento da localização ficam disponíveis com a entrega em andamento.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Figma "Entregador — Mobile · detail" (325 × 279, pílula de ETA) e
          "— Desktop · detail" (627 × 375, sem pílula). */}
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

      <div className="flex flex-col gap-3 rounded-[18px] bg-superficie p-4 ring-1 ring-borda">
        <p role="status" className="flex items-center gap-2 text-[13px] text-texto-apoio">
          <span
            aria-hidden
            className={`size-2.5 rounded-full ${estado === 'compartilhando' ? 'bg-sucesso' : 'bg-texto-suave'}`}
          />
          {TEXTO_DO_ESTADO[estado]}
        </p>
        {erro && (
          <p role="alert" className="text-[13px] text-erro">
            {erro}
          </p>
        )}

        <ResumoTrajeto
          distanciaRestanteM={visao?.distanciaRestanteM ?? null}
          duracaoRestanteS={visao?.duracaoRestanteS ?? null}
          estimado={visao?.estimado ?? true}
          mensagemSemDados="A distância e o tempo aparecem quando a localização for compartilhada."
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          {estado === 'parado' ? (
            <Botao className="flex-1" onClick={iniciar}>
              Compartilhar localização
            </Botao>
          ) : (
            <Botao variante="secundario" className="flex-1" onClick={parar}>
              Parar de compartilhar
            </Botao>
          )}
          <a
            href={linkDeNavegacao(destino, pedido.endereco)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-titulo flex h-12 flex-1 items-center justify-center rounded-[14px] bg-primaria-clara px-6 text-[13px] font-bold text-primaria-escura transition-colors hover:bg-lilas"
          >
            Abrir no Google Maps
          </a>
        </div>
        <p className="text-[11px] text-texto-suave">
          O navegador só envia a localização com esta tela aberta e o celular desbloqueado. Enquanto você navega pelo
          app do Google Maps, o recebedor vê a última posição enviada.
        </p>
      </div>
    </div>
  );
}
