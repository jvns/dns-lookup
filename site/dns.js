var app;
window.addEventListener('DOMContentLoaded', (event) => {
app = new Vue({
  el: '#app',
  data: {
      results: [],
  },
  computed: {
      sortedResults: function() {
          return this.results.sort(function(a,b){
              return a.type.toUpperCase() < b.type.toUpperCase()? -1:1;
              return x;
          });
      }
  }
})
loadFromHash();
})

function loadFromHash() {
    if (!window.location.hash) {
        return;
    }
    const hash = window.location.hash.substring(1);
    const parts = hash.split('|');
    const domain = parts[0];
    const type = parts[1];
    document.getElementById('domain').value = domain;
    if (type == "all-the-records") {
        lookupAll(domain);
    } else {
        lookupInner(type, domain, false);
    }
}

function lookup(element) {
    const domain = document.getElementById('domain').value;
    if (element.id == 'all-the-records') {
        lookupAll(domain);
        window.location.hash = domain + '|' + 'all-the-records';
    } else {
        const type = element.value.toLowerCase();
        lookupInner(type, domain, false);
        window.location.hash = domain + '|' + type.toUpperCase();
    }
}

function lookupAll(domain) {
    app.results = [];
    const all = ['a', 'aaaa', 'caa', 'cname', 'mx', 'ns', 'ptr', 'soa', 'srv', 'txt'];
    for (var i = 0; i < all.length; i++) {
        const type = all[i];
        lookupInner(type, domain, true);
    }
}

async function lookupInner(type, domain, append) {
    const url = "/.netlify/functions/dns"
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: domain + '.',
            type: type.toLowerCase(),
        }),
    });
    const answers = await response.json();
    const result = {
        type: type.toUpperCase(),
        answer: answers.join("\n"),
    };
    if (append) {
        app.results.push(result);
    } else {
        app.results = [result];
    }
}
