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
 * Cronoshop Layout Engine - Sequoia Ultra-Bar v4.3
 * Creato per Tony (Antonino) - Studente, Tifoso del Napoli e partner intellettuale.
 * * LOGICA: Sistema di navigazione avanzato con menu overlay totalmente funzionante.
 * * FIX DARK MODE: Toni blu notte profondi al posto del nero piatto.
 */

const initSequoiaSystem = () => {
    // 1. Pulizia vecchia barra
    const oldTopbar = document.querySelector('.topbar');
    if (oldTopbar) {
        oldTopbar.style.display = 'none';
        oldTopbar.id = 'old-topbar-hidden';
    }

    // 2. Parametri Design
    const design = {
        radius: "50px",
        width: "98%",
        marginTop: "24px",
        accent: "#007aff",
        darkBg: "rgba(15, 23, 42, 0.9)" // Blu notte invece di nero
    };

    // 3. Creazione Struttura Nuova Barra e Menu Overlay
    const container = document.createElement('div');
    container.className = 'sequoia-master-container';
    
    container.innerHTML = `
        <div class="sequoia-header-wrapper">
            <header class="sequoia-topbar">
                <div class="sequoia-info">
                    <h1 style="margin:0; font-size: 24px; font-weight:800; letter-spacing:-1px;">Cronoshop</h1>
                    <p style="margin:0; font-size: 13px; opacity: 0.6; font-weight:500;">99 prodotti disponibili</p>
                </div>
                <div class="sequoia-actions">
                    <div class="view-menu-container">
                        <button class="sq-btn view-trigger" aria-label="Opzioni Vista">
                            <span class="material-icons">tune</span>
                            <span class="sq-label">Vista</span>
                        </button>
                        
                        <!-- Menu Overlay -->
                        <div class="view-overlay" id="viewOverlay">
                            <div class="overlay-section">
                                <label>DISPOSIZIONE</label>
                                <div class="overlay-options">
                                    <div class="opt-item active" data-action="layout" data-value="grid">
                                        <span class="material-icons">grid_view</span>
                                        <span>Griglia</span>
                                    </div>
                                    <div class="opt-item" data-action="layout" data-value="list">
                                        <span class="material-icons">view_list</span>
                                        <span>Lista</span>
                                    </div>
                                </div>
                            </div>
                            <div class="overlay-divider"></div>
                            <div class="overlay-section">
                                <label>ORDINA PER</label>
                                <div class="overlay-options">
                                    <div class="opt-item" data-action="sort" data-value="price-asc">
                                        <span class="material-icons">payments</span>
                                        <span>Prezzo basso</span>
                                    </div>
                                    <div class="opt-item" data-action="sort" data-value="alpha">
                                        <span class="material-icons">sort_by_alpha</span>
                                        <span>Nome A-Z</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <button class="sq-circle-btn theme-toggle" aria-label="Cambia Tema">
                        <span class="material-icons">dark_mode</span>
                    </button>
                </div>
            </header>
        </div>
    `;

    // 4. Iniezione Stili CSS
    const style = document.createElement('style');
    style.textContent = `
        .sequoia-master-container { width: 100%; position: absolute; top: 0; left: 0; pointer-events: none; }
        .sequoia-header-wrapper {
            position: fixed; top: 0; left: 0; z-index: 10000;
            padding: ${design.marginTop} 0 10px; width: 100%;
            pointer-events: none; transition: padding 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .sequoia-topbar {
            pointer-events: auto; max-width: 1400px; width: ${design.width};
            margin: 0 auto; background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            border-radius: ${design.radius}; border: 1px solid rgba(0,0,0,0.08);
            padding: 12px 28px; display: flex; justify-content: space-between;
            align-items: center; box-shadow: 0 18px 40px rgba(0,0,0,0.08);
            transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .sequoia-actions { display: flex; align-items: center; gap: 12px; }
        .sq-btn {
            display: flex; align-items: center; gap: 8px; padding: 10px 20px;
            border-radius: 30px; border: 1px solid rgba(0,0,0,0.05);
            background: rgba(255,255,255,0.6); cursor: pointer; color: inherit;
            transition: all 0.2s ease;
        }
        .sq-circle-btn {
            width: 48px; height: 48px; display: grid; place-items: center;
            border-radius: 50%; border: 1px solid rgba(0,0,0,0.05);
            background: rgba(255,255,255,0.6); cursor: pointer; color: inherit; transition: all 0.3s ease;
        }
        .sq-btn:hover, .sq-circle-btn:hover { background: #fff; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
        
        .view-menu-container { position: relative; }
        .view-overlay {
            position: absolute; top: calc(100% + 15px); right: 0;
            width: 240px; background: white; border-radius: 28px;
            padding: 16px; box-shadow: 0 20px 50px rgba(0,0,0,0.15);
            border: 1px solid rgba(0,0,0,0.08); display: none;
            flex-direction: column; gap: 12px; transform: translateY(10px);
            opacity: 0; transition: all 0.3s ease; z-index: 10001;
        }
        .view-overlay.show { display: flex; transform: translateY(0); opacity: 1; }
        .overlay-section label { font-size: 10px; font-weight: 800; color: #8e8e93; letter-spacing: 0.5px; margin-bottom: 8px; display: block; padding-left: 8px; }
        .overlay-options { display: flex; flex-direction: column; gap: 4px; }
        .opt-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 16px; cursor: pointer; transition: background 0.2s; font-size: 14px; font-weight: 500; }
        .opt-item:hover { background: #f2f2f7; }
        .opt-item.active { background: #007aff15; color: #007aff; }
        .overlay-divider { height: 1px; background: rgba(0,0,0,0.05); margin: 4px 0; }

        .products-container.list-view { display: flex !important; flex-direction: column !important; gap: 20px !important; }
        .products-container.list-view .product-card { display: flex !important; flex-direction: row !important; width: 100% !important; align-items: center !important; gap: 20px !important; text-align: left !important; }
        .products-container.list-view .product-card img { width: 120px !important; height: 120px !important; }

        /* DARK MODE ADATTATA (BLU NOTTE) */
        body.dark-mode .sequoia-topbar, body.dark-mode .view-overlay { 
            background: ${design.darkBg}; 
            border-color: rgba(255,255,255,0.1); 
            color: #f1f5f9; 
        }
        body.dark-mode .sq-btn, body.dark-mode .sq-circle-btn { background: rgba(255,255,255,0.05); }
        body.dark-mode .opt-item:hover { background: rgba(255,255,255,0.1); }
        body.dark-mode .overlay-section label { color: #94a3b8; }
        body.dark-mode .overlay-divider { background: rgba(255,255,255,0.1); }
    `;
    document.head.appendChild(style);
    document.body.prepend(container);

    // 5. Funzioni Logiche
    const productsContainer = document.querySelector('.products-container') || document.querySelector('.grid');

    const updateLayout = (type) => {
        if (!productsContainer) return;
        if (type === 'list') {
            productsContainer.classList.add('list-view');
        } else {
            productsContainer.classList.remove('list-view');
        }
    };

    const sortProducts = (criteria) => {
        if (!productsContainer) return;
        const products = Array.from(productsContainer.children);
        
        products.sort((a, b) => {
            if (criteria === 'price-asc') {
                const priceA = parseFloat(a.querySelector('.price')?.textContent.replace(/[^0-9.]/g, '') || 0);
                const priceB = parseFloat(b.querySelector('.price')?.textContent.replace(/[^0-9.]/g, '') || 0);
                return priceA - priceB;
            } else if (criteria === 'alpha') {
                const nameA = a.querySelector('h3, .name')?.textContent.toLowerCase() || "";
                const nameB = b.querySelector('h3, .name')?.textContent.toLowerCase() || "";
                return nameA.localeCompare(nameB);
            }
            return 0;
        });

        products.forEach(p => productsContainer.appendChild(p));
    };

    // 6. Listener Menu Overlay
    const overlay = document.getElementById('viewOverlay');
    const trigger = document.querySelector('.view-trigger');
    const themeBtn = document.querySelector('.theme-toggle');

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        overlay.classList.toggle('show');
    });

    document.addEventListener('click', () => overlay.classList.remove('show'));
    overlay.addEventListener('click', (e) => e.stopPropagation());

    const options = document.querySelectorAll('.opt-item');
    options.forEach(opt => {
        opt.addEventListener('click', () => {
            const action = opt.dataset.action;
            const value = opt.dataset.value;
            opt.parentElement.querySelectorAll('.opt-item').forEach(i => i.classList.remove('active'));
            opt.classList.add('active');
            if (action === 'layout') updateLayout(value);
            if (action === 'sort') sortProducts(value);
            setTimeout(() => overlay.classList.remove('show'), 200);
        });
    });

    // Tema
    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('cronoshop-theme', isDark ? 'dark' : 'light');
        themeBtn.querySelector('.material-icons').textContent = isDark ? 'light_mode' : 'dark_mode';
    });

    // Scroll effect
    window.addEventListener('scroll', () => {
        const wrapper = document.querySelector('.sequoia-header-wrapper');
        const bar = document.querySelector('.sequoia-topbar');
        if (window.scrollY > 40) {
            wrapper.style.paddingTop = '8px';
            bar.style.borderRadius = '32px';
            bar.style.transform = 'scale(0.99)';
            overlay.classList.remove('show');
        } else {
            wrapper.style.paddingTop = design.marginTop;
            bar.style.borderRadius = design.radius;
            bar.style.transform = 'scale(1)';
        }
    });

    // Init Theme
    if (localStorage.getItem('cronoshop-theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeBtn.querySelector('.material-icons').textContent = 'light_mode';
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSequoiaSystem);
} else {
    initSequoiaSystem();
}