import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';
import fs from 'fs';
import { Agency } from './interfaces/agency.interface';

puppeteer.use(StealthPlugin());

export class Scraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  public async run(): Promise<void> {
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

  private async extractData(): Promise<Agency[]> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const agencyHandles = await this.page.$$('li.provider-list-item');
    const agencyData: Agency[] = [];

    for (let i = 0; i < 50 && i < agencyHandles.length; i++) {
      const agencyHandle = agencyHandles[i];
      const agencyInfo = await agencyHandle.evaluate(agency => {
        const title = (agency.querySelector('h3.provider__title a') as HTMLElement)?.innerText.trim();
        const rating = (agency.querySelector('span.sg-rating__number') as HTMLElement)?.innerText.trim();
        const reviewCount = (agency.querySelector('a.sg-rating__reviews') as HTMLElement)?.innerText.trim();
        const services = Array.from(agency.querySelectorAll('div.provider__services-list-item')).map(service => (service as HTMLElement).innerText.trim());
        const location = (agency.querySelector('div.provider__highlights-item.location') as HTMLElement)?.innerText.trim();
        const employees = (agency.querySelector('div.provider__highlights-item.employees-count') as HTMLElement)?.innerText.trim();
        const hourlyRate = (agency.querySelector('div.provider__highlights-item.hourly-rate') as HTMLElement)?.innerText.trim();
        const minProjectSize = (agency.querySelector('div.provider__highlights-item.min-project-size') as HTMLElement)?.innerText.trim();

        const websiteLink = agency.querySelector('a.provider__cta-link.website-link__item') as HTMLAnchorElement;
        let url: string | undefined = undefined;
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
              // Can't log here
            }
          }
        }

        const reviewsLink = agency.querySelector('a.provider__project-highlight-projects-link') as HTMLAnchorElement;
        const reviewsUrl = reviewsLink ? reviewsLink.href : undefined;

        return {
          title,
          rating,
          reviewCount,
          services,
          location,
          employees,
          hourlyRate,
          minProjectSize,
          url,
          reviewsUrl,
        };
      });

      agencyData.push(agencyInfo);
    }

    for (const agency of agencyData) {
      if (agency.reviewsUrl) {
        const { reviews, profileSummary } = await this.extractProfileData(agency.reviewsUrl);
        agency.reviews = reviews;
        agency.profileSummary = profileSummary;
      }
    }

    return agencyData.map(({ reviewsUrl, ...rest }) => rest);
  }

  private async extractProfileData(url: string): Promise<{ reviews: string[], profileSummary: string | undefined }> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    try {
      await this.page.goto(url, { waitUntil: 'networkidle2' });
      const data = await this.page.evaluate(() => {
        const reviews = Array.from(document.querySelectorAll('div.profile-review__quote')).map(el => (el as HTMLElement).innerText.trim());
        const profileSummary = (document.querySelector('div#profile-summary-text') as HTMLElement)?.innerText.trim();
        return { reviews, profileSummary };
      });
      return data;
    } catch (error) {
      console.error(`Error scraping profile data from ${url}:`, error);
      return { reviews: [], profileSummary: undefined };
    }
  }

  private saveData(agencies: Agency[]): void {
    fs.writeFileSync('agencies.json', JSON.stringify(agencies, null, 2));
    console.log('Scraping complete. Data saved to agencies.json');
  }

  private async close(): Promise<void> {
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
