'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import BotaoLogin from '@/app/components/auth/BotaoLogin';
import CampoLogin from '@/app/components/auth/CampoLogin';
import TelaLogin from '@/app/components/auth/TelaLogin';
import { ApiError, buscarUsuarioAtual, trocarSenhaEntregador } from '@/app/lib/api';
import { TAMANHO_MAXIMO, TAMANHO_MINIMO, validarNovaSenha } from './validacao';

export default function TrocarSenhaEntregador() {
  const router = useRouter();
  const [liberado, setLiberado] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    buscarUsuarioAtual()
      .then((usuario) => {
        if (cancelado) return;
        if (usuario.role !== 'ENTREGADOR') {
          router.replace('/login/entregador');
        } else if (!usuario.senhaTemporaria) {
          router.replace('/entregador');
        } else {
          setLiberado(true);
        }
      })
      .catch(() => {
        if (!cancelado) router.replace('/login/entregador');
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

    setCarregando(true);
    try {
      await trocarSenhaEntregador(senhaAtual, novaSenha);
      router.replace('/entregador');
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

  return (
    <TelaLogin titulo="Crie sua senha">
      <form onSubmit={handleTroca} className="flex flex-col gap-3 xl:gap-6 w-full">
        <p className="text-[13px] text-[#8B8A9A]">
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
        <CampoLogin
          rotulo="CONFIRMAR NOVA SENHA"
          type="password"
          autoComplete="new-password"
          required
          value={confirmacao}
          onChange={alterar(setConfirmacao)}
        />
        <BotaoLogin carregando={carregando} erro={erro}>
          Salvar nova senha
        </BotaoLogin>
      </form>
    </TelaLogin>
  );
}
