const cheerio = require('cheerio');
fetch('https://www.rbi.org.in/scripts/NewLinkDetails.aspx')
  .then(res => res.text())
  .then(html => {
    const $ = cheerio.load(html);
    console.log("Tables found:", $('table').length);
    console.log("Table classes:", $('table').map((i, el) => $(el).attr('class') || 'no-class').get());
    console.log("Has #example-one:", $('#example-one').length);
    if ($('table').length > 0) {
        console.log("First table html snippet:", $('table').first().html().substring(0, 300));
    }
  });
