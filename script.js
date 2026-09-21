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
};
document.querySelectorAll('[data-icon]').forEach((el) => {
  const svg = ICONS[el.getAttribute('data-icon')];
  if (svg) {
    el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${svg}</svg>`;
  }
});
