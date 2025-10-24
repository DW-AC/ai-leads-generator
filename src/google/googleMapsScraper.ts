import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';
import fs from 'fs';
import { Laundry } from '../interfaces/laundry.interface';

puppeteer.use(StealthPlugin());

export class GoogleMapsScraper {
    private browser: Browser | null = null;
    private page: Page | null = null;

    public async run(): Promise<void> {
        try {
            await this.initialize();
            await this.navigate('https://www.google.com/maps/search/laundry+in+makati+city+philippines');
            const laundries = await this.extractData();
            this.saveData(laundries);
        } catch (error) {
            console.error('An error occurred during scraping:', error);
        } finally {
            await this.close();
        }
    }

    private async initialize(): Promise<void> {
        this.browser = await puppeteer.launch();
        this.page = await this.browser.newPage();
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    }

    private async navigate(url: string): Promise<void> {
        if (!this.page) {
            throw new Error('Page not initialized');
        }
        await this.page.goto(url, { waitUntil: 'networkidle2' });
    }

    private async extractData(): Promise<Laundry[]> {
        if (!this.page) {
            throw new Error('Page not initialized');
        }

        const scrollableSelector = 'div[role="feed"]';
        await this.page.waitForSelector(scrollableSelector);

        let laundries: Laundry[] = [];

        const scrollContainer = await this.page.$(scrollableSelector);
        if (!scrollContainer) {
            throw new Error('Scrollable container not found');
        }

        let previousHeight = 0;
        while (laundries.length < 50) { // Limit to 50 results for now
            await scrollContainer.evaluate(node => node.scrollTop = node.scrollHeight);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for new results

            const currentHeight = await scrollContainer.evaluate(node => node.scrollHeight);
            if (currentHeight === previousHeight) {
                break;
            }
            previousHeight = currentHeight;

            const laundryHandles = await this.page.$$('div[jsaction*="mouseover:pane"]');
            for (const laundryHandle of laundryHandles) {
                try {
                    const name = await laundryHandle.$eval('div.fontHeadlineSmall', el => el.textContent?.trim() || '');
                    if (laundries.some(l => l.name === name)) {
                        continue;
                    }

                    let rating = 0;
                    try {
                        const ratingText = await laundryHandle.$eval('span.fontBodyMedium > span[aria-label]', el => el.getAttribute('aria-label') || '');
                        const ratingMatch = ratingText.match(/(\d+(\.\d+)?)\s+stars/);
                        if (ratingMatch) {
                            rating = parseFloat(ratingMatch[1]);
                        }
                    } catch (e) {
                        // No rating
                    }

                    const infoContainer = await laundryHandle.$('div:not([class]) > div:not([class])');
                    const infoText = await infoContainer?.evaluate(el => el.textContent || '') || '';

                    const parts = infoText.split('·').map(p => p.trim());
                    let address = parts.find(p => p.includes(',')) || '';
                    let phone = parts.find(p => /\d{3}-\d{4}/.test(p)) || '';

                    let website = '';
                    try {
                        website = await laundryHandle.$eval('a[data-value="Website"]', el => (el as HTMLAnchorElement).href);
                    } catch (e) {
                        // No website
                    }

                    laundries.push({ name, rating, address, phone, website });
                } catch(e) {
                    // Could not parse this element, skip it.
                }
            }
        }

        return laundries;
    }

    private saveData(laundries: Laundry[]): void {
        fs.writeFileSync('laundries.json', JSON.stringify(laundries, null, 2));
        console.log('Scraping complete. Data saved to laundries.json');
    }

    private async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Instantiate and run the scraper
(async () => {
    const scraper = new GoogleMapsScraper();
    await scraper.run();
})();
