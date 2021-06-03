module.exports = {
  computeInput: function(data, db, app, compareCoins) {

    var coin = new Object();
    switch (data[0]) {
      case "add":
        computeCommands(data, coin);
	coin.owned = false;
        db.insert(coin, (err, doc) => {
          console.log("Coin inserted manually!");
          console.log(doc);
        });
        break;
      case "delete":
        computeCommands(data, coin);
        db.remove(coin, {
          multi: true
        }, (err, numRemoved) => {
          console.log(numRemoved + " Coin(s) deleted manually!");
        });
        break;
      case "list":
        computeCommands(data, coin);
        db.find(coin, (err, docs) => {
          var fs = require('fs');
          var output = "";
          docs.sort(compareCoins);
          docs.forEach((element) => {
            output += "Country: " + element.country + " Year: " + element.year + " Value: " + element.value + " SCoinage: " + element.sCoinage + " Mint: " + element.mint + " Name: " + element.name + " Owned: " + element.owned + "\n";
          })
          try {
            fs.writeFileSync(app.getPath("desktop") + "/" + 'debugList.txt', output, 'utf-8');
          } catch (e) {
            console.log(e)
          }
        })
        break;
    }

  }
}

function computeCommands(data, coin) {
  for (var i = 1; i < data.length; i += 2) {
    if (data[i] == "-country")
      coin.country = data[i + 1].replace("|", " ");
    else if (data[i] == "-year")
      coin.year = data[i + 1];
    else if (data[i] == "-name")
      coin.name = data[i + 1].replace("|", " ");
    else if (data[i] == "-mint") {
      if (data[i + 1] == "0")
        coin.mint = " ";
      else
        coin.mint = data[i + 1];
    } else if (data[i] == "-sCoinage")
      coin.sCoinage = (data[i + 1] == "true");
    else if (data[i] == "-value")
      coin.value = parseFloat(data[i + 1]);
    else
      return;
  }
}
