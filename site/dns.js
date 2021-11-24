var app;
window.addEventListener('DOMContentLoaded', (event) => {
app = new Vue({
  el: '#app',
  data: {
      results: [],
      requestID: undefined,
  },
  computed: {
      sortedResults: function() {
          return this.results.sort(function(a,b){
              return a.type.toUpperCase() < b.type.toUpperCase()? -1:1;
          });
      }
  }
})
loadFromHash();
})

function makeid(length) {
   // copied from stackoverflow :)
   // https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

window.onhashchange = loadFromHash;
function loadFromHash() {
    if (!window.location.hash) {
        return;
    }
    const hash = decodeURIComponent(window.location.hash.substring(1));
    const parts = hash.split('|');
    const domain = parts[0];
    const type = parts[1];
    document.getElementById('domain').value = domain;
    if (type == "all-the-records") {
        lookupAll(domain);
    } else {
        lookupInner(type, domain, false);
    }
    document.getElementById(type.toUpperCase()).checked=true;
}

function formSubmit(event) {
    event.preventDefault();
    let element = document.querySelector('input[name="type"]:checked');
    if (!element) {
        element = document.getElementById('ALL-THE-RECORDS');
        element.checked = true;
    }
    lookup(element);
}

function getDomain(url) {
  url = url.trim();
  // Protocol
  if (url.includes("://")) {
    url = url.slice(url.indexOf("://") + 3);
  }
  // Path
  if (url.includes("/")) {
    url = url.slice(0, url.indexOf("/"));
  }
  // Port
  if (url.includes(":")) {
    url = url.slice(0, url.indexOf(":"));
  }
  return url;
}

function lookup(element) {
    var requestID = makeid(10);
    app.requestID = requestID;
    const url = document.getElementById('domain').value;
    const domain = getDomain(url);
    document.getElementById('domain').value = domain;
    const type = element.id.toLowerCase();
    if (type == 'all-the-records') {
        lookupAll(domain, requestID);
        window.location.hash = domain + '|' + 'all-the-records';
    } else {
        lookupInner(type, domain, false, requestID);
        window.location.hash = domain + '|' + type.toUpperCase();
    }
}

function lookupAll(domain, requestID) {
    app.results = [];
    const all = ['a', 'aaaa', 'caa', 'cname', 'mx', 'naptr', 'ns', 'ptr', 'soa', 'srv', 'txt'];
    for (var i = 0; i < all.length; i++) {
        const type = all[i];
        lookupInner(type, domain, true, requestID);
    }
}

async function lookupInner(type, domain, append, requestID) {
    const host = location.hostname === "localhost" ? "https://dns-lookup-fun.netlify.app" : "";
    const url = host + "/.netlify/functions/dns"
    if (!domain.endsWith('.')) {
        domain += '.';
    }
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: domain,
            type: type.toLowerCase(),
        }),
    });
    const responses = await response.json();
    const answers = responses["answer"];
    if (app.requestID != requestID) {
        // there was another request made already and this answer's not wanted
        // anymore, don't display it
        return;
    }
    const result = {
        type: type.toUpperCase(),
        answers: answers,
    };
    if (append) {
        app.results.push(result);
    } else {
        app.results = [result];
    }
}
