import type { WebDriver } from 'selenium-webdriver';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { codigoDiferenteDe, gerarCnpj, gerarCpf, gerarSufixo, gerarSufixoDeLetras } from './apoio/dados';
import {
  cadastrarEmpresa,
  conferirMapaDaEntrega,
  conferirLinkExterno,
  criarPedidoPelaTela,
  marcarPinoDaEmpresa,
  definirRemuneracao,
  fazerPrimeiroAcesso,
  lerSenhaTemporaria,
  preencherCadastroDoEntregador,
  type EmpresaDeTeste,
  type EntregadorDeTeste,
  type PedidoDeTeste,
} from './apoio/fluxos';
import { emailDeTeste, ENDERECO_DO_BANCO, JANELA, NAVEGADOR, PRODUCAO } from './apoio/ambiente';
import { renovarSenhaTemporaria, vencerSenhaTemporaria } from './apoio/banco';
import { abrirNavegador } from './apoio/navegador';
import {
  entrarComoEntregador,
  entrarNoAppDoEntregador,
  entrarNoPainel,
  irPeloMenu,
  sairDoAppDoEntregador,
  sairDoPainel,
} from './apoio/sessao';
import { Tela } from './apoio/tela';

const sufixo = gerarSufixo();
const sufixoDeLetras = gerarSufixoDeLetras();

const ENDERECO_DA_ENTREGA = {
  cep: '70390070',
  logradouro: 'SHCS 706 Bloco B',
  numero: '12',
  bairro: 'Asa Sul',
  cidade: 'Brasilia',
  uf: 'DF',
};

const ENDERECO_DAS_EMPRESAS = {
  cep: '70040010',
  logradouro: 'SBS Quadra 2',
  numero: '12',
  bairro: 'Asa Sul',
  cidade: 'Brasilia',
  uf: 'DF',
};

const PRODUTORA: EmpresaDeTeste = {
  ...ENDERECO_DAS_EMPRESAS,
  tipoDocumento: 'CPF',
  documento: gerarCpf(),
  nomeFantasia: `Horta Selenium ${sufixo}`,
  email: emailDeTeste('horta', sufixo),
  telefone: '61933330001',
  senha: `Produtora@${sufixo}`,
};

const CONCORRENTE: EmpresaDeTeste = {
  ...ENDERECO_DAS_EMPRESAS,
  tipoDocumento: 'CNPJ',
  documento: gerarCnpj(),
  razaoSocial: `Mercado Selenium ${sufixo} Ltda`,
  nomeFantasia: `Mercado Selenium ${sufixo}`,
  email: emailDeTeste('mercado', sufixo),
  telefone: '61933330002',
  senha: `Concorrente@${sufixo}`,
};

const PRIMEIRA_ENTREGADORA: EntregadorDeTeste = {
  nome: `Bianca Selenium ${sufixoDeLetras}`,
  cpf: gerarCpf(),
  telefone: '61977770001',
  veiculo: 'Bicicleta',
  senha: `Bianca@${sufixo}`,
};

const SEGUNDO_ENTREGADOR: EntregadorDeTeste = {
  nome: `Caio Selenium ${sufixoDeLetras}`,
  cpf: gerarCpf(),
  telefone: '61977770002',
  veiculo: 'Carro',
  placa: 'SEL2E34',
  senha: `Caio@${sufixo}`,
};

const PEDIDO: PedidoDeTeste = {
  ...ENDERECO_DA_ENTREGA,
  cep: '70390-070',
  recebedor: `Otavio Selenium ${sufixoDeLetras}`,
  telefone: '(61) 98888-0000',
  veiculo: 'Bicicleta',
  itens: 'Cesta de verduras',
};

const PINO_DA_PRODUTORA = { lat: -15.8059, lng: -47.8935 };
const PINO_DA_ENTREGA = { lat: -15.8139, lng: -47.9016 };
const TENTATIVAS_ATE_O_BLOQUEIO = 5;
const DATA_POSTERIOR = '10102030';
const DATA_ANTERIOR = '05052020';
const PERIODO_INVERTIDO = 'A data final precisa ser depois da inicial.';
const JANELA_DE_CELULAR = { largura: 420, altura: 860 };
const AVISO_DO_LIMITE_DE_LOGIN = 'Não foi possível entrar agora';
const ESPERA_DO_LIMITE_DE_LOGIN_MS = 20_000;
const POSICAO_SIMULADA = { latitude: -15.8135, longitude: -47.9046 };

describe('Caminhos alternativos', () => {
  let navegador: WebDriver;
  let tela: Tela;
  let senhaTemporariaDaPrimeira: string;
  let senhaTemporariaDoSegundo: string;
  let primeiroLink: string;
  let codigoDoRecebedor: string;

  beforeAll(async () => {
    navegador = await abrirNavegador();
    tela = new Tela(navegador);
  });

  afterEach(async ({ task }) => {
    if (task.result?.state === 'fail') await tela.guardarEvidencia(task.name);
  });

  afterAll(async () => {
    await navegador?.quit();
  });

  describe('uma produtora com CPF monta a frota', () => {
    it('cadastra o estabelecimento com CPF, sem razão social', async () => {
      await cadastrarEmpresa(tela, PRODUTORA);
      await definirRemuneracao(tela, '6,00', '2,00');
      await irPeloMenu(tela, 'Empresa');
      await tela.esperarTexto(PRODUTORA.nomeFantasia);
      expect(await tela.temTexto('Razão social')).toBe(false);
    });

    it('cadastra dois entregadores em sequência', async () => {
      await irPeloMenu(tela, 'Frota');
      await tela.clicarBotao('Cadastrar entregador');
      await preencherCadastroDoEntregador(tela, PRIMEIRA_ENTREGADORA);
      senhaTemporariaDaPrimeira = await lerSenhaTemporaria(tela, PRIMEIRA_ENTREGADORA);
      await tela.clicarBotao('Cadastrar outro entregador');
      await preencherCadastroDoEntregador(tela, SEGUNDO_ENTREGADOR);
      senhaTemporariaDoSegundo = await lerSenhaTemporaria(tela, SEGUNDO_ENTREGADOR);
      expect(senhaTemporariaDoSegundo).not.toBe(senhaTemporariaDaPrimeira);
      await tela.clicarBotao('Fechar cadastrar entregador');
    });

    it('cria o pedido que será disputado', async () => {
      await marcarPinoDaEmpresa(tela, PRODUTORA, PINO_DA_PRODUTORA);
      await criarPedidoPelaTela(tela, PEDIDO, PINO_DA_ENTREGA);
      await sairDoPainel(tela);
    });
  });

  describe('outra empresa tenta cadastrar a mesma entregadora', () => {
    it('recebe a oferta de convidar o CPF já cadastrado', async () => {
      await cadastrarEmpresa(tela, CONCORRENTE);
      await irPeloMenu(tela, 'Frota');
      await tela.clicarBotao('Cadastrar entregador');
      await preencherCadastroDoEntregador(tela, PRIMEIRA_ENTREGADORA);
      await tela.clicarBotao('Convidar este CPF');
    });

    it('envia o convite com o CPF já preenchido', async () => {
      const convite = await tela.dialogo('Convidar entregador');
      expect(await convite.valorDoCampo('CPF do entregador')).toBe(PRIMEIRA_ENTREGADORA.cpf);
      await convite.clicarBotao('Enviar convite');
      await navegador.wait(async () => (await convite.valorDoCampo('CPF do entregador')) === '');
      await convite.clicarBotao('Fechar convidar entregador');
      await sairDoPainel(tela);
    });
  });

  describe.skipIf(!ENDERECO_DO_BANCO)('senha temporária vencida', () => {
    it('recusa entrar com a senha temporária depois do prazo', async () => {
      await vencerSenhaTemporaria(SEGUNDO_ENTREGADOR.cpf);
      try {
        let alerta = AVISO_DO_LIMITE_DE_LOGIN;
        while (alerta.includes(AVISO_DO_LIMITE_DE_LOGIN)) {
          await entrarComoEntregador(tela, SEGUNDO_ENTREGADOR.cpf, senhaTemporariaDoSegundo);
          alerta = await tela.esperarAlerta();
          if (alerta.includes(AVISO_DO_LIMITE_DE_LOGIN)) await tela.aguardar(ESPERA_DO_LIMITE_DE_LOGIN_MS);
        }
        expect(await tela.caminhoAtual()).toBe('/login/entregador');
      } finally {
        await renovarSenhaTemporaria(SEGUNDO_ENTREGADOR.cpf);
      }
    });
  });

  describe('os entregadores respondem aos convites', () => {
    it('a primeira recusa a concorrente e aceita a produtora', async () => {
      await fazerPrimeiroAcesso(tela, PRIMEIRA_ENTREGADORA, senhaTemporariaDaPrimeira);
      await (await tela.item(CONCORRENTE.nomeFantasia)).clicarBotao('Recusar');
      await tela.esperarSumir(CONCORRENTE.nomeFantasia);
      await (await tela.item(PRODUTORA.nomeFantasia)).clicarBotao('Aceitar');
      await tela.esperarTexto('Nenhum convite aguardando resposta.');
      await tela.botao('Sair da frota');
      await sairDoAppDoEntregador(tela);
    });

    it('o segundo aceita e desiste de sair da frota', async () => {
      await fazerPrimeiroAcesso(tela, SEGUNDO_ENTREGADOR, senhaTemporariaDoSegundo);
      await tela.clicarBotao('Aceitar');
      await tela.clicarBotao('Sair da frota');
      await tela.esperarTexto('Sair da frota?');
      await tela.clicarBotao('Cancelar');
      await tela.botao('Sair da frota');
      await sairDoAppDoEntregador(tela);
    });
  });

  describe('a produtora troca o entregador do pedido', () => {
    it('atribui à primeira entregadora', async () => {
      await entrarNoPainel(tela, PRODUTORA.email, PRODUTORA.senha);
      await irPeloMenu(tela, 'Pedidos');
      await tela.clicarBotao('Atribuir');
      const atribuicao = await tela.dialogo('Atribuir entregador');
      await (await atribuicao.item(PRIMEIRA_ENTREGADORA.nome)).clicarBotao('Atribuir');
      await tela.esperarTexto(`atribuído a ${PRIMEIRA_ENTREGADORA.nome}.`);
    });

    it('reatribui ao segundo, o único disponível', async () => {
      await tela.clicarBotao('Reatribuir');
      const reatribuicao = await tela.dialogo('Reatribuir entregador');
      await reatribuicao.esperarTexto(SEGUNDO_ENTREGADOR.nome);
      expect(await reatribuicao.temTexto(PRIMEIRA_ENTREGADORA.nome)).toBe(false);
      await reatribuicao.clicarBotao('Reatribuir');
      await tela.esperarTexto(`reatribuído a ${SEGUNDO_ENTREGADOR.nome}.`);
    });

    it('mostra a troca no histórico e as conversas de WhatsApp', async () => {
      await tela.clicarLink('Ver detalhes');
      await tela.esperarTexto('Histórico de entregadores');
      await tela.esperarTexto(`Atribuído a ${PRIMEIRA_ENTREGADORA.nome}`);
      await tela.esperarTexto(`${PRIMEIRA_ENTREGADORA.nome} para ${SEGUNDO_ENTREGADOR.nome}`);
      await conferirLinkExterno(
        tela,
        `Conversar com ${SEGUNDO_ENTREGADOR.nome}`,
        `https://wa.me/55${SEGUNDO_ENTREGADOR.telefone}?`,
      );
      await conferirLinkExterno(
        tela,
        `Conversar com ${PEDIDO.recebedor}`,
        `https://wa.me/55${PEDIDO.telefone.replace(/\D/g, '')}?`,
      );
    });

    it('gerar outro link derruba o anterior', async () => {
      await tela.clicarBotao('Gerar link de rastreio');
      await tela.clicarBotao('Cancelar');
      await tela.clicarBotao('Gerar link de rastreio');
      await tela.clicarBotao('Gerar link');
      primeiroLink = await tela.valorDoCampoComNome('Link de rastreio');
      await tela.clicarBotao('Gerar outro link');
      await tela.clicarBotao('Gerar link');
      await navegador.wait(async () => (await tela.valorDoCampoComNome('Link de rastreio')) !== primeiroLink);
      codigoDoRecebedor = await tela.textoDe(
        `.//p[contains(normalize-space(), 'Código de recebimento')]/strong`,
        'código de recebimento',
      );
      const abaDoPainel = await tela.abaAtual();
      await tela.abrirNovaAba(primeiroLink);
      await tela.esperarTexto('Link de rastreio inválido');
      await tela.fecharAbaAtualEVoltarPara(abaDoPainel);
    });

    it('recusa período invertido nos filtros de data', async () => {
      await irPeloMenu(tela, 'Pedidos');
      await tela.clicarBotao('Finalizados');
      await tela.preencher('Concluído de', DATA_POSTERIOR);
      await tela.preencher('Até', DATA_ANTERIOR);
      await tela.esperarTexto(PERIODO_INVERTIDO);
      await irPeloMenu(tela, 'Avaliações');
      await tela.preencher('De', DATA_POSTERIOR);
      await tela.preencher('Até', DATA_ANTERIOR);
      await tela.esperarTexto(PERIODO_INVERTIDO);
    });

    it('navega pelo menu lateral na largura de celular', async () => {
      await tela.redimensionar(JANELA_DE_CELULAR.largura, JANELA_DE_CELULAR.altura);
      await tela.clicarBotao('Abrir menu');
      await tela.clicarLink('Frota');
      await tela.esperarTitulo('Frota');
      await tela.esperarTexto(SEGUNDO_ENTREGADOR.nome);
      await tela.clicarBotao('Abrir menu');
      await sairDoPainel(tela);
      await tela.redimensionar(JANELA.largura, JANELA.altura);
    });
  });

  describe('o segundo entregador na rua', () => {
    it('abre a entrega em andamento', async () => {
      await entrarNoAppDoEntregador(tela, SEGUNDO_ENTREGADOR.cpf, SEGUNDO_ENTREGADOR.senha);
      await tela.clicarLinkQueContem(PEDIDO.recebedor);
      await tela.esperarTexto('Localização não compartilhada');
    });

    it.skipIf(NAVEGADOR !== 'chrome')('compartilha e para de compartilhar a localização', async () => {
      await tela.simularLocalizacao(POSICAO_SIMULADA.latitude, POSICAO_SIMULADA.longitude);
      await tela.clicarBotao('Compartilhar localização');
      await tela.esperarTexto('Compartilhando a localização com o recebedor');
      await conferirMapaDaEntrega(tela, { origem: PRODUTORA.nomeFantasia, destino: 'Otavio', entregador: true });
      await tela.clicarBotao('Parar de compartilhar');
      await tela.esperarTexto('Localização não compartilhada');
    });

    it('tem atalhos para o Google Maps e para o WhatsApp do estabelecimento', async () => {
      await conferirLinkExterno(tela, 'Abrir no Google Maps', 'https://www.google.com/maps/dir/?api=1&');
      expect((await tela.atributosDoLinkQueContem('Abrir no Google Maps')).href).toContain('&destination=');
      await conferirLinkExterno(
        tela,
        `Conversar com ${PRODUTORA.nomeFantasia}`,
        `https://wa.me/55${PRODUTORA.telefone}?`,
      );
    });

    it('fica bloqueado depois de errar o código cinco vezes', async () => {
      const codigoErrado = codigoDiferenteDe(codigoDoRecebedor);
      await tela.clicarBotao('Finalizar entrega');
      for (let tentativa = 1; tentativa < TENTATIVAS_ATE_O_BLOQUEIO; tentativa++) {
        await tela.preencher('Código do recebedor', codigoErrado);
        await tela.clicarBotao('Finalizar');
        await tela.esperarTexto(`${TENTATIVAS_ATE_O_BLOQUEIO - tentativa} tentativa`);
      }
      await tela.preencher('Código do recebedor', codigoErrado);
      await tela.clicarBotao('Finalizar');
      await tela.esperarTexto('As tentativas acabaram, espere alguns minutos');
    });

    it('nem o código certo passa durante o bloqueio', async () => {
      await tela.preencher('Código do recebedor', codigoDoRecebedor);
      await tela.clicarBotao('Finalizar');
      await tela.esperarTexto('Libera às');
      await sairDoAppDoEntregador(tela);
    });
  });

  describe('a primeira entregadora deixa a frota', () => {
    it('confirma a saída e fica sem empresas', async () => {
      await entrarNoAppDoEntregador(tela, PRIMEIRA_ENTREGADORA.cpf, PRIMEIRA_ENTREGADORA.senha);
      await tela.clicarBotao('Sair da frota');
      await tela.clicarBotao('Confirmar saída');
      await tela.esperarTexto('Você ainda não faz parte de nenhuma frota.');
      await sairDoAppDoEntregador(tela);
    });
  });

  // A vitrine é página de desenvolvimento; em produção o roteiro não a abre.
  describe.skipIf(PRODUCAO)('vitrine do design system', () => {
    it('mostra os componentes base', async () => {
      await tela.abrir('/design-system');
      await tela.esperarTitulo('Componentes base');
      await tela.esperarTexto('Tipografia');
    });
  });
});
