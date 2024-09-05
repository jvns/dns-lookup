var app;
window.addEventListener('DOMContentLoaded', (event) => {
Vue.component('tracestep', {
  template: '#trace-step',
  props: ['title', 'records', "ns", "domain"],
})
Vue.component('recordlist', {
  template: '#recordlist',
  props: ['records'],
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
      rootServers: undefined,
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
    app.rootServers = [
        "198.41.0.4",
        "170.247.170.2",
        "192.33.4.12",
        "199.7.91.13",
        "192.203.230.10",
        "192.5.5.241",
        "192.112.36.4",
        "198.97.190.53",
        "192.36.148.17",
        "192.58.128.30",
        "193.0.14.129",
        "199.7.83.42",
        "202.12.27.33",
    ]
    app.domain = domain;
    app.rootNS = app.rootServers[Math.floor(Math.random() * app.rootServers.length)];
    app.rootResponses = await query(domain, app.rootNS);
    app.tldNS = app.rootResponses['authority'][0]['value'];
    // Do a 500ms sleep here just to make it "feel" more like there are 3
    // different stages and like it's happening "live".
    // Without the replies come back too fast!
    await new Promise(r => setTimeout(r, 500));
    app.tldResponses = await query(domain, app.tldNS);
    app.authNS = app.tldResponses['authority'][0]['value'];
    await new Promise(r => setTimeout(r, 500));
    app.authResponses = await query(domain, app.authNS);
}
