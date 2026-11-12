import { useRef, useState, type FormEvent } from 'react';
import { ApiError, criarPedido } from '@/app/lib/api';
import { useSessao } from '@/app/lib/useSessao';
import {
  CAMPOS_DO_ENDERECO,
  criarFluxoEnvioPedido,
  validarNovoPedido,
  type ErrosNovoPedido,
  type FormularioNovoPedido,
} from '@/app/lib/novoPedido';
import type { CriarPedidoResposta } from '@/app/lib/tipos';
import { useLocalDoPedido } from './useLocalDoPedido';

const FORMULARIO_INICIAL: FormularioNovoPedido = {
  nome_recebedor: '',
  telefone: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  itens: '',
  observacoes: '',
  tipo_veiculo: '',
};

function mensagemDeFalha(erro: unknown): string {
  let mensagemDeErro = 'Não foi possível concluir o cadastro. Verifique sua conexão e tente novamente.';
  if (erro instanceof ApiError) {
    if (erro.status === 401) {
      mensagemDeErro = 'Sua sessão expirou. Entre novamente para cadastrar o pedido.';
    } else if (erro.status === 403) {
      mensagemDeErro = 'Sua conta não tem permissão para cadastrar este pedido.';
    } else if (erro.status === 409) {
      mensagemDeErro =
        erro.message === 'Parâmetros de remuneração não configurados'
          ? 'Configure os parâmetros de remuneração da empresa antes de cadastrar pedidos.'
          : `Não foi possível criar o pedido: ${erro.message}`;
    } else {
      mensagemDeErro = `Não foi possível criar o pedido: ${erro.message}`;
    }
  }
  return mensagemDeErro;
}
export function useCadastroPedido(onFechar: () => void, onCriado?: (pedido: CriarPedidoResposta) => void) {
  const empresa = useSessao('ESTABELECIMENTO');
  const fluxoDeEnvio = useRef(criarFluxoEnvioPedido(criarPedido));
  const [enviando, definirEnviando] = useState(false);
  const envioEmCurso = useRef(false);
  const [dadosDoFormulario, definirDadosDoFormulario] = useState<FormularioNovoPedido>(FORMULARIO_INICIAL);
  const [erros, definirErros] = useState<ErrosNovoPedido>({});
  const [aviso, definirAviso] = useState('');
  const [erroDeEnvio, definirErroDeEnvio] = useState('');
  const local = useLocalDoPedido(dadosDoFormulario);

  function atualizarCampo<Campo extends keyof FormularioNovoPedido>(campo: Campo, valor: FormularioNovoPedido[Campo]) {
    definirDadosDoFormulario((atuais) => ({ ...atuais, [campo]: valor }));
    if (CAMPOS_DO_ENDERECO.has(campo)) local.esquecer();
    definirErros((atuais) => ({ ...atuais, [campo]: undefined }));
    definirAviso('');
    definirErroDeEnvio('');
  }

  async function processarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (envioEmCurso.current) return;
    const novosErros = validarNovoPedido(dadosDoFormulario);
    definirErros(novosErros);
    definirAviso('');
    definirErroDeEnvio('');
    const primeiroCampo = Object.keys(novosErros)[0];
    if (primeiroCampo) {
      const campo = evento.currentTarget.elements.namedItem(primeiroCampo);
      if (campo instanceof HTMLElement) campo.focus();
      return;
    }
    if (local.faltaConfirmar(evento.currentTarget)) return;
    if (!empresa) return;
    envioEmCurso.current = true;
    definirEnviando(true);
    let pedido: CriarPedidoResposta;
    try {
      const resultado = await fluxoDeEnvio.current(dadosDoFormulario, empresa, local.destino);
      if (resultado.estado !== 'criado') return;
      pedido = resultado.pedido;
    } catch (erro) {
      definirErroDeEnvio(mensagemDeFalha(erro));
      return;
    } finally {
      envioEmCurso.current = false;
      definirEnviando(false);
    }
    // Callbacks ficam fora do catch da API: falha na página não significa falha no cadastro.
    definirDadosDoFormulario(FORMULARIO_INICIAL);
    definirErros({});
    local.esquecer();
    definirAviso(`Pedido #${pedido.id_pedido} criado com sucesso.`);
    onFechar();
    onCriado?.(pedido);
  }

  function fechar() {
    if (!envioEmCurso.current) onFechar();
  }

  let mensagemDeEstado = aviso;
  if (enviando) {
    mensagemDeEstado = 'Calculando entrega e cadastrando pedido...';
  } else if (!empresa) {
    mensagemDeEstado = 'Aguardando a sessão do estabelecimento...';
  }

  return {
    dadosDoFormulario,
    erros,
    atualizarCampo,
    processarEnvio,
    fechar,
    enviando,
    empresa,
    mensagemDeEstado,
    erroDeEnvio,
    local: local.propriedades,
  };
}
