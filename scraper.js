const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  await page.goto('https://clutch.co/web-developers', { waitUntil: 'networkidle2' });

  const agencies = await page.evaluate(() => {
    const agencyList = document.querySelectorAll('li.provider-list-item');
    const agencyData = [];
    for (let i = 0; i < 50 && i < agencyList.length; i++) {
      const agency = agencyList[i];
      const title = agency.querySelector('h3.provider__title a')?.innerText.trim();
      const rating = agency.querySelector('span.sg-rating__number')?.innerText.trim();
      const reviewCount = agency.querySelector('a.sg-rating__reviews')?.innerText.trim();
      const services = Array.from(agency.querySelectorAll('div.provider__services-list-item')).map(service => service.innerText.trim());
      const location = agency.querySelector('div.provider__highlights-item.location')?.innerText.trim();
      const employees = agency.querySelector('div.provider__highlights-item.employees-count')?.innerText.trim();
      const hourlyRate = agency.querySelector('div.provider__highlights-item.hourly-rate')?.innerText.trim();
      const minProjectSize = agency.querySelector('div.provider__highlights-item.min-project-size')?.innerText.trim();

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
