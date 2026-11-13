import { Builder, type WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import firefox from 'selenium-webdriver/firefox';
import { NAVEGADOR, SEM_TELA } from './ambiente';

const LARGURA_DA_JANELA = 1440;
const ALTURA_DA_JANELA = 900;

export async function abrirNavegador(): Promise<WebDriver> {
  const opcoesDoChrome = new chrome.Options();
  opcoesDoChrome.addArguments(`--window-size=${LARGURA_DA_JANELA},${ALTURA_DA_JANELA}`);
  const opcoesDoFirefox = new firefox.Options();
  opcoesDoFirefox.addArguments(`--width=${LARGURA_DA_JANELA}`, `--height=${ALTURA_DA_JANELA}`);
  if (SEM_TELA) {
    opcoesDoChrome.addArguments('--headless=new');
    opcoesDoFirefox.addArguments('-headless');
  }
  return new Builder()
    .forBrowser(NAVEGADOR)
    .setChromeOptions(opcoesDoChrome)
    .setFirefoxOptions(opcoesDoFirefox)
    .build();
}
