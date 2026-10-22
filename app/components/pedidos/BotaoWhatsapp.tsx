'use client';

import { useEffect, useState } from 'react';
import IconeConversa from '@/app/components/icones/IconeConversa';
import { ApiError, buscarConversaWhatsapp, type LadoDaConversa } from '@/app/lib/api';
import type { ConversaWhatsapp } from '@/app/lib/tipos';

export type VarianteLinkWhatsapp = 'primario' | 'claro';

export interface LinkWhatsappProps {
  link: string;
  rotulo: string;
  variante?: VarianteLinkWhatsapp;
}

const estilosPorVariante: Record<VarianteLinkWhatsapp, string> = {
  primario: 'bg-primaria text-white hover:bg-primaria-escura',
  claro: 'bg-primaria-clara text-primaria-escura hover:bg-lilas',
};

// Abre o WhatsApp de quem clica, já na conversa com o outro lado (wa.me).
export function LinkWhatsapp({ link, rotulo, variante = 'primario' }: LinkWhatsappProps) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex w-full items-center justify-center gap-2 rounded-[16px] px-4 py-3 text-[15px] font-bold shadow-sm transition-colors ${estilosPorVariante[variante]}`}
    >
      <IconeConversa className="size-5" />
      {rotulo}
    </a>
  );
}

export interface BotaoWhatsappProps {
  idPedido: number;
  // Com quem a conversa abre: entregador, recebedor ou estabelecimento.
  com: LadoDaConversa;
  variante?: VarianteLinkWhatsapp;
}

// Recusas que o backend explica (pedido não é seu, pedido fora do status,
// telefone inválido): a mensagem dele vai direto para a tela.
const RECUSAS_EXPLICADAS = [404, 409, 422];

// E-US19 e E-US20 + EN-US07: a plataforma só monta o link wa.me; a conversa
// acontece no WhatsApp de cada um e nada passa pelo sistema. O link é buscado
// ao montar para o clique abrir direto: abrir uma aba depois de um await é
// bloqueado como pop-up em alguns navegadores.
export default function BotaoWhatsapp({ idPedido, com, variante }: BotaoWhatsappProps) {
  const [conversa, setConversa] = useState<ConversaWhatsapp | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    buscarConversaWhatsapp(idPedido, com)
      .then((resposta) => {
        if (!cancelado) setConversa(resposta);
      })
      .catch((err: unknown) => {
        if (cancelado) return;
        setAviso(
          err instanceof ApiError && RECUSAS_EXPLICADAS.includes(err.status)
            ? err.message
            : 'Não foi possível preparar a conversa agora.',
        );
      });
    return () => {
      cancelado = true;
    };
  }, [idPedido, com]);

  if (aviso) {
    return (
      <p role="status" className="text-xs text-texto-apoio">
        {aviso}
      </p>
    );
  }

  if (!conversa) {
    return <p className="text-xs text-texto-apoio">Preparando a conversa...</p>;
  }

  return (
    <LinkWhatsapp link={conversa.link} rotulo={`Conversar com ${conversa.contato} no WhatsApp`} variante={variante} />
  );
}
