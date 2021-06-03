const {
  ipcRenderer
} = require("electron")

function search() {
  ipcRenderer.send("searchQuery", document.getElementById("countrySelect").value + "|" + document.getElementById("yearSelect").value + "|" + document.getElementById("sCoinage").checked);
}

function menu() {
  ipcRenderer.send("menu");
}

function update() {
  ipcRenderer.send("update");
  document.getElementById("loader").style.display = "block";
}

function printList() {
  ipcRenderer.send("printList");
}

function console() {
  ipcRenderer.send("console");
}

function consoleSend(event) {
  if (event.keyCode == 13) {
    ipcRenderer.send("consoleInput", document.getElementById("console").value);
    document.getElementById("console").value = "";
  }
}

function tableHandler(e) {
  //update Owned/Unowned
  //JavaScript interpretiert "" als false jeden anderen String als true - Yay!
  var oldValue;
  oldValue = e.innerHTML.trim();
  e.innerHTML == " " ? e.innerHTML = "X" : e.innerHTML = " ";
  ipcRenderer.send("toggleOwned", oldValue + "|" + e.dataset.country + "|" + e.dataset.year + "|" + e.dataset.value + "|" + e.dataset.mint + "|" + e.dataset.sCoinage + "|" + e.dataset.name);
}

ipcRenderer.on("searchResult", (event, arg) => {
  var data = arg.split("|");
  document.getElementById('headerTitle').innerHTML = data[0];
  document.getElementById('content').innerHTML = data[1];
  document.querySelectorAll(".searchtable td").forEach(function(el) {
    el.addEventListener("click", function(evt) {
      tableHandler(evt.target);
    });
  });
});

ipcRenderer.on("alert", (event, arg) => {
  alert(arg)
});

ipcRenderer.on("inputfields", (event, arg) => {
  document.getElementById("yearSelect").innerHTML = arg.years;
  document.getElementById("countrySelect").innerHTML = arg.countries;
});
