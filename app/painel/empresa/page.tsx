'use client';

import { useEffect, useState, type FormEvent } from 'react';
import CamposDaEmpresa from '@/app/components/empresa/CamposDaEmpresa';
import PinoDaEmpresa from '@/app/components/empresa/PinoDaEmpresa';
import { usePinoDaEmpresa } from '@/app/components/empresa/usePinoDaEmpresa';
import Botao from '@/app/components/ui/Botao';
import Card from '@/app/components/ui/Card';
import TituloPagina from '@/app/components/ui/TituloPagina';
import { ApiError, atualizarCadastroDaEmpresa, buscarCadastroDaEmpresa } from '@/app/lib/api';
import {
  CAMPOS_DO_ENDERECO_DA_EMPRESA,
  enderecoDaEmpresaParaLocalizar,
  formatarCep,
  formatarDocumento,
  paraDadosCadastrais,
  paraValores,
  validarEmpresa,
  type ErrosDoFormulario,
  type ValoresDaEmpresa,
} from '@/app/lib/empresa';
import { formatarTelefone } from '@/app/lib/texto';
import type { CadastroDaEmpresa } from '@/app/lib/tipos';

function formatarData(dataIso: string): string {
  return new Date(dataIso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function descreverOrigem(origem: CadastroDaEmpresa['origem']): string {
  return origem ? 'Marcado no mapa' : 'Ainda não marcado. Clique em Editar para marcar a empresa no mapa.';
}

function Informacao({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-texto-apoio">{rotulo}</dt>
      <dd className="text-sm text-texto-corpo">{valor}</dd>
    </div>
  );
}

export default function PaginaEmpresa() {
  const [cadastro, setCadastro] = useState<CadastroDaEmpresa | null>(null);
  const [erroCarregar, setErroCarregar] = useState(false);
  const [editando, setEditando] = useState(false);
  const [valores, setValores] = useState<ValoresDaEmpresa | null>(null);
  const [erros, setErros] = useState<ErrosDoFormulario<ValoresDaEmpresa>>({});
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const pino = usePinoDaEmpresa();

  useEffect(() => {
    let cancelado = false;
    buscarCadastroDaEmpresa()
      .then((resposta) => {
        if (!cancelado) setCadastro(resposta);
      })
      .catch(() => {
        if (!cancelado) setErroCarregar(true);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  function editar() {
    if (!cadastro) return;
    setValores(paraValores(cadastro));
    setErros({});
    setMensagem(null);
    setEditando(true);
    pino.iniciar(cadastro);
  }

  function cancelar() {
    pino.encerrar();
    setEditando(false);
    setValores(null);
    setErros({});
  }

  function alterar(campo: keyof ValoresDaEmpresa, valor: string) {
    setValores((anteriores) => (anteriores ? { ...anteriores, [campo]: valor } : anteriores));
    setErros((anteriores) => ({ ...anteriores, [campo]: undefined }));
    if (CAMPOS_DO_ENDERECO_DA_EMPRESA.has(campo)) pino.enderecoMudou();
  }

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    if (!valores) return;
    const novosErros = validarEmpresa(valores);
    setErros(novosErros);
    const primeiro = Object.keys(novosErros)[0];
    if (primeiro) {
      document.getElementById(`empresa-${primeiro}`)?.focus();
      return;
    }

    setSalvando(true);
    setMensagem(null);
    try {
      setCadastro(await atualizarCadastroDaEmpresa({ ...paraDadosCadastrais(valores), ...pino.paraEnvio() }));
      pino.encerrar();
      setEditando(false);
      setValores(null);
      setMensagem({ tipo: 'sucesso', texto: 'Dados atualizados.' });
    } catch (erro) {
      setMensagem({
        tipo: 'erro',
        texto: erro instanceof ApiError ? erro.message : 'Não foi possível salvar. Tente de novo.',
      });
    } finally {
      setSalvando(false);
    }
  }

  if (erroCarregar) {
    return (
      <>
        <TituloPagina titulo="Empresa" subtitulo="Informações cadastradas do estabelecimento" />
        <Card titulo="Não foi possível carregar os dados" descricao="Tente novamente em alguns instantes." />
      </>
    );
  }

  if (!cadastro) {
    return <p className="text-xs text-texto-apoio">Carregando dados da empresa...</p>;
  }

  const { documento, endereco } = cadastro;
  const enderecoCompleto = `${endereco.logradouro}, ${endereco.numero}${endereco.complemento ? `, ${endereco.complemento}` : ''}, ${endereco.bairro}, ${endereco.cidade}/${endereco.uf}, CEP ${formatarCep(endereco.cep)}`;

  return (
    <>
      <TituloPagina titulo="Empresa" subtitulo="Informações cadastradas do estabelecimento" />
      <div className="flex max-w-[900px] flex-col gap-5">
        <Card titulo="Documento" descricao="O documento e a razão social não podem ser alterados.">
          <dl className="grid gap-4 md:grid-cols-2">
            <Informacao rotulo={documento.tipo} valor={formatarDocumento(documento.tipo, documento.numero)} />
            {cadastro.razaoSocial && <Informacao rotulo="Razão social" valor={cadastro.razaoSocial} />}
          </dl>
        </Card>

        {editando && valores ? (
          <Card titulo="Editar dados">
            <form onSubmit={salvar} noValidate className="flex flex-col gap-5">
              <CamposDaEmpresa valores={valores} erros={erros} desabilitado={salvando} onChange={alterar} />
              <PinoDaEmpresa
                etapa={pino.etapa}
                pino={pino.pino}
                tentativa={pino.tentativa}
                enderecoEncontrado={pino.enderecoEncontrado}
                podeLocalizar={enderecoDaEmpresaParaLocalizar(valores) !== null}
                desabilitado={salvando}
                aoLocalizar={() => void pino.localizar(valores)}
                aoMarcar={pino.marcar}
                aoManter={pino.manter}
              />
              {mensagem?.tipo === 'erro' && (
                <p role="alert" className="text-xs text-erro">
                  {mensagem.texto}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <Botao type="submit" disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar'}
                </Botao>
                <Botao variante="secundario" onClick={cancelar} disabled={salvando}>
                  Cancelar
                </Botao>
              </div>
            </form>
          </Card>
        ) : (
          <Card
            titulo="Dados do estabelecimento"
            acao={
              <Botao variante="claro" onClick={editar}>
                Editar
              </Botao>
            }
          >
            <dl className="grid gap-4 md:grid-cols-2">
              <Informacao rotulo="Nome fantasia" valor={cadastro.nomeFantasia} />
              <Informacao rotulo="E-mail" valor={cadastro.email} />
              <Informacao rotulo="Telefone" valor={formatarTelefone(cadastro.telefone)} />
              <Informacao rotulo="Endereço" valor={enderecoCompleto} />
              <Informacao rotulo="Ponto de saída das entregas" valor={descreverOrigem(cadastro.origem)} />
            </dl>
            {mensagem?.tipo === 'sucesso' && (
              <p role="status" className="mt-4 text-xs text-sucesso-texto">
                {mensagem.texto}
              </p>
            )}
          </Card>
        )}

        <p className="text-xs text-texto-apoio">
          Cadastro criado em {formatarData(cadastro.criadaEm)}. Última atualização em{' '}
          {formatarData(cadastro.atualizadaEm)}.
        </p>
      </div>
    </>
  );
}
