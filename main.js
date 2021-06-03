const {app, BrowserWindow, ipcMain} = require("electron");
const Datastore = require('nedb'),
  db = new Datastore({
    filename: app.getPath("userData") + '/coins'
  });
db.loadDatabase(function(err) {
  console.log(err);
});

let mainWindow
let menuWindow
let initialSetupWindow
let consoleWindow

var values = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2];

var mints = ["A", "D", "F", "G", "J"]

var countries = {
  "Andorra": 2014,
  "Belgien": 1999,
  "Deutschland": 2002,
  "Estland": 2011,
  "Finnland": 1999,
  "Frankreich": 1999,
  "Griechenland": 2002,
  "Irland": 2002,
  "Italien": 2002,
  "Lettland": 2014,
  "Litauen": 2015,
  "Luxemburg": 2002,
  "Malta": 2008,
  "Monaco": 2001,
  "Niederlande": 1999,
  "Österreich": 2002,
  "Portugal": 2002,
  "San Marino": 2002,
  "Slowakei": 2009,
  "Slowenien": 2007,
  "Spanien": 1999,
  "Vatikanstadt": 2002,
  "Zypern": 2008
}

function createMainWindow() {

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    webPreferences: {
      nodeIntegration: true
    }
  })

  if (initialSetupWindow != null)
    initialSetupWindow.close();

  mainWindow.setMenuBarVisibility(false)

  mainWindow.on("close", () => {
    mainWindow = null
    app.quit();
  })

  mainWindow.loadFile("index.html");

  mainWindow.webContents.on("did-finish-load", () => {
    setUpSelects();
  })

}

app.on("ready", () => {
  db.count({}, insertIfEmpty)
})

app.on("window-all-closed", () => {
  app.quit();
})

function setUpSelects() {
  var currentYear = new Date().getFullYear();
  var yearText;
  var countryText;

  yearText += "<option value=''>----</option>";
  countryText += "<option value=''>----</option>";
  for (var i = 1999; i <= currentYear; i++) {
    yearText += "<option value='" + i + "'>" + i + "</option>";
  }
  var countryList = Object.keys(countries);
  for (var i = 0; i < countryList.length; i++) {
    countryText += "<option value='" + countryList[i] + "'>" + countryList[i] + "</option>";
  }

  mainWindow.webContents.send("inputfields", {
    years: yearText,
    countries: countryText
  });
}

function insertIfEmpty(err, count) {
  if (count == 0) {
    showInitialWindow();
    var currentYear = new Date().getFullYear();
    for (var country in countries) {
      for (var year = countries[country]; year <= currentYear; year++) {
        if (country == "Deutschland") {
          for (var i = 0; i < values.length; i++) {
            for (var j = 0; j < mints.length; j++) {
              db.insert({
                sCoinage: false,
                name: "",
                year: year.toString(),
                country: country,
                value: values[i],
                mint: mints[j],
                owned: false
              });
            }
          }
        } else {
          for (var i = 0; i < values.length; i++) {
            db.insert({
              sCoinage: false,
              name: "",
              year: year.toString(),
              country: country,
              value: values[i],
              mint: " ",
              owned: false
            });
          }
        }
      }
    }
    updateSCoins(true);
  } else {
    createMainWindow();
  }

}

function showInitialWindow() {
  initialSetupWindow = new BrowserWindow({
    width: 300,
    height: 300,
    frame: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  initialSetupWindow.setResizable(false)
  initialSetupWindow.setMenuBarVisibility(false)

  initialSetupWindow.on("close", () => {
    initialSetupWindow = null
  })

  initialSetupWindow.loadFile("initial.html")
}

function update() {
  insertIfYearDoesntExist();
  updateSCoins(false);
}

function insertIfYearDoesntExist() {
  var currentYear = new Date().getFullYear();
  db.count({
    year: currentYear.toString(),
    sCoinage: false
  }, (err, count) => {
    if (count == 0) {
      for (var country in countries) {
        if (country == "Deutschland") {
          for (var i = 0; i < values.length; i++) {
            for (var j = 0; j < mints.length; j++) {
              db.insert({
                sCoinage: false,
                name: "",
                year: currentYear.toString(),
                country: country,
                value: values[i],
                mint: mints[j],
                owned: false
              });
            }
          }
        } else {
          for (var i = 0; i < values.length; i++) {
            db.insert({
              sCoinage: false,
              name: "",
              year: currentYear.toString(),
              country: country,
              value: values[i],
              mint: " ",
              owned: false
            });
          }
        }
      }
    }
  })
}

ipcMain.on("toggleOwned", (event, arg) => {
  //data[0] = oldValue | data[1] = country | data[2] = year | data[3] = value | data[4] = mint | data[5] = SCoinage | data[6] = name;
  var data = arg.split("|");
  db.update({
    country: data[1],
    year: data[2],
    value: parseFloat(data[3]),
    mint: data[4],
    name: data[6]
  }, {
    $set: {
      owned: !data[0]
    }
  }, (err, num, upsert) => {
    console.log("Updated " + num + " Datasets!")
  })

})

ipcMain.on("searchQuery", (event, arg) => {
  console.log(arg);
  //data[0] = country | data[1] = year | data[2] = sCoinage
  var data = arg.split("|");
  var coins = null;
  var mode = -1;
  if (data[0] != "" && data[1] != "") {
    coins = db.find({
      country: data[0],
      year: data[1],
      sCoinage: data[2] == "true"
    });
    mode = 0;
  } else {
    if (data[1] == "") {
      coins = db.find({
        country: data[0],
        sCoinage: data[2] == "true"
      });
      mode = 1;
    } else {
      coins = db.find({
        year: data[1],
        sCoinage: data[2] == "true"
      });
      mode = 2;
    }
  }

  if (coins != null && mode != -1)
    var data = createTable(data[0], data[1], data[2], mode, coins, event);
})

ipcMain.on("update", (event, arg) => {
  update();
})

ipcMain.on("menu", (event, arg) => {
  if (menuWindow == null) {
    menuWindow = new BrowserWindow({
      width: 300,
      height: 350,
      webPreferences: {
        nodeIntegration: true
      }
    })


    menuWindow.setResizable(false);
    menuWindow.setMenuBarVisibility(false)

    menuWindow.on("close", () => {
      menuWindow = null
    })

    menuWindow.loadFile("menu.html")
  } else {
    menuWindow.moveTop()
  }
})

ipcMain.on("printList", (event, arg) => {
  var fs = require('fs');
  var content = "";

  var lastCountry = "";
  var lastYear = "";

  var curCountry = "";
  var curYear = "";

  var curMint = "";
  var lastMint = "";

  db.find({
    sCoinage: false,
    owned: false
  }, (err, docs) => {
    docs.sort(compareCoinsForPrint);
    docs.forEach((element) => {
      curCountry = element.country;
      curYear = element.year;
      curMint = element.mint;
      if(curCountry != lastCountry || curYear != lastYear)
        if(element.country == "Deutschland")
          content += "\n" + element.country + " " + element.year + "\n" + element.mint + " " + fancyPrintCoinValue(element.value);
        else
          content += "\n" + element.country + " " + element.year + " " + fancyPrintCoinValue(element.value);
      else {
        if(element.country == "Deutschland"){
          if(lastMint != curMint){
            content += "\n" + element.mint + " " + fancyPrintCoinValue(element.value);
          }else{
            content += " " + fancyPrintCoinValue(element.value);
          }
        }else{
          content += " " + fancyPrintCoinValue(element.value);
        }

      }
      lastMint = curMint;
      lastCountry = curCountry;
      lastYear = curYear;
    })
  });

  db.find({
    sCoinage: true,
    owned: false
  }, (err, docs) => {
    content += "\n\nSonderprägungen:\n";
    docs.sort(compareCoins);
    var lastElement = null;
    var curElement = null;
    for (var i = 0; i < docs.length; i++) {

      curElement = docs[i];
      if(lastElement != null && curElement != null && curElement.country == lastElement.country && curElement.year == lastElement.year && curElement.name == lastElement.name)
        content += ","+curElement.mint;
      else
        content += "\n" + docs[i].country + " " + docs[i].year + " " + docs[i].name + " " + docs[i].mint;
      lastElement = curElement;
    }
    content = content.trim();
    try {
      fs.writeFileSync(app.getPath("desktop") + "/" + 'coinlist.txt', content, 'utf-8');
      event.reply("alert", "List saved to Desktop!")
    } catch (e) {
      event.reply("alert", "Failed to save File!")
    }
  });

})

function fancyPrintCoinValue(elementValue){

  switch(elementValue){
    case 0.01:
      return "1ct";
    case 0.02:
      return "2ct";
    case 0.05:
      return "5ct";
    case 0.1:
      return "10ct";
    case 0.2:
      return "20ct";
    case 0.5:
      return "50ct";
    case 1:
      return "1€";
    case 2:
      return "2€";
  }

}

ipcMain.on("console", (event, arg) => {
  if (consoleWindow == null) {
    consoleWindow = new BrowserWindow({
      width: 225,
      height: 100,
      webPreferences: {
        nodeIntegration: true
      }
    })


    consoleWindow.setResizable(false);
    consoleWindow.setMenuBarVisibility(false)

    consoleWindow.on("close", () => {
      consoleWindow = null
    })

    consoleWindow.loadFile("console.html")
  } else {
    consoleWindow.moveTop()
  }
})

ipcMain.on("consoleInput", (event, arg) => {
  console.log(arg);
  var data = arg.split(" ");
  var cs = require('./coinconsole');
  cs.computeInput(data, db, app, compareCoins);
})

function updateSCoins(firstStart) {
  const sc = require('./scrapper');
  sc.scrap(function(coins) {
    console.log("meep:" + coins.length);
    for (var i = 0; i < coins.length; i++) {
      (function(i) {
        console.log(coins[i].name + " " + coins[i].year + " " + coins[i].country);
        db.count({
          year: coins[i].year,
          country: coins[i].country,
          name: coins[i].name,
          sCoinage: true
        }, (err, count) => {
          if (count == 0) {
            if (coins[i].country != "Deutschland") {
              db.insert({
                sCoinage: true,
                name: coins[i].name,
                year: coins[i].year,
                country: coins[i].country,
                value: 2,
                mint: " ",
                owned: false
              });
            } else {
              for (var j = 0; j < mints.length; j++)
                db.insert({
                  sCoinage: true,
                  name: coins[i].name,
                  year: coins[i].year,
                  country: coins[i].country,
                  value: 2,
                  mint: mints[j],
                  owned: false
                });
            }
          }
        });
      })(i);
    }
    if (firstStart)
      createMainWindow();
    mainWindow.webContents.send("alert", "Database-Update completed!");

  });
}

function compareCoins(a, b) {
  var countrySort = a.country.localeCompare(b.country);
  if (countrySort != 0)
    return countrySort;
  var yearSort = a.year.localeCompare(b.year);
  if (yearSort != 0)
    return yearSort;
  var nameSort = a.name.localeCompare(b.name);
  if (nameSort != 0)
    return nameSort;
  var mintSort = a.mint.localeCompare(b.mint);
  if (mintSort != 0)
    return mintSort;
  var valueA = a.value;
  var valueB = b.value;
  if (valueA > valueB)
    return 1;
  if (valueA < valueB)
    return -1;
  return 0;
}

function compareCoinsForPrint(a, b) {
  var countrySort = a.country.localeCompare(b.country);
  if (countrySort != 0)
    return countrySort;
  var yearSort = a.year.localeCompare(b.year);
  if (yearSort != 0)
    return yearSort;
  var nameSort = a.name.localeCompare(b.name);
  if (nameSort != 0)
    return nameSort;
  if(a.mint == b.mint) {
    var valueA = a.value;
    var valueB = b.value;
    if (valueA > valueB)
      return 1;
    if (valueA < valueB)
      return -1;
  }
    var mintSort = a.mint.localeCompare(b.mint);
    return mintSort;
}

function createTable(country, year, sCoinage, mode, coins, event) {
  //mode 0 = both; 1 = country; 2 = year;
  coins.exec((err, docs) => {
    docs.sort(compareCoins);
    docs.forEach((element) => {
      console.log(element.country + element.year + element.mint + element.value + element.sCoinage);
    })

    var table = "";
    if (sCoinage != "true") {
      switch (mode) {
        case 0:
          table += country + ", " + year + "|"
          if (country != "Deutschland") {
            table += "<table class=\"searchtable\"><tr><th></th><th>1ct</th><th>2ct</th><th>5ct</th><th>10ct</th><th>20ct</th><th>50ct</th><th>1&euro;</th><th>2&euro;</th></tr><tr><th></th>";
            docs.forEach((element) => {
              table += "<td class = \"noSCoinage\" data-country=\"" + element.country + "\" data-year=\"" + element.year + "\" data-value=\"" + element.value + "\" data-mint=\"" + element.mint + "\" data-sCoinage=\"" + element.sCoinage + "\" data-name=\"" + element.name + "\">";
              table += element.owned == true ? "X" : " ";
              table += "</td>";
            })
          } else {
            table += "<table class=\"searchtable\"><tr><th></th><th>1ct</th><th>2ct</th><th>5ct</th><th>10ct</th><th>20ct</th><th>50ct</th><th>1&euro;</th><th>2&euro;</th></tr><tr>";
            for (var i = 0; i < docs.length; i++) {
              if (i % 8 == 0) {
                if (i > 0) table += "</tr>";
                table += "<tr><th>" + mints[i / 8] + "</th>";
              }
              table += "<td class = \"noSCoinage\" data-country=" + docs[i].country + " data-year=\"" + docs[i].year + "\" data-value=\"" + docs[i].value + "\" data-mint=\"" + docs[i].mint + "\" data-sCoinage=\"" + docs[i].sCoinage + "\" data-name=\"" + docs[i].name + "\">";
              table += docs[i].owned == true ? "X" : " ";
              table += "</td>";
            }
          }
          table += "</tr></table>"
          break;
        case 1:
          table += country + "|"
          if (country != "Deutschland") {
            table += "<table class=\"searchtable\"><tr><th></th><th>1ct</th><th>2ct</th><th>5ct</th><th>10ct</th><th>20ct</th><th>50ct</th><th>1&euro;</th><th>2&euro;</th></tr><tr>";
            for (var i = 0; i < docs.length; i++) {
              if (i % 8 == 0) {
                if (i > 0) table += "</tr>";
                table += "<tr><th>" + docs[i].year + "</th>";
              }
              table += "<td class = \"noSCoinage\" data-country=\"" + docs[i].country + "\" data-year=\"" + docs[i].year + "\" data-value=\"" + docs[i].value + "\" data-mint=\"" + docs[i].mint + "\" data-sCoinage=\"" + docs[i].sCoinage + "\" data-name=\"" + docs[i].name + "\">";
              table += docs[i].owned == true ? "X" : " ";
              table += "</td>";
            }
          } else {
            var j = 0;
            for (var i = 0; i < docs.length; i++) {
              if (i % 40 == 0) {
                j = 0;
                if (i > 0) table += "</tr></table><br><br>";
                table += "<table class=\"searchtable\"><tr><th>" + docs[i].year + "</th><th>1ct</th><th>2ct</th><th>5ct</th><th>10ct</th><th>20ct</th><th>50ct</th><th>1&euro;</th><th>2&euro;</th></tr><tr>";
              }
              if (j % 8 == 0) {
                if (j > 0) table += "</tr>"
                table += "<tr><th>" + mints[j / 8] + "</th>";
              }
              table += "<td class = \"noSCoinage\" data-country=" + docs[i].country + " data-year=\"" + docs[i].year + "\" data-value=\"" + docs[i].value + "\" data-mint=\"" + docs[i].mint + "\" data-sCoinage=\"" + docs[i].sCoinage + "\" data-name=\"" + docs[i].name + "\">";
              table += docs[i].owned == true ? "X" : " ";
              table += "</td>";
              j++
            }
          }
          table += "</tr></table><br>"
          break;
        case 2:
          table += year + "|";
          table += "<table class=\"searchtable\"><tr><th></th><th>1ct</th><th>2ct</th><th>5ct</th><th>10ct</th><th>20ct</th><th>50ct</th><th>1&euro;</th><th>2&euro;</th></tr><tr>";
          for (var i = 0; i < docs.length; i++) {
            if (docs[i].country == "Deutschland") continue;
            if (i % 8 == 0) {
              if (i > 0) table += "</tr>";
              table += "<tr><th>" + docs[i].country + "</th>";
            }
            table += "<td class = \"noSCoinage\" data-country=\"" + docs[i].country + "\" data-year=\"" + docs[i].year + "\" data-value=\"" + docs[i].value + "\" data-mint=\"" + docs[i].mint + "\" data-sCoinage=\"" + docs[i].sCoinage + "\" data-name=\"" + docs[i].name + "\">";
            table += docs[i].owned == true ? "X" : " ";
            table += "</td>";
          }
          table += "</tr></table>"
          table += "<br><br>"
          table += "<table class=\"searchtable\"><tr><th>Deutschland</th><th>1ct</th><th>2ct</th><th>5ct</th><th>10ct</th><th>20ct</th><th>50ct</th><th>1&euro;</th><th>2&euro;</th></tr><tr>";
          var j = 0;
          var k = 0;
          for (var i = 0; i < docs.length; i++) {
            if (docs[i].country == "Deutschland") {
              if (j % 8 == 0) {
                if (j > 0) table += "</tr>"
                table += "<tr><th>" + mints[k] + "</th>"
                k++;
              }
              table += "<td class = \"noSCoinage\" data-country=" + docs[i].country + " data-year=\"" + docs[i].year + "\" data-value=\"" + docs[i].value + "\" data-mint=\"" + docs[i].mint + "\" data-sCoinage=\"" + docs[i].sCoinage + "\" data-name=\"" + docs[i].name + "\">";
              table += docs[i].owned == true ? "X" : " ";
              table += "</td>";
              j++
            }
          }
          table += "</tr></table><br>"
          break;
      }
    } else {
      switch (mode) {
        case 0:
          table += country + ", " + year + "|";
          if (country != "Deutschland") {
            table += "<table class=\"searchtable\"><tr><th></th></tr><tr><th></th>";
            docs.forEach((element) => {
              table += "<td class = \"SCoinage\">" + element.name + "</td>";
              table += "<td class = \"SCoinageOwnedCell\" data-country=" + element.country + " data-year=\"" + element.year + "\" data-value=\"" + element.value + "\" data-mint=\"" + element.mint + "\" data-sCoinage=\"" + element.sCoinage + "\" data-name=\"" + element.name + "\">";
              table += element.owned == true ? "X" : " ";
              table += "</td></tr><tr><th></th>";
            })
          } else {
            table += "<table class=\"searchtable\"><tr><th></th><th></th><th>" + mints[0] + "</th><th>" + mints[1] + "</th><th>" + mints[2] + "</th><th>" + mints[3] + "</th><th>" + mints[4] + "</th></tr><tr><th></th>";
            for (var i = 0; i < docs.length; i++) {
              if (i % 5 == 0) {
                if (i != 0)
                  table += "</tr><tr><th></th>"
                table += "<td class = \"SCoinage\">" + docs[i].name + "</td>";
              }
              table += "<td  class = \"SCoinageOwnedCell\" data-country=" + docs[i].country + " data-year=\"" + docs[i].year + "\" data-value=\"" + docs[i].value + "\" data-mint=\"" + docs[i].mint + "\" data-sCoinage=\"" + docs[i].sCoinage + "\" data-name=\"" + docs[i].name + "\">";
              table += docs[i].owned == true ? "X" : " ";
              table += "</td>";
            }
          }
          table += "</tr></table><br>"
          break;
        case 1:
          table += country + "|";
          var curYear = 0;
          if (country != "Deutschland") {
            for (var i = 0; i < docs.length; i++) {
              if (parseInt(docs[i].year) > curYear) {
                if (i != 0)
                  table += "</tr></table><br>";
                table += "<table class=\"searchtable\"><tr><th>" + docs[i].year + "</th></tr><tr><th></th>";
                curYear = parseInt(docs[i].year);
              }
              table += "<td class = \"SCoinage\">" + docs[i].name + "</td>";
              table += "<td class = \"SCoinageOwnedCell\" data-country=" + docs[i].country + " data-year=\"" + docs[i].year + "\" data-value=\"" + docs[i].value + "\" data-mint=\"" + docs[i].mint + "\" data-sCoinage=\"" + docs[i].sCoinage + "\" data-name=\"" + docs[i].name + "\">";
              table += docs[i].owned == true ? "X" : " ";
              table += "</td></tr><tr><th></th>";
            }
          } else {
            var skipCheck = false;
            for (var i = 0; i < docs.length; i++) {
              if (parseInt(docs[i].year) > curYear) {
                if (i != 0) {
                  table += "</tr></table><br><br>";
                  skipCheck = true;
                }
                table += "<table class=\"searchtable\"><tr><th>" + docs[i].year + "</th><th></th><th>" + mints[0] + "</th><th>" + mints[1] + "</th><th>" + mints[2] + "</th><th>" + mints[3] + "</th><th>" + mints[4] + "</th><tr><th></th>";
                curYear = parseInt(docs[i].year);
              }
              if (i % 5 == 0) {
                if (i != 0 && skipCheck == false)
                  table += "</tr><tr><th></th>"
                table += "<td class = \"SCoinage\">" + docs[i].name + "</td>";
                skipCheck = false;
              }
              table += "<td  class = \"SCoinageOwnedCell\" data-country=" + docs[i].country + " data-year=\"" + docs[i].year + "\" data-value=\"" + docs[i].value + "\" data-mint=\"" + docs[i].mint + "\" data-sCoinage=\"" + docs[i].sCoinage + "\" data-name=\"" + docs[i].name + "\">";
              table += docs[i].owned == true ? "X" : " ";
              table += "</td>";
            }
          }
          table += "</tr></table><br>"
          break;
        case 2:
          table += year + "|";
          var curCountry = "";
          for (var i = 0; i < docs.length; i++) {
            if (docs[i].country == "Deutschland")
              continue;
            if (docs[i].country != curCountry) {
              if (i != 0) {
                table += "</tr></table><br>";
              }
              table += "<table class=\"searchtable\"><tr><th>" + docs[i].country + "</th></tr><tr><th></th>";
              curCountry = docs[i].country;
            }
            table += "<td class = \"SCoinage\">" + docs[i].name + "</td>";
            table += "<td class = \"SCoinageOwnedCell\" data-country=" + docs[i].country + " data-year=\"" + docs[i].year + "\" data-value=\"" + docs[i].value + "\" data-mint=\"" + docs[i].mint + "\" data-sCoinage=\"" + docs[i].sCoinage + "\" data-name=\"" + docs[i].name + "\">";
            table += docs[i].owned == true ? "X" : " ";
            table += "</td></tr><tr><th></th>";
          }
          table += "<table class=\"searchtable\"><tr><th>Deutschland</th><th></th><th>" + mints[0] + "</th><th>" + mints[1] + "</th><th>" + mints[2] + "</th><th>" + mints[3] + "</th><th>" + mints[4] + "</th><tr><th></th>";
          var j = 0;
          for (var i = 0; i < docs.length; i++) {
            if (docs[i].country == "Deutschland") {
              if (j % 5 == 0) {
                if (j > 0) {
                  table += "</tr>"
                  table += "<tr><th></th>"
                }
                table += "<td class = \"SCoinage\">" + docs[i].name + "</td>";
              }
              table += "<td class = \"noSCoinage\" data-country=" + docs[i].country + " data-year=\"" + docs[i].year + "\" data-value=\"" + docs[i].value + "\" data-mint=\"" + docs[i].mint + "\" data-sCoinage=\"" + docs[i].sCoinage + "\" data-name=\"" + docs[i].name + "\">";
              table += docs[i].owned == true ? "X" : " ";
              table += "</td>";
              j++
            }
          }
          table += "</tr></table><br>"
          break;
      }
    }
    event.reply("searchResult", table);

  })
}
