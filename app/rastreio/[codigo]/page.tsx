'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import CabecalhoRecebedor from '@/app/components/layout/CabecalhoRecebedor';
import MapaEntrega from '@/app/components/mapa/MapaEntrega';
import EtaSemMapa from '@/app/components/mapa/EtaSemMapa';
import PilulaTrajeto from '@/app/components/mapa/PilulaTrajeto';
import EtiquetaStatus from '@/app/components/pedidos/EtiquetaStatus';
import Card from '@/app/components/ui/Card';
import { ApiError, buscarRastreio } from '@/app/lib/api';
import { formatarEndereco, pedidoEmAberto } from '@/app/lib/pedidos';
import { iniciais } from '@/app/lib/texto';
import type { PaginaDoRecebedor } from '@/app/lib/tipos';
import { type EstadoConexao, useRastreioTempoReal } from '@/app/lib/useRastreioTempoReal';

type Falha = 'invalido' | 'encerrado' | 'erro';

const MENSAGEM_DA_FALHA: Record<Falha, { titulo: string; texto: string }> = {
  invalido: {
    titulo: 'Link de rastreio inválido',
    texto: 'Confira se o link foi copiado inteiro ou peça um novo ao estabelecimento.',
  },
  encerrado: {
    titulo: 'Entrega encerrada',
    texto: 'Este pedido já foi finalizado ou cancelado, e o rastreio não está mais disponível.',
  },
  erro: {
    titulo: 'Não foi possível carregar o rastreio',
    texto: 'Tente novamente em alguns instantes.',
  },
};

const TEXTO_DA_CONEXAO: Record<EstadoConexao, string | null> = {
  conectando: 'Conectando ao rastreio...',
  conectado: 'Atualizando em tempo real.',
  reconectando: 'Conexão instável. Tentando reconectar...',
  encerrado: null,
};

// O [codigo] da URL é o token do link do recebedor, não o número do pedido.
export default function PaginaRastreio() {
  const { codigo } = useParams<{ codigo: string }>();
  const [pagina, setPagina] = useState<PaginaDoRecebedor | null>(null);
  const [falha, setFalha] = useState<Falha | null>(null);

  useEffect(() => {
    let cancelado = false;
    buscarRastreio(codigo)
      .then((resposta) => {
        if (!cancelado) setPagina(resposta);
      })
      .catch((erro: unknown) => {
        if (cancelado) return;
        if (erro instanceof ApiError && erro.status === 404) setFalha('invalido');
        else if (erro instanceof ApiError && erro.status === 410) setFalha('encerrado');
        else setFalha('erro');
      });
    return () => {
      cancelado = true;
    };
  }, [codigo]);

  const abertaAoCarregar = pagina !== null && pedidoEmAberto(pagina.pedido.status);
  const { visao, status, conexao, acessoNegado } = useRastreioTempoReal(codigo, abertaAoCarregar);

  const statusAtual = status ?? visao?.status ?? pagina?.pedido.status;
  const encerrada = acessoNegado !== null || (statusAtual !== undefined && !pedidoEmAberto(statusAtual));
  const falhaVisivel: Falha | null = falha ?? (acessoNegado === 'invalido' ? 'invalido' : null);

  if (falhaVisivel) {
    const { titulo, texto } = MENSAGEM_DA_FALHA[falhaVisivel];
    return (
      <main className="mx-auto w-full max-w-[640px] px-[18px] py-12">
        <Card titulo={titulo} descricao={texto} />
      </main>
    );
  }

  if (!pagina || !statusAtual) {
    return (
      <main className="mx-auto w-full max-w-[640px] px-[18px] py-12">
        <p className="text-xs text-texto-apoio">Carregando o rastreio...</p>
      </main>
    );
  }

  // O mapa só é carregado (e cobrado pelo Google) com a entrega em andamento:
  // antes disso não há entregador para mostrar.
  const emAndamento = statusAtual === 'EM_ANDAMENTO' && !encerrada;
  const mapaLigado = visao?.exibirMapa ?? pagina.exibirMapa;
  const mostrarMapa = emAndamento && mapaLigado;
  const mostrarEtaSemMapa = emAndamento && !mapaLigado;
  const textoDaConexao = encerrada ? null : TEXTO_DA_CONEXAO[conexao];
  const distancia = visao?.distanciaRestanteM ?? null;
  const duracao = visao?.duracaoRestanteS ?? null;

  const rodapeDoRastreio = (
    <div className="flex flex-col gap-1 px-[18px] md:px-0">
      {visao?.estimado && duracao !== null && (
        <p className="text-[11px] text-texto-suave">Estimativa aproximada, calculada em linha reta.</p>
      )}
      {textoDaConexao && (
        <p role="status" className="text-[11px] text-texto-suave">
          {textoDaConexao}
        </p>
      )}
    </div>
  );

  const cartoesDoPedido = (
    <>
      <Card titulo="Seu pedido" acao={<EtiquetaStatus status={statusAtual} />}>
        <p className="text-sm text-texto">{pagina.pedido.descricao}</p>
        <p className="mt-2 text-xs text-texto-apoio">{formatarEndereco(pagina.pedido.endereco)}</p>
      </Card>

      {encerrada && (
        <Card
          titulo="Entrega encerrada"
          descricao="O rastreio em tempo real termina quando o pedido é finalizado ou cancelado."
        />
      )}
      {!encerrada && !emAndamento && (
        <Card titulo="Tempo estimado de chegada" descricao="O pedido ainda não saiu para entrega." />
      )}

      <Card titulo="Código de recebimento" descricao="Informe este código ao entregador para confirmar o recebimento.">
        <p className="font-titulo text-2xl font-bold tracking-[0.3em] text-texto">{pagina.codigoRecebedor}</p>
      </Card>
    </>
  );

  return (
    <>
      <CabecalhoRecebedor
        nomeEstabelecimento={pagina.estabelecimento}
        iniciaisEstabelecimento={iniciais(pagina.estabelecimento)}
        numeroPedido={String(pagina.pedido.numero)}
      />
      <main className="mx-auto w-full max-w-[1280px] px-[18px] pb-6 md:px-10 md:py-12">
        {mostrarMapa && (
          // Figma "Recebedor — Desktop · Em andamento": cartões à esquerda (560)
          // e mapa à direita (627 × 375). No mobile, o mapa vem primeiro e
          // ocupa a largura toda (390 × 435).
          <div className="grid gap-5 lg:grid-cols-[560fr_627fr] lg:gap-[13px]">
            <div className="-mx-[18px] flex flex-col gap-3 md:mx-0 lg:order-2">
              <MapaEntrega
                origem={visao?.origem ?? null}
                nomeOrigem={pagina.estabelecimento}
                destino={visao?.destino ?? null}
                entregador={visao?.entregador ?? null}
                rota={visao?.rota ?? null}
                sobreposicao={
                  <PilulaTrajeto
                    distanciaRestanteM={distancia}
                    duracaoRestanteS={duracao}
                    className="absolute left-3 top-2 md:left-0 md:top-0"
                  />
                }
                className="h-[435px] overflow-hidden lg:h-[375px]"
              />
              {rodapeDoRastreio}
            </div>
            <div className="flex flex-col gap-5 lg:order-1">{cartoesDoPedido}</div>
          </div>
        )}

        {mostrarEtaSemMapa && (
          // Figma "03B — Rastreio sem mapa" (mobile) e "— Web" (700 + 420).
          <>
            <div className="mb-[29px] hidden md:block">
              <h1 className="text-[28px] font-semibold text-texto-corpo">Rastreio ao vivo</h1>
              <p className="mt-1 text-[13px] text-texto-apoio">Acompanhe seu pedido mesmo sem o mapa.</p>
            </div>
            <div className="grid gap-5 lg:grid-cols-[700fr_420fr] lg:gap-7">
              <div className="-mx-[18px] flex flex-col gap-3 md:mx-0">
                <EtaSemMapa
                  nomeEntregador={pagina.entregador}
                  distanciaRestanteM={distancia}
                  duracaoRestanteS={duracao}
                />
                {rodapeDoRastreio}
              </div>
              <div className="flex flex-col gap-5">{cartoesDoPedido}</div>
            </div>
          </>
        )}

        {!emAndamento && <div className="flex max-w-[640px] flex-col gap-5">{cartoesDoPedido}</div>}
      </main>
    </>
  );
}
