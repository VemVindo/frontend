import type { WebDriver } from 'selenium-webdriver';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { codigoDiferenteDe, gerarCnpj, gerarCpf, gerarSufixo, gerarSufixoDeLetras } from './apoio/dados';
import { criarPedidoComPino, definirOrigemDaEmpresa, preencherNovoPedido, RECUSA_SEM_PINO } from './apoio/fluxos';
import { emailDeTeste, PRODUCAO } from './apoio/ambiente';
import { abrirNavegador } from './apoio/navegador';
import {
  entrarNoAppDoEntregador,
  entrarNoPainel,
  irPeloMenu,
  sairDoAppDoEntregador,
  sairDoPainel,
} from './apoio/sessao';
import { Tela } from './apoio/tela';

const sufixo = gerarSufixo();
const sufixoDeLetras = gerarSufixoDeLetras();

const EMPRESA = {
  tipoDocumento: 'CNPJ' as const,
  documento: '',
  cnpj: gerarCnpj(),
  razaoSocial: `Restaurante Selenium ${sufixo} Ltda`,
  nomeFantasia: `Restaurante Selenium ${sufixo}`,
  email: emailDeTeste('restaurante', sufixo),
  telefone: '61933334444',
  telefoneEditado: '61955556666',
  cep: '70040010',
  logradouro: 'SBS Quadra 2',
  numero: '12',
  bairro: 'Asa Sul',
  cidade: 'Brasilia',
  uf: 'DF',
  senha: `Empresa@${sufixo}`,
};

const ENTREGADOR = {
  nome: `Diego Selenium ${sufixoDeLetras}`,
  cpf: gerarCpf(),
  telefone: '61977778888',
  telefoneEditado: '61977779999',
  veiculo: 'Moto',
  placa: 'SEL1E23',
  senha: `Entregador@${sufixo}`,
};

const PEDIDO = {
  recebedor: `Helena Selenium ${sufixoDeLetras}`,
  telefone: '(61) 99999-0000',
  cep: '70390-070',
  logradouro: 'SHCS 706 Bloco B',
  numero: '12',
  bairro: 'Asa Sul',
  cidade: 'Brasília',
  uf: 'DF',
  veiculo: 'Veículo motorizado',
  itens: 'Duas marmitas e um suco',
};

const PINO_DA_EMPRESA = { lat: -15.8016, lng: -47.8862 };
const PINO_DA_ENTREGA = { lat: -15.8139, lng: -47.9016 };

const AVALIACAO = {
  estrelas: '5 de 5 estrelas',
  comentario: `Entrega rápida e cuidadosa ${sufixo}`,
};

describe('Jornada da entrega: empresa, entregador e recebedor', () => {
  let navegador: WebDriver;
  let tela: Tela;
  let senhaTemporaria: string;
  let idDoPedido: string;
  let linkDeRastreio: string;
  let codigoDoRecebedor: string;
  let abaDoEntregador: string;
  let abaDoRecebedor: string;

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

  describe('a empresa se cadastra e prepara a operação', () => {
    it('aponta os campos inválidos do cadastro', async () => {
      await tela.abrir('/');
      await tela.clicarLink('Cadastrar meu estabelecimento');
      await tela.esperarTitulo('Cadastrar estabelecimento');
      await tela.clicarBotao('Cadastrar');
      await tela.esperarTexto('CNPJ inválido');
      await tela.esperarTexto('A razão social é obrigatória para CNPJ');
    });

    it('cadastra o estabelecimento e cai no dashboard', async () => {
      await tela.preencher('CNPJ', EMPRESA.cnpj);
      await tela.preencher('Razão social', EMPRESA.razaoSocial);
      await tela.preencher('Nome fantasia', EMPRESA.nomeFantasia);
      await tela.preencher('E-mail', EMPRESA.email);
      await tela.preencher('Telefone', EMPRESA.telefone);
      await tela.preencher('CEP', EMPRESA.cep);
      await tela.preencher('Logradouro', EMPRESA.logradouro);
      await tela.preencher('Número', EMPRESA.numero);
      await tela.preencher('Bairro', EMPRESA.bairro);
      await tela.preencher('Cidade', EMPRESA.cidade);
      await tela.escolherOpcao('UF', EMPRESA.uf);
      await tela.preencher('Senha', EMPRESA.senha);
      await tela.preencher('Confirme a senha', EMPRESA.senha);
      await tela.clicarBotao('Cadastrar');
      await tela.esperarCaminho('/painel');
      await tela.esperarTexto('Nenhum pedido pendente no momento.');
    });

    it('alterna o período do dashboard', async () => {
      await tela.clicarBotao('Hoje');
      expect(await (await tela.botao('Hoje')).getAttribute('aria-pressed')).toBe('true');
      await tela.clicarBotao('30 dias');
      expect(await (await tela.botao('30 dias')).getAttribute('aria-pressed')).toBe('true');
    });

    it('define os parâmetros de remuneração', async () => {
      await irPeloMenu(tela, 'Remuneração');
      await tela.esperarTexto('Nenhum parâmetro salvo ainda');
      await tela.clicarBotao('Salvar parâmetros');
      await tela.esperarTexto('Preencha este campo');
      await tela.preencher('Valor base por entrega', '8,00');
      await tela.preencher('Adicional por quilômetro', '1,50');
      await tela.clicarBotao('Salvar parâmetros');
      await tela.esperarTexto('Parâmetros salvos. Os novos valores valem para as próximas entregas.');
      await tela.esperarTexto('Valores em vigor desde');
    });

    it('edita os dados do estabelecimento', async () => {
      await irPeloMenu(tela, 'Empresa');
      await tela.esperarTexto(EMPRESA.razaoSocial);
      await tela.clicarBotao('Editar');
      await tela.preencher('Telefone', EMPRESA.telefoneEditado);
      await tela.clicarBotao('Salvar');
      await tela.esperarTexto('Dados atualizados.');
    });

    it('desliga e religa o mapa do link de rastreio', async () => {
      await irPeloMenu(tela, 'Configurações');
      const chave = 'Exibir o mapa ao recebedor';
      const estadoInicial = await (await tela.botao(chave)).getAttribute('aria-checked');
      await tela.clicarBotao(chave);
      await tela.esperarTexto('O recebedor passa a ver');
      expect(await (await tela.botao(chave)).getAttribute('aria-checked')).not.toBe(estadoInicial);
      await tela.clicarBotao(chave);
      await navegador.wait(
        async () => (await (await tela.botao(chave)).getAttribute('aria-checked')) === estadoInicial,
      );
    });

    it('recusa convite com CPF inválido', async () => {
      await irPeloMenu(tela, 'Frota');
      await tela.esperarTexto('Nenhum entregador na frota ainda.');
      await tela.clicarBotao('Convidar entregador que já usa o VemVindo');
      const convite = await tela.dialogo('Convidar entregador');
      await convite.preencher('CPF do entregador', '11111111111');
      await convite.clicarBotao('Enviar convite');
      await convite.esperarTexto('CPF inválido');
      await convite.clicarBotao('Fechar convidar entregador');
    });

    it('cadastra o entregador e recebe a senha temporária', async () => {
      await tela.clicarBotao('Cadastrar entregador');
      const cadastro = await tela.dialogo('Cadastrar entregador');
      await cadastro.preencher('Nome completo', ENTREGADOR.nome);
      await cadastro.preencher('CPF', ENTREGADOR.cpf);
      await cadastro.preencher('Telefone', ENTREGADOR.telefone);
      await cadastro.escolherOpcao('Tipo de veículo', ENTREGADOR.veiculo);
      await cadastro.preencher('Placa', ENTREGADOR.placa);
      await cadastro.clicarBotao('Cadastrar entregador');
      await cadastro.esperarTexto(`${ENTREGADOR.nome} foi cadastrado.`);
      senhaTemporaria = await cadastro.textoDe(
        `.//p[normalize-space()='Senha temporária']/following-sibling::p[1]`,
        'senha temporária gerada',
      );
      expect(senhaTemporaria).not.toBe('');
      await cadastro.clicarBotao('Fechar cadastrar entregador');
    });

    it.skipIf(PRODUCAO)('valida o novo pedido e recusa enviar sem o pino da entrega', async () => {
      await irPeloMenu(tela, 'Pedidos');
      await tela.esperarTexto('Nenhum pedido ativo no momento.');
      await tela.clicarBotao('+ Novo pedido');
      const vazio = await tela.dialogo('Novo pedido');
      await vazio.clicarBotao('Criar pedido');
      await vazio.esperarTexto('Informe o nome do recebedor.');
      await vazio.clicarBotao('Fechar novo pedido');
      await preencherNovoPedido(tela, PEDIDO);
      const preenchido = await tela.dialogo('Novo pedido');
      await preenchido.clicarBotao('Criar pedido');
      await preenchido.esperarTexto(RECUSA_SEM_PINO);
      await preenchido.clicarBotao('Fechar novo pedido');
    });

    it('cria o pedido com o pino da empresa e o da entrega', async () => {
      await definirOrigemDaEmpresa(tela, { ...EMPRESA, telefone: EMPRESA.telefoneEditado }, PINO_DA_EMPRESA);
      await criarPedidoComPino(tela, PEDIDO, PINO_DA_ENTREGA);
      await tela.esperarTexto('Não atribuído');
      await sairDoPainel(tela);
    });
  });

  describe('o entregador faz o primeiro acesso', () => {
    it('é levado a trocar a senha temporária', async () => {
      await entrarNoAppDoEntregador(tela, ENTREGADOR.cpf, senhaTemporaria);
      await tela.esperarCaminho('/login/entregador/trocar-senha');
      await tela.esperarTexto('Crie sua senha');
      await tela.esperarTexto('O que as empresas veem sobre você');
      await tela.esperarTexto(EMPRESA.nomeFantasia);
    });

    it('recusa confirmação de senha diferente', async () => {
      await tela.preencher('SENHA TEMPORÁRIA', senhaTemporaria);
      await tela.preencher('NOVA SENHA', ENTREGADOR.senha);
      await tela.preencher('CONFIRMAR NOVA SENHA', `${ENTREGADOR.senha}x`);
      await tela.marcarCaixa();
      await tela.clicarBotao('Salvar nova senha');
      await tela.esperarTexto('As senhas não conferem');
    });

    it('cria a própria senha e aceita o convite da empresa', async () => {
      await tela.preencher('CONFIRMAR NOVA SENHA', ENTREGADOR.senha);
      await tela.clicarBotao('Salvar nova senha');
      await tela.esperarCaminho('/entregador');
      await tela.esperarTexto('quer você na frota');
      await tela.clicarBotao('Aceitar');
      await tela.esperarTexto('Nenhum convite aguardando resposta.');
      await tela.botao('Sair da frota');
      await sairDoAppDoEntregador(tela);
    });
  });

  describe('a empresa despacha o pedido', () => {
    it('atribui o pedido ao entregador', async () => {
      await entrarNoPainel(tela, EMPRESA.email, EMPRESA.senha);
      await irPeloMenu(tela, 'Pedidos');
      await tela.esperarTexto(PEDIDO.recebedor);
      await tela.clicarBotao('Atribuir');
      const atribuicao = await tela.dialogo('Atribuir entregador');
      await atribuicao.esperarTexto(ENTREGADOR.nome);
      await atribuicao.clicarBotao('Atribuir');
      await tela.esperarTexto(`atribuído a ${ENTREGADOR.nome}.`);
    });

    it('vê o pedido em andamento no detalhe', async () => {
      await tela.clicarLink('Ver detalhes');
      await tela.esperarTexto('Detalhe da entrega');
      await tela.esperarTexto('Em andamento');
      await tela.esperarTexto('Saiu para entrega');
      await tela.esperarTexto(PEDIDO.itens);
      idDoPedido = (await tela.caminhoAtual()).split('/').pop() as string;
      expect(Number(idDoPedido)).toBeGreaterThan(0);
    });

    it('gera o link de rastreio com o código de recebimento', async () => {
      await tela.clicarBotao('Gerar link de rastreio');
      await tela.clicarBotao('Gerar link');
      linkDeRastreio = await tela.valorDoCampoComNome('Link de rastreio');
      codigoDoRecebedor = await tela.textoDe(
        `.//p[contains(normalize-space(), 'Código de recebimento')]/strong`,
        'código de recebimento',
      );
      expect(linkDeRastreio).toContain('/rastreio/');
      expect(codigoDoRecebedor).toMatch(/^\d{6}$/);
      await sairDoPainel(tela);
    });
  });

  describe('o entregador entrega e o recebedor acompanha', () => {
    it('o entregador abre a entrega em andamento', async () => {
      await entrarNoAppDoEntregador(tela, ENTREGADOR.cpf, ENTREGADOR.senha);
      await tela.clicarLinkQueContem(PEDIDO.recebedor);
      await tela.esperarTitulo(`Pedido #${idDoPedido}`);
      await tela.botao('Finalizar entrega');
      await tela.esperarTexto('Saiu para entrega');
      abaDoEntregador = await tela.abaAtual();
    });

    it('o recebedor acompanha pelo link sem login', async () => {
      abaDoRecebedor = await tela.abrirNovaAba(linkDeRastreio);
      await tela.esperarTexto('Seu pedido');
      await tela.esperarTexto(EMPRESA.nomeFantasia);
      await tela.esperarTexto('Em andamento');
      await tela.esperarTexto('Código de recebimento');
      await tela.esperarTexto(codigoDoRecebedor);
    });

    it('o código errado não finaliza a entrega', async () => {
      await tela.irParaAba(abaDoEntregador);
      await tela.clicarBotao('Finalizar entrega');
      await tela.preencher('Código do recebedor', codigoDiferenteDe(codigoDoRecebedor));
      await tela.clicarBotao('Finalizar');
      await tela.esperarTexto('Restam 4 tentativas');
    });

    it('o código certo finaliza a entrega', async () => {
      await tela.preencher('Código do recebedor', codigoDoRecebedor);
      await tela.clicarBotao('Finalizar');
      await tela.esperarTexto('Finalizado em');
      await tela.clicarLink('Voltar para as entregas');
      await tela.esperarTexto('Nenhuma entrega em aberto no momento.');
    });

    it('o entregador vê o resumo do dia na empresa', async () => {
      await tela.clicarLinkQueContem(EMPRESA.nomeFantasia);
      await tela.esperarTexto('Resumo diário');
      await tela.esperarTexto('Entregas realizadas');
      await tela.esperarTexto(PEDIDO.recebedor);
    });

    it('o entregador corrige o próprio telefone em Meu cadastro', async () => {
      await tela.clicarLink('Meu cadastro');
      await tela.esperarTitulo('Meu cadastro');
      expect(await tela.valorDoCampo('Nome completo')).toBe(ENTREGADOR.nome);
      await tela.preencher('Telefone', ENTREGADOR.telefoneEditado);
      await tela.clicarBotao('Salvar alterações');
      await tela.esperarTexto('Cadastro atualizado.');
      await tela.abrir('/entregador/perfil');
      await navegador.wait(async () => (await tela.valorDoCampo('Telefone')) === ENTREGADOR.telefoneEditado);
      await sairDoAppDoEntregador(tela);
    });

    it('o recebedor é avisado da entrega e avalia', async () => {
      await tela.irParaAba(abaDoRecebedor);
      await tela.esperarTexto('Pedido entregue!');
      await tela.clicarBotao(AVALIACAO.estrelas);
      await tela.esperarTexto('Excelente!');
      await tela.preencher('Quer contar mais alguma coisa? (opcional)', AVALIACAO.comentario);
      await tela.clicarBotao('Enviar avaliação');
      await tela.esperarTexto('Avaliação enviada!');
      await tela.fecharAbaAtualEVoltarPara(abaDoEntregador);
    });
  });

  describe('a empresa confere o resultado', () => {
    it('vê a entrega concluída e a avaliação no dashboard', async () => {
      await entrarNoPainel(tela, EMPRESA.email, EMPRESA.senha);
      await tela.esperarTexto('1 entrega concluída em 7 dias');
      await tela.esperarTexto(AVALIACAO.comentario);
    });

    it('filtra as avaliações por nota', async () => {
      await irPeloMenu(tela, 'Avaliações');
      await tela.esperarTexto(AVALIACAO.comentario);
      await tela.clicarBotao('Nota 1');
      await tela.esperarTexto('Nenhuma avaliação encontrada com esses filtros.');
      await tela.clicarBotao('Todas');
      await tela.esperarTexto(AVALIACAO.comentario);
    });

    it('encontra o pedido entre os finalizados', async () => {
      await irPeloMenu(tela, 'Pedidos');
      await tela.esperarTexto('Nenhum pedido ativo no momento.');
      await tela.clicarBotao('Finalizados');
      await tela.esperarTitulo('Pedidos finalizados');
      await tela.esperarTexto(PEDIDO.recebedor);
      await tela.esperarTexto('5 de 5');
    });

    it('vê o desempenho do entregador, sem poder editar os dados dele', async () => {
      await irPeloMenu(tela, 'Frota');
      await tela.esperarTexto(ENTREGADOR.nome);
      await tela.esperarTexto('1 entrega');
      await tela.clicarBotao(`Ações de ${ENTREGADOR.nome}`);
      await tela.botao('Remover entregador');
      expect(await tela.temTexto('Editar dados')).toBe(false);
    });

    it('remove o entregador da frota', async () => {
      await tela.clicarBotao('Remover entregador');
      const remocao = await tela.dialogo('Remover entregador');
      await remocao.clicarBotao('Remover entregador');
      await tela.esperarTexto('Nenhum entregador na frota ainda.');
      await sairDoPainel(tela);
    });
  });
});
