/* ============================================
   ARTSY PRODUCTION — Quick Commerce Logic
   (unjob.ai inspired Interactive Engine)
   ============================================ */

// Catalog Data
const SERVICES_DATA = {
  'talking-head-reel': {
    id: 'talking-head-reel',
    title: 'Engaging Talking-Head Reel',
    price: 29,
    mrp: 39,
    delivery: '1 Day',
    thumb: 'images/portfolio-brand-1.jpg'
  },
  'wedding-teaser': {
    id: 'wedding-teaser',
    title: 'Cinematic Wedding Teaser (60s)',
    price: 49,
    mrp: 69,
    delivery: '1 Day',
    thumb: 'images/portfolio-wedding-1.jpg'
  },
  'ugc-ad-creative': {
    id: 'ugc-ad-creative',
    title: 'UGC Ad Creative (Hook & Callouts)',
    price: 31,
    mrp: 36,
    delivery: '1 Day',
    thumb: 'images/portfolio-brand-2.jpg'
  },
  'product-showcase': {
    id: 'product-showcase',
    title: 'Product Showcase 3D Cutaway Reel',
    price: 59,
    mrp: 79,
    delivery: '2 Days',
    thumb: 'images/portfolio-product-1.jpg'
  },
  'retention-reel': {
    id: 'retention-reel',
    title: 'Advanced Retention Viral Reel',
    price: 47,
    mrp: 54,
    delivery: '1 Day',
    thumb: 'images/portfolio-brand-1.jpg'
  },
  'corporate-keynote': {
    id: 'corporate-keynote',
    title: 'Corporate Keynote & Summit Recap',
    price: 89,
    mrp: 119,
    delivery: '2 Days',
    thumb: 'images/portfolio-corporate-1.jpg'
  },
  'wedding-documentary': {
    id: 'wedding-documentary',
    title: 'Grand Wedding Full Documentary',
    price: 199,
    mrp: 279,
    delivery: '3 Days',
    thumb: 'images/portfolio-wedding-2.jpg'
  },
  'davinci-color': {
    id: 'davinci-color',
    title: 'DaVinci 4K HDR Color Grade & Foley',
    price: 39,
    mrp: 55,
    delivery: '1 Day',
    thumb: 'images/portfolio-product-1.jpg'
  }
};

// Global Cart State
let cart = {};

document.addEventListener('DOMContentLoaded', () => {
  initSearch();
  initCategoryPills();
  initCartTriggers();
});

/* ══════════════════════════════════════
   1. CART OPERATIONS (Quick Commerce)
   ══════════════════════════════════════ */
function addToCart(serviceId) {
  if (!cart[serviceId]) {
    cart[serviceId] = 1;
  } else {
    cart[serviceId]++;
  }
  updateCardStepper(serviceId);
  updateCartTotals();
  showFloatingBar();
}

function increaseQty(serviceId) {
  if (!cart[serviceId]) {
    cart[serviceId] = 1;
  } else {
    cart[serviceId]++;
  }
  updateCardStepper(serviceId);
  updateCartTotals();
}

function decreaseQty(serviceId) {
  if (cart[serviceId]) {
    cart[serviceId]--;
    if (cart[serviceId] <= 0) {
      delete cart[serviceId];
    }
  }
  updateCardStepper(serviceId);
  updateCartTotals();
}

function updateCardStepper(serviceId) {
  const card = document.querySelector(`[data-service-id="${serviceId}"]`);
  if (!card) return;

  const addBtn = card.querySelector('.btn-unjob-add');
  const stepper = card.querySelector('.qty-stepper-box');
  const qtyVal = card.querySelector('.qty-val');
  const currentCount = cart[serviceId] || 0;

  if (currentCount > 0) {
    if (addBtn) addBtn.style.display = 'none';
    if (stepper) stepper.classList.add('active');
    if (qtyVal) qtyVal.textContent = currentCount;
  } else {
    if (addBtn) addBtn.style.display = 'inline-flex';
    if (stepper) stepper.classList.remove('active');
  }
}

function updateCartTotals() {
  let totalItems = 0;
  let subtotal = 0;
  let totalMrp = 0;

  for (const [id, qty] of Object.entries(cart)) {
    const item = SERVICES_DATA[id];
    if (item && qty > 0) {
      totalItems += qty;
      subtotal += item.price * qty;
      totalMrp += item.mrp * qty;
    }
  }

  // Update Nav Badge
  const navBadge = document.getElementById('nav-cart-count');
  if (navBadge) navBadge.textContent = totalItems;

  // Check rush toggle
  const rushToggle = document.getElementById('rush-delivery-toggle');
  const rushFee = (rushToggle && rushToggle.checked && totalItems > 0) ? 15 : 0;

  const savings = Math.max(0, totalMrp - subtotal);
  const grandTotal = subtotal + rushFee;

  // Floating Checkout Bar
  const floatingBar = document.getElementById('floating-checkout-bar');
  const barText = document.getElementById('bar-total-text');
  if (totalItems > 0) {
    if (floatingBar) floatingBar.classList.add('active');
    if (barText) barText.textContent = `${totalItems} ${totalItems === 1 ? 'service' : 'services'} • $${grandTotal}`;
  } else {
    if (floatingBar) floatingBar.classList.remove('active');
  }

  // Cart Drawer Breakdown
  const drawerTitle = document.getElementById('drawer-cart-title');
  if (drawerTitle) drawerTitle.textContent = `Your Cart (${totalItems} items)`;

  const elSubtotal = document.getElementById('bill-subtotal');
  if (elSubtotal) elSubtotal.textContent = `$${subtotal}`;

  const elDiscount = document.getElementById('bill-discount');
  if (elDiscount) elDiscount.textContent = `-$${savings}`;

  const elGrand = document.getElementById('bill-grand-total');
  if (elGrand) elGrand.textContent = `$${grandTotal}`;

  renderDrawerItems();
}

function showFloatingBar() {
  const floatingBar = document.getElementById('floating-checkout-bar');
  if (floatingBar) floatingBar.classList.add('active');
}

/* ══════════════════════════════════════
   2. SLIDE-OVER DRAWER
   ══════════════════════════════════════ */
function openCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-drawer-overlay');
  if (drawer && overlay) {
    drawer.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-drawer-overlay');
  if (drawer && overlay) {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function initCartTriggers() {
  const openBtn = document.getElementById('open-cart-btn');
  if (openBtn) {
    openBtn.addEventListener('click', openCartDrawer);
  }
}

function renderDrawerItems() {
  const list = document.getElementById('drawer-items-list');
  if (!list) return;

  const items = Object.entries(cart).filter(([_, qty]) => qty > 0);

  if (items.length === 0) {
    list.innerHTML = `
      <p style="text-align: center; color: var(--color-text-muted); font-size: 13px; margin: 40px 0;">
        Your cart is currently empty.<br>Select any video edit package to begin!
      </p>
    `;
    return;
  }

  let html = '';
  for (const [id, qty] of items) {
    const item = SERVICES_DATA[id];
    if (!item) continue;
    html += `
      <div class="cart-item-row">
        <img src="${item.thumb}" class="cart-item-thumb" alt="${item.title}">
        <div class="cart-item-details">
          <div class="cart-item-title">${item.title}</div>
          <div class="cart-item-price">$${item.price} each</div>
        </div>
        <div class="qty-stepper-box active" style="height: 28px;">
          <button class="qty-btn" onclick="decreaseQty('${id}')">-</button>
          <span class="qty-val">${qty}</span>
          <button class="qty-btn" onclick="increaseQty('${id}')">+</button>
        </div>
      </div>
    `;
  }
  list.innerHTML = html;
}

function triggerCheckoutSuccess() {
  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  if (totalItems === 0) {
    alert('Please add at least one edit service to your cart first!');
    return;
  }

  const btn = document.getElementById('btn-instant-order');
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span>Assigning Top Editor...</span>`;

  setTimeout(() => {
    btn.innerHTML = `<span>✓ Booked! Editor Matched</span>`;
    btn.style.background = '#10B981';

    setTimeout(() => {
      alert('🎉 Order placed successfully in seconds!\n\nYour dedicated video editor has been matched. We have received your request and your delivery clock (24h) has started.');
      cart = {};
      document.querySelectorAll('.qty-stepper-box').forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.btn-unjob-add').forEach(b => b.style.display = 'inline-flex');
      updateCartTotals();
      closeCartDrawer();
      btn.disabled = false;
      btn.innerHTML = original;
      btn.style.background = '';
    }, 1000);
  }, 1200);
}

/* ══════════════════════════════════════
   3. SEARCH & CATEGORY FILTERING
   ══════════════════════════════════════ */
function initSearch() {
  const input = document.getElementById('nav-search-input');
  if (!input) return;

  input.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    filterServicesByTerm(term);
  });
}

function filterServicesByTerm(term) {
  const cards = document.querySelectorAll('.unjob-service-card');
  cards.forEach(card => {
    const title = (card.getAttribute('data-title') || '').toLowerCase();
    const cat = (card.getAttribute('data-cat') || '').toLowerCase();

    if (!term || title.includes(term) || cat.includes(term)) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

function initCategoryPills() {
  const pills = document.querySelectorAll('.category-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const filter = pill.getAttribute('data-filter');
      filterCategory(filter);
    });
  });
}

function filterCategory(category) {
  const cards = document.querySelectorAll('.unjob-service-card');
  cards.forEach(card => {
    const cardCat = card.getAttribute('data-cat');
    if (category === 'all' || cardCat === category) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });

  // Highlight pill
  const pills = document.querySelectorAll('.category-pill');
  pills.forEach(p => {
    if (p.getAttribute('data-filter') === category) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });

  // Scroll smoothly to catalog
  const catalog = document.getElementById('services-catalog');
  if (catalog) {
    catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* ══════════════════════════════════════
   4. MEDIA PREVIEW MODAL
   ═══════════════════════════════════ */
function previewMedia(src) {
  const modal = document.getElementById('preview-modal');
  const img = document.getElementById('preview-img');
  if (modal && img) {
    img.src = src;
    modal.classList.add('active');
  }
}

function closePreviewModal() {
  const modal = document.getElementById('preview-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}
