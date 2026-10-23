'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import IconeFechar from '@/app/components/icones/IconeFechar';
import Botao from '@/app/components/ui/Botao';
import CampoTexto from '@/app/components/ui/CampoTexto';
import { ApiError, criarPedido } from '@/app/lib/api';
import { useSessao } from '@/app/lib/useSessao';
import type { CriarPedidoResposta } from '@/app/lib/tipos';
import { criarFluxoEnvioPedido, type ObterEntregaNovoPedido, validarNovoPedido, type ErrosNovoPedido, type FormularioNovoPedido } from '@/app/lib/novoPedido';

export interface NovoPedidoModalProps {
  aberto: boolean;
  onFechar: () => void;
  onCriado?: (pedido: CriarPedidoResposta) => void;
  /** Ausente até existir integração real de cotação automática; mantém o cadastro bloqueado. */
  obterEntrega?: ObterEntregaNovoPedido;
}

const AVISO_INTEGRACAO = 'O cadastro está desabilitado: o cálculo do valor da entrega e a distância ainda dependem da integração. Nenhum pedido será enviado; seus dados serão mantidos neste formulário.';

const FORMULARIO_INICIAL: FormularioNovoPedido = {
  nome_recebedor: '', telefone: '', cep: '', logradouro: '', numero: '',
  complemento: '', bairro: '', cidade: '', uf: '', itens: '', observacoes: '',
};

export default function NovoPedidoModal({ aberto, onFechar, onCriado, obterEntrega }: NovoPedidoModalProps) {
  const empresa = useSessao('ESTABELECIMENTO');
  const fluxo = useRef(criarFluxoEnvioPedido(criarPedido));
  const [enviando, setEnviando] = useState(false);
  const envioEmCurso = useRef(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [dados, setDados] = useState<FormularioNovoPedido>(FORMULARIO_INICIAL);
  const [erros, setErros] = useState<ErrosNovoPedido>({});
  const [aviso, setAviso] = useState('');
  const [erroEnvio, setErroEnvio] = useState('');

  useEffect(() => {
    if (!aberto || !dialogo.current) return;
    const modal = dialogo.current;
    const origem = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const rolagemAnterior = document.body.style.overflow;
    modal.showModal();
    document.body.style.overflow = 'hidden';
    modal.querySelector<HTMLInputElement>('input')?.focus();
    return () => {
      modal.close();
      document.body.style.overflow = rolagemAnterior;
      origem?.focus();
    };
  }, [aberto]);

  function atualizar(campo: keyof FormularioNovoPedido, valor: string) {
    setDados((atuais) => ({ ...atuais, [campo]: valor }));
    setErros((atuais) => ({ ...atuais, [campo]: undefined }));
    setAviso('');
    setErroEnvio('');
  }

  async function validar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (envioEmCurso.current) return;
    const novosErros = validarNovoPedido(dados);
    setErros(novosErros);
    setAviso('');
    setErroEnvio('');
    const primeiroCampo = Object.keys(novosErros)[0];
    if (primeiroCampo) {
      const campo = evento.currentTarget.elements.namedItem(primeiroCampo);
      if (campo instanceof HTMLElement) campo.focus();
      return;
    }
    if (!empresa || !obterEntrega) return;
    envioEmCurso.current = true;
    setEnviando(true);
    let pedido: CriarPedidoResposta;
    try {
      const resultado = await fluxo.current(dados, empresa, obterEntrega);
      if (resultado.estado !== 'criado') return;
      pedido = resultado.pedido;
    } catch (erro) {
      setErroEnvio(
        erro instanceof ApiError
          ? erro.status === 401
            ? 'Sua sessão expirou. Entre novamente para cadastrar o pedido.'
            : erro.status === 403
              ? 'Sua conta não tem permissão para cadastrar este pedido.'
              : `Não foi possível criar o pedido: ${erro.message}`
          : 'Não foi possível concluir o cadastro. Verifique sua conexão e tente novamente.',
      );
      return;
    } finally {
      envioEmCurso.current = false;
      setEnviando(false);
    }
    // Callbacks ficam fora do catch da API: falha na página não significa falha no cadastro.
    setDados(FORMULARIO_INICIAL);
    setErros({});
    setAviso(`Pedido #${pedido.id_pedido} criado com sucesso.`);
    onFechar();
    onCriado?.(pedido);
  }

  function fechar() {
    if (!envioEmCurso.current) onFechar();
  }

  return (
    <dialog
      ref={dialogo}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-titulo`}
      onCancel={(evento) => { evento.preventDefault(); fechar(); }}
      onClick={(evento) => {
        if (evento.target !== evento.currentTarget) return;
        const limites = evento.currentTarget.getBoundingClientRect();
        if (evento.clientX < limites.left || evento.clientX > limites.right || evento.clientY < limites.top || evento.clientY > limites.bottom) fechar();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[520px] overflow-y-auto overscroll-contain rounded-[20px] border-0 bg-superficie p-5 text-texto backdrop:bg-sobreposicao/55 sm:p-6"
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 id={`${id}-titulo`} className="font-titulo text-lg font-bold">Novo pedido</h2>
        <button type="button" aria-label="Fechar novo pedido" onClick={fechar} disabled={enviando} className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-primaria">
          <IconeFechar className="size-5" />
        </button>
      </div>
      <form noValidate onSubmit={validar} aria-busy={enviando}>
        <fieldset disabled={enviando} className="flex min-w-0 flex-col gap-3">
        <CampoTexto aparencia="modal" rotulo="Nome do recebedor" name="nome_recebedor" placeholder="Ex.: Carla Menezes" autoComplete="name" required value={dados.nome_recebedor} erro={erros.nome_recebedor} onChange={(evento) => atualizar('nome_recebedor', evento.target.value)} />
        <CampoTexto aparencia="modal" rotulo="Telefone" name="telefone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="(61) 99999-0000" required value={dados.telefone} erro={erros.telefone} onChange={(evento) => atualizar('telefone', evento.target.value)} />
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          {([
            ['cep', 'CEP', '70000-000', 'postal-code'],
            ['logradouro', 'Logradouro', 'Rua ou avenida', 'address-line1'],
            ['numero', 'Número', 'Ex.: 10', 'off'],
            ['complemento', 'Complemento (opcional)', 'Apartamento, bloco', 'address-line2'],
            ['bairro', 'Bairro', 'Ex.: Centro', 'address-level3'],
            ['cidade', 'Cidade', 'Ex.: Brasília', 'address-level2'],
            ['uf', 'UF', 'Ex.: DF', 'address-level1'],
          ] as const).map(([campo, rotulo, placeholder, autoComplete]) => (
            <CampoTexto
              key={campo}
              aparencia="modal"
              rotulo={rotulo}
              name={campo}
              placeholder={placeholder}
              autoComplete={autoComplete}
              inputMode={campo === 'numero' || campo === 'cep' ? 'numeric' : undefined}
              autoCapitalize={campo === 'uf' ? 'characters' : undefined}
              required={campo !== 'complemento'}
              value={dados[campo]}
              erro={erros[campo]}
              onChange={(evento) => atualizar(campo, evento.target.value)}
            />
          ))}
        </div>
        {(['itens', 'observacoes'] as const).map((campo) => (
          <div key={campo} className="flex flex-col gap-1">
            <label htmlFor={`${id}-${campo}`} className="text-[11px] text-texto-apoio">{campo === 'itens' ? 'Itens do pedido (opcional)' : 'Observações (opcional)'}</label>
            <textarea
              id={`${id}-${campo}`}
              name={campo}
              rows={campo === 'itens' ? 3 : 2}
              placeholder={campo === 'itens' ? 'Descreva os itens e quantidades' : undefined}
              value={dados[campo]}
              onChange={(evento) => atualizar(campo, evento.target.value)}
              aria-invalid={erros[campo] ? true : undefined}
              aria-describedby={erros[campo] ? `${id}-${campo}-erro` : undefined}
              className={`min-w-0 resize-y rounded-lg border bg-superficie px-3 py-2 text-xs text-texto-corpo placeholder:text-texto-apoio focus:border-primaria focus:outline-none focus:ring-2 focus:ring-primaria-clara ${erros[campo] ? 'border-erro' : 'border-borda'}`}
            />
            {erros[campo] && <p id={`${id}-${campo}-erro`} className="text-[11px] text-erro">{erros[campo]}</p>}
          </div>
        ))}
        <p id={`${id}-aviso`} role="status" aria-live="polite" className="text-xs text-texto-apoio">{enviando ? 'Calculando entrega e cadastrando pedido...' : !obterEntrega ? AVISO_INTEGRACAO : !empresa ? 'Aguardando a sessão do estabelecimento...' : aviso}</p>
        {erroEnvio && <p role="alert" className="text-xs text-erro">{erroEnvio}</p>}
        <Botao type="submit" disabled={enviando || !empresa || !obterEntrega} aria-describedby={`${id}-aviso`} larguraTotal className="mt-2 h-11 rounded-xl text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaria">{enviando ? 'Criando pedido...' : 'Criar pedido'}</Botao>
        </fieldset>
      </form>
    </dialog>
  );
}
