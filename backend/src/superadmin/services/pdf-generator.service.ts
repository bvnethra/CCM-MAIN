import puppeteer, { Browser } from 'puppeteer';

export class PdfGeneratorService {
    private static browserInstance: Browser | null = null;

    private static async getBrowser(): Promise<Browser> {
        if (!this.browserInstance || !this.browserInstance.connected) {
            this.browserInstance = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            });
        }
        return this.browserInstance;
    }

    static async generatePdfFromHtml(html: string): Promise<Buffer> {
        const browser = await this.getBrowser();
        const page = await browser.newPage();
        try {
            await page.setContent(html, { waitUntil: 'load' });
            const pdfUint8Array = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' }
            });
            return Buffer.from(pdfUint8Array);
        } finally {
            await page.close();
        }
    }

    static async closeBrowser(): Promise<void> {
        if (this.browserInstance) {
            await this.browserInstance.close();
            this.browserInstance = null;
        }
    }
}
