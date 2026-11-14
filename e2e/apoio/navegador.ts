import { Builder, type WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import firefox from 'selenium-webdriver/firefox';
import { JANELA, NAVEGADOR, SEM_TELA } from './ambiente';

export async function abrirNavegador(): Promise<WebDriver> {
  const opcoesDoChrome = new chrome.Options();
  opcoesDoChrome.addArguments(`--window-size=${JANELA.largura},${JANELA.altura}`);
  const opcoesDoFirefox = new firefox.Options();
  opcoesDoFirefox.addArguments(`--width=${JANELA.largura}`, `--height=${JANELA.altura}`);
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
