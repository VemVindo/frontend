'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BotaoLogin from '@/app/components/auth/BotaoLogin';
import CampoLogin from '@/app/components/auth/CampoLogin';
import TelaLogin from '@/app/components/auth/TelaLogin';
import { ApiError, loginEntregador } from '@/app/lib/api';
import { cpfValido, somenteDigitosCpf } from '@/app/lib/cpf';
import { TELA_INICIAL, TELA_TROCAR_SENHA } from '@/app/lib/rotas';

export default function LoginEntregador() {
  const router = useRouter();
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    if (!cpfValido(cpf)) {
      setErro('CPF inválido. Confira os 11 dígitos');
      return;
    }
    setCarregando(true);
    try {
      const { usuario } = await loginEntregador(cpf, senha);
      router.replace(usuario.senhaTemporaria ? TELA_TROCAR_SENHA : TELA_INICIAL.ENTREGADOR);
    } catch (e) {
      setErro(
        e instanceof ApiError && e.status === 401
          ? 'CPF ou senha incorretos'
          : 'Não foi possível entrar agora. Tente novamente.',
      );
      setCarregando(false);
    }
  }

  return (
    <TelaLogin titulo="Entrar como entregador">
      <form onSubmit={handleLogin} className="flex flex-col gap-3 xl:gap-6 w-full">
        <CampoLogin
          rotulo="CPF"
          type="text"
          inputMode="numeric"
          autoComplete="username"
          required
          maxLength={11}
          value={cpf}
          placeholder='Somente números'
          onChange={(e) => { setCpf(somenteDigitosCpf(e.target.value)); setErro(null); }}
        />
        <CampoLogin
          rotulo="SENHA"
          type="password"
          autoComplete="current-password"
          required
          value={senha}
          placeholder='*********'
          onChange={(e) => { setSenha(e.target.value); setErro(null); }}
        />
        <BotaoLogin carregando={carregando} erro={erro}>
          Acessar
        </BotaoLogin>
        <Link href="/" className="text-center text-[13px] text-[#6C5DD3] font-medium">
          Sou empresa
        </Link>
      </form>
    </TelaLogin>
  );
}
