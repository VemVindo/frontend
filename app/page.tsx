'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BotaoLogin from '@/app/components/auth/BotaoLogin';
import CampoLogin from '@/app/components/auth/CampoLogin';
import TelaLogin from '@/app/components/auth/TelaLogin';
import { ApiError, loginEmpresa } from '@/app/lib/api';
import { TELA_INICIAL } from '@/app/lib/rotas';

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setCarregando(true);
    try {
      await loginEmpresa(email, senha);
      router.replace(TELA_INICIAL.ESTABELECIMENTO);
    } catch (e) {
      setErro(
        e instanceof ApiError && e.status === 401
          ? 'Senha incorreta ou conta inexistente'
          : 'Não foi possível entrar agora. Tente novamente.',
      );
      setCarregando(false);
    }
  }

  return (
    <TelaLogin titulo="Entrar na sua conta">
      <form onSubmit={handleLogin} className="flex flex-col gap-3 xl:gap-6 w-full">
        <CampoLogin
          rotulo="EMAIL"
          type="email"
          autoComplete="email"
          required
          value={email}
          placeholder='example@mail.com'
          onChange={(e) => { setEmail(e.target.value); setErro(null); }}
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
        <Link href="/login/entregador" className="text-center text-[13px] text-primaria font-medium">
          Sou entregador
        </Link>
      </form>
    </TelaLogin>
  );
}
