'use client';

import { useState, type FormEvent } from 'react';
import CampoTipoVeiculo from '@/app/components/entregador/CampoTipoVeiculo';
import Botao from '@/app/components/ui/Botao';
import CampoTexto from '@/app/components/ui/CampoTexto';
import { ApiError, atualizarPerfilDoEntregador } from '@/app/lib/api';
import { formatarCpf } from '@/app/lib/dadosCompartilhados';
import { somenteDigitos, type ErrosDoFormulario } from '@/app/lib/empresa';
import { normalizarPlaca, precisaDePlaca } from '@/app/lib/entregadores';
import { somenteLetras } from '@/app/lib/entrada';
import {
  alteracoesDoPerfil,
  semAlteracoes,
  TAMANHO_MAXIMO_DO_NOME,
  validarPerfil,
  valoresDoPerfil,
  type ValoresDoPerfil,
} from '@/app/lib/perfilEntregador';
import type { PerfilDoEntregador, TipoVeiculo } from '@/app/lib/tipos';

export const PERFIL_SALVO = 'Cadastro atualizado.';
export const NADA_MUDOU = 'Nada mudou. Altere algum campo para salvar.';
const SEM_CONEXAO = 'Não foi possível salvar agora. Tente de novo.';
const SENHA_TEMPORARIA = 403;

export interface FormularioPerfilProps {
  perfil: PerfilDoEntregador;
  onSalvo: (perfil: PerfilDoEntregador) => void;
  onSenhaTemporaria: () => void;
}

type Aviso = { tipo: 'sucesso' | 'erro'; texto: string } | null;

export default function FormularioPerfil({ perfil, onSalvo, onSenhaTemporaria }: FormularioPerfilProps) {
  const [valores, setValores] = useState<ValoresDoPerfil>(() => valoresDoPerfil(perfil));
  const [erros, setErros] = useState<ErrosDoFormulario<ValoresDoPerfil>>({});
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);

  function alterar<Campo extends keyof ValoresDoPerfil>(campo: Campo, valor: ValoresDoPerfil[Campo]) {
    setValores((anteriores) => ({ ...anteriores, [campo]: valor }));
    setErros((anteriores) => ({ ...anteriores, [campo]: undefined }));
    setAviso(null);
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const novosErros = validarPerfil(valores);
    setErros(novosErros);
    if (Object.values(novosErros).some(Boolean)) return;

    const edicao = alteracoesDoPerfil(perfil, valores);
    if (semAlteracoes(edicao)) {
      setAviso({ tipo: 'erro', texto: NADA_MUDOU });
      return;
    }

    setEnviando(true);
    setAviso(null);
    try {
      const atualizado = await atualizarPerfilDoEntregador(edicao);
      setValores(valoresDoPerfil(atualizado));
      setAviso({ tipo: 'sucesso', texto: PERFIL_SALVO });
      onSalvo(atualizado);
    } catch (erro) {
      if (erro instanceof ApiError && erro.status === SENHA_TEMPORARIA) {
        onSenhaTemporaria();
        return;
      }
      setAviso({ tipo: 'erro', texto: erro instanceof ApiError ? erro.message : SEM_CONEXAO });
    } finally {
      setEnviando(false);
    }
  }

  const campo = (nome: keyof ValoresDoPerfil) => ({ id: `perfil-${nome}`, erro: erros[nome], disabled: enviando });

  return (
    <form onSubmit={salvar} noValidate className="grid gap-4 md:grid-cols-2">
      <CampoTexto
        rotulo="Nome completo"
        autoComplete="name"
        maxLength={TAMANHO_MAXIMO_DO_NOME}
        className="md:col-span-2"
        value={valores.nome}
        onChange={(evento) => alterar('nome', somenteLetras(evento.target.value))}
        {...campo('nome')}
      />
      <CampoTexto
        rotulo="CPF"
        descricao="O CPF não pode ser alterado"
        id="perfil-cpf"
        value={formatarCpf(perfil.cpf)}
        readOnly
        className="md:col-span-2"
      />
      <CampoTexto
        rotulo="Telefone"
        descricao="Com DDD, só números"
        inputMode="numeric"
        autoComplete="tel-national"
        value={valores.telefone}
        onChange={(evento) => alterar('telefone', somenteDigitos(evento.target.value, 11))}
        {...campo('telefone')}
      />
      <CampoTipoVeiculo
        id="perfil-tipoVeiculo"
        valor={valores.tipoVeiculo}
        desabilitado={enviando}
        obrigatorio
        onChange={(tipoVeiculo) => alterar('tipoVeiculo', tipoVeiculo as TipoVeiculo)}
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

      {aviso && (
        <p
          role={aviso.tipo === 'sucesso' ? 'status' : 'alert'}
          className={`text-sm md:col-span-2 ${aviso.tipo === 'sucesso' ? 'text-sucesso-texto' : 'text-erro'}`}
        >
          {aviso.texto}
        </p>
      )}

      <Botao type="submit" disabled={enviando} className="md:col-span-2 md:justify-self-start">
        {enviando ? 'Salvando...' : 'Salvar alterações'}
      </Botao>
    </form>
  );
}
