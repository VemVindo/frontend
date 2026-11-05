'use client';

import { useEffect, useState } from 'react';
import Card from '@/app/components/ui/Card';
import TituloPagina from '@/app/components/ui/TituloPagina';
import { ApiError, atualizarConfiguracoes, buscarConfiguracoes } from '@/app/lib/api';
import type { ConfiguracoesDaEmpresa } from '@/app/lib/tipos';

export default function PaginaConfiguracoes() {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesDaEmpresa | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    buscarConfiguracoes()
      .then((resposta) => {
        if (!cancelado) setConfiguracoes(resposta);
      })
      .catch(() => {
        if (!cancelado) setErro('Não foi possível carregar as configurações.');
      });
    return () => {
      cancelado = true;
    };
  }, []);

  async function alternarMapa() {
    if (!configuracoes) return;
    setSalvando(true);
    setErro(null);
    setAviso(null);
    try {
      const salvas = await atualizarConfiguracoes({ exibirMapa: !configuracoes.exibirMapa });
      setConfiguracoes(salvas);
      setAviso(
        salvas.exibirMapa
          ? 'O recebedor passa a ver o mapa com o entregador.'
          : 'O recebedor passa a ver só o tempo estimado de chegada.',
      );
    } catch (falha) {
      setErro(falha instanceof ApiError ? falha.message : 'Não foi possível salvar agora.');
    } finally {
      setSalvando(false);
    }
  }

  const mensagem = erro ? (
    <p role="alert" className="text-[13px] text-erro">
      {erro}
    </p>
  ) : aviso ? (
    <p role="status" className="text-[13px] text-sucesso-texto">
      {aviso}
    </p>
  ) : !configuracoes ? (
    <p className="text-xs text-texto-apoio">Carregando...</p>
  ) : undefined;

  return (
    <div className="max-w-[720px]">
      <TituloPagina titulo="Configurações" subtitulo="Como o recebedor acompanha as entregas." />

      <Card
        titulo="Mapa no link de rastreio"
        descricao="Desligado, o recebedor vê só a distância e o tempo estimado de chegada, sem a posição do entregador."
        acao={
          configuracoes && (
            <button
              type="button"
              role="switch"
              aria-checked={configuracoes.exibirMapa}
              aria-label="Exibir o mapa ao recebedor"
              disabled={salvando}
              onClick={alternarMapa}
              className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${configuracoes.exibirMapa ? 'bg-primaria' : 'bg-borda'}`}
            >
              <span
                aria-hidden
                className={`absolute top-1 size-5 rounded-full bg-white shadow transition-[left] ${configuracoes.exibirMapa ? 'left-6' : 'left-1'}`}
              />
            </button>
          )
        }
      >
        {mensagem}
      </Card>
    </div>
  );
}
