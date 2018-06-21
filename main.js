const axios = require('axios');
const cheerio = require ('cheerio');
const fs = require('fs');

const baseUrl = 'https://www.idealista.com';
const initialUrl = '/alquiler-viviendas/madrid/centro/sol/';

function scrapeUrl(url, items=[]) {
    console.log('requesting', url);
    return axios.get(url)
        .then(response => {
            const $ = cheerio.load(response.data);
            const pageItems = $('.items-container .item').toArray()
                .map(item => {
                    const $item = $(item);
                    return {
                        id: $item.attr('data-adid'),
                        title: $item.find('.item-link').text(),
                        link: baseUrl + $item.find('.item-link').attr('href'),
                        image: $item.find('.gallery-fallback img').attr('data-ondemand-img'),
                        price: $item.find('.item-price').text(),
                        rooms: $item.find(".item-detail small:contains('hab.')").parent().text(),
                        squareMeters: $item.find(".item-detail small:contains('m²')").parent().text(),
                    };
                });
            const allItems = items.concat(pageItems);
            console.log(pageItems.length,'items retrieved', allItems.length, 'acumulated');
            const nextUrl = $('.pagination .next a').attr('href');
            return nextUrl ? scrapeUrl(baseUrl + nextUrl, allItems) : allItems;
        })
        .catch(error => {
            console.log('error', error);
            return items;
        });
}

scrapeUrl(baseUrl + initialUrl)
    .then(items => {
        console.log('finish!');
        fs.writeFile('./items.json', JSON.stringify(items), 'utf8', function(error) {
            if (error) return console.log('error', error);
            console.log(items.length, 'items saved');
        }); 
    });