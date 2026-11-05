'use client';

import { useState, type FormEvent } from 'react';
import Botao from '@/app/components/ui/Botao';
import Card from '@/app/components/ui/Card';
import CampoTexto from '@/app/components/ui/CampoTexto';
import { ApiError, convidarEntregador } from '@/app/lib/api';
import { cpfValido, somenteDigitosCpf } from '@/app/lib/cpf';

type Aviso = { tipo: 'sucesso' | 'erro'; texto: string };

export interface FormularioConviteEntregadorProps {
  cpfInicial?: string;
}

export default function FormularioConviteEntregador({ cpfInicial = '' }: FormularioConviteEntregadorProps) {
  const [cpf, setCpf] = useState(cpfInicial);
  const [erroDoCpf, setErroDoCpf] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!cpfValido(cpf)) {
      setErroDoCpf('CPF inválido');
      return;
    }
    setEnviando(true);
    setAviso(null);
    try {
      const { mensagem } = await convidarEntregador(cpf);
      setAviso({ tipo: 'sucesso', texto: mensagem });
      setCpf('');
    } catch (falha) {
      setAviso({
        tipo: 'erro',
        texto: falha instanceof ApiError ? falha.message : 'Não foi possível enviar o convite agora. Tente de novo.',
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card
      titulo="Convidar entregador"
      descricao="Para quem já usa o VemVindo em outro estabelecimento. Basta o CPF: ele aceita o convite no app."
    >
      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <CampoTexto
          id="convite-cpf"
          rotulo="CPF do entregador"
          descricao="Só números"
          inputMode="numeric"
          autoComplete="off"
          autoFocus={Boolean(cpfInicial)}
          value={cpf}
          erro={erroDoCpf}
          disabled={enviando}
          onChange={(evento) => {
            setCpf(somenteDigitosCpf(evento.target.value));
            setErroDoCpf(undefined);
            setAviso(null);
          }}
        />
        {aviso && (
          <p
            role={aviso.tipo === 'erro' ? 'alert' : 'status'}
            className={`text-[13px] ${aviso.tipo === 'erro' ? 'text-erro' : 'text-sucesso-texto'}`}
          >
            {aviso.texto}
          </p>
        )}
        <Botao type="submit" variante="secundario" disabled={enviando} className="self-start">
          {enviando ? 'Enviando...' : 'Enviar convite'}
        </Botao>
      </form>
    </Card>
  );
}
