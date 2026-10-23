'use client';

import { useState, type FormEvent } from 'react';
import Botao from '@/app/components/ui/Botao';
import CampoTexto from '@/app/components/ui/CampoTexto';
import { ApiError, finalizarPedido } from '@/app/lib/api';
import { acaoDoStatus } from '@/app/lib/pedidos';

const TAMANHO_DO_CODIGO = 6;

export interface FinalizarComCodigoProps {
  idPedido: number;
  onFinalizado: () => void;
}

export default function FinalizarComCodigo({ idPedido, onFinalizado }: FinalizarComCodigoProps) {
  const [aberto, setAberto] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function fechar() {
    setAberto(false);
    setCodigo('');
    setErro(null);
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      await finalizarPedido(idPedido, codigo);
      fechar();
      onFinalizado();
    } catch (falha) {
      setErro(mensagemDoErro(falha));
      setCodigo('');
    } finally {
      setEnviando(false);
    }
  }

  if (!aberto) {
    return (
      <Botao larguraTotal className="h-14 text-base" onClick={() => setAberto(true)}>
        {acaoDoStatus('FINALIZADO')}
      </Botao>
    );
  }

  const codigoCompleto = codigo.length === TAMANHO_DO_CODIGO;

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-[18px] bg-superficie p-4 ring-1 ring-borda">
      <CampoTexto
        rotulo="Código do recebedor"
        descricao="Peça ao recebedor o código de 6 números que aparece no link de rastreio."
        erro={erro ?? undefined}
        value={codigo}
        onChange={(evento) => setCodigo(somenteNumeros(evento.target.value))}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={TAMANHO_DO_CODIGO}
        autoFocus
        required
      />
      <div className="flex gap-3">
        <Botao variante="secundario" className="flex-1" disabled={enviando} onClick={fechar}>
          Voltar
        </Botao>
        <Botao type="submit" className="flex-1" disabled={enviando || !codigoCompleto}>
          Finalizar
        </Botao>
      </div>
    </form>
  );
}

function somenteNumeros(valor: string): string {
  return valor.replace(/\D/g, '').slice(0, TAMANHO_DO_CODIGO);
}

function mensagemDoErro(falha: unknown): string {
  if (!(falha instanceof ApiError)) {
    return 'Não foi possível finalizar a entrega agora.';
  }
  const { tentativasRestantes, liberaEm } = falha.detalhes;
  if (typeof tentativasRestantes === 'number') {
    return `${falha.message}. ${textoDasTentativas(tentativasRestantes)}.`;
  }
  if (typeof liberaEm === 'string') {
    return `${falha.message}. Libera às ${horario(liberaEm)}.`;
  }
  return falha.message;
}

function textoDasTentativas(restantes: number): string {
  if (restantes === 0) {
    return 'As tentativas acabaram, espere alguns minutos';
  }
  return restantes === 1 ? 'Resta 1 tentativa' : `Restam ${restantes} tentativas`;
}

function horario(dataIso: string): string {
  return new Date(dataIso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
