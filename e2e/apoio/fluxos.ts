import { entrarNoAppDoEntregador, irPeloMenu } from './sessao';
import type { Tela } from './tela';

export interface EnderecoDeTeste {
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface EmpresaDeTeste extends EnderecoDeTeste {
  tipoDocumento: 'CNPJ' | 'CPF';
  documento: string;
  razaoSocial?: string;
  nomeFantasia: string;
  email: string;
  telefone: string;
  senha: string;
}

export interface EntregadorDeTeste {
  nome: string;
  cpf: string;
  telefone: string;
  veiculo: string;
  placa?: string;
  senha: string;
}

export interface PedidoDeTeste extends EnderecoDeTeste {
  recebedor: string;
  telefone: string;
  veiculo: string;
  itens: string;
}

export interface Coordenada {
  lat: number;
  lng: number;
}

const SUCESSO_HTTP = [200, 201];
const MODO_DE_VIAGEM: Record<string, string> = { 'Veículo motorizado': 'DRIVE', Bicicleta: 'BICYCLE' };
export const RECUSA_SEM_PINO = 'Não foi possível localizar o endereço da entrega';

async function exigirSucesso(status: number, acao: string): Promise<void> {
  if (!SUCESSO_HTTP.includes(status)) throw new Error(`${acao} respondeu HTTP ${status}`);
}

const OPCAO_DO_DOCUMENTO = { CNPJ: 'CNPJ (empresa)', CPF: 'CPF (produtor)' };

export async function cadastrarEmpresa(tela: Tela, empresa: EmpresaDeTeste): Promise<void> {
  await tela.abrir('/cadastro');
  await tela.clicarRotulo(OPCAO_DO_DOCUMENTO[empresa.tipoDocumento]);
  await tela.preencher(empresa.tipoDocumento, empresa.documento);
  if (empresa.razaoSocial) await tela.preencher('Razão social', empresa.razaoSocial);
  await tela.preencher('Nome fantasia', empresa.nomeFantasia);
  await tela.preencher('E-mail', empresa.email);
  await tela.preencher('Telefone', empresa.telefone);
  await tela.preencher('CEP', empresa.cep);
  await tela.preencher('Logradouro', empresa.logradouro);
  await tela.preencher('Número', empresa.numero);
  await tela.preencher('Bairro', empresa.bairro);
  await tela.preencher('Cidade', empresa.cidade);
  await tela.escolherOpcao('UF', empresa.uf);
  await tela.preencher('Senha', empresa.senha);
  await tela.preencher('Confirme a senha', empresa.senha);
  await tela.clicarBotao('Cadastrar');
  await tela.esperarCaminho('/painel');
}

export async function definirRemuneracao(tela: Tela, valorBase: string, adicionalPorKm: string): Promise<void> {
  await irPeloMenu(tela, 'Remuneração');
  await tela.preencher('Valor base por entrega', valorBase);
  await tela.preencher('Adicional por quilômetro', adicionalPorKm);
  await tela.clicarBotao('Salvar parâmetros');
  await tela.esperarTexto('Parâmetros salvos.');
}

export async function preencherCadastroDoEntregador(tela: Tela, entregador: EntregadorDeTeste): Promise<void> {
  const cadastro = await tela.dialogo('Cadastrar entregador');
  await cadastro.preencher('Nome completo', entregador.nome);
  await cadastro.preencher('CPF', entregador.cpf);
  await cadastro.preencher('Telefone', entregador.telefone);
  await cadastro.escolherOpcao('Tipo de veículo', entregador.veiculo);
  if (entregador.placa) await cadastro.preencher('Placa', entregador.placa);
  await cadastro.clicarBotao('Cadastrar entregador');
}

export async function lerSenhaTemporaria(tela: Tela, entregador: EntregadorDeTeste): Promise<string> {
  const cadastro = await tela.dialogo('Cadastrar entregador');
  await cadastro.esperarTexto(`${entregador.nome} foi cadastrado.`);
  return cadastro.textoDe(
    `.//p[normalize-space()='Senha temporária']/following-sibling::p[1]`,
    'senha temporária gerada',
  );
}

export async function definirOrigemDaEmpresa(tela: Tela, empresa: EmpresaDeTeste, origem: Coordenada): Promise<void> {
  const status = await tela.chamarApiComSessao('PUT', '/empresa/cadastro', {
    nomeFantasia: empresa.nomeFantasia,
    email: empresa.email,
    telefone: empresa.telefone,
    cep: empresa.cep,
    logradouro: empresa.logradouro,
    numero: Number(empresa.numero),
    bairro: empresa.bairro,
    cidade: empresa.cidade,
    uf: empresa.uf,
    origemLat: origem.lat,
    origemLng: origem.lng,
  });
  await exigirSucesso(status, 'Definir o pino da empresa');
}

export async function preencherNovoPedido(tela: Tela, pedido: PedidoDeTeste): Promise<void> {
  await irPeloMenu(tela, 'Pedidos');
  await tela.clicarBotao('+ Novo pedido');
  const novoPedido = await tela.dialogo('Novo pedido');
  await novoPedido.preencher('Nome do recebedor', pedido.recebedor);
  await novoPedido.preencher('Telefone', pedido.telefone);
  await novoPedido.preencher('CEP', pedido.cep);
  await novoPedido.preencher('Logradouro', pedido.logradouro);
  await novoPedido.preencher('Número', pedido.numero);
  await novoPedido.preencher('Bairro', pedido.bairro);
  await novoPedido.preencher('Cidade', pedido.cidade);
  await novoPedido.escolherOpcao('UF', pedido.uf);
  await novoPedido.escolherOpcao('Tipo de veículo', pedido.veiculo);
  await novoPedido.preencher('Itens do pedido (opcional)', pedido.itens);
}

export async function criarPedidoComPino(tela: Tela, pedido: PedidoDeTeste, destino: Coordenada): Promise<void> {
  const status = await tela.chamarApiComSessao('POST', '/pedidos', {
    nome_recebedor: pedido.recebedor,
    telefone_recebedor: pedido.telefone.replace(/\D/g, ''),
    cep: pedido.cep.replace(/\D/g, ''),
    logradouro: pedido.logradouro,
    numero: Number(pedido.numero),
    bairro: pedido.bairro,
    cidade: pedido.cidade,
    uf: pedido.uf,
    descricao: `Itens: ${pedido.itens}`,
    tipo_veiculo: MODO_DE_VIAGEM[pedido.veiculo],
    destino_lat: destino.lat,
    destino_lng: destino.lng,
  });
  await exigirSucesso(status, 'Criar o pedido com o pino');
  await tela.abrir('/painel/pedidos');
  await tela.esperarTexto(pedido.recebedor);
}

export async function fazerPrimeiroAcesso(
  tela: Tela,
  entregador: EntregadorDeTeste,
  senhaTemporaria: string,
): Promise<void> {
  await entrarNoAppDoEntregador(tela, entregador.cpf, senhaTemporaria);
  await tela.esperarCaminho('/login/entregador/trocar-senha');
  await tela.preencher('SENHA TEMPORÁRIA', senhaTemporaria);
  await tela.preencher('NOVA SENHA', entregador.senha);
  await tela.preencher('CONFIRMAR NOVA SENHA', entregador.senha);
  await tela.marcarCaixa();
  await tela.clicarBotao('Salvar nova senha');
  await tela.esperarCaminho('/entregador');
}
