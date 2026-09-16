'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [token, setToken] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    console.log(token);
    if(token) router.push(`/valid/${token}`);
  }, [token])

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    console.log(email, senha);
    setCarregando(true);
    try {
      const response = await fetch('http://localhost:8000/auth/login/empresa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          senha: senha
        })});
        if (!response.ok) {
          throw new Error('Falha na autenticação');
        } 
        const data = await response.json();
        setToken(data.accessToken);
    } catch (error) {
      setError(true);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="bg-[#F6F5FB] flex h-full w-full flex-1 flex-col xl:flex-row items-center gap-[50px] px-6 py-16 xl:p-0">
      <div className='xl:w-[40%] xl:flex xl:items-center xl:justify-center'>
        <Image
          src="/logo-mobile.png"
          width={250}
          height={250}
          alt="Picture of the author"
          className='lg:hidden'
        />

        <Image
          src="/logo-desktop.png"
          width={500}
          height={500}
          alt="Picture of the author"
          className='hidden xl:block'
        />
      </div>

      <div className='w-full h-full xl:w-[60%] xl:bg-[#6C5DD3] xl:py-[150px] xl:px-[100px]'>
        <div className='w-full h-full flex flex-col justify-start xl:justify-center items-center gap-[75px] xl:rounded-3xl xl:bg-white xl:p-[50px] xl:items-start xl:justify-normal'>
          <p className='text-[#1D1B2E] text-[22px] xl:text-[28px] font-semibold'>Entrar na sua conta</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-3 xl:gap-6 w-full">
            <div className='flex flex-col gap-1 xl:gap-2'>
              <label htmlFor='idcnpj' className="text-[13px] text-[#8B8A9A] font-bold">
                EMAIL
              </label>
                <input
                  type="email"
                  value={email}
                  placeholder='example@mail.com'
                  onChange={(e) => {setEmail(e.target.value);setError(false)}}
                  className="rounded-xl px-4 py-4 bg-white xl:bg-[#F6F5FB] text-black"
                />
              </div>
            <div className='flex flex-col gap-1 xl:gap-2'>
              <label htmlFor="idpassword" className="text-[13px] text-[#8B8A9A] font-bold">
                SENHA
              </label>
                <input
                  id="idpassword"
                  type="password"
                  value={senha}
                  placeholder='*********'
                  onChange={(e) => {setSenha(e.target.value);setError(false)}}
                  className="rounded-xl px-4 py-4 bg-white xl:bg-[#F6F5FB] text-black"
                />
            </div>
            <div className='w-full flex flex-col justify-center items-center'>
              {carregando ?
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#6C5DD3]"></div>
              :            <button
                type="submit"
                className="hover:cursor-pointer transition-transform duration-300 hover:scale-101 rounded-xl bg-[#6C5DD3] w-full py-4 xl:py-5 text-sm xl:text-lg font-medium text-white disabled:opacity-50"
              >
                Acessar
              </button>}
              {error && <p className='text-[14px] text-red-500 mt-5'>Senha Incorreta ou Conta Inexistente</p>}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
