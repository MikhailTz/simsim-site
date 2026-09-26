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
  const corpo = document.getElementById('waBody');
  const status = document.getElementById('waStatus');
  const waScreen = document.getElementById('waScreen');
  const trackScreen = document.getElementById('trackScreen');
  const bike = document.getElementById('trackBike');
  const caption = document.getElementById('demoCaption');
  const tabs = document.querySelectorAll('.demo-tab');

  // Textos iguais aos padrões das mensagens automáticas do sistema
  // (lib/messageTemplates.ts e orderStatusMessages.ts no simsim-app).
  // "card" desenha um cartão dentro do balão: local (pino no mapa),
  // horarios (tabela da semana) ou comprovante (Pix).
  const DEMOS = {
    atendimento: {
      legenda: 'Respostas automáticas pras perguntas mais comuns, a qualquer hora',
      passos: [
        { de: 'out', texto: 'Oi, boa tarde! Quero o cardápio' },
        { de: 'in', texto: 'Boa tarde, Maria! Que bom te ver por aqui 😊 Esse é o cardápio completo da Sua Loja. Pra fazer seu pedido, é só escolher os itens direto por lá:', botoes: ['📖 Ver cardápio'] },
        { de: 'out', texto: 'Vocês estão abertos?' },
        { de: 'in', texto: 'Estamos abertos agora! 🟢 Funcionamos até 22:00.', card: 'horarios' },
        { de: 'out', texto: 'Qual o endereço de vocês?' },
        { de: 'in', texto: 'Aqui está nossa localização 📍', card: 'local' },
        { de: 'out', texto: 'Quanto fica a entrega pra Rua das Palmeiras?' },
        { de: 'in', texto: 'Pra Rua das Palmeiras a taxa de entrega fica R$ 6,00 🛵 Chega em 30 a 40 minutos.' },
        { de: 'out', texto: 'Aceita Pix?' },
        { de: 'in', texto: 'Aceitamos: Pix, Pix online (taxa 0%), Cartão de crédito, Dinheiro.' },
        { de: 'out', texto: 'Tem pedido mínimo?' },
        { de: 'in', texto: 'O pedido mínimo é R$ 30,00.' },
      ],
    },
    pedido: {
      legenda: 'O pedido é anotado sozinho e a loja só confere antes de aceitar',
      passos: [
        { de: 'out', texto: 'Oi, boa noite! 😊' },
        { de: 'in', texto: 'Olá! Seja bem-vindo à Sua Loja 👋 Quer dar uma olhada no cardápio?', botoes: ['📖 Ver cardápio'] },
        { de: 'out', texto: 'Quero 2 cheeseburgers e uma coca, pra entregar na Rua das Palmeiras, 80' },
        { de: 'in', texto: 'Seu pedido foi anotado! ✍️\n2x Cheeseburger e 1x Coca-Cola 2L, total R$ 58,00 com a entrega.\nSó aguardando um atendente conferir antes de ser aceito 🙏' },
        { de: 'in', pausa: 2200, texto: 'Olá, Maria! Seu pedido foi confirmado e será preparado para entrega em breve 🥰', botoes: ['📦 Ver status'] },
        { de: 'out', texto: 'Obrigada! 😍' },
      ],
    },
    confirmado: {
      legenda: 'O cliente acompanha o pedido e recebe o resumo completo, com endereço e pagamento',
      passos: [
        { de: 'out', texto: 'Oi! Quero acompanhar o pedido B-4676' },
        { de: 'in', texto: 'Oi, Maria! Segue o link pra você acompanhar os detalhes e o status do seu pedido B-4676:', botoes: ['📦 Ver status'] },
        { de: 'in', texto: 'Olá, Maria! Seu pedido foi confirmado e será preparado para entrega em breve 🥰\n---\n*Produtos*\n*2x Cheeseburger*   R$ 40,00\n*1x Coca-Cola 2L*   R$ 12,00\n---\nR$ 52,00 Total dos produtos\nR$ 6,00 Taxa de entrega\n*R$ 58,00 Total*\nForma de pagamento: Pix\n---\nBairro: Centro\nRua: Rua das Palmeiras, 80\nObrigado pela preferência 😉\nPedido B-4676' },
        { de: 'out', texto: 'Paguei!', card: 'comprovante' },
        { de: 'in', texto: 'Recebemos a confirmação do pagamento de R$ 58,00 do seu pedido B-4676, tudo quitado, obrigado! 🙏' },
      ],
    },
    entrega: {
      legenda: 'Cada etapa avisada no WhatsApp, com o mapa da entrega em tempo real',
      passos: [
        { de: 'in', texto: 'Seu pedido B-4598 está sendo preparado agora! 👨‍🍳' },
        { de: 'in', texto: 'Seu pedido B-4598 está pronto e já vai sair pra entrega. 🎉' },
        { de: 'in', texto: 'Seu pedido B-4598 saiu para entrega com o entregador Carlos! 🛵', botoes: ['📍 Acompanhar pedido', '📷 Seguir no Instagram'] },
        { tap: '📍 Acompanhar pedido' },
        { track: true },
        { voltar: true },
        { de: 'in', texto: 'Seu pedido B-4598 foi concluído. Obrigado pela preferência! 🙏' },
        { de: 'in', texto: 'Se puder, deixa sua avaliação pra gente, ajuda muito!', botoes: ['⭐ Deixar avaliação'] },
      ],
    },
    retirada: {
      legenda: 'O cliente prefere buscar? O pedido vira retirada e o valor é ajustado sozinho',
      passos: [
        { de: 'in', texto: 'Olá, Maria! Seu pedido foi confirmado e será preparado para entrega em breve 🥰', botoes: ['📦 Ver status'] },
        { de: 'out', texto: 'Posso buscar meu pedido aí na loja?' },
        { de: 'in', texto: 'Pode sim! 😊 Já vou ajustar seu pedido pra retirada.' },
        { de: 'in', texto: 'Seu pedido B-4702 foi ajustado pra retirada na loja e já está pronto pra você buscar! 🎉\nTaxa de entrega removida, novo valor total: R$ 52,00.' },
        { de: 'in', texto: 'Aqui está nossa localização 📍', card: 'local' },
        { de: 'out', texto: 'Beleza, passo aí em 10 minutos 👍' },
      ],
    },
  };

  const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  let execucao = 0;
  const esperar = (ms, id) => new Promise((resolve, reject) => setTimeout(() => (id === execucao ? resolve() : reject()), ms));

  function mostrarChat(limpar = true) {
    trackScreen.hidden = true;
    waScreen.hidden = false;
    if (limpar) chat.innerHTML = '';
    if (status) status.textContent = 'online';
    corpo.scrollTop = corpo.scrollHeight;
  }

  function card(tipo) {
    const el = document.createElement('span');
    if (tipo === 'local') {
      el.innerHTML = '<span class="wa-card-map"></span><span class="wa-card-title">Sua Loja</span><span class="wa-card-sub">Rua do Comércio, 45, Centro</span>';
    } else if (tipo === 'horarios') {
      el.className = 'wa-hours';
      [['Seg a Sex', '11:00 às 22:00'], ['Sábado', '11:00 às 23:00'], ['Domingo', '17:00 às 22:00']].forEach(([d, h]) => {
        el.insertAdjacentHTML('beforeend', '<span>' + d + '</span><span>' + h + '</span>');
      });
    } else if (tipo === 'comprovante') {
      el.className = 'wa-receipt';
      el.innerHTML = '<small>Comprovante Pix</small><b>R$ 58,00</b><small>Para: Sua Loja</small>';
    }
    return el;
  }

  // Texto com *negrito* (como no WhatsApp) e linhas "---" viram separador.
  function texto(el, conteudo) {
    conteudo.split('\n').forEach((linha, i, linhas) => {
      if (linha === '---') { const sep = document.createElement('span'); sep.className = 'wa-sep'; el.appendChild(sep); return; }
      linha.split('*').forEach((parte, k) => {
        if (!parte) return;
        if (k % 2) { const b = document.createElement('b'); b.textContent = parte; el.appendChild(b); }
        else el.appendChild(document.createTextNode(parte));
      });
      if (i < linhas.length - 1 && linhas[i + 1] !== '---') el.appendChild(document.createTextNode('\n'));
    });
  }

  function balao(msg) {
    const el = document.createElement('div');
    el.className = 'wa-msg ' + msg.de;
    if (msg.card === 'local' || msg.card === 'comprovante') el.appendChild(card(msg.card));
    texto(el, msg.texto);
    if (msg.card === 'horarios') el.appendChild(card(msg.card));
    (msg.botoes || []).forEach((t) => {
      const b = document.createElement('span');
      b.className = 'wa-btn';
      b.textContent = t;
      el.appendChild(b);
    });
    const t = document.createElement('time');
    t.textContent = hora();
    el.appendChild(t);
    chat.appendChild(el);
    rolarProFim();
  }

  // Mantém o histórico: a conversa sobe e a tela acompanha a última mensagem.
  function rolarProFim() {
    corpo.scrollTo({ top: corpo.scrollHeight, behavior: reduzido ? 'auto' : 'smooth' });
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
          } else if (passo.voltar) {
            mostrarChat(false);
            await esperar(500, id);
          } else if (passo.track) {
            mostrarStatus();
            await esperar(600, id);
            await andarMoto(6000, id);
            await esperar(1500, id);
          } else if (passo.de === 'in') {
            const digitando = document.createElement('div');
            digitando.className = 'wa-typing';
            digitando.innerHTML = '<span></span><span></span><span></span>';
            if (passo.pausa) await esperar(passo.pausa, id);
            chat.appendChild(digitando);
            rolarProFim();
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

  let atual = 'atendimento';
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
