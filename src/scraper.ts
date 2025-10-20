import puppeteer, {Browser, Page} from 'puppeteer';
import fs from 'fs';
import {Agency} from './interfaces/agency.interface';

export class Scraper {
    private browser : Browser | null = null;
    private page : Page | null = null;

    public async run() : Promise<void> {
        try {
            await this.initialize();
            await this.navigate('https://clutch.co/web-developers');

            // Save HTML for debugging
            const content = await this.page!.content();
            fs.writeFileSync('clutch.html', content);

            const agencies = await this.extractData();
            this.saveData(agencies);
        } catch (error) {
            console.error('An error occurred during scraping:', error);
        } finally {
            await this.close();
        }
    }

    private async initialize() : Promise<void> {
        this.browser = await puppeteer.launch();
        this.page = await this.browser.newPage();

        this.page.on('console', msg => {
            for (let i = 0; i < msg.args().length; ++i) {
                console.log(`${i}: ${msg.args()[i]}`);
            }
        });

        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    }

    private async navigate(url : string) : Promise<void> {
        if (!this.page) {
            throw new Error('Page not initialized');
        }
        await this.page.goto(url, {waitUntil : 'networkidle2'});
    }

    private async extractData() : Promise<Agency[]> {
        if (!this.page) {
            throw new Error('Page not initialized');
        }

        return this.page.evaluate(() => {
            const agencyList = document.querySelectorAll('li.provider-list-item');
            const agencyData : Agency[] = [];
            for (let i = 0; i < 50 && i < agencyList.length; i++) {
                const agency = agencyList[i];
                const title = (agency.querySelector('h3.provider__title a') as HTMLElement)?.innerText.trim();
                const rating = (agency.querySelector('span.sg-rating__number') as HTMLElement)?.innerText.trim();
                const reviewCount = (agency.querySelector('a.sg-rating__reviews') as HTMLElement)?.innerText.trim();
                const services = Array.from(agency.querySelectorAll('div.provider__services-list-item')).map(service => (service as HTMLElement).innerText.trim());
                const location = (agency.querySelector('div.provider__highlights-item.location') as HTMLElement)?.innerText.trim();
                const employees = (agency.querySelector('div.provider__highlights-item.employees-count') as HTMLElement)?.innerText.trim();
                const hourlyRate = (agency.querySelector('div.provider__highlights-item.hourly-rate') as HTMLElement)?.innerText.trim();
                const minProjectSize = (agency.querySelector('div.provider__highlights-item.min-project-size') as HTMLElement)?.innerText.trim();

                const websiteLink = agency.querySelector('a.provider__cta-link.website-link__item') as HTMLAnchorElement;
                let url : string | undefined = undefined;
                if (websiteLink) {
                    const href = websiteLink.getAttribute('href');
                    if (href) {
                        try {
                            const fullUrl = new URL(href, 'https://clutch.co');
                            const urlParams = new URLSearchParams(fullUrl.search);
                            const u = urlParams.get('u');
                            if (u) {
                                url = decodeURIComponent(u);
                            }
                        } catch (e) {
                            console.error('Error parsing URL:', href, e);
                        }
                    }
                }

                agencyData.push({
                    title,
                    rating,
                    reviewCount,
                    services,
                    location,
                    employees,
                    hourlyRate,
                    minProjectSize,
                    url,
                });
            }
            return agencyData;
        });
    }

    private saveData(agencies : Agency[]) : void {
        fs.writeFileSync('agencies.json', JSON.stringify(agencies, null, 2));
        console.log('Scraping complete. Data saved to agencies.json');
    }

    private async close() : Promise<void> {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Instantiate and run the scraper
(async () => {
    const scraper = new Scraper();
    await scraper.run();
})();
