var app;
window.addEventListener('DOMContentLoaded', (event) => {
Vue.component('tracestep', {
  template: '#trace-step',
  props: ['title', 'records', "ns", "domain"],
})
app = new Vue({
  el: '#app',
  data: {
      domain: undefined,
      rootNS: undefined,
      authNS: undefined,
      tldNS: undefined,
      rootResponses: undefined,
      tldResponses: undefined,
      authResponses: undefined,
  },
  computed: {
      root: function() {
          if (!this.rootResponses) {
              return undefined;
          }
          return this.rootResponses.authority;
      },
      tld: function() {
          if (!this.tldResponses) {
              return undefined;
          }
          return this.tldResponses.authority;
      },
      auth: function() {
          if (!this.authResponses) {
              return undefined;
          }
          return this.authResponses.answer;
      },
  },
})
loadFromHash();
})

window.onhashchange = loadFromHash;
function loadFromHash() {
    if (!window.location.hash) {
        return;
    }
    const domain = decodeURIComponent(window.location.hash.substring(1));
    document.getElementById('trace').checked=true;
    trace(domain)
}


function formSubmit(event) {
    event.preventDefault();
    buttonHandler();
}

function buttonHandler() {
    const domain = document.getElementById('domain').value
    trace(domain);
}

async function query(domain, server) {
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
            server: server,
            type: "A",
        }),
    });
    const responses = await response.json();
    return responses;
}

async function clear() {
    app.domain = undefined;
    app.rootNS = undefined;
    app.rootResponses = undefined;
    app.tldNS = undefined;
    app.tldResponses = undefined;
    app.authNS = undefined;
    app.authResponses = undefined;
}

async function trace(domain) {
    // update everything just to make sure
    window.location.hash = domain;
    document.getElementById('domain').value = domain;
    clear();
    app.domain = domain;
    app.rootNS =  "192.203.230.10"
    app.rootResponses = await query(domain, app.rootNS);
    app.tldNS = app.rootResponses['authority'][0]['value'];
    app.tldResponses = await query(domain, app.tldNS);
    app.authNS = app.tldResponses['authority'][0]['value'];
    app.authResponses = await query(domain, app.authNS);
}
