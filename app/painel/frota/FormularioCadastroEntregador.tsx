'use client';

import { useState, type FormEvent } from 'react';
import Botao from '@/app/components/ui/Botao';
import Card from '@/app/components/ui/Card';
import CampoTexto from '@/app/components/ui/CampoTexto';
import { ApiError, cadastrarEntregador } from '@/app/lib/api';
import { somenteDigitosCpf } from '@/app/lib/cpf';
import { somenteDigitos, type ErrosDoFormulario } from '@/app/lib/empresa';
import {
  ENTREGADOR_VAZIO,
  normalizarPlaca,
  paraNovoEntregador,
  precisaDePlaca,
  validarEntregador,
  type ValoresDoEntregador,
} from '@/app/lib/entregadores';
import type { EntregadorCadastrado } from '@/app/lib/tipos';
import CampoTipoVeiculo from './CampoTipoVeiculo';
import SenhaTemporariaGerada from './SenhaTemporariaGerada';

const CPF_JA_CADASTRADO = 409;

export interface FormularioCadastroEntregadorProps {
  onCpfJaCadastrado: (cpf: string) => void;
}

export default function FormularioCadastroEntregador({ onCpfJaCadastrado }: FormularioCadastroEntregadorProps) {
  const [valores, setValores] = useState<ValoresDoEntregador>(ENTREGADOR_VAZIO);
  const [erros, setErros] = useState<ErrosDoFormulario<ValoresDoEntregador>>({});
  const [enviando, setEnviando] = useState(false);
  const [falhaDoEnvio, setFalhaDoEnvio] = useState<ApiError | string | null>(null);
  const [cadastrado, setCadastrado] = useState<EntregadorCadastrado | null>(null);

  function alterar<Campo extends keyof ValoresDoEntregador>(campo: Campo, valor: ValoresDoEntregador[Campo]) {
    setValores((anteriores) => ({ ...anteriores, [campo]: valor }));
    setErros((anteriores) => ({ ...anteriores, [campo]: undefined }));
    setFalhaDoEnvio(null);
  }

  function recomecar() {
    setValores(ENTREGADOR_VAZIO);
    setCadastrado(null);
  }

  function convidarEsteCpf() {
    onCpfJaCadastrado(valores.cpf);
    setValores(ENTREGADOR_VAZIO);
    setFalhaDoEnvio(null);
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const novosErros = validarEntregador(valores);
    setErros(novosErros);
    if (Object.values(novosErros).some(Boolean)) {
      return;
    }
    setEnviando(true);
    setFalhaDoEnvio(null);
    try {
      setCadastrado(await cadastrarEntregador(paraNovoEntregador(valores)));
    } catch (falha) {
      setFalhaDoEnvio(falha instanceof ApiError ? falha : 'Não foi possível cadastrar agora. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  if (cadastrado) {
    return (
      <Card titulo="Cadastrar entregador">
        <SenhaTemporariaGerada cadastrado={cadastrado} onCadastrarOutro={recomecar} />
      </Card>
    );
  }

  const cpfJaCadastrado = falhaDoEnvio instanceof ApiError && falhaDoEnvio.status === CPF_JA_CADASTRADO;
  const campo = (nome: keyof ValoresDoEntregador) => ({
    id: `entregador-${nome}`,
    erro: erros[nome],
    disabled: enviando,
  });

  return (
    <Card
      titulo="Cadastrar entregador"
      descricao="Para quem ainda não usa o VemVindo. O cadastro gera uma senha temporária para o primeiro acesso."
    >
      <form onSubmit={enviar} noValidate className="grid gap-4 md:grid-cols-2">
        <CampoTexto
          rotulo="Nome completo"
          autoComplete="off"
          className="md:col-span-2"
          value={valores.nome}
          onChange={(evento) => alterar('nome', evento.target.value)}
          {...campo('nome')}
        />
        <CampoTexto
          rotulo="CPF"
          descricao="Só números"
          inputMode="numeric"
          autoComplete="off"
          value={valores.cpf}
          onChange={(evento) => alterar('cpf', somenteDigitosCpf(evento.target.value))}
          {...campo('cpf')}
        />
        <CampoTexto
          rotulo="Telefone"
          descricao="Com DDD, só números"
          inputMode="numeric"
          autoComplete="off"
          value={valores.telefone}
          onChange={(evento) => alterar('telefone', somenteDigitos(evento.target.value, 11))}
          {...campo('telefone')}
        />
        <CampoTipoVeiculo
          id="entregador-tipoVeiculo"
          valor={valores.tipoVeiculo}
          erro={erros.tipoVeiculo}
          desabilitado={enviando}
          onChange={(tipoVeiculo) => alterar('tipoVeiculo', tipoVeiculo)}
        />
        {precisaDePlaca(valores.tipoVeiculo) && (
          <CampoTexto
            rotulo="Placa"
            descricao="ABC1234 ou ABC1D23"
            autoComplete="off"
            value={valores.placa}
            onChange={(evento) => alterar('placa', normalizarPlaca(evento.target.value))}
            {...campo('placa')}
          />
        )}

        {falhaDoEnvio && (
          <div role="alert" className="flex flex-col items-start gap-2 md:col-span-2">
            <p className="text-[13px] text-erro">
              {falhaDoEnvio instanceof ApiError ? falhaDoEnvio.message : falhaDoEnvio}
            </p>
            {cpfJaCadastrado && (
              <Botao variante="claro" onClick={convidarEsteCpf}>
                Convidar este CPF
              </Botao>
            )}
          </div>
        )}

        <Botao type="submit" disabled={enviando} className="md:col-span-2 md:justify-self-start">
          {enviando ? 'Cadastrando...' : 'Cadastrar entregador'}
        </Botao>
      </form>
    </Card>
  );
}
