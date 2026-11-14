import type { WebDriver } from 'selenium-webdriver';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';
import { abrirNavegador } from './apoio/navegador';
import { prepararPersonas, type Personas } from './apoio/personas';
import {
  entrarComoEmpresa,
  entrarComoEntregador,
  irPeloMenu,
  sairDoAppDoEntregador,
  sairDoPainel,
} from './apoio/sessao';
import { Tela } from './apoio/tela';

const TELAS_DO_MENU = [
  { item: 'Pedidos', titulo: 'Pedidos ativos' },
  { item: 'Frota', titulo: 'Frota' },
  { item: 'Remuneração', titulo: 'Remuneração' },
  { item: 'Avaliações', titulo: 'Avaliações' },
  { item: 'Empresa', titulo: 'Empresa' },
  { item: 'Configurações', titulo: 'Configurações' },
];

describe('Autenticação e navegação', () => {
  let navegador: WebDriver;
  let tela: Tela;
  let personas: Personas;

  beforeAll(async () => {
    personas = await prepararPersonas();
    navegador = await abrirNavegador();
    tela = new Tela(navegador);
  });

  afterEach(async ({ task }) => {
    if (task.result?.state === 'fail') await tela.guardarEvidencia(task.name);
  });

  afterAll(async () => {
    await navegador?.quit();
  });

  it('recusa a empresa com senha errada', async () => {
    await entrarComoEmpresa(tela, personas.empresa.email, 'SenhaErrada@1');
    await tela.esperarTexto('Senha incorreta ou conta inexistente');
  });

  it('leva a empresa ao dashboard depois do login', async () => {
    await entrarComoEmpresa(tela, personas.empresa.email, personas.empresa.senha);
    await tela.esperarCaminho('/painel');
    await tela.esperarTexto('Visão geral do estabelecimento');
    await tela.esperarTexto('Pedidos pendentes');
  });

  it.each(TELAS_DO_MENU)('abre a tela $item pelo menu', async ({ item, titulo }) => {
    await irPeloMenu(tela, item);
    await tela.esperarTitulo(titulo);
  });

  it('encerra a sessão da empresa e protege o painel', async () => {
    await sairDoPainel(tela);
    await tela.abrir('/painel');
    await tela.esperarCaminho('/');
    await tela.esperarTexto('Entrar na sua conta');
  });

  it('troca entre o login da empresa e o do entregador', async () => {
    await tela.abrir('/');
    await tela.clicarLink('Sou entregador');
    await tela.esperarCaminho('/login/entregador');
    await tela.esperarTexto('Entrar como entregador');
  });

  it('recusa CPF inválido antes de consultar a API', async () => {
    await entrarComoEntregador(tela, '11111111111', personas.entregador.senha);
    await tela.esperarTexto('CPF inválido. Confira os 11 dígitos');
  });

  it('recusa o entregador com senha errada', async () => {
    await entrarComoEntregador(tela, personas.entregador.cpf, 'SenhaErrada@1');
    await tela.esperarTexto('CPF ou senha incorretos');
  });

  it('leva o entregador às suas entregas depois do login', async () => {
    await entrarComoEntregador(tela, personas.entregador.cpf, personas.entregador.senha);
    await tela.esperarCaminho('/entregador');
    await tela.esperarTexto('Entregas em aberto');
    await tela.esperarTexto('O que as empresas veem sobre você');
    await sairDoAppDoEntregador(tela);
  });

  it('avisa quando o link de rastreio não existe', async () => {
    await tela.abrir('/rastreio/link-que-nao-existe');
    await tela.esperarTexto('Link de rastreio inválido');
  });
});
