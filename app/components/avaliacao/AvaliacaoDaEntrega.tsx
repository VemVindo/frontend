'use client';

import { useEffect, useState, type FormEvent } from 'react';
import SeletorDeNota from '@/app/components/avaliacao/SeletorDeNota';
import IconeCheck from '@/app/components/icones/IconeCheck';
import Botao from '@/app/components/ui/Botao';
import Card from '@/app/components/ui/Card';
import { ApiError, consultarAvaliacao, enviarComentario, enviarNota } from '@/app/lib/api';
import { MENSAGEM_SEM_AVALIACAO, TAMANHO_MAXIMO_COMENTARIO, comentarioParaEnviar } from '@/app/lib/avaliacao';
import type { AvaliacaoDoRecebedor } from '@/app/lib/tipos';

export interface AvaliacaoDaEntregaProps {
  token: string;
}

export default function AvaliacaoDaEntrega({ token }: AvaliacaoDaEntregaProps) {
  const [resposta, setResposta] = useState<AvaliacaoDoRecebedor | null>(null);
  const [erroAoCarregar, setErroAoCarregar] = useState(false);
  const [nota, setNota] = useState<number | null>(null);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroAoEnviar, setErroAoEnviar] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    consultarAvaliacao(token)
      .then((atual) => {
        if (!cancelado) setResposta(atual);
      })
      .catch(() => {
        if (!cancelado) setErroAoCarregar(true);
      });
    return () => {
      cancelado = true;
    };
  }, [token]);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (nota === null) return;
    setEnviando(true);
    setErroAoEnviar(null);
    try {
      const comNota = await enviarNota(token, nota);
      setResposta(comNota);
      const texto = comentarioParaEnviar(comentario);
      if (texto) setResposta(await enviarComentario(token, texto));
    } catch (erro) {
      setErroAoEnviar(erro instanceof ApiError ? erro.message : 'Não foi possível enviar sua avaliação agora.');
    } finally {
      setEnviando(false);
    }
  }

  if (erroAoCarregar) {
    return <Card titulo="Entrega encerrada" descricao="Não foi possível carregar a avaliação agora." />;
  }

  if (!resposta) {
    return <p className="text-xs text-texto-apoio">Carregando a avaliação...</p>;
  }

  if (resposta.situacao === 'aguardando') {
    return null;
  }

  if (resposta.situacao === 'expirada' || resposta.situacao === 'indisponivel') {
    return <Card titulo="Entrega encerrada" descricao={MENSAGEM_SEM_AVALIACAO[resposta.situacao]} />;
  }

  if (resposta.situacao === 'avaliado') {
    return (
      <section className="flex flex-col items-center gap-3 py-8 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-sucesso-fundo text-sucesso">
          <IconeCheck className="size-7" />
        </span>
        <h2 className="font-titulo text-xl font-bold">Avaliação enviada!</h2>
        <p className="max-w-[300px] text-[13px] text-texto-suave">
          Obrigado por compartilhar sua experiência. Sua opinião ajuda a melhorar as próximas entregas.
        </p>
        {erroAoEnviar && (
          <p role="alert" className="text-xs text-erro">
            Sua nota foi registrada, mas o comentário não: {erroAoEnviar}
          </p>
        )}
      </section>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col items-center gap-4 py-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-sucesso-fundo text-sucesso">
        <IconeCheck className="size-7" />
      </span>
      <h2 className="font-titulo text-xl font-bold">Pedido entregue!</h2>
      <p className="text-[13px] text-texto-suave">Como foi sua experiência com a entrega?</p>

      <SeletorDeNota nota={nota} desabilitado={enviando} onEscolher={setNota} />

      {nota !== null && (
        <div className="flex w-full flex-col gap-1 text-left">
          <label htmlFor="comentario-avaliacao" className="text-xs text-texto-corpo">
            Quer contar mais alguma coisa? (opcional)
          </label>
          <textarea
            id="comentario-avaliacao"
            value={comentario}
            maxLength={TAMANHO_MAXIMO_COMENTARIO}
            disabled={enviando}
            onChange={(evento) => setComentario(evento.target.value)}
            rows={4}
            className="rounded-[14px] border border-borda bg-superficie p-3 text-[13px] outline-none focus:border-primaria"
          />
          <p className="self-end text-[11px] text-texto-suave">
            {comentario.length} / {TAMANHO_MAXIMO_COMENTARIO}
          </p>
        </div>
      )}

      {erroAoEnviar && (
        <p role="alert" className="text-xs text-erro">
          {erroAoEnviar}
        </p>
      )}

      <Botao type="submit" larguraTotal disabled={nota === null || enviando}>
        {enviando ? 'Enviando...' : 'Enviar avaliação'}
      </Botao>
    </form>
  );
}
