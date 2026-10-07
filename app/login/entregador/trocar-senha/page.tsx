'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import BotaoLogin from '@/app/components/auth/BotaoLogin';
import CaixaConfirmacao from '@/app/components/auth/CaixaConfirmacao';
import CampoLogin from '@/app/components/auth/CampoLogin';
import TelaLogin from '@/app/components/auth/TelaLogin';
import PainelDadosCompartilhados from '@/app/components/entregador/PainelDadosCompartilhados';
import { ApiError, buscarUsuarioAtual, trocarSenhaEntregador } from '@/app/lib/api';
import { TELA_DE_LOGIN, TELA_INICIAL } from '@/app/lib/rotas';
import { usePrivacidadeEntregador } from '@/app/lib/usePrivacidadeEntregador';
import { TAMANHO_MAXIMO, TAMANHO_MINIMO, validarNovaSenha } from './validacao';

export default function TrocarSenhaEntregador() {
  const router = useRouter();
  const [liberado, setLiberado] = useState(false);
  const { dados, vinculos } = usePrivacidadeEntregador(liberado);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [ciente, setCiente] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    buscarUsuarioAtual()
      .then((usuario) => {
        if (cancelado) return;
        if (usuario.cargo !== 'ENTREGADOR') {
          router.replace(TELA_DE_LOGIN.ENTREGADOR);
        } else if (!usuario.senhaTemporaria) {
          router.replace(TELA_INICIAL.ENTREGADOR);
        } else {
          setLiberado(true);
        }
      })
      .catch(() => {
        if (!cancelado) router.replace(TELA_DE_LOGIN.ENTREGADOR);
      });
    return () => {
      cancelado = true;
    };
  }, [router]);

  async function handleTroca(event: FormEvent) {
    event.preventDefault();

    const erroValidacao = validarNovaSenha(senhaAtual, novaSenha, confirmacao);
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }
    if (!ciente) {
      setErro('Confirme que viu os dados que as empresas veem');
      return;
    }

    setCarregando(true);
    try {
      await trocarSenhaEntregador(senhaAtual, novaSenha, ciente);
      router.replace(TELA_INICIAL.ENTREGADOR);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setErro('Senha temporária incorreta');
      } else if (e instanceof ApiError && e.status === 400) {
        setErro(e.message);
      } else {
        setErro('Não foi possível salvar a senha agora. Tente novamente.');
      }
      setCarregando(false);
    }
  }

  function alterar(setter: (valor: string) => void) {
    return (e: { target: { value: string } }) => {
      setter(e.target.value);
      setErro(null);
    };
  }

  if (!liberado) return null;

  const convites = vinculos?.filter((v) => v.status === 'PENDENTE') ?? [];

  return (
    <TelaLogin titulo="Crie sua senha">
      <form onSubmit={handleTroca} className="flex flex-col gap-3 xl:gap-6 w-full">
        <p className="text-[13px] text-texto-suave">
          Este é seu primeiro acesso. Troque a senha temporária que você recebeu da empresa por uma senha só sua.
        </p>
        <CampoLogin
          rotulo="SENHA TEMPORÁRIA"
          type="password"
          autoComplete="current-password"
          required
          value={senhaAtual}
          onChange={alterar(setSenhaAtual)}
        />
        <CampoLogin
          rotulo="NOVA SENHA"
          type="password"
          autoComplete="new-password"
          required
          minLength={TAMANHO_MINIMO}
          maxLength={TAMANHO_MAXIMO}
          value={novaSenha}
          onChange={alterar(setNovaSenha)}
        />
        <p className="-mt-1 text-[12px] text-texto-suave">
          De {TAMANHO_MINIMO} a {TAMANHO_MAXIMO} caracteres: letras sem acento, números e símbolos, sem espaços.
        </p>
        <CampoLogin
          rotulo="CONFIRMAR NOVA SENHA"
          type="password"
          autoComplete="new-password"
          required
          value={confirmacao}
          onChange={alterar(setConfirmacao)}
        />
        {dados && <PainelDadosCompartilhados dados={dados} />}
        {convites.length > 0 && (
          <p className="text-[13px] text-texto-suave">
            Convites esperando sua resposta: <strong className="text-texto">{convites.map((v) => v.empresa).join(', ')}</strong>.
            Você aceita ou recusa cada um depois de criar a senha.
          </p>
        )}
        <CaixaConfirmacao marcado={ciente} onAlterar={(valor) => { setCiente(valor); setErro(null); }}>
          Vi quais dados as empresas veem sobre mim depois que eu aceitar um convite.
        </CaixaConfirmacao>
        <BotaoLogin carregando={carregando} erro={erro}>
          Salvar nova senha
        </BotaoLogin>
      </form>
    </TelaLogin>
  );
}
