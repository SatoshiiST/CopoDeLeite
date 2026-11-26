const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveals = document.querySelectorAll('.reveal');

if (reducedMotion || !('IntersectionObserver' in window)) {
  reveals.forEach((element) => element.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const siblings = [...entry.target.parentElement.children].filter((child) => child.classList.contains('reveal'));
      const index = siblings.indexOf(entry.target);
      entry.target.style.setProperty('--reveal-delay', `${Math.max(0, index) * 85}ms`);
      entry.target.classList.add('is-visible');
      activeObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  reveals.forEach((element) => observer.observe(element));
}

const progress = document.querySelector('.scroll-progress span');
const heroPhoto = document.querySelector('.hero-photo');
const siteHeader = document.querySelector('.site-header');
let scrollFrame = 0;

function updateScrollMotion() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progressValue = scrollable > 0 ? window.scrollY / scrollable : 0;
  if (progress) progress.style.transform = `scaleX(${progressValue})`;

  if (heroPhoto) {
    const heroProgress = Math.max(0, Math.min(window.scrollY / (heroPhoto.offsetHeight * 1.2), 1));
    heroPhoto.style.setProperty('--hero-shift', `${heroProgress * 38}px`);
    heroPhoto.style.setProperty('--hero-scale', `${1.035 + heroProgress * 0.15}`);
  }
  document.querySelectorAll('.menu-card-photo').forEach((photo) => {
    const bounds = photo.getBoundingClientRect();
    const distance = (window.innerHeight / 2 - (bounds.top + bounds.height / 2)) / window.innerHeight;
    photo.style.setProperty('--scroll-drift', `${Math.max(-7, Math.min(7, distance * 9))}px`);
  });
  scrollFrame = 0;
}

function updateHeaderBlur() {
  if (!siteHeader) return;
  const progress = Math.max(0, Math.min(window.scrollY / 180, 1));
  siteHeader.classList.toggle('is-scrolled', window.scrollY > 4);
  siteHeader.style.setProperty('--header-blur', `${progress * 14}px`);
  siteHeader.style.setProperty('--header-opacity', `${1 - progress * 0.2}`);
  siteHeader.style.setProperty('--header-shadow', `${progress * 0.07}`);
}

window.addEventListener('scroll', updateHeaderBlur, { passive: true });
updateHeaderBlur();

const menuToggle = document.querySelector('.mobile-menu-toggle');
const primaryNavigation = document.querySelector('#primary-navigation');

function setMenuOpen(open) {
  if (!siteHeader || !menuToggle) return;
  siteHeader.classList.toggle('menu-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
}

menuToggle?.addEventListener('click', () => {
  setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
});
primaryNavigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenuOpen(false)));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenuOpen(false);
});

if (!reducedMotion) {
  window.addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(updateScrollMotion);
  }, { passive: true });
  updateScrollMotion();

  document.querySelectorAll('.product-photo').forEach((photo) => {
    const card = photo.closest('.product');
    if (!card) return;

    card.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const bounds = photo.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      photo.style.setProperty('--pointer-x', `${x * 100}%`);
      photo.style.setProperty('--pointer-y', `${y * 100}%`);
      photo.style.setProperty('--tilt-x', `${(x - 0.5) * 5}deg`);
      photo.style.setProperty('--tilt-y', `${(0.5 - y) * 4}deg`);
    });

    card.addEventListener('pointerleave', () => {
      photo.style.setProperty('--tilt-x', '0deg');
      photo.style.setProperty('--tilt-y', '0deg');
    });
  });
  document.addEventListener('pointerdown', (event) => {
    const button = event.target.closest('button, .button');
    if (!button) return;
    const bounds = button.getBoundingClientRect();
    button.style.setProperty('--tap-x', `${event.clientX - bounds.left}px`);
    button.style.setProperty('--tap-y', `${event.clientY - bounds.top}px`);
    button.classList.remove('tap-feedback');
    requestAnimationFrame(() => button.classList.add('tap-feedback'));
    window.setTimeout(() => button.classList.remove('tap-feedback'), 650);
  }, true);
}

const menuProducts = [
  { id: 'cacau', name: 'Cookie Cacau', price: 1300, category: 'tradicionais', image: 'cookie-cacau.webp' },
  { id: 'red-velvet-tradicional', name: 'Cookie Red Velvet', price: 1300, category: 'tradicionais', image: 'cookie-red-velvet.webp' },
  { id: 'classico', name: 'Cookie Clássico', price: 1300, category: 'tradicionais', image: 'cookie-doce-de-leite.webp' },
  { id: 'red-velvet-recheado', name: 'Cookie Red Velvet Recheado', price: 1750, category: 'recheados', image: 'cookie-red-velvet-recheado.png' },
  { id: 'nutella', name: 'Cookie Nutella', price: 1500, category: 'recheados', image: 'cookie-nutella.webp' },
  { id: 'doce-leite', name: 'Cookie Doce de Leite', price: 1500, category: 'recheados', image: 'cookie-doce-de-leite.webp' },
  { id: 'alpino', name: 'Cookie Alpino', price: 1750, category: 'recheados', image: 'cookie-cacau.webp' },
];
const cartStorageKey = 'copo-de-leite-cart-v1';
const lastOrderStorageKey = 'copo-de-leite-last-order-v1';
let savedCart = [];
try { savedCart = JSON.parse(localStorage.getItem(cartStorageKey) || '[]'); } catch { savedCart = []; }
const cart = new Map(savedCart.filter(([id, quantity]) => menuProducts.some((product) => product.id === id) && Number.isInteger(quantity) && quantity > 0));
let lastOrder = [];
try { lastOrder = JSON.parse(localStorage.getItem(lastOrderStorageKey) || '[]'); } catch { lastOrder = []; }
const menuGrid = document.querySelector('#menu-grid');
const cartItems = document.querySelector('#cart-items');
const cartTotal = document.querySelector('#cart-total');
const cartCount = document.querySelector('#cart-count');
const headerCartCount = document.querySelector('#header-cart-count');
const checkoutButton = document.querySelector('#checkout-button');
let activeFilter = 'todos';
const formatPrice = (cents) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

function renderMenu() {
  if (!menuGrid) return;
  const categories = activeFilter === 'todos' ? ['tradicionais', 'recheados'] : [activeFilter];
  menuGrid.innerHTML = categories.map((category) => {
    const groupProducts = menuProducts.filter((product) => product.category === category);
    const groupName = category === 'tradicionais' ? 'Cookies tradicionais' : 'Cookies recheados';
    const groupNote = category === 'tradicionais' ? 'Sabores clássicos da casa' : 'Cookies com recheios e sabores especiais';
    const cards = groupProducts.map((product, index) => {
      const quantity = cart.get(product.id) || 0;
      return `<article class="menu-card" style="--card-index:${index}">
        <div class="menu-card-photo"><img src="assets/${product.image}" alt="${product.name}" loading="lazy"><span>${category === 'tradicionais' ? 'TRADICIONAL' : 'RECHEADO'}</span></div>
        <div class="menu-card-info"><p class="menu-category">${category === 'tradicionais' ? 'COOKIES TRADICIONAIS' : 'COOKIES RECHEADOS'}</p><h3>${product.name}</h3><strong class="menu-price">${formatPrice(product.price)}</strong>
        <div class="menu-card-actions">${quantity ? `<div class="quantity-control"><button type="button" data-action="minus" data-id="${product.id}" aria-label="Diminuir ${product.name}">−</button><span>${quantity}</span><button type="button" data-action="plus" data-id="${product.id}" aria-label="Adicionar ${product.name}">+</button></div>` : `<button class="add-button" type="button" data-action="add" data-id="${product.id}">Adicionar <span>+</span></button>`}</div></div>
      </article>`;
    }).join('');
    return `<section class="menu-group menu-group-${category}" aria-label="${groupName}"><div class="menu-group-heading"><span>${category === 'tradicionais' ? '01' : '02'}</span><div><h3>${groupName}</h3><p>${groupNote}</p></div></div><div class="menu-group-grid">${cards}</div></section>`;
  }).join('');
}

function renderCart() {
  const selected = menuProducts.filter((product) => cart.has(product.id));
  const count = selected.reduce((sum, product) => sum + cart.get(product.id), 0);
  const total = selected.reduce((sum, product) => sum + product.price * cart.get(product.id), 0);
  try { localStorage.setItem(cartStorageKey, JSON.stringify([...cart])); } catch {}
  if (headerCartCount) headerCartCount.textContent = String(count);
  if (cartCount) cartCount.textContent = `${count} ${count === 1 ? 'item' : 'itens'}`;
  if (cartTotal) cartTotal.textContent = formatPrice(total);
  if (cartItems) cartItems.innerHTML = selected.length ? selected.map((product) => {
    const quantity = cart.get(product.id);
    return `<div class="cart-line"><div><strong>${product.name}</strong><small>${quantity} × ${formatPrice(product.price)}</small></div><div class="cart-line-actions"><button type="button" data-action="minus" data-id="${product.id}" aria-label="Remover um ${product.name}">−</button><span>${formatPrice(product.price * quantity)}</span><button type="button" data-action="plus" data-id="${product.id}" aria-label="Adicionar um ${product.name}">+</button></div></div>`;
  }).join('') : '<p class="cart-empty">Adicione seus cookies favoritos para começar.</p>';
  const checkoutText = `Olá, eu gostaria de pedir: ${selected.map((product) => `${cart.get(product.id)}x ${product.name}`).join(', ')}.`;
  if (checkoutButton) {
    checkoutButton.href = selected.length ? `https://wa.me/5516991389236?text=${encodeURIComponent(checkoutText)}` : '#carrinho';
    checkoutButton.target = '_blank';
    checkoutButton.rel = 'noreferrer';
    checkoutButton.setAttribute('aria-disabled', String(!selected.length));
    checkoutButton.classList.toggle('is-disabled', !selected.length);
    checkoutButton.innerHTML = `Encomendar cookies (${formatPrice(total)}) <span><svg class="arrow-icon" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></span>`;
  }
  renderMenu();
  renderReorder();
}

function renderReorder() {
  const section = document.querySelector('#reorder-section');
  const itemsContainer = document.querySelector('#reorder-items');
  if (!section || !itemsContainer) return;
  lastOrder = Array.isArray(lastOrder) ? lastOrder.filter(([id, quantity]) => menuProducts.some((product) => product.id === id) && Number.isInteger(quantity) && quantity > 0) : [];
  section.hidden = lastOrder.length === 0;
  if (!lastOrder.length) return;
  itemsContainer.innerHTML = lastOrder.map(([id, previousQuantity]) => {
    const product = menuProducts.find((item) => item.id === id);
    return `<article class="reorder-card"><img src="assets/${product.image}" alt="" loading="lazy"><div><h3>${product.name}</h3><p>${formatPrice(product.price)} · ${previousQuantity} ${previousQuantity === 1 ? 'unidade' : 'unidades'} no pedido anterior</p></div><button type="button" data-reorder-id="${id}">Adicionar de novo <span>+</span></button></article>`;
  }).join('');
}

menuGrid?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { id, action } = button.dataset;
  const quantity = cart.get(id) || 0;
  if (action === 'minus' && quantity <= 1) cart.delete(id);
  else if (action === 'minus') cart.set(id, quantity - 1);
  else cart.set(id, quantity + 1);
  renderCart();
});
menuGrid?.addEventListener('pointermove', (event) => {
  if (event.pointerType === 'touch') return;
  const photo = event.target.closest('.menu-card-photo');
  if (!photo) return;
  const bounds = photo.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width;
  const y = (event.clientY - bounds.top) / bounds.height;
  photo.style.setProperty('--tilt-x', `${(x - 0.5) * 4}deg`);
  photo.style.setProperty('--tilt-y', `${(0.5 - y) * 4}deg`);
  photo.style.setProperty('--pointer-x', `${x * 100}%`);
  photo.style.setProperty('--pointer-y', `${y * 100}%`);
});
menuGrid?.addEventListener('pointerout', (event) => {
  const photo = event.target.closest('.menu-card-photo');
  if (!photo || photo.contains(event.relatedTarget)) return;
  photo.style.setProperty('--tilt-x', '0deg');
  photo.style.setProperty('--tilt-y', '0deg');
});
cartItems?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { id, action } = button.dataset;
  const quantity = cart.get(id) || 0;
  if (action === 'minus' && quantity <= 1) cart.delete(id);
  else if (action === 'minus') cart.set(id, quantity - 1);
  else cart.set(id, quantity + 1);
  renderCart();
});
document.querySelectorAll('.menu-tab').forEach((tab) => tab.addEventListener('click', () => {
  activeFilter = tab.dataset.filter;
  document.querySelectorAll('.menu-tab').forEach((item) => {
    const selected = item === tab;
    item.classList.toggle('is-active', selected);
    item.setAttribute('aria-selected', String(selected));
  });
  renderMenu();
}));
checkoutButton?.addEventListener('click', (event) => {
  event.preventDefault();
  const selected = menuProducts.filter((product) => cart.has(product.id));
  if (!selected.length) return;
  const whatsappUrl = checkoutButton.href;
  lastOrder = selected.map((product) => [product.id, cart.get(product.id)]);
  try { localStorage.setItem(lastOrderStorageKey, JSON.stringify(lastOrder)); } catch {}
  cart.clear();
  renderCart();
  const notice = document.querySelector('#checkout-notice');
  if (notice) {
    notice.hidden = false;
    notice.textContent = 'Seu pedido foi preparado no WhatsApp e o carrinho foi limpo. Você pode repetir o pedido abaixo.';
  }
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
});
document.querySelector('#reorder-items')?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-reorder-id]');
  if (!button) return;
  const previousQuantity = lastOrder.find(([id]) => id === button.dataset.reorderId)?.[1] || 1;
  cart.set(button.dataset.reorderId, (cart.get(button.dataset.reorderId) || 0) + previousQuantity);
  renderCart();
});
document.querySelector('#reorder-all')?.addEventListener('click', () => {
  lastOrder.forEach(([id, quantity]) => cart.set(id, (cart.get(id) || 0) + quantity));
  renderCart();
});
renderMenu();
renderCart();
