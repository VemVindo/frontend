'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CamposDaEmpresa from '@/app/components/empresa/CamposDaEmpresa';
import Botao from '@/app/components/ui/Botao';
import CampoTexto from '@/app/components/ui/CampoTexto';
import LogoCompleta from '@/app/components/ui/LogoCompleta';
import { ApiError, cadastrarEmpresa } from '@/app/lib/api';
import {
  EMPRESA_VAZIA,
  normalizarDocumento,
  paraNovaEmpresa,
  validarCadastro,
  type ErrosDoFormulario,
  type ValoresDoCadastro,
} from '@/app/lib/empresa';
import { TELA_DE_LOGIN, TELA_INICIAL } from '@/app/lib/rotas';
import type { TipoDocumento } from '@/app/lib/tipos';

const CADASTRO_VAZIO: ValoresDoCadastro = {
  ...EMPRESA_VAZIA,
  tipoDocumento: 'CNPJ',
  documento: '',
  razaoSocial: '',
  senha: '',
  confirmacaoSenha: '',
};

export default function PaginaCadastro() {
  const router = useRouter();
  const [valores, setValores] = useState(CADASTRO_VAZIO);
  const [erros, setErros] = useState<ErrosDoFormulario<ValoresDoCadastro>>({});
  const [enviando, setEnviando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  function alterar(campo: keyof ValoresDoCadastro, valor: string) {
    setValores((anteriores) => ({ ...anteriores, [campo]: valor }));
    setErros((anteriores) => ({ ...anteriores, [campo]: undefined }));
    setErroGeral(null);
  }

  function trocarTipo(tipo: TipoDocumento) {
    setValores((anteriores) => ({
      ...anteriores,
      tipoDocumento: tipo,
      documento: normalizarDocumento(tipo, anteriores.documento),
    }));
    setErros((anteriores) => ({ ...anteriores, documento: undefined, razaoSocial: undefined }));
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const novosErros = validarCadastro(valores);
    setErros(novosErros);
    const primeiro = Object.keys(novosErros)[0];
    if (primeiro) {
      document.getElementById(`empresa-${primeiro}`)?.focus();
      return;
    }

    setEnviando(true);
    try {
      await cadastrarEmpresa(paraNovaEmpresa(valores));
      router.replace(TELA_INICIAL.ESTABELECIMENTO);
    } catch (erro) {
      setErroGeral(erro instanceof ApiError ? erro.message : 'Não foi possível cadastrar agora. Tente novamente.');
      setEnviando(false);
    }
  }

  const ehCnpj = valores.tipoDocumento === 'CNPJ';

  return (
    <main className="flex w-full flex-1 flex-col items-center gap-8 bg-fundo px-4 py-10 md:py-14">
      <LogoCompleta className="h-auto w-[160px]" />
      <form
        onSubmit={enviar}
        noValidate
        className="flex w-full max-w-[720px] flex-col gap-6 rounded-3xl bg-superficie p-6 md:p-10"
      >
        <div>
          <h1 className="text-[22px] font-semibold text-texto md:text-[28px]">Cadastrar estabelecimento</h1>
          <p className="mt-1 text-xs text-texto-apoio">
            Já tem conta?{' '}
            <Link href={TELA_DE_LOGIN.ESTABELECIMENTO} className="font-semibold text-primaria hover:underline">
              Entrar
            </Link>
          </p>
        </div>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-3 text-xs font-semibold text-texto">Documento</legend>
          <div role="radiogroup" aria-label="Tipo de documento" className="flex gap-2">
            {(['CNPJ', 'CPF'] as const).map((tipo) => (
              <label
                key={tipo}
                className={`cursor-pointer rounded-[10px] border px-4 py-2 text-xs font-semibold ${
                  valores.tipoDocumento === tipo
                    ? 'border-primaria bg-primaria-clara text-primaria-escura'
                    : 'border-borda text-texto-corpo'
                }`}
              >
                <input
                  type="radio"
                  name="tipoDocumento"
                  value={tipo}
                  checked={valores.tipoDocumento === tipo}
                  onChange={() => trocarTipo(tipo)}
                  className="sr-only"
                />
                {tipo === 'CNPJ' ? 'CNPJ (empresa)' : 'CPF (produtor)'}
              </label>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <CampoTexto
              id="empresa-documento"
              rotulo={ehCnpj ? 'CNPJ' : 'CPF'}
              descricao={ehCnpj ? 'Só letras e números' : 'Só números'}
              value={valores.documento}
              erro={erros.documento}
              disabled={enviando}
              onChange={(evento) =>
                alterar('documento', normalizarDocumento(valores.tipoDocumento, evento.target.value))
              }
            />
            {ehCnpj && (
              <CampoTexto
                id="empresa-razaoSocial"
                rotulo="Razão social"
                reservarEspacoDescricao
                value={valores.razaoSocial}
                erro={erros.razaoSocial}
                disabled={enviando}
                onChange={(evento) => alterar('razaoSocial', evento.target.value)}
              />
            )}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-xs font-semibold text-texto">Dados do estabelecimento</legend>
          <CamposDaEmpresa
            valores={valores}
            erros={erros}
            desabilitado={enviando}
            reservarEspacoDescricao
            onChange={alterar}
          />
        </fieldset>

        <fieldset className="grid gap-4 md:grid-cols-2">
          <legend className="mb-3 text-xs font-semibold text-texto">Senha de acesso</legend>
          <CampoTexto
            id="empresa-senha"
            rotulo="Senha"
            descricao="De 8 a 72 caracteres, sem espaços"
            type="password"
            autoComplete="new-password"
            value={valores.senha}
            erro={erros.senha}
            disabled={enviando}
            onChange={(evento) => alterar('senha', evento.target.value)}
          />
          <CampoTexto
            id="empresa-confirmacaoSenha"
            rotulo="Confirme a senha"
            reservarEspacoDescricao
            type="password"
            autoComplete="new-password"
            value={valores.confirmacaoSenha}
            erro={erros.confirmacaoSenha}
            disabled={enviando}
            onChange={(evento) => alterar('confirmacaoSenha', evento.target.value)}
          />
        </fieldset>

        {erroGeral && (
          <p role="alert" className="text-xs text-erro">
            {erroGeral}
          </p>
        )}
        <Botao type="submit" larguraTotal disabled={enviando}>
          {enviando ? 'Cadastrando...' : 'Cadastrar'}
        </Botao>
      </form>
    </main>
  );
}
