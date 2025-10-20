import puppeteer from 'puppeteer';
import fs from 'fs';

interface Agency {
  title: string | undefined;
  rating: string | undefined;
  reviewCount: string | undefined;
  services: string[];
  location: string | undefined;
  employees: string | undefined;
  hourlyRate: string | undefined;
  minProjectSize: string | undefined;
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  await page.goto('https://clutch.co/web-developers', { waitUntil: 'networkidle2' });

  const agencies: Agency[] = await page.evaluate(() => {
    const agencyList = document.querySelectorAll('li.provider-list-item');
    const agencyData: Agency[] = [];
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

      agencyData.push({
        title,
        rating,
        reviewCount,
        services,
        location,
        employees,
        hourlyRate,
        minProjectSize,
      });
    }
    return agencyData;
  });

  fs.writeFileSync('agencies.json', JSON.stringify(agencies, null, 2));

  console.log('Scraping complete. Data saved to agencies.json');

  await browser.close();
})();
