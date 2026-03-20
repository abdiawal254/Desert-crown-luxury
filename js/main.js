/* Desert Crown Luxury - single-file app controller for all pages (vanilla JS only). */
(function () {
  const KEY_CART = "dcl_cart_v1";
  const KEY_THEME = "dcl_theme_v1";
  const LOADER_MS_MIN = 260;

  const PRODUCTS = (window.PRODUCTS || []);
  const PRODUCT_MAP = new Map(PRODUCTS.map((p) => [p.id, p]));

  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0
  });

  function formatMoney(n) {
    const v = typeof n === "number" ? n : Number(n || 0);
    return currency.format(isFinite(v) ? v : 0);
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function safeJsonParse(s, fallback) {
    try {
      return JSON.parse(s);
    } catch {
      return fallback;
    }
  }

  function getCart() {
    const raw = localStorage.getItem(KEY_CART);
    const data = safeJsonParse(raw, {});
    if (!data || typeof data !== "object") return {};
    return data;
  }

  function setCart(cartObj) {
    localStorage.setItem(KEY_CART, JSON.stringify(cartObj));
  }

  function cartCount() {
    const cart = getCart();
    return Object.values(cart).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
  }

  function addToCart(productId, qty = 1) {
    const product = PRODUCT_MAP.get(productId);
    if (!product) return false;

    const cart = getCart();
    const current = Number(cart[productId] || 0);
    const next = clamp(current + Number(qty || 1), 1, 99);
    cart[productId] = next;
    setCart(cart);
    return true;
  }

  function updateCartQty(productId, qty) {
    const cart = getCart();
    if (qty === "" || qty === null || qty === undefined) return; // avoid accidental deletes while typing
    const next = Number(qty);
    if (!isFinite(next)) return;
    if (next <= 0) {
      delete cart[productId];
      setCart(cart);
      return;
    }
    cart[productId] = clamp(Math.floor(next), 1, 99);
    setCart(cart);
  }

  function removeFromCart(productId) {
    const cart = getCart();
    delete cart[productId];
    setCart(cart);
  }

  function getCartLines() {
    const cart = getCart();
    const lines = [];
    for (const [id, qty] of Object.entries(cart)) {
      const product = PRODUCT_MAP.get(id);
      const q = Number(qty) || 0;
      if (!product || q <= 0) continue;
      lines.push({ product, qty: q, subtotal: product.price * q });
    }
    // stable ordering by name
    lines.sort((a, b) => a.product.name.localeCompare(b.product.name));
    return lines;
  }

  function cartTotal() {
    return getCartLines().reduce((sum, l) => sum + l.subtotal, 0);
  }

  // Toast
  let toastQueue = 0;
  function showToast(message, type = "gold") {
    const host = document.getElementById("toastHost") || createToastHost();
    const id = ++toastQueue;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.dataset.toastId = String(id);

    const mark = document.createElement("div");
    mark.className = "toastMark";
    mark.textContent = type === "danger" ? "!" : "✓";

    const body = document.createElement("div");
    body.style.flex = "1";
    const strong = document.createElement("strong");
    strong.textContent = type === "danger" ? "Update needed" : "Added to cart";
    const span = document.createElement("span");
    span.textContent = message;

    body.appendChild(strong);
    body.appendChild(span);

    const close = document.createElement("button");
    close.className = "srOnly";
    close.textContent = "dismiss";

    toast.appendChild(mark);
    toast.appendChild(body);
    toast.appendChild(close);

    host.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2600);
  }

  function createToastHost() {
    const host = document.createElement("div");
    host.id = "toastHost";
    document.body.appendChild(host);
    return host;
  }

  // Theme
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  function updateThemeToggleUI(theme) {
    const isLight = String(theme) === "light";
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(isLight));
      const label = btn.querySelector("[data-theme-label]");
      if (label) label.textContent = isLight ? "Dark" : "Light";
    });
  }

  function initTheme() {
    const saved = localStorage.getItem(KEY_THEME);
    const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = saved || (systemPrefersDark ? "dark" : "light");
    applyTheme(theme);
    updateThemeToggleUI(theme);
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme") || "dark";
    const next = cur === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(KEY_THEME, next);
    updateThemeToggleUI(next);
  }

  // Reveal on scroll
  function initReveal() {
    const els = Array.from(document.querySelectorAll(".reveal"));
    const canObserve = typeof window.IntersectionObserver === "function";

    if (!els.length) return;
    if (!canObserve) {
      // Fallback: if IntersectionObserver isn't supported, show everything.
      els.forEach((el) => el.classList.add("in-view"));
      return;
    }

    // Observe newly-rendered elements too (shop/product pages insert content after init).
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) e.target.classList.add("in-view");
        }
      },
      { threshold: 0.16 }
    );

    const observeEl = (el) => {
      if (el.dataset.revealObserved === "1") return;
      el.dataset.revealObserved = "1";
      // If it's already in view, reveal instantly to avoid "blank" states.
      const r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < (window.innerHeight || 800)) {
        el.classList.add("in-view");
        return;
      }
      io.observe(el);
    };

    els.forEach(observeEl);

    // Expose a small helper so render functions can reveal dynamic content.
    window.__dclRevealObserve = observeEl;
  }

  // Loading overlay
  function hideLoaderAfter(minMs = LOADER_MS_MIN) {
    const loader = document.getElementById("pageLoader");
    if (!loader) return;
    const start = performance.now();
    const done = () => {
      loader.setAttribute("aria-hidden", "true");
    };
    const elapsed = performance.now() - start;
    const delay = clamp(minMs - elapsed, 0, 900);
    setTimeout(done, delay);
  }

  // Navbar + Footer custom elements (reusable components)
  function renderLuxNavbar() {
    class LuxNavbar extends HTMLElement {
      connectedCallback() {
        const navHtml = `
          <div class="navWrap">
            <div class="container navbar">
              <a class="brand" href="index.html" aria-label="Desert Crown Luxury Home">
                <div class="brandMark" aria-hidden="true"></div>
                <div class="brandText">
                  <strong>Desert Crown Luxury</strong>
                  <span>Dubai-inspired elegance</span>
                </div>
              </a>

              <nav class="navLinks" aria-label="Primary navigation">
                <a href="index.html">Home</a>
                <a href="shop.html">Shop</a>
                <a href="about.html">About</a>
                <a href="contact.html">Contact</a>
                <a class="cartLink" href="cart.html">
                  Cart <span class="cartCount" id="navCartCount">0</span>
                </a>
              </nav>

              <div class="navRight">
                <button class="themeBtn navToggle" type="button" data-nav-toggle aria-label="Open menu">Menu</button>
                <button class="themeBtn" type="button" data-theme-toggle aria-label="Toggle dark/light mode">
                  <span aria-hidden="true">✦</span>
                  <span data-theme-label>Theme</span>
                </button>
                <a class="iconBtn cartLink" href="cart.html" aria-label="Go to cart">
                  <span aria-hidden="true">⟡</span>
                  <span>Cart</span>
                  <span class="cartCount" id="navCartCount2">0</span>
                </a>
              </div>
            </div>

            <div class="container navDrawer" data-nav-drawer>
              <a href="index.html">Home</a>
              <a href="shop.html">Shop</a>
              <a href="about.html">About</a>
              <a href="contact.html">Contact</a>
              <a class="cartLink" href="cart.html">Cart <span class="cartCount" id="navCartCount3">0</span></a>
            </div>
          </div>
        `;
        this.innerHTML = navHtml;

        const btnToggleTheme = this.querySelector("[data-theme-toggle]");
        if (btnToggleTheme) {
          btnToggleTheme.addEventListener("click", toggleTheme);
          btnToggleTheme.setAttribute("aria-pressed", String((document.documentElement.getAttribute("data-theme") || "dark") === "light"));
          const label = btnToggleTheme.querySelector("[data-theme-label]");
          if (label) label.textContent = (document.documentElement.getAttribute("data-theme") || "dark") === "dark" ? "Light" : "Dark";
        }

        const btnMenu = this.querySelector("[data-nav-toggle]");
        const drawer = this.querySelector("[data-nav-drawer]");
        if (btnMenu && drawer) {
          btnMenu.addEventListener("click", () => drawer.classList.toggle("open"));
          drawer.querySelectorAll("a").forEach((a) => {
            a.addEventListener("click", () => drawer.classList.remove("open"));
          });
        }
      }
    }

    if (!customElements.get("lux-navbar")) {
      customElements.define("lux-navbar", LuxNavbar);
    }
  }

  function renderLuxFooter() {
    class LuxFooter extends HTMLElement {
      connectedCallback() {
        this.innerHTML = `
          <footer class="footer">
            <div class="container footerGrid">
              <div class="footerBrand">
                <strong>Desert Crown Luxury</strong>
                <div class="sub" style="margin-top:4px;">
                  Premium watches and khanzu inspired by Dubai nights, warm sand tones, and gold finishing.
                </div>
                <div class="footSmall">© ${new Date().getFullYear()} Desert Crown Luxury. All rights reserved.</div>
              </div>

              <div>
                <div class="kicker" style="margin-bottom:10px;">Explore</div>
                <a href="shop.html">Shop</a><br/>
                <a href="about.html">About</a><br/>
                <a href="contact.html">Contact</a>
              </div>

              <div>
                <div class="kicker" style="margin-bottom:10px;">Support</div>
                <a href="checkout.html">Checkout</a><br/>
                <a href="cart.html">Cart</a><br/>
                <a href="index.html">Home</a>
              </div>
            </div>
          </footer>
        `;
      }
    }

    if (!customElements.get("lux-footer")) {
      customElements.define("lux-footer", LuxFooter);
    }
  }

  function updateCartBadges() {
    const count = cartCount();
    const ids = ["navCartCount", "navCartCount2", "navCartCount3"];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) el.textContent = String(count);
    }
  }

  function getProductAccentStyle(product) {
    return `--accent: ${product.accent};`;
  }

  function productMonogram(product) {
    return (product.symbol || product.name || "?").slice(0, 2).toUpperCase();
  }

  function productImageSvgMarkup(product, variant = "card") {
    const mon = productMonogram(product);
    const accent = product.accent || "#E2B45A";
    const kind = product.category === "khanzu" ? "Khanzu" : "Watch";

    const dims =
      variant === "cart" ? { w: 220, h: 220 } :
      variant === "modal" ? { w: 720, h: 420 } :
      variant === "gallery" ? { w: 920, h: 560 } :
      { w: 520, h: 360 };

    const cx = dims.w * 0.5;
    const cy = dims.h * 0.52;
    const r = Math.min(dims.w, dims.h) * (variant === "cart" ? 0.20 : 0.22);

    const iconSvg =
      product.category === "watches"
        ? `
          <g>
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(0,0,0,0.10)" stroke="${accent}" stroke-opacity="0.75" stroke-width="${variant === "cart" ? 10 : 14}" />
            <circle cx="${cx}" cy="${cy}" r="${r * 0.45}" fill="rgba(0,0,0,0.22)" stroke="rgba(255,255,255,0.18)" stroke-width="${variant === "cart" ? 6 : 8}" />
            <path d="M ${cx} ${cy} L ${cx + r * 0.05} ${cy - r * 0.55}" stroke="${accent}" stroke-opacity="0.9" stroke-width="${variant === "cart" ? 10 : 12}" stroke-linecap="round"/>
            <path d="M ${cx} ${cy} L ${cx + r * 0.52} ${cy + r * 0.10}" stroke="rgba(255,217,139,0.85)" stroke-width="${variant === "cart" ? 7 : 9}" stroke-linecap="round"/>
            <rect x="${cx - r * 0.06}" y="${cy - r * 1.07}" width="${r * 0.12}" height="${r * 0.22}" rx="${r * 0.06}" fill="${accent}" fill-opacity="0.85" />
          </g>
        `
        : `
          <g>
            <path d="M ${dims.w * 0.42} ${dims.h * 0.20}
                     C ${dims.w * 0.34} ${dims.h * 0.42}, ${dims.w * 0.34} ${dims.h * 0.68}, ${dims.w * 0.42} ${dims.h * 0.86}
                     C ${dims.w * 0.44} ${dims.h * 0.98}, ${dims.w * 0.56} ${dims.h * 0.98}, ${dims.w * 0.58} ${dims.h * 0.86}
                     C ${dims.w * 0.66} ${dims.h * 0.68}, ${dims.w * 0.66} ${dims.h * 0.42}, ${dims.w * 0.58} ${dims.h * 0.20}
                     Z"
                  fill="rgba(0,0,0,0.12)" stroke="${accent}" stroke-opacity="0.75" stroke-width="${variant === "cart" ? 10 : 14}" />
            <path d="M ${dims.w * 0.48} ${dims.h * 0.38} L ${dims.w * 0.52} ${dims.h * 0.38}" stroke="${accent}" stroke-width="${variant === "cart" ? 6 : 8}" stroke-linecap="round"/>
            <path d="M ${dims.w * 0.50} ${dims.h * 0.34} L ${dims.w * 0.50} ${dims.h * 0.84}" stroke="rgba(255,217,139,0.75)" stroke-width="${variant === "cart" ? 6 : 8}" stroke-linecap="round" opacity="0.9"/>
          </g>
        `;

    const fontSize = variant === "cart" ? 72 : 88;
    const titleY = variant === "cart" ? 118 : 140;

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${dims.w}" height="${dims.h}" viewBox="0 0 ${dims.w} ${dims.h}">
        <rect x="10" y="10" width="${dims.w - 20}" height="${dims.h - 20}" rx="24"
              fill="rgba(0,0,0,0.18)" stroke="${accent}" stroke-opacity="0.30" stroke-width="2"/>
        ${iconSvg}
        <text x="50%" y="${titleY}" text-anchor="middle" dominant-baseline="middle"
              font-family="Arial, Helvetica, sans-serif"
              font-size="${fontSize}" font-weight="900"
              fill="${accent}" fill-opacity="0.98"
              stroke="rgba(0,0,0,0.55)" stroke-width="${variant === "cart" ? 5 : 6}">${mon}</text>
        <text x="50%" y="${variant === "cart" ? dims.h * 0.82 : dims.h * 0.83}" text-anchor="middle"
              dominant-baseline="middle"
              font-family="Arial, Helvetica, sans-serif"
              font-size="${variant === "cart" ? 18 : 22}" font-weight="800"
              fill="rgba(255,255,255,0.78)">${kind.toUpperCase()}</text>
      </svg>
    `;
  }

  function productImageHtml(product, alt = "", className = "productImg") {
    const imgUrl = product.image;
    if (!imgUrl) return `<div class="productImgFallback">${escapeHtml(product.name)}</div>`;
    return `<img class="${className}" alt="${escapeHtml(alt || product.name)}" src="${imgUrl}" loading="lazy" />`;
  }

  // SHARED: product card
  function createProductCard(product) {
    const el = document.createElement("article");
    el.className = "productCard reveal";
    el.style.cssText = getProductAccentStyle(product);

    el.innerHTML = `
      <div class="productArt" aria-hidden="true">
        ${productImageHtml(product, "", "productImg")}
      </div>

      <div class="productTopRow">
        <h3 class="productTitle">${escapeHtml(product.name)}</h3>
        <div class="badge">${escapeHtml(product.tag || product.category)}</div>
      </div>

      <div class="price">${formatMoney(product.price)}</div>
      <div class="prodDesc">${escapeHtml(product.description)}</div>

      <div class="productActions">
        <button class="btn btn-sm btn--ghost btn-quick" type="button" data-quick-view="${escapeAttr(product.id)}">Quick View</button>
        <button class="btn btn-sm btn--primary btn-add" type="button" data-add-to-cart="${escapeAttr(product.id)}">Add to Cart</button>
      </div>
    `;
    return el;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replaceAll("`", "&#096;");
  }

  function renderShop() {
    const grid = document.getElementById("productGrid");
    const resultMeta = document.getElementById("resultMeta");
    if (!grid) return;

    const cat = document.getElementById("filterCategory");
    const minInput = document.getElementById("filterMinPrice");
    const maxInput = document.getElementById("filterMaxPrice");
    const sortSel = document.getElementById("sortSelect");

    const defaultMin = Number(minInput?.value || 0);
    const defaultMax = Number(maxInput?.value || 999999);

    function getFilteredSorted() {
      const category = cat ? cat.value : "all";
      const minP = minInput ? Number(minInput.value) : defaultMin;
      const maxP = maxInput ? Number(maxInput.value) : defaultMax;
      const sort = sortSel ? sortSel.value : "featured";

      let list = PRODUCTS.slice();
      if (category && category !== "all") list = list.filter((p) => p.category === category);
      list = list.filter((p) => p.price >= (isFinite(minP) ? minP : 0) && p.price <= (isFinite(maxP) ? maxP : 999999));

      if (sort === "low") list.sort((a, b) => a.price - b.price);
      if (sort === "high") list.sort((a, b) => b.price - a.price);
      if (sort === "rating") list.sort((a, b) => (b.rating || 0) - (a.rating || 0));

      return list;
    }

    function render() {
      grid.innerHTML = "";
      const list = getFilteredSorted();
      if (resultMeta) resultMeta.textContent = `${list.length} item${list.length === 1 ? "" : "s"} found`;

      if (list.length === 0) {
        const empty = document.createElement("div");
        empty.className = "panel";
        empty.style.padding = "18px";
        empty.innerHTML = `<strong style="letter-spacing:.08em;text-transform:uppercase;">No matches</strong><p class="sub" style="margin-top:10px;">Try adjusting your category or price range.</p>`;
        grid.appendChild(empty);
        return;
      }
      list.forEach((p) => grid.appendChild(createProductCard(p)));
    }

    render();

    // Filters
    const inputs = [cat, minInput, maxInput, sortSel].filter(Boolean);
    inputs.forEach((el) => el.addEventListener("input", render));
    inputs.forEach((el) => el.addEventListener("change", render));

    // Delegated actions (add + quick view)
    grid.addEventListener("click", (e) => {
      const addBtn = e.target.closest("[data-add-to-cart]");
      if (addBtn) {
        const id = addBtn.getAttribute("data-add-to-cart");
        handleAdd(id);
        return;
      }
      const quickBtn = e.target.closest("[data-quick-view]");
      if (quickBtn) {
        const id = quickBtn.getAttribute("data-quick-view");
        openQuickView(id);
        return;
      }
    });

    // Ensure freshly rendered product cards reveal (because initReveal runs before renderShop).
    const observerFn = window.__dclRevealObserve;
    if (typeof observerFn === "function") {
      Array.from(grid.querySelectorAll(".reveal")).forEach(observerFn);
    }

    // Product details navigation (optional: whole card click)
    grid.addEventListener("click", (e) => {
      const card = e.target.closest(".productCard");
      if (!card) return;
      // Ignore if clicked buttons
      if (e.target.closest("button")) return;
      const btn = card.querySelector("[data-quick-view]");
      if (!btn) return;
      const id = btn.getAttribute("data-quick-view");
      location.href = `product.html?id=${encodeURIComponent(id)}`;
    });
  }

  // QUICK VIEW modal
  function openQuickView(productId) {
    const product = PRODUCT_MAP.get(productId);
    if (!product) return;

    const modal = document.getElementById("quickViewModal");
    const body = document.getElementById("quickViewBody");
    if (!modal || !body) return;

    body.innerHTML = `
      <div class="modalLayout">
        <div class="modalArt" style="${getProductAccentStyle(product)}">
          ${productImageHtml(product, "", "modalImg")}
        </div>

        <div>
          <div class="kicker">Quick View</div>
          <div class="h2" style="margin:8px 0 6px;">${escapeHtml(product.name)}</div>
          <div class="price" style="margin-top:0;">${formatMoney(product.price)}</div>
          <p class="sub" style="margin-top:10px;">${escapeHtml(product.description)}</p>

          <div class="detailsList" aria-label="Product details">
            ${Object.entries(product.details || {}).map(([k, v]) => `
              <div class="detailItem">
                <strong>${escapeHtml(k)}</strong>
                <span>${escapeHtml(v)}</span>
              </div>
            `).join("")}
          </div>

          <div class="modalActions">
            <a class="btn btn--ghost" href="product.html?id=${encodeURIComponent(product.id)}">View Details</a>
            <button class="btn btn--primary btn-add" type="button" data-add-to-cart="${escapeAttr(product.id)}">Add to Cart</button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";

    const closeBtn = modal.querySelector("[data-close-modal]");
    if (closeBtn) closeBtn.focus();
  }

  function closeQuickView() {
    const modal = document.getElementById("quickViewModal");
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    modal.style.display = "none";
    document.body.style.overflow = "";
  }

  // Shared add handler
  function handleAdd(productId) {
    const ok = addToCart(productId, 1);
    if (!ok) {
      showToast("This product is unavailable.", "danger");
      return;
    }
    updateCartBadges();
    const product = PRODUCT_MAP.get(productId);
    showToast(`${product ? product.name : "Item"} added to your cart.`);
    // Update if cart.html is already open elsewhere
  }

  function initQuickViewModal() {
    const modal = document.getElementById("quickViewModal");
    if (!modal) return;

    const closeBtn = modal.querySelector("[data-close-modal]");
    if (closeBtn) closeBtn.addEventListener("click", closeQuickView);

    modal.addEventListener("click", (e) => {
      const dialog = modal.querySelector(".modal__dialog");
      if (!dialog) return;
      if (!dialog.contains(e.target)) closeQuickView();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("open")) closeQuickView();
    });

    modal.addEventListener("click", (e) => {
      const addBtn = e.target.closest("[data-add-to-cart]");
      if (addBtn) {
        const id = addBtn.getAttribute("data-add-to-cart");
        handleAdd(id);
        closeQuickView();
      }
    });
  }

  function renderProductPage() {
    const main = document.querySelector("[data-product-page]");
    if (!main) return;
    const id = new URLSearchParams(location.search).get("id");
    if (!id) {
      main.innerHTML = `<div class="panel"><div class="panelBody"><strong style="letter-spacing:.08em;text-transform:uppercase;">Missing product</strong><p class="sub" style="margin-top:10px;">No product id was provided. Return to the shop and select an item.</p><div style="margin-top:14px;"><a class="btn btn--primary" href="shop.html">Back to Shop</a></div></div></div>`;
      return;
    }
    const product = PRODUCT_MAP.get(id);
    if (!product) {
      main.innerHTML = `<div class="panel"><div class="panelBody"><strong style="letter-spacing:.08em;text-transform:uppercase;">Product not found</strong><p class="sub" style="margin-top:10px;">The product you’re looking for doesn’t exist.</p><div style="margin-top:14px;"><a class="btn btn--primary" href="shop.html">Back to Shop</a></div></div></div>`;
      return;
    }

    const detailsEntries = Object.entries(product.details || {});
    main.innerHTML = `
      <div class="breadcrumbs">${escapeHtml("Desert Crown Luxury")} / <a href="shop.html" style="color:inherit;">Shop</a> / ${escapeHtml(product.name)}</div>
      <div class="productPageGrid">
        <div class="gallery">
          <div class="galleryMain reveal" style="${getProductAccentStyle(product)}">
            ${productImageHtml(product, "", "galleryImg")}
          </div>
        </div>

        <div class="panel reveal productCardRight" style="${getProductAccentStyle(product)}">
          <div class="kicker">${escapeHtml(product.category === "watches" ? "Watches" : "Khanzu")}</div>
          <div class="h2">${escapeHtml(product.name)}</div>
          <div class="price" style="margin-top:-2px;">${formatMoney(product.price)}</div>
          <p class="sub" style="margin-top:12px;">${escapeHtml(product.description)}</p>

          <div class="keyPoints">
            ${(product.keyPoints || []).map((t) => `
              <div class="point">
                <div class="pointDot" aria-hidden="true"></div>
                <span>${escapeHtml(t)}</span>
              </div>
            `).join("")}
          </div>

          <div class="detailsList" aria-label="Product specifications">
            ${detailsEntries.map(([k, v]) => `
              <div class="detailItem">
                <strong>${escapeHtml(k)}</strong>
                <span>${escapeHtml(v)}</span>
              </div>
            `).join("")}
          </div>

          <div class="formActions" style="margin-top:18px;">
            <a class="btn btn--ghost" href="shop.html">Back to Shop</a>
            <button class="btn btn--primary btn-add" type="button" data-add-to-cart="${escapeAttr(product.id)}">Add to Cart</button>
          </div>
        </div>
      </div>
    `;

    // Ensure product page reveal elements animate in.
    const observerFn = window.__dclRevealObserve;
    if (typeof observerFn === "function") {
      Array.from(main.querySelectorAll(".reveal")).forEach(observerFn);
    }

    // Add to cart
    main.querySelector("[data-add-to-cart]")?.addEventListener("click", () => handleAdd(product.id));
  }

  function renderCartPage() {
    const list = document.getElementById("cartItems");
    const totalEl = document.getElementById("cartTotal");
    const checkoutBtn = document.getElementById("toCheckout");
    const emptyState = document.getElementById("cartEmpty");
    if (!list || !totalEl) return;

    const lines = getCartLines();
    list.innerHTML = "";
    if (emptyState) emptyState.style.display = lines.length ? "none" : "block";
    if (checkoutBtn) {
      const disabled = lines.length === 0;
      checkoutBtn.setAttribute("aria-disabled", String(disabled));
      checkoutBtn.tabIndex = disabled ? -1 : 0;
      checkoutBtn.classList.toggle("is-disabled", disabled);
    }

    if (lines.length === 0) {
      totalEl.textContent = formatMoney(0);
      return;
    }

    for (const line of lines) {
      const { product, qty, subtotal } = line;
      const row = document.createElement("div");
      row.className = "cartRow";
      row.style.cssText = getProductAccentStyle(product);
      row.innerHTML = `
        <div class="cartMain">
          <div class="cartMiniArt" aria-hidden="true">
            ${productImageHtml(product, "", "cartMiniImg")}
          </div>
          <div class="cartName">
            <strong>${escapeHtml(product.name)}</strong>
            <small>${formatMoney(product.price)} each</small>
          </div>
        </div>

        <div class="qtyBox">
          <label class="srOnly" for="qty-${escapeAttr(product.id)}">Quantity for ${escapeHtml(product.name)}</label>
          <input id="qty-${escapeAttr(product.id)}" type="number" min="1" max="99" value="${qty}" data-qty-input="${escapeAttr(product.id)}" />
        </div>

        <div class="subTotal" data-line-total="${escapeAttr(product.id)}">${formatMoney(subtotal)}</div>

        <button class="removeBtn" type="button" aria-label="Remove item" data-remove="${escapeAttr(product.id)}">✕</button>
      `;
      list.appendChild(row);
    }

    totalEl.textContent = formatMoney(lines.reduce((s, l) => s + l.subtotal, 0));
  }

  function initCartInteractions() {
    const list = document.getElementById("cartItems");
    if (!list) return;

    list.addEventListener("input", (e) => {
      const input = e.target.closest("[data-qty-input]");
      if (!input) return;
      const id = input.getAttribute("data-qty-input");
      updateCartQty(id, input.value);
      rerenderCart();
      updateCartBadges();
    });

    list.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-remove]");
      if (!btn) return;
      const id = btn.getAttribute("data-remove");
      removeFromCart(id);
      showToast("Item removed from cart.", "gold");
      rerenderCart();
      updateCartBadges();
    });

    function rerenderCart() {
      renderCartPage();
    }
  }

  function initCheckoutPage() {
    const form = document.getElementById("checkoutForm");
    const summary = document.getElementById("checkoutSummary");
    const totalEl = document.getElementById("checkoutTotal");
    if (!form || !summary || !totalEl) return;

    function renderSummary() {
      const lines = getCartLines();
      summary.innerHTML = "";
      if (lines.length === 0) {
        summary.innerHTML = `<div class="sub">Your cart is empty. Return to the shop to add items.</div><div style="margin-top:14px;"><a class="btn btn--primary" href="shop.html">Go to Shop</a></div>`;
        totalEl.textContent = formatMoney(0);
        form.querySelector('button[type="submit"]')?.setAttribute("disabled", "disabled");
        return;
      }
      form.querySelector('button[type="submit"]')?.removeAttribute("disabled");

      const ul = document.createElement("div");
      ul.className = "cartList";
      for (const line of lines) {
        const { product, qty, subtotal } = line;
        const row = document.createElement("div");
        row.className = "cartRow";
        row.style.cssText = getProductAccentStyle(product);
        row.style.gridTemplateColumns = "1fr 160px 130px";
        row.style.borderRadius = "16px";
        row.innerHTML = `
          <div class="cartMain">
            <div class="cartMiniArt" aria-hidden="true" style="width:54px;height:54px;border-radius:16px;">
              <span>${productMonogram(product)}</span>
            </div>
            <div class="cartName">
              <strong>${escapeHtml(product.name)}</strong>
              <small>${qty} × ${formatMoney(product.price)}</small>
            </div>
          </div>
          <div class="qtyBox" style="justify-content:flex-start;">
            <span class="label" style="color:var(--muted);">Subtotal</span>
          </div>
          <div class="subTotal">${formatMoney(subtotal)}</div>
        `;
        ul.appendChild(row);
      }
      summary.appendChild(ul);

      totalEl.textContent = formatMoney(cartTotal());
    }

    renderSummary();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.setAttribute("disabled", "disabled");

      // Basic validation
      const required = [
        ["fullName", "Full name"],
        ["email", "Email"],
        ["address", "Address"],
        ["city", "City"],
        ["cardNumber", "Card number"],
        ["expiry", "Expiry"],
        ["cvv", "CVV"]
      ];
      for (const [name, label] of required) {
        const input = form.querySelector(`[name="${name}"]`);
        if (!input) continue;
        const v = String(input.value || "").trim();
        if (!v) {
          showToast(`${label} is required.`, "danger");
          btn && btn.removeAttribute("disabled");
          return;
        }
      }

      // Fake processing
      const processing = form.querySelector("[data-processing]");
      if (processing) processing.style.display = "block";
      const result = form.querySelector("[data-result]");
      if (result) result.style.display = "none";

      await new Promise((r) => setTimeout(r, 1100));

      const orderNo = "DCL-" + Math.floor(100000 + Math.random() * 900000);
      if (result) {
        result.innerHTML = `
          <strong style="letter-spacing:.08em;text-transform:uppercase;">Payment successful</strong>
          <p class="sub" style="margin-top:10px;">Order ${escapeHtml(orderNo)} has been created (demo checkout).</p>
        `;
        result.style.display = "block";
      }

      // Clear cart
      localStorage.removeItem(KEY_CART);
      updateCartBadges();
      renderSummary();

      if (processing) processing.style.display = "none";
      btn && btn.removeAttribute("disabled");
    });
  }

  function initAboutContactHandlers() {
    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
      contactForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = contactForm.querySelector('input[name="name"]')?.value || "there";
        showToast(`Thanks, ${escapeHtml(name)}. We'll get back to you soon.`);
        contactForm.reset();
      });
    }
  }

  function initShopQuickViewAddHandler() {
    // Buttons inside modal are already handled in initQuickViewModal
  }

  function initGlobalDelegates() {
    // Listen to cart changes in other tabs
    window.addEventListener("storage", (e) => {
      if (e.key === KEY_CART) updateCartBadges();
    });
  }

  function initPage() {
    // Prevent any accidental "opacity:0" reveal state on slower browsers.
    document.body.classList.add("dcl-ready");
    initTheme();
    renderLuxNavbar();
    renderLuxFooter();
    initReveal();
    updateCartBadges();
    initQuickViewModal();
    initGlobalDelegates();
    initAboutContactHandlers();

    const page = document.body.dataset.page || "home";
    if (page === "shop") renderShop();
    if (page === "product") renderProductPage();
    if (page === "cart") {
      renderCartPage();
      initCartInteractions();
    }
    if (page === "checkout") initCheckoutPage();

    hideLoaderAfter(420);
  }

  // Wait for DOM ready (products.js is defer-loaded too).
  window.addEventListener("DOMContentLoaded", initPage);
})();

