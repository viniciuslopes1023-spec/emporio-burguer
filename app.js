// ===== Configuração =====
// Troque pelo número real da loja: código do país + DDD + número (sem espaços nem símbolos)
const WHATSAPP_NUMERO = "5585999745068";
const LOJA_NOME = "Empório Burguer Gourmet";

// ===== Estado =====
const cart = new Map(); // id -> { id, name, price, qty }

const cartBtn = document.getElementById("cart-btn");
const cartBadge = document.getElementById("cart-badge");
const cartDrawer = document.getElementById("cart-drawer");
const cartOverlay = document.getElementById("cart-overlay");
const cartClose = document.getElementById("cart-close");
const cartItems = document.getElementById("cart-items");
const cartEmpty = document.getElementById("cart-empty");
const cartTotal = document.getElementById("cart-total");
const btnWhatsapp = document.getElementById("btn-whatsapp");
const toast = document.getElementById("toast");
const orderbar = document.getElementById("orderbar");
const orderbarCount = document.getElementById("orderbar-count");
const orderbarTotal = document.getElementById("orderbar-total");
const orderbarLabel = document.getElementById("orderbar-label");
const orderbarCart = document.getElementById("orderbar-cart");
const orderbarView = document.getElementById("orderbar-view");
const orderbarWa = document.getElementById("orderbar-wa");

// ===== Carrinho =====
function formatBRL(v) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function cartQtyTotal() {
  let n = 0;
  cart.forEach((item) => (n += item.qty));
  return n;
}

function cartSum() {
  let s = 0;
  cart.forEach((item) => (s += item.price * item.qty));
  return s;
}

function addItem(product) {
  const existing = cart.get(product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.set(product.id, { ...product, qty: 1 });
  }
  renderCart();
  showToast(product.name + " adicionado");
}

function changeQty(id, delta) {
  const item = cart.get(id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart.delete(id);
  renderCart();
}

function removeItem(id) {
  cart.delete(id);
  renderCart();
}

function renderCart() {
  const qty = cartQtyTotal();

  if (qty > 0) {
    cartBadge.hidden = false;
    cartBadge.textContent = qty;
  } else {
    cartBadge.hidden = true;
  }

  cartItems.querySelectorAll(".cart-row").forEach((el) => el.remove());

  if (cart.size === 0) {
    cartEmpty.hidden = false;
    cartTotal.textContent = formatBRL(0);
    btnWhatsapp.setAttribute("aria-disabled", "true");
    btnWhatsapp.classList.add("disabled");
    return;
  }

  cartEmpty.hidden = true;
  btnWhatsapp.removeAttribute("aria-disabled");
  btnWhatsapp.classList.remove("disabled");

  cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML =
      '<div class="cart-row-info">' +
      '<span class="cart-row-name"></span>' +
      '<span class="cart-row-price"></span>' +
      "</div>" +
      '<div class="cart-row-actions">' +
      '<button class="qty-btn" data-act="dec" aria-label="Diminuir">−</button>' +
      '<span class="qty-value"></span>' +
      '<button class="qty-btn" data-act="inc" aria-label="Aumentar">+</button>' +
      '<button class="qty-remove" data-act="rm" aria-label="Remover">×</button>' +
      "</div>";

    row.querySelector(".cart-row-name").textContent = item.name;
    row.querySelector(".cart-row-price").textContent = formatBRL(item.price * item.qty);
    row.querySelector(".qty-value").textContent = item.qty;

    row.querySelector('[data-act="dec"]').addEventListener("click", () => changeQty(item.id, -1));
    row.querySelector('[data-act="inc"]').addEventListener("click", () => changeQty(item.id, 1));
    row.querySelector('[data-act="rm"]').addEventListener("click", () => removeItem(item.id));

    cartItems.appendChild(row);
  });

  cartTotal.textContent = formatBRL(cartSum());
  renderOrderBar();
}

// ===== Barra fixa do pedido (acesso rápido ao carrinho) =====
function renderOrderBar() {
  if (!orderbar) return;
  const qty = cartQtyTotal();
  const total = cartSum();

  if (qty > 0) {
    orderbar.hidden = false;
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => orderbar.classList.add("show"));
    } else {
      orderbar.classList.add("show");
    }
    orderbarCount.textContent = qty;
    orderbarTotal.textContent = formatBRL(total);
    orderbarLabel.textContent = qty === 1 ? "1 item no pedido" : qty + " itens no pedido";
    orderbarWa.href = buildWhatsappLink();
    document.body.classList.add("has-orderbar");
  } else {
    orderbar.classList.remove("show");
    document.body.classList.remove("has-orderbar");
    setTimeout(() => {
      if (cartQtyTotal() === 0) orderbar.hidden = true;
    }, 320);
  }
}

function buildWhatsappLink() {
  const lines = ["*Pedido — " + LOJA_NOME + "*", ""];
  cart.forEach((item) => {
    lines.push(item.qty + "x " + item.name + " — " + formatBRL(item.price * item.qty));
  });
  lines.push("");
  lines.push("*Total: " + formatBRL(cartSum()) + "*");
  const text = encodeURIComponent(lines.join("\n"));
  return "https://wa.me/" + WHATSAPP_NUMERO + "?text=" + text;
}

// ===== Drawer =====
function openCart() {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  cartOverlay.hidden = false;
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => cartOverlay.classList.add("open"));
  } else {
    cartOverlay.classList.add("open");
  }
  document.body.style.overflow = "hidden";
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  cartOverlay.classList.remove("open");
  setTimeout(() => (cartOverlay.hidden = true), 250);
  document.body.style.overflow = "";
}

cartBtn.addEventListener("click", openCart);
cartClose.addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);
if (orderbarCart) orderbarCart.addEventListener("click", openCart);
if (orderbarView) orderbarView.addEventListener("click", openCart);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCart();
});

btnWhatsapp.addEventListener("click", (e) => {
  if (cart.size === 0) {
    e.preventDefault();
    return;
  }
  btnWhatsapp.href = buildWhatsappLink();
});

// ===== Toast =====
const toastText = document.getElementById("toast-text");
const toastAction = document.getElementById("toast-action");
let toastTimer;

function showToast(msg) {
  toastText.textContent = msg;
  toast.hidden = false;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => (toast.hidden = true), 250);
  }, 4000);
}

toastAction.addEventListener("click", () => {
  toast.classList.remove("show");
  toast.hidden = true;
  openCart();
});

// ===== Botões de adicionar (cards + cardápio completo) =====
document.querySelectorAll(".add-btn").forEach((btn) => {
  if (btn.disabled) return;
  const card = btn.closest(".card");
  const name = btn.dataset.name || (card && card.dataset.name);
  const price = btn.dataset.price || (card && card.dataset.price);
  if (!name || price === undefined || price === "") return;
  btn.addEventListener("click", () => {
    addItem({
      id: name,
      name: name,
      price: parseFloat(price),
    });
  });
});

// ===== Filtros =====
document.querySelectorAll(".filter").forEach((filterBtn) => {
  filterBtn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((b) => b.classList.remove("active"));
    filterBtn.classList.add("active");
    const cat = filterBtn.dataset.filter;
    document.querySelectorAll(".card").forEach((card) => {
      const show = cat === "todos" || card.dataset.cat === cat;
      card.hidden = !show;
      if (show) card.classList.add("in");
    });
  });
});

// ===== Animações de scroll =====
if ("IntersectionObserver" in window) {
  const animObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          animObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -70px 0px" }
  );

  document
    .querySelectorAll(".anim, .anim-left, .anim-right, .anim-pop")
    .forEach((el) => animObserver.observe(el));
} else {
  document
    .querySelectorAll(".anim, .anim-left, .anim-right, .anim-pop")
    .forEach((el) => el.classList.add("in"));
}

// ===== Scrollspy do cardápio completo =====
const fmNav = document.getElementById("fm-nav");
const fmSections = document.querySelectorAll(".fm-section");
if (fmNav && fmSections.length && "IntersectionObserver" in window) {
  const chips = fmNav.querySelectorAll(".fm-chip");
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        chips.forEach((chip) => {
          chip.classList.toggle(
            "active",
            chip.getAttribute("href") === "#" + entry.target.id
          );
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  fmSections.forEach((s) => spy.observe(s));
}

// ===== Menu do topo: destaca o link da seção visível =====
const topNav = document.getElementById("nav-links");
if (topNav && "IntersectionObserver" in window) {
  const links = topNav.querySelectorAll("a");
  const targets = links
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);
  const navSpy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          link.classList.toggle(
            "active",
            link.getAttribute("href") === "#" + entry.target.id
          );
        });
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  targets.forEach((t) => navSpy.observe(t));
}

renderCart();
