'use client';

import { useEffect, useState } from 'react';
import FiltroDeComentarios from '@/app/components/avaliacoes/FiltroDeComentarios';
import ListaDeComentarios from '@/app/components/avaliacoes/ListaDeComentarios';
import Card from '@/app/components/ui/Card';
import TituloPagina from '@/app/components/ui/TituloPagina';
import { listarAvaliacoes } from '@/app/lib/api';
import { FILTRO_INICIAL, periodoInvalido } from '@/app/lib/comentarios';
import type { AvaliacaoDaEmpresa, FiltroDeAvaliacoes } from '@/app/lib/tipos';

export default function PaginaAvaliacoes() {
  const [filtro, setFiltro] = useState<FiltroDeAvaliacoes>(FILTRO_INICIAL);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoDaEmpresa[] | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (periodoInvalido(filtro)) return;
    let cancelado = false;
    listarAvaliacoes(filtro)
      .then((lista) => {
        if (cancelado) return;
        setAvaliacoes(lista);
        setErro(false);
      })
      .catch(() => {
        if (!cancelado) setErro(true);
      });
    return () => {
      cancelado = true;
    };
  }, [filtro]);

  return (
    <>
      <TituloPagina titulo="Avaliações" subtitulo="Comentários dos recebedores sobre as entregas" />
      <Card titulo="Comentários">
        <div className="flex flex-col gap-5">
          <FiltroDeComentarios filtro={filtro} onAlterar={setFiltro} />
          {erro && (
            <p role="alert" className="text-xs text-erro">
              Não foi possível carregar as avaliações agora.
            </p>
          )}
          {!avaliacoes && !erro && <p className="text-xs text-texto-apoio">Carregando avaliações...</p>}
          {avaliacoes && <ListaDeComentarios avaliacoes={avaliacoes} />}
        </div>
      </Card>
    </>
  );
}
