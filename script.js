const productsGrid = document.querySelector(".products-grid");
const cartCount = document.getElementById("cartCount");
const products = window.products || [];
const productModal = document.getElementById("productModal");
const modalClose = productModal?.querySelector(".modal-close");
const modalImage = productModal?.querySelector(".modal-image");
const modalCategory = productModal?.querySelector(".modal-category");
const modalName = productModal?.querySelector(".modal-name");
const modalDesc = productModal?.querySelector(".modal-desc");
const modalPrice = productModal?.querySelector(".modal-price");
const modalOldPrice = productModal?.querySelector(".modal-old-price");
const modalAdd = productModal?.querySelector(".modal-add");
const toast = document.getElementById("toast");
const bottomNav = document.getElementById("bottomNav");
const mainSearchInput = document.getElementById("mainSearchInput");
const desktopSearchInput = document.getElementById("desktopSearchInput");
const desktopTabItems = document.querySelectorAll(".desktop-tab");
const desktopHeader = document.getElementById("desktopHeader");
const subtitle = document.querySelector(".subtitle");
const cartPanel = document.getElementById("cartPanel");
const profilePanel = document.getElementById("profilePanel");
const openedCount = document.getElementById("openedCount");
const addedCount = document.getElementById("addedCount");
const inCartCount = document.getElementById("inCartCount");
const cartList = document.getElementById("cartList");
const cartTotal = document.getElementById("cartTotal");
const emptyCartBtn = document.getElementById("emptyCartBtn");
const checkoutBtn = document.getElementById("checkoutBtn");
const amazonLink = document.getElementById("amazonLink");
const viewAction = document.querySelectorAll(".view-action");
const viewMenuOverlay = document.getElementById("viewMenuOverlay");
const tabItems = document.querySelectorAll(".tab-item");

let cart = JSON.parse(localStorage.getItem('cronoshop-cart') || '[]');
let activeProduct = null;
let activeTab = "products";
let productsOpened = parseInt(localStorage.getItem('cronoshop-opened') || '0', 10);
let productsAdded = parseInt(localStorage.getItem('cronoshop-added') || '0', 10);
let layoutMode = localStorage.getItem('cronoshop-layout') || 'grid';
let orderMode = localStorage.getItem('cronoshop-order') || 'default';
let filterQuery = "";

function saveCart() {
  localStorage.setItem('cronoshop-cart', JSON.stringify(cart));
}

function saveStats() {
  localStorage.setItem('cronoshop-opened', productsOpened.toString());
  localStorage.setItem('cronoshop-added', productsAdded.toString());
}

function saveLayoutMode() {
  localStorage.setItem('cronoshop-layout', layoutMode);
}

function saveOrderMode() {
  localStorage.setItem('cronoshop-order', orderMode);
}

function sortProducts(list) {
  if (orderMode === 'price') {
    return [...list].sort((a, b) => a.prezzo - b.prezzo);
  }

  if (orderMode === 'name') {
    return [...list].sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
  }

  return list;
}

function updateViewMenuSelection() {
  document.querySelectorAll('[data-layout-option]').forEach(button => {
    button.classList.toggle('active', button.dataset.layoutOption === layoutMode);
  });

  document.querySelectorAll('[data-sort-option]').forEach(button => {
    button.classList.toggle('active', button.dataset.sortOption === orderMode);
  });
}

function toggleViewMenu() {
  if (!viewMenuOverlay) return;
  viewMenuOverlay.classList.toggle('active');
}

function closeViewMenu() {
  viewMenuOverlay?.classList.remove('active');
}

function renderProducts(list) {
  if (!productsGrid) return;
  const orderedList = sortProducts(list);
  const html = orderedList.map(product => {
    const hasDiscount = product.sconto && product.prezzo_originale;
    return `
      <button class="product-card" type="button" data-product-id="${product.id}">
        <img class="product-image" src="${product.img}" alt="${product.nome}">
        <div class="product-info">
          <div class="product-meta">
            <span class="product-title">${product.nome}</span>
            ${product.featured ? '<span class="product-tag">In evidenza</span>' : ''}
          </div>
          <div class="product-meta">
            <span>${product.categoria}</span>
          </div>
          <div class="product-price">
            <strong>€${product.prezzo.toFixed(2)}</strong>
            ${hasDiscount ? `<span class="product-old">€${product.prezzo_originale.toFixed(2)}</span>` : ''}
          </div>
        </div>
      </button>
    `;
  }).join("");

  productsGrid.innerHTML = html;
  productsGrid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => {
      const productId = card.dataset.productId;
      const product = products.find(item => item.id === productId);
      if (product) {
        openProduct(product);
      }
    });
  });
}

function openProduct(product) {
  productsOpened += 1;
  updateProfileStats();

  activeProduct = product;
  modalImage.src = product.img;
  modalImage.alt = product.nome;
  modalCategory.textContent = product.categoria.toUpperCase();
  modalName.textContent = product.nome;
  modalDesc.textContent = product.descrizione;
  modalPrice.textContent = `€${product.prezzo.toFixed(2)}`;
  modalOldPrice.textContent = product.prezzo_originale ? `€${product.prezzo_originale.toFixed(2)}` : '';
  modalOldPrice.style.display = product.prezzo_originale ? 'inline' : 'none';
  amazonLink.href = product.link || `https://www.amazon.it/s?k=${encodeURIComponent(product.nome)}`;
  productModal.classList.remove('hidden');
}

function closeProductModal() {
  productModal.classList.add('hidden');
  activeProduct = null;
}

function updateCartCount() {
  if (cartCount) cartCount.textContent = cart.length;
  if (inCartCount) inCartCount.textContent = cart.length;
}

function updateProfileStats() {
  if (openedCount) openedCount.textContent = productsOpened;
  if (addedCount) addedCount.textContent = productsAdded;
  if (inCartCount) inCartCount.textContent = cart.length;
  const profileTotal = document.getElementById('profileTotal');
  if (profileTotal) {
    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
    profileTotal.textContent = `€${total.toFixed(2)}`;
  }
}

function setLayoutMode(mode) {
  layoutMode = mode;
  const productsPanel = document.querySelector('.products-panel');
  if (productsPanel) {
    productsPanel.classList.toggle('list', layoutMode === 'list');
    productsPanel.classList.toggle('grid', layoutMode === 'grid');
  }
  viewAction.forEach(button => {
    const icon = button.querySelector('.view-icon');
    if (icon) icon.textContent = layoutMode === 'list' ? 'view_list' : 'view_quilt';
  });
  saveLayoutMode();
}

function toggleLayout() {
  setLayoutMode(layoutMode === 'grid' ? 'list' : 'grid');
}

function getCartItems() {
  return cart.reduce((acc, product) => {
    const existing = acc.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
      existing.subtotal += product.prezzo;
    } else {
      acc.push({ ...product, quantity: 1, subtotal: product.prezzo });
    }
    return acc;
  }, []);
}

function renderCart() {
  const items = getCartItems();
  if (!items.length) {
    cartList.innerHTML = `<div class="cart-empty">Il carrello è vuoto. Aggiungi un prodotto per iniziare.</div>`;
  } else {
    cartList.innerHTML = items.map(item => `
      <div class="cart-item">
        <img src="${item.img}" alt="${item.nome}">
        <div class="cart-item-info">
          <span class="cart-item-title">${item.nome}</span>
          <div class="cart-item-meta">
            <span class="cart-item-qty">x${item.quantity}</span>
            <span>${item.categoria}</span>
          </div>
        </div>
        <div class="cart-item-actions">
          <span class="cart-item-price">€${item.subtotal.toFixed(2)}</span>
          <button class="cart-item-remove" type="button" data-remove-id="${item.id}">Rimuovi</button>
        </div>
      </div>
    `).join("");
  }

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  if (cartTotal) cartTotal.textContent = `€${total.toFixed(2)}`;
  if (emptyCartBtn) emptyCartBtn.disabled = cart.length === 0;
  if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;
  const profileTotal = document.getElementById('profileTotal');
  if (profileTotal) profileTotal.textContent = `€${total.toFixed(2)}`;
}

function addToCart(product) {
  cart.push(product);
  saveCart();
  productsAdded += 1;
  saveStats();
  updateCartCount();
  updateProfileStats();
  renderCart();
  showToast(`"${product.nome}" aggiunto al carrello`);
}

function removeFromCart(productId) {
  const index = cart.findIndex(item => item.id === productId);
  if (index === -1) return;
  const removed = cart.splice(index, 1)[0];
  saveCart();
  updateCartCount();
  updateProfileStats();
  renderCart();
  showToast(`"${removed.nome}" rimosso dal carrello`);
}

function clearCart() {
  cart.length = 0;
  saveCart();
  updateCartCount();
  updateProfileStats();
  renderCart();
  showToast("Carrello svuotato");
}

function setActiveTab(tab) {
  activeTab = tab;
  tabItems.forEach(item => item.classList.toggle("active", item.dataset.tab === tab));
  desktopTabItems.forEach(item => item.classList.toggle("active", item.dataset.tab === tab));

  const productsPanel = document.querySelector('.products-panel');
  if (productsPanel) {
    productsPanel.style.display = tab === 'products' ? 'block' : 'none';
  }
  if (cartPanel) {
    cartPanel.classList.toggle('visible', tab === 'cart');
    cartPanel.classList.toggle('hidden', tab !== 'cart');
  }
  if (profilePanel) {
    profilePanel.classList.toggle('visible', tab === 'profile');
    profilePanel.classList.toggle('hidden', tab !== 'profile');
  }

  if (tab === 'cart' || tab === 'profile') {
    renderCart();
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 1800);
}

function filterProducts(query) {
  filterQuery = query.trim().toLowerCase();
  if (!filterQuery) {
    renderProducts(products);
    return;
  }

  const filtered = products.filter(item => {
    return item.nome.toLowerCase().includes(filterQuery) ||
      (item.descrizione && item.descrizione.toLowerCase().includes(filterQuery)) ||
      (item.categoria && item.categoria.toLowerCase().includes(filterQuery));
  });

  renderProducts(filtered);
}

function setSortOrder(order) {
  orderMode = order;
  saveOrderMode();
  updateViewMenuSelection();
  filterProducts(filterQuery);
}

function setLayoutMode(mode) {
  layoutMode = mode;
  const productsPanel = document.querySelector('.products-panel');
  if (productsPanel) {
    productsPanel.classList.toggle('list', layoutMode === 'list');
    productsPanel.classList.toggle('grid', layoutMode === 'grid');
  }
  viewAction.forEach(button => {
    const icon = button.querySelector('.view-icon');
    if (icon) icon.textContent = layoutMode === 'list' ? 'view_list' : 'view_quilt';
  });
  saveLayoutMode();
  updateViewMenuSelection();
}

function toggleSearch(active) {
  if (active) {
    bottomNav?.classList.add('is-searching');
    desktopHeader?.classList.add('is-searching');
    setTimeout(() => {
      if (desktopHeader && window.matchMedia('(min-width: 900px), (orientation: landscape)').matches) {
        desktopSearchInput?.focus();
      } else {
        mainSearchInput?.focus();
      }
    }, 200);
  } else {
    bottomNav?.classList.remove('is-searching');
    desktopHeader?.classList.remove('is-searching');
    if (mainSearchInput) mainSearchInput.value = "";
    if (desktopSearchInput) desktopSearchInput.value = "";
    filterProducts('');
  }
}

window.toggleSearch = toggleSearch;

const searchInputs = [mainSearchInput, desktopSearchInput].filter(Boolean);
searchInputs.forEach(input => {
  input.addEventListener('input', event => {
    filterProducts(event.target.value);
  });
  input.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      toggleSearch(false);
    }
  });
});

desktopTabItems.forEach(button => {
  button.addEventListener('click', () => setActiveTab(button.dataset.tab));
});

tabItems.forEach(item => {
  item.addEventListener('click', () => setActiveTab(item.dataset.tab));
});

if (modalClose) {
  modalClose.addEventListener('click', closeProductModal);
}

if (productModal) {
  productModal.addEventListener('click', event => {
    if (event.target === productModal) {
      closeProductModal();
    }
  });
}

if (modalAdd) {
  modalAdd.addEventListener('click', () => {
    if (!activeProduct) {
      return;
    }
    addToCart(activeProduct);
  });
}

viewAction.forEach(button => button.addEventListener('click', () => {
  updateViewMenuSelection();
  toggleViewMenu();
}));

if (viewMenuOverlay) {
  viewMenuOverlay.addEventListener('click', event => {
    const layoutButton = event.target.closest('[data-layout-option]');
    if (layoutButton) {
      setLayoutMode(layoutButton.dataset.layoutOption);
      closeViewMenu();
      return;
    }

    const sortButton = event.target.closest('[data-sort-option]');
    if (sortButton) {
      setSortOrder(sortButton.dataset.sortOption);
      closeViewMenu();
      return;
    }
  });
}

if (cartList) {
  cartList.addEventListener('click', event => {
    const button = event.target.closest('[data-remove-id]');
    if (!button) return;
    removeFromCart(button.dataset.removeId);
  });
}

if (emptyCartBtn) {
  emptyCartBtn.addEventListener('click', clearCart);
}

if (checkoutBtn) {
  checkoutBtn.addEventListener('click', () => {
    if (!cart.length) return;
    showToast('Procedura di pagamento non ancora disponibile');
  });
}

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (productModal && !productModal.classList.contains('hidden')) {
      closeProductModal();
    }
    closeViewMenu();
  }
});

document.addEventListener('click', event => {
  if (viewMenuOverlay?.classList.contains('active') && !event.target.closest('.view-action') && !event.target.closest('.view-menu-overlay')) {
    closeViewMenu();
  }
});

if (productsGrid) {
  renderProducts(products);
}
setLayoutMode(layoutMode);
updateViewMenuSelection();
updateProfileStats();
if (cartList) {
  renderCart();
}

if (subtitle) {
  subtitle.textContent = `${products.length} prodotti disponibili`;
}


/**
 * Cronoshop 4.0 - Sequoia Interaction Engine
 * Versione: Mobile & Tablet Only
 */

document.addEventListener('DOMContentLoaded', () => {
    // Configurazione: mostriamo la topbar solo sotto i 1024px
    const isMobileOrTablet = () => window.innerWidth <= 1024;

    if (isMobileOrTablet()) {
        initSequoiaTopbar();
    }

    // Gestione ridimensionamento finestra (se passi da mobile a desktop live)
    window.addEventListener('resize', () => {
        const topBar = document.querySelector('.sequoia-topbar');
        if (!isMobileOrTablet() && topBar) {
            topBar.style.display = 'none';
        } else if (isMobileOrTablet() && topBar) {
            topBar.style.display = 'flex';
        }
    });
});

function initSequoiaTopbar() {
    // Evitiamo duplicati se la funzione viene chiamata più volte
    if (document.querySelector('.sequoia-topbar')) return;

    // Iniezione HTML della Topbar direttamente da JS per pulizia
    const topBarHTML = `
        <header class="sequoia-topbar">
            <div class="topbar-blur-bg"></div>
            <div class="topbar-content">
                <div class="topbar-left">
                    <div class="brand-logo">
                        <span class="material-icons">watch</span>
                        <span class="brand-name">Cronoshop <span>4.0</span></span>
                    </div>
                </div>
                <div class="topbar-right">
                    <button class="icon-btn search-trigger" id="topSearchBtn">
                        <span class="material-icons">search</span>
                    </button>
                    <button class="icon-btn profile-trigger" onclick="window.location.href='info.html'">
                        <img src="https://ui-avatars.com/api/?name=Tony&background=2563eb&color=fff" alt="User">
                    </button>
                </div>
            </div>
            
            <!-- Barra di ricerca espandibile -->
            <div class="search-overlay-bar" id="searchOverlay">
                <span class="material-icons">search</span>
                <input type="text" placeholder="Cerca orologi, brand..." id="searchInput">
                <button class="close-search" id="closeSearch">
                    <span class="material-icons">close</span>
                </button>
            </div>
        </header>

        <style>
            .sequoia-topbar {
                position: fixed;
                top: 15px;
                left: 15px;
                right: 15px;
                height: 64px;
                z-index: 2000;
                display: flex;
                align-items: center;
                transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }

            /* Effetto sfocatura e vetro */
            .topbar-blur-bg {
                position: absolute;
                inset: 0;
                background: rgba(255, 255, 255, 0.7);
                backdrop-filter: blur(20px) saturate(180%);
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                border-radius: 22px;
                border: 1px solid rgba(255, 255, 255, 0.4);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
                z-index: -1;
            }

            .topbar-content {
                width: 100%;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 16px;
            }

            .brand-logo {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .brand-logo .material-icons {
                color: #2563eb;
                font-size: 28px;
            }

            .brand-name {
                font-weight: 800;
                font-size: 1.1rem;
                letter-spacing: -0.02em;
                color: #1e293b;
            }

            .brand-name span {
                color: #2563eb;
                font-weight: 400;
            }

            .topbar-right {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .icon-btn {
                width: 40px;
                height: 40px;
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.03);
                color: #1e293b;
                transition: all 0.2s ease;
            }

            .icon-btn:active {
                transform: scale(0.9);
                background: rgba(0, 0, 0, 0.08);
            }

            .profile-trigger img {
                width: 32px;
                height: 32px;
                border-radius: 10px;
                object-fit: cover;
            }

            /* Logica Ricerca */
            .search-overlay-bar {
                position: absolute;
                inset: 0;
                background: #fff;
                border-radius: 22px;
                display: flex;
                align-items: center;
                padding: 0 16px;
                gap: 12px;
                transform: scale(0.95);
                opacity: 0;
                pointer-events: none;
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                z-index: 10;
            }

            .sequoia-topbar.search-active .search-overlay-bar {
                transform: scale(1);
                opacity: 1;
                pointer-events: auto;
            }

            .search-overlay-bar input {
                flex: 1;
                border: none;
                outline: none;
                font-size: 1rem;
                font-weight: 500;
                background: transparent;
            }

            .close-search {
                color: #64748b;
            }

            /* Nascondi topbar originale se presente per evitare conflitti su mobile */
            @media (max-width: 1024px) {
                .topbar:not(.sequoia-topbar) {
                    display: none !important;
                }
            }
        </style>
    `;

    document.body.insertAdjacentHTML('afterbegin', topBarHTML);

    // Gestione Eventi
    const topbar = document.querySelector('.sequoia-topbar');
    const searchBtn = document.getElementById('topSearchBtn');
    const closeBtn = document.getElementById('closeSearch');
    const searchInput = document.getElementById('searchInput');

    searchBtn.addEventListener('click', () => {
        topbar.classList.add('search-active');
        setTimeout(() => searchInput.focus(), 100);
    });

    closeBtn.addEventListener('click', () => {
        topbar.classList.remove('search-active');
        searchInput.value = '';
    });

    // Effetto Hide on Scroll
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > lastScroll && currentScroll > 100) {
            topbar.style.transform = 'translateY(-120%)';
        } else {
            topbar.style.transform = 'translateY(0)';
        }
        lastScroll = currentScroll;
    });
}
