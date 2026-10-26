'use client';

import { useState, type FormEvent } from 'react';
import Botao from '@/app/components/ui/Botao';
import Card from '@/app/components/ui/Card';
import CampoTexto from '@/app/components/ui/CampoTexto';
import { ApiError, editarEntregador } from '@/app/lib/api';
import { somenteDigitos, type ErrosDoFormulario } from '@/app/lib/empresa';
import {
  entregadorEditado,
  normalizarPlaca,
  paraEdicaoDoEntregador,
  precisaDePlaca,
  validarEntregador,
  valoresParaEditar,
  type ValoresDoEntregador,
} from '@/app/lib/entregadores';
import type { DadosCompartilhados } from '@/app/lib/tipos';
import CampoTipoVeiculo from './CampoTipoVeiculo';

export const ERRO_EDICAO_RECUSADA = 'Não foi possível salvar. Confira se o entregador ainda está na sua frota.';
const ERRO_EDICAO_SEM_CONEXAO = 'Não foi possível salvar agora. Tente de novo.';

export interface FormularioEdicaoEntregadorProps {
  entregador: DadosCompartilhados;
  onSalvo: (atualizado: DadosCompartilhados) => void;
  onCancelar: () => void;
}

export default function FormularioEdicaoEntregador({ entregador, onSalvo, onCancelar }: FormularioEdicaoEntregadorProps) {
  const [valores, setValores] = useState<ValoresDoEntregador>(valoresParaEditar(entregador));
  const [erros, setErros] = useState<ErrosDoFormulario<ValoresDoEntregador>>({});
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);

  function alterar<Campo extends keyof ValoresDoEntregador>(campo: Campo, valor: ValoresDoEntregador[Campo]) {
    setValores((anteriores) => ({ ...anteriores, [campo]: valor }));
    setErros((anteriores) => ({ ...anteriores, [campo]: undefined }));
    setFalha(null);
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const novosErros = validarEntregador(valores);
    setErros(novosErros);
    if (Object.values(novosErros).some(Boolean)) {
      return;
    }
    const edicao = paraEdicaoDoEntregador(valores);
    setEnviando(true);
    setFalha(null);
    try {
      const salvou = await editarEntregador(edicao);
      if (salvou) {
        onSalvo(entregadorEditado(entregador, edicao));
      } else {
        setFalha(ERRO_EDICAO_RECUSADA);
      }
    } catch (erro) {
      setFalha(erro instanceof ApiError ? erro.message : ERRO_EDICAO_SEM_CONEXAO);
    } finally {
      setEnviando(false);
    }
  }

  const campo = (nome: keyof ValoresDoEntregador) => ({
    id: `edicao-${nome}`,
    erro: erros[nome],
    disabled: enviando,
  });

  return (
    <Card titulo={`Editar ${entregador.nome}`} descricao="O CPF não muda. Altere só o que precisar.">
      <form onSubmit={salvar} noValidate className="grid gap-4 md:grid-cols-2">
        <CampoTexto
          rotulo="Nome do entregador"
          autoComplete="off"
          className="md:col-span-2"
          value={valores.nome}
          onChange={(evento) => alterar('nome', evento.target.value)}
          {...campo('nome')}
        />
        <CampoTexto
          rotulo="Telefone do entregador"
          descricao="Com DDD, só números"
          inputMode="numeric"
          autoComplete="off"
          value={valores.telefone}
          onChange={(evento) => alterar('telefone', somenteDigitos(evento.target.value, 11))}
          {...campo('telefone')}
        />
        <CampoTipoVeiculo
          id="edicao-tipoVeiculo"
          valor={valores.tipoVeiculo}
          erro={erros.tipoVeiculo}
          desabilitado={enviando}
          onChange={(tipoVeiculo) => alterar('tipoVeiculo', tipoVeiculo)}
        />
        {precisaDePlaca(valores.tipoVeiculo) && (
          <CampoTexto
            rotulo="Placa do veículo"
            descricao="ABC1234 ou ABC1D23"
            autoComplete="off"
            value={valores.placa}
            onChange={(evento) => alterar('placa', normalizarPlaca(evento.target.value))}
            {...campo('placa')}
          />
        )}

        {falha && (
          <p role="alert" className="text-[13px] text-erro md:col-span-2">
            {falha}
          </p>
        )}

        <div className="flex gap-3 md:col-span-2">
          <Botao type="submit" disabled={enviando}>
            {enviando ? 'Salvando...' : 'Salvar alterações'}
          </Botao>
          <Botao variante="secundario" disabled={enviando} onClick={onCancelar}>
            Cancelar
          </Botao>
        </div>
      </form>
    </Card>
  );
}
