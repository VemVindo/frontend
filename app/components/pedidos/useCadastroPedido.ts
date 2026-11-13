import { useRef, useState, type FormEvent } from 'react';
import { ApiError, criarPedido, localizarEndereco } from '@/app/lib/api';
import { useSessao } from '@/app/lib/useSessao';
import {
  CAMPOS_DO_ENDERECO,
  criarFluxoEnvioPedido,
  enderecoParaLocalizar,
  validarNovoPedido,
  type ErrosNovoPedido,
  type FormularioNovoPedido,
} from '@/app/lib/novoPedido';
import type { Coordenada, CriarPedidoResposta, EnderecoLocalizado } from '@/app/lib/tipos';
import type { EtapaDoLocal } from './LocalNoMapa';
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

function etapaDaBusca(achou: boolean, precisao: EnderecoLocalizado['precisao']): EtapaDoLocal {
  if (!achou) return 'nao-encontrado';
  return precisao === 'exato' ? 'encontrado' : 'aproximado';
}

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
  const [destino, definirDestino] = useState<Coordenada | null>(null);
  const [etapaDoLocal, definirEtapaDoLocal] = useState<EtapaDoLocal>('pendente');
  const [tentativa, definirTentativa] = useState(0);
  const [enderecoEncontrado, definirEnderecoEncontrado] = useState<string | null>(null);
  // Uma busca antiga não pode sobrescrever o pino depois que o endereço mudou.
  const buscaAtual = useRef(0);

  function esquecerLocal() {
    buscaAtual.current += 1;
    definirDestino(null);
    definirEnderecoEncontrado(null);
    definirEtapaDoLocal('pendente');
  }

  async function localizar(): Promise<Coordenada | null> {
    const endereco = enderecoParaLocalizar(dadosDoFormulario);
    if (!endereco) return null;
    const busca = ++buscaAtual.current;
    definirEtapaDoLocal('localizando');
    try {
      const { coordenada, precisao, enderecoEncontrado: encontrado } = await localizarEndereco(endereco);
      if (busca !== buscaAtual.current) return null;
      definirDestino(coordenada);
      definirEnderecoEncontrado(coordenada ? encontrado : null);
      definirEtapaDoLocal(etapaDaBusca(coordenada !== null, precisao));
      definirTentativa((atual) => atual + 1);
      return coordenada;
    } catch {
      if (busca !== buscaAtual.current) return null;
      definirDestino(null);
      definirEnderecoEncontrado(null);
      definirEtapaDoLocal('falhou');
      definirTentativa((atual) => atual + 1);
      return null;
    }
  }

  function marcarDestino(ponto: Coordenada) {
    definirDestino(ponto);
    definirEtapaDoLocal('marcado');
  }

  function atualizarCampo<Campo extends keyof FormularioNovoPedido>(campo: Campo, valor: FormularioNovoPedido[Campo]) {
    definirDadosDoFormulario((atuais) => ({ ...atuais, [campo]: valor }));
    if (CAMPOS_DO_ENDERECO.has(campo)) esquecerLocal();
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
    if (!empresa) return;
    envioEmCurso.current = true;
    definirEnviando(true);
    let pedido: CriarPedidoResposta;
    try {
      const destinoDoPedido = destino ?? (await localizar());
      const resultado = await fluxoDeEnvio.current(dadosDoFormulario, empresa, destinoDoPedido);
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
    esquecerLocal();
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
    local: {
      etapa: etapaDoLocal,
      destino,
      tentativa,
      enderecoEncontrado,
      podeLocalizar: enderecoParaLocalizar(dadosDoFormulario) !== null,
      aoLocalizar: localizar,
      aoMarcar: marcarDestino,
    },
  };
}
