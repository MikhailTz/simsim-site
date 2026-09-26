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
  const subtabs = document.querySelectorAll('.demo-subtab');
  const linhaSub = document.getElementById('demoSubtabs');
  const painelScreen = document.getElementById('painelScreen');
  const pnList = document.getElementById('pnList');
  const pnCount = document.getElementById('pnCount');
  const aparelho = document.querySelector('.wa-demo');
  const gestor = document.getElementById('gestorDemo');

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
        { de: 'out', texto: 'Oi! Meu pedido já tá saindo? 😊' },
        { de: 'in', texto: 'Seu pedido B-4598 está sendo preparado agora! 👨‍🍳' },
        { de: 'in', texto: 'Seu pedido B-4598 está pronto e já vai sair pra entrega. 🎉' },
        { de: 'in', texto: 'Seu pedido B-4598 saiu para entrega com o entregador Carlos! 🛵', botoes: ['📍 Acompanhar pedido', '📷 Seguir no Instagram'] },
        { tap: '📍 Acompanhar pedido' },
        { track: true },
        { voltar: true },
        { de: 'out', texto: 'Chegou! Obrigada 😍' },
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
    'loja-gestor': {
      legenda: 'A loja escolhe as entregas no mapa, seleciona o motoboy e despacha',
      tela: 'gestor',
    },
    'loja-whats': {
      legenda: 'O motoboy recebe a rota com todos os pedidos no WhatsApp da loja',
      passos: [
        { de: 'in', texto: 'Rota de entrega: 2 pedidos\n\n1. B-4803 · Maria (21 99999-0101)\n   Rua das Palmeiras, 80, Centro\n   Cobrar: R$ 58,00 (Pix)\n\n2. B-4797 · João (21 99999-0202)\n   Rua do Sol, 12, Jardim\n   Já pago, não precisa cobrar', botoes: ['🗺️ Abrir rota completa'] },
        { de: 'out', texto: '👍 Saindo agora!' },
      ],
    },
    'loja-painel': {
      legenda: 'No site do motoboy, as entregas despachadas aparecem sozinhas em "Em entrega"',
      tela: 'painel',
    },
  };

  const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  let execucao = 0;
  const esperar = (ms, id) => new Promise((resolve, reject) => setTimeout(() => (id === execucao ? resolve() : reject()), ms));

  function mostrarChat(limpar = true) {
    trackScreen.hidden = true;
    painelScreen.hidden = true;
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
    painelScreen.hidden = true;
    trackScreen.hidden = false;
    moverMoto(0);
  }

  function mostrarParado(demo) {
    if (demo.tela === 'gestor') { resetGestor(); despachadoNoGestor(); return; }
    if (demo.tela === 'painel') { mostrarPainel(); pnList.innerHTML = ''; CLIENTES.forEach((c) => pnList.appendChild(cardPainel(c))); pnCount.textContent = '2 pedidos'; return; }
    mostrarChat();
    const temMapa = demo.passos.some((p) => p.track);
    if (temMapa) { mostrarStatus(); moverMoto(0.6); return; }
    demo.passos.filter((p) => p.de).forEach(balao);
  }

  // ---- Aba "Entregas" -------------------------------------------------
  // Os mesmos dois clientes nas três visões (Gestor, WhatsApp e site do
  // motoboy), pra ficar claro que é a mesma entrega passando de mão em mão.
  const CLIENTES = [
    { num: 'B-4803', nome: 'Maria', end: 'Rua das Palmeiras, 80, Centro', valor: 'R$ 58,00', pag: 'Pix', pago: false, fim: '5 min restantes' },
    { num: 'B-4797', nome: 'João', end: 'Rua do Sol, 12, Jardim', valor: 'R$ 71,50', pag: 'Dinheiro', pago: true, fim: '9 min restantes' },
  ];
  const g = (id) => document.getElementById(id);
  const gdCanvas = g('gdCanvas');
  const prepOriginal = g('gdPrep').innerHTML;
  const entOriginal = g('gdEnt').innerHTML;

  function palco(qual) {
    gestor.hidden = qual !== 'gestor';
    aparelho.hidden = qual === 'gestor';
    if (qual === 'gestor') escalarGestor();
  }
  // A tela do Gestor é desenhada em 720x420 e reduzida pra largura disponível.
  function escalarGestor() {
    const largura = gestor.clientWidth - 20;
    gestor.style.setProperty('--gd-s', String(Math.min(1, largura / 720)));
  }
  window.addEventListener('resize', () => { if (!gestor.hidden) escalarGestor(); });

  function centro(el) {
    const c = gdCanvas.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const escala = c.width / 720;
    return [(r.left - c.left + r.width / 2) / escala, (r.top - c.top + r.height / 2) / escala];
  }
  async function clicar(el, id) {
    const [x, y] = centro(el);
    const cursor = g('gdCursor');
    cursor.style.left = x - 4 + 'px';
    cursor.style.top = y - 2 + 'px';
    await esperar(900, id);
    el.classList.add('press');
    await esperar(180, id);
    el.classList.remove('press');
  }

  function resetGestor() {
    g('gdMap').hidden = true;
    g('gdRoute').hidden = true;
    g('gdToast').hidden = true;
    g('gdRouteList').innerHTML = '';
    g('gdPrep').innerHTML = prepOriginal;
    g('gdEnt').innerHTML = entOriginal;
    g('gdPrepCount').textContent = '3';
    g('gdEntCount').textContent = '0';
    const sel = g('gdSelect');
    sel.textContent = 'Selecione um motoboy…';
    sel.classList.remove('done');
    g('gdDispatch').classList.remove('ok');
    ['pinMaria', 'pinJoao'].forEach((pid) => { g(pid).classList.remove('sel'); g(pid).querySelector('i').textContent = ''; });
    const cursor = g('gdCursor');
    cursor.style.transition = 'none';
    cursor.style.left = '640px';
    cursor.style.top = '380px';
    void cursor.offsetWidth;
    cursor.style.transition = '';
  }

  function cardEntrega(c) {
    const el = document.createElement('div');
    el.className = 'gd-card';
    el.innerHTML = '<b>' + c.num + '</b><span>' + c.nome + '</span><small>🛵 Carlos</small><em>' + c.valor + '</em>';
    return el;
  }
  function despachadoNoGestor() {
    g('gdPrep').querySelectorAll('[data-cli]').forEach((el) => el.remove());
    g('gdPrepCount').textContent = '1';
    const ent = g('gdEnt');
    ent.innerHTML = '';
    CLIENTES.forEach((c) => ent.appendChild(cardEntrega(c)));
    g('gdEntCount').textContent = '2';
  }

  function paradaNaRota(c, n) {
    const el = document.createElement('div');
    el.className = 'gd-stop';
    el.innerHTML = '<i>' + n + '</i><span><b>' + c.num + '</b><small>' + c.end.split(',').slice(0, 2).join(',') + '</small><small>🕒 ' + c.fim + '</small></span>';
    g('gdRouteList').appendChild(el);
    g('gdRouteCount').textContent = n + (n === 1 ? ' pedido na rota' : ' pedidos na rota');
  }

  async function rodarGestor(id) {
    resetGestor();
    await esperar(800, id);
    await clicar(g('gdMapBtn'), id);
    g('gdMap').hidden = false;
    await esperar(700, id);
    const pins = [g('pinMaria'), g('pinJoao')];
    for (let i = 0; i < pins.length; i++) {
      await clicar(pins[i], id);
      pins[i].classList.add('sel');
      pins[i].querySelector('i').textContent = String(i + 1);
      g('gdRoute').hidden = false;
      paradaNaRota(CLIENTES[i], i + 1);
      await esperar(500, id);
    }
    await clicar(g('gdSelect'), id);
    g('gdSelect').textContent = 'Carlos';
    g('gdSelect').classList.add('done');
    g('gdDispatch').classList.add('ok');
    await esperar(400, id);
    await clicar(g('gdDispatch'), id);
    g('gdToast').hidden = false;
    await esperar(1500, id);
    g('gdMap').hidden = true;
    await esperar(300, id);
    despachadoNoGestor();
    await esperar(3000, id);
  }

  function cardPainel(c) {
    const el = document.createElement('div');
    el.className = 'pn-card';
    el.innerHTML = '<div class="pn-card-top"><span>' + c.num + '</span><span>agora</span></div>' +
      '<div class="pn-card-name"><b>' + c.nome + '</b><span>💬</span></div><small>📍 ' + c.end + '</small>' +
      '<div class="pn-card-pay"><span>' + c.valor + '</span><em class="' + (c.pago ? 'pago">' + c.pag + ' · Já pago' : 'cobrar">' + c.pag + ' · A cobrar') + '</em></div>';
    return el;
  }
  function mostrarPainel() {
    waScreen.hidden = true;
    trackScreen.hidden = true;
    painelScreen.hidden = false;
    pnList.innerHTML = '<p class="pn-empty">Nenhuma entrega sua em andamento.</p>';
    pnCount.textContent = '0 pedidos';
  }
  async function rodarPainel(id) {
    mostrarPainel();
    await esperar(1400, id);
    pnList.innerHTML = '';
    for (let i = 0; i < CLIENTES.length; i++) {
      pnList.appendChild(cardPainel(CLIENTES[i]));
      pnCount.textContent = (i + 1) + (i === 0 ? ' pedido' : ' pedidos');
      await esperar(1300, id);
    }
    await esperar(3000, id);
  }

  async function rodar(chave) {
    const id = ++execucao;
    const demo = DEMOS[chave];
    if (caption) caption.textContent = demo.legenda;
    palco(demo.tela === 'gestor' ? 'gestor' : 'celular');
    if (reduzido) return mostrarParado(demo);
    try {
      if (demo.tela) {
        await (demo.tela === 'gestor' ? rodarGestor(id) : rodarPainel(id));
        selecionar(ORDEM[(ORDEM.indexOf(chave) + 1) % ORDEM.length]);
        return;
      }
      {
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
        // Terminou a história: passa sozinho pra próxima aba, assim quem só
        // fica olhando vê todos os exemplos sem precisar tocar em nada.
        selecionar(ORDEM[(ORDEM.indexOf(chave) + 1) % ORDEM.length]);
        return;
      }
    } catch (e) {
      // Outra aba foi escolhida: esta execução para aqui.
    }
  }

  const ORDEM = [...tabs].map((t) => t.dataset.demo).filter((k) => DEMOS[k]).concat([...subtabs].map((t) => t.dataset.demo));
  const linhaAbas = document.querySelector('.demo-tabs');
  let atual = ORDEM[0];
  let visivel = false;

  function selecionar(chave) {
    atual = chave;
    const grupo = chave.split('-')[0];
    if (linhaSub) linhaSub.hidden = grupo !== 'loja';
    subtabs.forEach((t) => t.classList.toggle('active', t.dataset.demo === chave));
    tabs.forEach((t) => {
      const ativa = t.dataset.demo === grupo;
      t.classList.toggle('active', ativa);
      t.setAttribute('aria-selected', String(ativa));
      // No celular as abas ficam numa linha que desliza: centraliza a aba
      // ativa só nessa linha (sem mexer na rolagem da página).
      if (ativa && linhaAbas && linhaAbas.scrollWidth > linhaAbas.clientWidth) {
        linhaAbas.scrollTo({ left: t.offsetLeft - (linhaAbas.clientWidth - t.offsetWidth) / 2, behavior: 'smooth' });
      }
    });
    if (visivel) rodar(chave);
  }

  tabs.forEach((tab) => tab.addEventListener('click', () => selecionar(tab.dataset.demo === 'loja' ? 'loja-gestor' : tab.dataset.demo)));
  subtabs.forEach((tab) => tab.addEventListener('click', () => selecionar(tab.dataset.demo)));

  // Deslizar o dedo pro lado em cima do celular (ou da tela do Gestor)
  // troca de aba.
  let toqueX = null;
  let toqueY = null;
  const inicioToque = (e) => { toqueX = e.touches[0].clientX; toqueY = e.touches[0].clientY; };
  const fimToque = (e) => {
    if (toqueX === null) return;
    const dx = e.changedTouches[0].clientX - toqueX;
    const dy = e.changedTouches[0].clientY - toqueY;
    toqueX = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const i = ORDEM.indexOf(atual);
    selecionar(ORDEM[(i + (dx < 0 ? 1 : -1) + ORDEM.length) % ORDEM.length]);
  };
  [aparelho, gestor].forEach((el) => {
    el.addEventListener('touchstart', inicioToque, { passive: true });
    el.addEventListener('touchend', fimToque, { passive: true });
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
