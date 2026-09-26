document.getElementById('year').textContent = new Date().getFullYear();

const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');
if (menuBtn && navLinks) {
  menuBtn.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? '✕' : '☰';
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.textContent = '☰';
  }));
}

// Ícones de linha simples (sem emoji) usados nos cards de funcionalidade,
// no cupom/rastreamento e no card de LGPD — um só lugar pra manter o
// mesmo traço em todas as páginas.
const ICONS = {
  chat: '<path d="M4 5h16v11H9.5l-4.2 4v-4H4V5Z"/>',
  menu: '<rect x="5" y="3" width="14" height="18" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/>',
  kanban: '<rect x="3" y="4" width="4.5" height="16" rx="1"/><rect x="9.75" y="4" width="4.5" height="10" rx="1"/><rect x="16.5" y="4" width="4.5" height="13" rx="1"/>',
  pin: '<path d="M12 21c-4-4-7-7.58-7-11a7 7 0 0 1 14 0c0 3.42-3 7-7 11Z"/><circle cx="12" cy="10" r="2.3"/>',
  card: '<rect x="2.5" y="5.5" width="19" height="13" rx="2"/><line x1="2.5" y1="10" x2="21.5" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
  receipt: '<path d="M6 3h12v18l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2-2 1.2V3Z"/><line x1="8.5" y1="8" x2="15.5" y2="8"/><line x1="8.5" y1="11.5" x2="15.5" y2="11.5"/><line x1="8.5" y1="15" x2="13" y2="15"/>',
  sync: '<path d="M4 12a8 8 0 0 1 14.5-4.6M20 12a8 8 0 0 1-14.5 4.6"/><polyline points="18.5 3 18.5 7.4 14.1 7.4"/><polyline points="5.5 21 5.5 16.6 9.9 16.6"/>',
  shield: '<path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3Z"/><polyline points="9 12 11 14 15 9.5"/>',
  check: '<circle cx="12" cy="12" r="9"/><polyline points="8 12.5 11 15.5 16 9"/>',
  route: '<circle cx="6" cy="6" r="2.3"/><circle cx="18" cy="18" r="2.3"/><path d="M6 8.3V13a4 4 0 0 0 4 4h4"/>',
  phoneOff: '<path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.84.32 1.72.55 2.63.65A2 2 0 0 1 22 16.92V19a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-6.53-1.75"/><path d="M9.09 9.09A16 16 0 0 1 6.5 4.63 2 2 0 0 1 8.5 2h2.09a2 2 0 0 1 2 1.72c.11.9.34 1.78.65 2.62"/><line x1="1" y1="1" x2="23" y2="23"/>',
};
document.querySelectorAll('[data-icon]').forEach((el) => {
  const svg = ICONS[el.getAttribute('data-icon')];
  if (svg) {
    el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${svg}</svg>`;
  }
});

// Botões "Assinar agora" dos planos — tenta abrir o checkout do Mercado
// Pago (via /api/mercadopago/create-preference) e, se ainda não estiver
// configurado (ou der erro), cai pro link de WhatsApp que já está no
// próprio botão (href), sem quebrar nada.
document.querySelectorAll('[data-checkout]').forEach((btn) => {
  btn.addEventListener('click', async (event) => {
    const plan = btn.getAttribute('data-checkout');
    const fallbackHref = btn.getAttribute('href');
    event.preventDefault();
    try {
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
        signal: AbortSignal.timeout(8000),
      });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
        return;
      }
    } catch {
      // segue pro fallback abaixo
    }
    window.open(fallbackHref, '_blank', 'noopener');
  });
});

// "Como funciona" da Home (seção #whatsapp-demo): cada aba roda um exemplo
// animado no celular, em loop. Passos: mensagem do cliente ("out"), loja
// "digitando…" e respondendo ("in", com botões), toque num botão ("tap") e
// troca pra tela de status da entrega com o motoboy andando no mapa
// ("track"). Só começa quando a seção aparece na tela; com "reduzir
// movimento" ligado no sistema, mostra o resultado final parado.
(function () {
  const chat = document.getElementById('waChat');
  if (!chat) return;
  const status = document.getElementById('waStatus');
  const waScreen = document.getElementById('waScreen');
  const trackScreen = document.getElementById('trackScreen');
  const bike = document.getElementById('trackBike');
  const caption = document.getElementById('demoCaption');
  const tabs = document.querySelectorAll('.demo-tab');

  const DEMOS = {
    pedido: {
      legenda: 'O cliente faz o pedido conversando normalmente no WhatsApp',
      passos: [
        { de: 'out', texto: 'Oi, boa noite! 😊' },
        { de: 'in', texto: 'Olá! Seja bem-vindo à Sua Loja 👋 Quer dar uma olhada no cardápio?', botoes: ['📖 Ver cardápio'] },
        { de: 'out', texto: 'Quero 2 cheeseburgers e uma coca' },
        { de: 'in', texto: 'Anotado! 🍔 2x Cheeseburger e 1x Coca-Cola. Total: R$ 46,00. É pra entrega ou retirada?' },
        { de: 'out', texto: 'Entrega' },
        { de: 'in', texto: 'Pedido confirmado! ✅ Chega em uns 40 minutos. Pode pagar no Pix online, com taxa 0%.', botoes: ['🛵 Acompanhar pedido'] },
      ],
    },
    automaticas: {
      legenda: 'Mensagens automáticas com botões interativos',
      passos: [
        { de: 'out', texto: 'Cardápio' },
        { de: 'in', texto: 'O cardápio está disponível no link a seguir. Se precisar de ajuda para escolher algo ou tiver alguma dúvida, é só chamar!', botoes: ['📖 Ver cardápio'] },
        { de: 'in', texto: 'Olá, Maria! Recebemos seu pedido B-4676 para amanhã, 14:00 às 15:00, e logo ele será aceito pela loja. 🙏', botoes: ['📄 Ver detalhes'] },
      ],
    },
    entrega: {
      legenda: 'Botões pra acompanhar a entrega e um mapa em tempo real',
      passos: [
        { de: 'out', texto: 'Meu pedido já está vindo?' },
        { de: 'in', texto: 'Seu pedido B-4598 está pronto e já vai sair pra entrega. 🎉' },
        { de: 'in', texto: 'Seu pedido B-4598 saiu para entrega com o entregador Carlos! 🛵', botoes: ['📍 Acompanhar pedido', '📷 Seguir no Instagram'] },
        { tap: '📍 Acompanhar pedido' },
        { track: true },
      ],
    },
    avaliacao: {
      legenda: 'Depois da entrega, o cliente é convidado a avaliar a loja',
      passos: [
        { de: 'in', texto: 'Seu pedido B-4598 foi concluído. Obrigado pela preferência! 🙏' },
        { de: 'in', texto: 'Se puder, deixa sua avaliação pra gente, ajuda muito!', botoes: ['⭐ Deixar avaliação'] },
        { de: 'out', texto: 'Tava tudo ótimo, obrigado! 😋' },
      ],
    },
  };

  const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  let execucao = 0;
  const esperar = (ms, id) => new Promise((resolve, reject) => setTimeout(() => (id === execucao ? resolve() : reject()), ms));

  function mostrarChat() {
    trackScreen.hidden = true;
    waScreen.hidden = false;
    chat.innerHTML = '';
    if (status) status.textContent = 'online';
  }

  function balao(msg) {
    const el = document.createElement('div');
    el.className = 'wa-msg ' + msg.de;
    el.appendChild(document.createTextNode(msg.texto));
    (msg.botoes || []).forEach((texto) => {
      const b = document.createElement('span');
      b.className = 'wa-btn';
      b.textContent = texto;
      el.appendChild(b);
    });
    const t = document.createElement('time');
    t.textContent = hora();
    el.appendChild(t);
    chat.appendChild(el);
    // Com a conversa alinhada por baixo, o que passa do topo não entra no
    // scrollHeight; soma as alturas e tira as mensagens mais antigas.
    const altura = () => [...chat.children].reduce((t, c) => t + c.offsetHeight + 6, 0);
    while (altura() > chat.clientHeight - 20 && chat.children.length > 1) chat.removeChild(chat.firstChild);
  }

  // Motoboy anda pelo trajeto tracejado do mapa até a casa do cliente.
  const ROTA = [[30, 101], [85, 101], [85, 51], [175, 51], [175, 34]];
  function posicaoNaRota(p) {
    const trechos = ROTA.slice(1).map((pt, i) => Math.hypot(pt[0] - ROTA[i][0], pt[1] - ROTA[i][1]));
    let resto = p * trechos.reduce((a, b) => a + b, 0);
    for (let i = 0; i < trechos.length; i++) {
      if (resto <= trechos[i]) {
        const f = resto / trechos[i];
        return [ROTA[i][0] + (ROTA[i + 1][0] - ROTA[i][0]) * f, ROTA[i][1] + (ROTA[i + 1][1] - ROTA[i][1]) * f];
      }
      resto -= trechos[i];
    }
    return ROTA[ROTA.length - 1];
  }
  function moverMoto(p) {
    const [x, y] = posicaoNaRota(p);
    bike.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
  }
  function andarMoto(duracao, id) {
    return new Promise((resolve, reject) => {
      const inicio = performance.now();
      (function quadro(agora) {
        if (id !== execucao) return reject();
        const p = Math.min((agora - inicio) / duracao, 1);
        moverMoto(p);
        if (p < 1) requestAnimationFrame(quadro);
        else resolve();
      })(inicio);
    });
  }
  function mostrarStatus() {
    waScreen.hidden = true;
    trackScreen.hidden = false;
    moverMoto(0);
  }

  function mostrarParado(demo) {
    mostrarChat();
    const temMapa = demo.passos.some((p) => p.track);
    if (temMapa) { mostrarStatus(); moverMoto(0.6); return; }
    demo.passos.filter((p) => p.de).forEach(balao);
  }

  async function rodar(chave) {
    const id = ++execucao;
    const demo = DEMOS[chave];
    if (caption) caption.textContent = demo.legenda;
    if (reduzido) return mostrarParado(demo);
    try {
      for (;;) {
        mostrarChat();
        await esperar(600, id);
        for (const passo of demo.passos) {
          if (passo.tap) {
            await esperar(900, id);
            const alvo = [...chat.querySelectorAll('.wa-btn')].find((b) => b.textContent === passo.tap);
            if (alvo) alvo.classList.add('tap');
            await esperar(1100, id);
          } else if (passo.track) {
            mostrarStatus();
            await esperar(600, id);
            await andarMoto(6000, id);
            await esperar(1500, id);
          } else if (passo.de === 'in') {
            const digitando = document.createElement('div');
            digitando.className = 'wa-typing';
            digitando.innerHTML = '<span></span><span></span><span></span>';
            chat.appendChild(digitando);
            if (status) status.textContent = 'digitando…';
            await esperar(1200, id);
            digitando.remove();
            if (status) status.textContent = 'online';
            balao(passo);
            await esperar(1500, id);
          } else {
            await esperar(800, id);
            balao(passo);
            await esperar(600, id);
          }
        }
        await esperar(3000, id);
      }
    } catch (e) {
      // Outra aba foi escolhida: esta execução para aqui.
    }
  }

  let atual = 'pedido';
  let visivel = false;
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => { t.classList.toggle('active', t === tab); t.setAttribute('aria-selected', String(t === tab)); });
      atual = tab.dataset.demo;
      if (visivel) rodar(atual);
    });
  });

  const observador = new IntersectionObserver((entradas) => {
    if (entradas.some((e) => e.isIntersecting)) {
      observador.disconnect();
      visivel = true;
      rodar(atual);
    }
  }, { threshold: 0.3 });
  observador.observe(chat);
})();
