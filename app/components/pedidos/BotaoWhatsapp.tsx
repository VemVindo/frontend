'use client';

import { useEffect, useState } from 'react';
import IconeConversa from '@/app/components/icones/IconeConversa';
import Botao from '@/app/components/ui/Botao';
import { ApiError, buscarConversaWhatsapp, type LadoDaConversa } from '@/app/lib/api';
import type { ConversaWhatsapp } from '@/app/lib/tipos';

interface BotaoWhatsappIntegradoProps {
  modo?: 'whatsapp';
  idPedido: number;
  // Com quem a conversa abre: a empresa fala com o entregador e vice-versa.
  com: LadoDaConversa;
}

interface BotaoWhatsappVisualProps {
  modo: 'visual';
  destinatario: 'recebedor' | 'estabelecimento';
}

export type BotaoWhatsappProps = BotaoWhatsappIntegradoProps | BotaoWhatsappVisualProps;

// Recusas que o backend explica (pedido não é seu, entrega fora de andamento,
// telefone inválido): a mensagem dele vai direto para a tela.
const RECUSAS_EXPLICADAS = [404, 409, 422];

// E-US20 + EN-US07: a plataforma só monta o link wa.me; a conversa acontece no
// WhatsApp de cada um e nada passa pelo sistema. O link é buscado ao montar
// para o clique abrir direto: abrir uma aba depois de um await é bloqueado
// como pop-up em alguns navegadores.
export default function BotaoWhatsapp(props: BotaoWhatsappProps) {
  if (props.modo === 'visual') {
    const texto =
      props.destinatario === 'recebedor' ? 'Conversar com recebedor' : 'Falar com o estabelecimento';

    return (
      <Botao
        disabled
        title={`A conversa com ${props.destinatario} estará disponível em breve.`}
        className="flex w-full items-center justify-center gap-2 px-4 text-[15px] opacity-70"
      >
        <IconeConversa className="size-5" />
        {texto}
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] uppercase">Em breve</span>
      </Botao>
    );
  }

  return <BotaoWhatsappIntegrado idPedido={props.idPedido} com={props.com} />;
}

function BotaoWhatsappIntegrado({ idPedido, com }: BotaoWhatsappIntegradoProps) {
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
    <a
      href={conversa.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-primaria px-4 py-3 text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-primaria-escura"
    >
      <IconeConversa className="size-5" />
      Conversar com {conversa.contato} no WhatsApp
    </a>
  );
}
