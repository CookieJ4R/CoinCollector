const rp = require('request-promise');
const $ = require('cheerio');

const startYear = 2004;
var currentCalls = 0;

var countrieURLCodes = [
  "andorra",
  "belgien",
  "deutschland",
  "estland",
  "finnland",
  "frankreich",
  "griechenland",
  "irland",
  "italien",
  "lettland",
  "litauen",
  "luxemburg",
  "malta",
  "monaco",
  "niederlande",
  "oesterreich",
  "portugal",
  "san-marino",
  "slowakei",
  "slowenien",
  "spanien",
  "vatikanstadt",
  "zypern"
]

var countryNames = [
  "Andorra",
  "Belgien",
  "Deutschland",
  "Estland",
  "Finnland",
  "Frankreich",
  "Griechenland",
  "Irland",
  "Italien",
  "Lettland",
  "Litauen",
  "Luxemburg",
  "Malta",
  "Monaco",
  "Niederlande",
  "Österreich",
  "Portugal",
  "San Marino",
  "Slowakei",
  "Slowenien",
  "Spanien",
  "Vatikanstadt",
  "Zypern"
]

var coins = [];

module.exports = {
  scrap: function(callback) {
    for (var i = 0; i < countrieURLCodes.length; i++) {
      var url = "https://www.zwei-euro.com/" + countrieURLCodes[i] + "/gedenkmuenzen/";
      (function(i) {
        rp(url).then(function(html) {
          $('.title', html).each(function() {
            var text = $(this).text();
            var year = text.substring(0, 4).trim();
            var name = text.substring(5).trim();
            console.log(year);
            console.log(name);
            var coin = new Object();
            coin.year = year;
            coin.country = countryNames[i];
            coin.name = name;
            coins.push(coin);
          });
          callCallback(callback);
        })
      })(i);
    }
  }

}

function callCallback(callback) {
  currentCalls++;
  if (currentCalls >= countryNames.length)
    callback(coins);
}
