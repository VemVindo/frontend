'use client';

import { useRef, useState } from 'react';
import Botao from '@/app/components/ui/Botao';
import Card from '@/app/components/ui/Card';
import { ApiError, gerarLinkDeRastreio } from '@/app/lib/api';
import type { LinkDeRastreio as LinkGerado } from '@/app/lib/tipos';

export interface LinkDeRastreioProps {
  idPedido: number;
}

type Etapa = 'inicio' | 'confirmando' | 'gerando';

export default function LinkDeRastreio({ idPedido }: LinkDeRastreioProps) {
  const [etapa, setEtapa] = useState<Etapa>('inicio');
  const [gerado, setGerado] = useState<LinkGerado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const campo = useRef<HTMLInputElement>(null);

  async function gerar() {
    setEtapa('gerando');
    setErro(null);
    setAviso(null);
    try {
      setGerado(await gerarLinkDeRastreio(idPedido));
    } catch (falha) {
      setErro(
        falha instanceof ApiError && (falha.status === 404 || falha.status === 409)
          ? falha.message
          : 'Não foi possível gerar o link agora.',
      );
    } finally {
      setEtapa('inicio');
    }
  }

  async function copiar() {
    if (!gerado) return;
    try {
      await navigator.clipboard.writeText(gerado.link);
      setAviso('Link copiado.');
    } catch {
      campo.current?.select();
      setAviso('Não foi possível copiar sozinho: o link está selecionado, use Ctrl+C.');
    }
  }

  return (
    <Card
      titulo="Link de rastreio"
      descricao="O recebedor acompanha a entrega por este link, sem criar conta."
      acao={
        etapa !== 'confirmando' && (
          <Botao variante="claro" disabled={etapa === 'gerando'} onClick={() => setEtapa('confirmando')}>
            {gerado ? 'Gerar outro link' : 'Gerar link de rastreio'}
          </Botao>
        )
      }
    >
      {etapa === 'confirmando' && (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-texto-apoio">
            Se este pedido já tiver um link, ele para de funcionar, e quem estiver acompanhando por ele perde o acesso
            na hora.
          </p>
          <div className="flex gap-3">
            <Botao variante="secundario" onClick={() => setEtapa('inicio')}>
              Cancelar
            </Botao>
            <Botao onClick={gerar}>Gerar link</Botao>
          </div>
        </div>
      )}

      {gerado && etapa !== 'confirmando' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              ref={campo}
              readOnly
              value={gerado.link}
              aria-label="Link de rastreio"
              onFocus={(evento) => evento.currentTarget.select()}
              className="h-12 min-w-0 flex-1 rounded-[14px] border border-borda bg-superficie-suave px-4 text-[13px] text-texto"
            />
            <Botao onClick={copiar}>Copiar link</Botao>
          </div>
          <p className="text-[12px] text-texto-apoio">
            Código de recebimento: <strong className="text-texto">{gerado.codigoRecebedor}</strong>. O link só aparece
            agora; para enviar de novo depois, gere outro.
          </p>
        </div>
      )}

      {erro && (
        <p role="alert" className="text-xs text-erro">
          {erro}
        </p>
      )}
      {aviso && (
        <p role="status" className="mt-2 text-xs text-sucesso-texto">
          {aviso}
        </p>
      )}
    </Card>
  );
}
