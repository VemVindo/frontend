import { mkdir, writeFile } from 'node:fs/promises';
import { By, Key, type WebDriver, type WebElement } from 'selenium-webdriver';
import { Select } from 'selenium-webdriver/lib/select';
import { ESPERA_MAXIMA_MS, PAUSA_ENTRE_ACOES_MS, URL_DA_API, URL_DO_FRONT } from './ambiente';

const PASTA_DE_EVIDENCIAS = 'reports/e2e';

type RaizDaBusca = WebDriver | WebElement;

function literalXpath(texto: string): string {
  if (!texto.includes("'")) return `'${texto}'`;
  const partes = texto.split("'").map((parte) => `'${parte}'`);
  return `concat(${partes.join(`, "'", `)})`;
}

function xpathDoTexto(texto: string): string {
  const contemTexto = `contains(normalize-space(.), ${literalXpath(texto)})`;
  return `.//*[not(self::script) and not(self::style)][${contemTexto} and not(.//*[${contemTexto}])]`;
}

function pausar(milissegundos: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, milissegundos));
}

export class Regiao {
  constructor(
    protected readonly navegador: WebDriver,
    private readonly raiz: RaizDaBusca,
  ) {}

  private async visiveis(xpath: string): Promise<WebElement[]> {
    const encontrados = await this.raiz.findElements(By.xpath(xpath));
    const visibilidade = await Promise.all(encontrados.map((elemento) => elemento.isDisplayed().catch(() => false)));
    return encontrados.filter((_, indice) => visibilidade[indice]);
  }

  protected async esperarVisivel(xpath: string, descricao: string): Promise<WebElement> {
    let primeiro: WebElement | undefined;
    await this.navegador.wait(
      async () => {
        [primeiro] = await this.visiveis(xpath);
        return primeiro !== undefined;
      },
      ESPERA_MAXIMA_MS,
      `Não apareceu na tela: ${descricao}`,
    );
    return primeiro as WebElement;
  }

  private async clicar(elemento: WebElement): Promise<void> {
    await this.navegador.executeScript('arguments[0].scrollIntoView({ block: "center" })', elemento);
    await this.navegador.wait(() => elemento.isEnabled(), ESPERA_MAXIMA_MS, 'O elemento continuou desabilitado');
    await pausar(PAUSA_ENTRE_ACOES_MS);
    await elemento.click();
  }

  async campo(rotulo: string): Promise<WebElement> {
    const etiqueta = await this.esperarVisivel(
      `.//label[normalize-space()=${literalXpath(rotulo)}]`,
      `campo "${rotulo}"`,
    );
    const idDoCampo = (await etiqueta.getAttribute('for')) ?? '';
    return this.navegador.findElement(By.id(idDoCampo));
  }

  async valorDoCampo(rotulo: string): Promise<string> {
    return (await (await this.campo(rotulo)).getAttribute('value')) ?? '';
  }

  async valorDoCampoComNome(nome: string): Promise<string> {
    const campo = await this.esperarVisivel(`.//input[@aria-label=${literalXpath(nome)}]`, `campo "${nome}"`);
    return (await campo.getAttribute('value')) ?? '';
  }

  async preencher(rotulo: string, valor: string): Promise<void> {
    const campo = await this.campo(rotulo);
    await this.clicar(campo);
    const valorAtual = (await campo.getAttribute('value')) ?? '';
    await campo.sendKeys(Key.END, ...Array.from(valorAtual, () => Key.BACK_SPACE), valor);
  }

  async escolherOpcao(rotulo: string, opcao: string): Promise<void> {
    const campo = await this.campo(rotulo);
    await pausar(PAUSA_ENTRE_ACOES_MS);
    await new Select(campo).selectByVisibleText(opcao);
  }

  async botao(nome: string): Promise<WebElement> {
    const nomeNoXpath = literalXpath(nome);
    return this.esperarVisivel(
      `.//button[normalize-space()=${nomeNoXpath} or @aria-label=${nomeNoXpath}]`,
      `botão "${nome}"`,
    );
  }

  async clicarBotao(nome: string): Promise<void> {
    await this.clicar(await this.botao(nome));
  }

  async clicarLink(nome: string): Promise<void> {
    const nomeNoXpath = literalXpath(nome);
    const link = await this.esperarVisivel(
      `.//a[normalize-space()=${nomeNoXpath} or @aria-label=${nomeNoXpath}]`,
      `link "${nome}"`,
    );
    await this.clicar(link);
  }

  async clicarLinkQueContem(trecho: string): Promise<void> {
    const link = await this.esperarVisivel(
      `.//a[contains(normalize-space(), ${literalXpath(trecho)})]`,
      `link com "${trecho}"`,
    );
    await this.clicar(link);
  }

  async clicarRotulo(texto: string): Promise<void> {
    await this.clicar(
      await this.esperarVisivel(`.//label[contains(normalize-space(), ${literalXpath(texto)})]`, `opção "${texto}"`),
    );
  }

  async item(texto: string): Promise<Regiao> {
    const raiz = await this.esperarVisivel(
      `.//li[contains(normalize-space(.), ${literalXpath(texto)})]`,
      `item da lista com "${texto}"`,
    );
    return new Regiao(this.navegador, raiz);
  }

  async enderecoDoLinkQueContem(trecho: string): Promise<string> {
    const link = await this.esperarVisivel(
      `.//a[contains(normalize-space(), ${literalXpath(trecho)})]`,
      `link com "${trecho}"`,
    );
    return (await link.getAttribute('href')) ?? '';
  }

  async temTexto(texto: string): Promise<boolean> {
    return (await this.visiveis(xpathDoTexto(texto))).length > 0;
  }

  async marcarCaixa(): Promise<void> {
    await this.clicar(await this.esperarVisivel(`.//input[@type='checkbox']`, 'caixa de confirmação'));
  }

  async esperarTexto(texto: string): Promise<WebElement> {
    return this.esperarVisivel(xpathDoTexto(texto), `texto "${texto}"`);
  }

  async esperarTitulo(titulo: string): Promise<void> {
    await this.esperarVisivel(`.//h1[normalize-space()=${literalXpath(titulo)}]`, `título "${titulo}"`);
  }

  async textoDe(xpath: string, descricao: string): Promise<string> {
    return (await this.esperarVisivel(xpath, descricao)).getText();
  }

  async esperarSumir(texto: string): Promise<void> {
    await this.navegador.wait(
      async () => (await this.visiveis(xpathDoTexto(texto))).length === 0,
      ESPERA_MAXIMA_MS,
      `Continuou na tela: "${texto}"`,
    );
  }
}

export class Tela extends Regiao {
  constructor(navegador: WebDriver) {
    super(navegador, navegador);
  }

  async abrir(caminho: string): Promise<void> {
    await this.navegador.get(`${URL_DO_FRONT}${caminho}`);
  }

  async abrirEndereco(endereco: string): Promise<void> {
    await this.navegador.get(endereco);
  }

  async esperarCaminho(caminho: string): Promise<void> {
    await this.navegador.wait(
      async () => new URL(await this.navegador.getCurrentUrl()).pathname === caminho,
      ESPERA_MAXIMA_MS,
      `A tela não foi para ${caminho}`,
    );
  }

  async caminhoAtual(): Promise<string> {
    return new URL(await this.navegador.getCurrentUrl()).pathname;
  }

  async esperarCaminhoOuTexto(caminhos: string[], texto: string): Promise<'caminho' | 'texto'> {
    let resultado: 'caminho' | 'texto' | undefined;
    await this.navegador.wait(
      async () => {
        if (caminhos.includes(await this.caminhoAtual())) resultado = 'caminho';
        else if (await this.temTexto(texto)) resultado = 'texto';
        return resultado !== undefined;
      },
      ESPERA_MAXIMA_MS,
      `A tela não foi para ${caminhos.join(' nem ')} e não mostrou "${texto}"`,
    );
    return resultado as 'caminho' | 'texto';
  }

  async aguardar(milissegundos: number): Promise<void> {
    await pausar(milissegundos);
  }

  async redimensionar(largura: number, altura: number): Promise<void> {
    await this.navegador.manage().window().setRect({ width: largura, height: altura });
  }

  async simularLocalizacao(latitude: number, longitude: number): Promise<void> {
    const chromium = this.navegador as unknown as {
      sendDevToolsCommand(comando: string, parametros: object): Promise<void>;
    };
    await chromium.sendDevToolsCommand('Browser.grantPermissions', {
      permissions: ['geolocation'],
      origin: URL_DO_FRONT,
    });
    await chromium.sendDevToolsCommand('Emulation.setGeolocationOverride', { latitude, longitude, accuracy: 10 });
  }

  async dialogo(titulo: string): Promise<Regiao> {
    const raiz = await this.esperarVisivel(
      `.//*[@role='dialog'][.//h2[contains(normalize-space(), ${literalXpath(titulo)})]]`,
      `diálogo "${titulo}"`,
    );
    return new Regiao(this.navegador, raiz);
  }

  async abrirNovaAba(endereco: string): Promise<string> {
    await this.navegador.switchTo().newWindow('tab');
    await this.navegador.get(endereco);
    return this.navegador.getWindowHandle();
  }

  async abaAtual(): Promise<string> {
    return this.navegador.getWindowHandle();
  }

  async irParaAba(aba: string): Promise<void> {
    await this.navegador.switchTo().window(aba);
  }

  async fecharAbaAtualEVoltarPara(aba: string): Promise<void> {
    await this.navegador.close();
    await this.navegador.switchTo().window(aba);
  }

  async guardarEvidencia(nome: string): Promise<void> {
    const arquivo = nome.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
    await mkdir(PASTA_DE_EVIDENCIAS, { recursive: true });
    await writeFile(`${PASTA_DE_EVIDENCIAS}/${arquivo}.png`, await this.navegador.takeScreenshot(), 'base64');
    const texto = await this.navegador.findElement(By.css('body')).getText();
    await writeFile(`${PASTA_DE_EVIDENCIAS}/${arquivo}.txt`, `${await this.navegador.getCurrentUrl()}\n\n${texto}`);
  }

  async chamarApiComSessao(metodo: string, caminho: string, corpo: unknown): Promise<number> {
    return this.navegador.executeAsyncScript<number>(
      `const [endereco, metodo, corpo, concluir] = arguments;
       fetch(endereco, {
         method: metodo,
         credentials: 'include',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(corpo),
       }).then((resposta) => concluir(resposta.status), () => concluir(0));`,
      `${URL_DA_API}${caminho}`,
      metodo,
      corpo,
    );
  }
}
