let DB = null;

let SHOP_STATE = {
  search: "",
  type: "all",
  category: "all",
  quick: "all",
  sort: "featured"
};

const $ = (id) => document.getElementById(id);

/* =========================
   HELPERS
========================= */
function safeText(v) {
  return (v ?? "").toString();
}

function escapeHtml(str) {
  return safeText(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseAbout(raw) {
  if (!raw) return "";

  return raw
    .split("\n")
    .map((line) => {
      const t = line.trim();
      if (!t) return "";

      if (t.startsWith("#")) {
        return `<div class="aboutTitle">${escapeHtml(
          t.replace(/^#+/, "").trim()
        )}</div>`;
      }

      return `<div class="aboutP">${escapeHtml(t)}</div>`;
    })
    .join("");
}

function parseMoney(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const normalized = String(value)
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function moneyText(value) {
  const num = parseMoney(value);
  if (num == null) return "";
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function makeSlug(text) {
  return safeText(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* =========================
   NORMALIZAÇÃO DOS ITENS
========================= */
function normalizeShopItem(item, index = 0) {
  const kind = item.kind === "beat" ? "beat" : "product";
  const title = safeText(item.title).trim();
  const category = safeText(item.category).trim();
  const slug = safeText(item.slug).trim() || makeSlug(title || `item-${index + 1}`);

  const gallery = Array.isArray(item.gallery)
    ? item.gallery.map((x) => safeText(x).trim()).filter(Boolean)
    : safeText(item.gallery)
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);

  const images = [safeText(item.img).trim(), ...gallery].filter(Boolean);

  const price = parseMoney(item.price);
  const oldPrice = parseMoney(item.oldPrice);

  const stockRaw = Number(item.stock);
  const stock = Number.isFinite(stockRaw) ? Math.max(0, stockRaw) : null;

  return {
    ...item,
    id: item.id || `${slug}-${index}`,
    kind,
    title,
    desc: safeText(item.desc).trim(),
    link: safeText(item.link).trim(),
    whatsapp: safeText(item.whatsapp).trim(),
    instagram: safeText(item.instagram).trim(),
    category,
    slug,
    img: images[0] || "",
    gallery,
    images,
    price,
    oldPrice,
    badge: safeText(item.badge).trim(),
    audio: safeText(item.audio).trim(),
    bpm: safeText(item.bpm).trim(),
    key: safeText(item.key).trim(),
    genre: safeText(item.genre).trim(),
    license: safeText(item.license).trim(),
    featured: Boolean(item.featured),
    isNew: Boolean(item.isNew),
    bestSeller: Boolean(item.bestSeller),
    active: item.active !== false,
    stock,
    createdAt: item.createdAt || Date.now() + index
  };
}

function getActiveShopItems() {
  return (DB?.shop || [])
    .map(normalizeShopItem)
    .filter((item) => item.active);
}

function getCategories(items) {
  const map = new Set();

  items.forEach((item) => {
    if (item.category) map.add(item.category);
  });

  return [...map].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/* =========================
   TEMA / CONTEÚDO GERAL
========================= */
function applyTheme(settings) {
  document.documentElement.style.setProperty("--accent", settings.accent || "#7a00ff");
  document.documentElement.style.setProperty("--bg", settings.bg || "#0b0b0b");

  const logoImg = $("logoImg");
  if (logoImg && settings.logo) logoImg.src = settings.logo;

  const brandName = $("brandName");
  if (brandName) brandName.textContent = settings.brand || "Zone7 Records";

  const heroBg = $("heroBg");
  if (heroBg) {
    if (settings.heroBg) {
      heroBg.style.backgroundImage = `url('${settings.heroBg}')`;
      heroBg.style.backgroundSize = "cover";
      heroBg.style.backgroundPosition = "center";
    } else {
      heroBg.style.backgroundImage = "";
    }
  }

  const heroTitle = $("heroTitle");
  if (heroTitle) heroTitle.textContent = settings.heroTitle || "ZONE7 RECORDS";

  const heroSub = $("heroSub");
  if (heroSub) heroSub.textContent = settings.heroSub || "";

  const aboutText = $("aboutText");
  if (aboutText) aboutText.innerHTML = parseAbout(settings.about || "");
}

function artistCardHTML(item) {
  const link = safeText(item.link).trim();

  const btn = link
    ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener"><button class="btn" type="button">Conhecer</button></a>`
    : `<button class="btn alt" type="button" disabled>Sem link</button>`;

  return `
    <article class="card">
      <img class="cardMedia" src="${escapeHtml(item.img || "")}" alt="${escapeHtml(item.title || "")}">
      <div class="cardBody">
        <div class="cardTitle">${escapeHtml(item.title || "")}</div>
        <p class="cardDesc">${escapeHtml(item.desc || "")}</p>
        <div class="cardActions">${btn}</div>
      </div>
    </article>
  `;
}

function renderSpotify() {
  const spotifySection = $("spotifySection");
  const spotifyGrid = $("spotifyGrid");
  if (!spotifySection || !spotifyGrid) return;

  const embeds = (DB?.settings?.spotify || [])
    .map((x) => String(x).trim())
    .filter(Boolean);

  if (!embeds.length) {
    spotifySection.classList.add("hidden");
    spotifyGrid.innerHTML = "";
    return;
  }

  spotifySection.classList.remove("hidden");
  spotifyGrid.innerHTML = embeds
    .map((code) => `<div class="spotifyCard">${code}</div>`)
    .join("");
}

function renderHeroStats() {
  const statArtists = $("statArtists");
  const statShop = $("statShop");
  const statSpotify = $("statSpotify");

  if (statArtists) statArtists.textContent = String((DB?.artists || []).length);
  if (statShop) statShop.textContent = String(getActiveShopItems().length);
  if (statSpotify) statSpotify.textContent = String((DB?.settings?.spotify || []).length);
}

/* =========================
   LOJA
========================= */
function buildWhatsappLink(item) {
  const phone = safeText(item.whatsapp || "").replace(/\D/g, "");
  if (!phone) return "";

  const message = encodeURIComponent(
    `Olá! Tenho interesse em "${item.title}" da Zone7.`
  );

  return `https://wa.me/${phone}?text=${message}`;
}

function buildItemUrl(item) {
  const url = new URL(window.location.href);
  url.searchParams.set("item", item.slug);
  return url.toString();
}

function buildBadges(item) {
  const badges = [];

  badges.push(
    `<span class="miniBadge ${item.kind === "beat" ? "isBeat" : "isProduct"}">${
      item.kind === "beat" ? "BEAT" : "PRODUTO"
    }</span>`
  );

  if (item.featured) {
    badges.push(`<span class="miniBadge isFeatured">DESTAQUE</span>`);
  }

  if (item.isNew) {
    badges.push(`<span class="miniBadge isNew">NOVO</span>`);
  }

  if (item.bestSeller) {
    badges.push(`<span class="miniBadge isHot">MAIS VENDIDO</span>`);
  }

  if (item.badge) {
    badges.push(`<span class="miniBadge isGhost">${escapeHtml(item.badge)}</span>`);
  }

  return badges.join("");
}

function shopCardHTML(item) {
  const hasPromo =
    item.oldPrice != null &&
    item.price != null &&
    item.oldPrice > item.price;

  const buyLabel = item.kind === "beat" ? "Comprar beat" : "Comprar";
  const whatsappLink = buildWhatsappLink(item);

  const stockText =
    item.stock === null
      ? "Sob consulta"
      : item.stock > 0
      ? `${item.stock} em estoque`
      : "Esgotado";

  const metaPills = [
    item.category ? `<span class="tinyPill">${escapeHtml(item.category)}</span>` : "",
    item.kind === "beat" && item.bpm
      ? `<span class="tinyPill">${escapeHtml(item.bpm)} BPM</span>`
      : "",
    item.kind === "beat" && item.key
      ? `<span class="tinyPill">${escapeHtml(item.key)}</span>`
      : "",
    item.kind === "beat" && item.license
      ? `<span class="tinyPill">${escapeHtml(item.license)}</span>`
      : ""
  ].join("");

  const infoItems = [
    item.category ? ["Categoria", item.category] : null,
    ["Status", stockText],
    item.kind === "beat" && item.bpm ? ["BPM", item.bpm] : null,
    item.kind === "beat" && item.key ? ["Tom", item.key] : null,
    item.kind === "beat" && item.genre ? ["Gênero", item.genre] : null,
    item.kind === "beat" && item.license ? ["Licença", item.license] : null
  ]
    .filter(Boolean)
    .slice(0, 4)
    .map(
      ([label, value]) => `
        <div class="shopInfoItem">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `
    )
    .join("");

  const primaryAction = item.link
    ? `<a href="${escapeHtml(item.link)}" target="_blank" rel="noopener"><button class="btn" type="button">${buyLabel}</button></a>`
    : `<button class="btn alt" type="button" data-open-item="${escapeHtml(item.id)}">Ver detalhes</button>`;

  const whatsappAction = whatsappLink
    ? `<a href="${escapeHtml(whatsappLink)}" target="_blank" rel="noopener"><button class="btn alt" type="button">WhatsApp</button></a>`
    : "";

  const audio =
    item.kind === "beat" && item.audio
      ? `<audio class="beatPlayer" controls preload="none" src="${escapeHtml(item.audio)}"></audio>`
      : "";

  return `
    <article class="shopCard ${item.featured ? "featuredCard" : ""}" data-id="${escapeHtml(item.id)}">
      <button class="cardClickLayer" type="button" data-open-item="${escapeHtml(item.id)}" aria-label="Abrir detalhes"></button>

      <div class="shopMediaWrap">
        <img class="cardMedia" src="${escapeHtml(item.img)}" alt="${escapeHtml(item.title)}">
        <div class="shopMediaShade"></div>
        <div class="shopBadges">${buildBadges(item)}</div>
      </div>

      <div class="cardBody shopCardBody">
        <div class="shopHeaderLine">
          <div class="cardTitle">${escapeHtml(item.title)}</div>
          <div class="stockText ${item.stock === 0 ? "isOut" : ""}">${escapeHtml(stockText)}</div>
        </div>

        <p class="cardDesc">${escapeHtml(item.desc)}</p>

        <div class="tinyPills">${metaPills}</div>

        <div class="shopInfoGrid">${infoItems}</div>

        ${audio}

        <div class="priceRow">
          <div class="priceStack">
            ${hasPromo ? `<span class="oldPrice">${moneyText(item.oldPrice)}</span>` : ""}
            <span class="mainPrice">${moneyText(item.price) || "Consulte"}</span>
          </div>
          <button class="ghostCardBtn" type="button" data-open-item="${escapeHtml(item.id)}">Detalhes</button>
        </div>

        <div class="cardActions">
          ${primaryAction}
          ${whatsappAction}
        </div>
      </div>
    </article>
  `;
}

function sortItems(items) {
  const list = [...items];

  switch (SHOP_STATE.sort) {
    case "newest":
      return list.sort(
        (a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)
      );

    case "price-asc":
      return list.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));

    case "price-desc":
      return list.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));

    case "name":
      return list.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));

    case "featured":
    default:
      return list.sort((a, b) => {
        const scoreA =
          Number(Boolean(a.featured)) * 10 +
          Number(Boolean(a.bestSeller)) * 4 +
          Number(Boolean(a.isNew)) * 2;

        const scoreB =
          Number(Boolean(b.featured)) * 10 +
          Number(Boolean(b.bestSeller)) * 4 +
          Number(Boolean(b.isNew)) * 2;

        if (scoreB !== scoreA) return scoreB - scoreA;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }
}

function filterItems(items) {
  let list = [...items];

  if (SHOP_STATE.search) {
    const q = SHOP_STATE.search.toLowerCase();

    list = list.filter((item) =>
      [
        item.title,
        item.desc,
        item.category,
        item.genre,
        item.key,
        item.license,
        item.badge
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  if (SHOP_STATE.type !== "all") {
    list = list.filter((item) => item.kind === SHOP_STATE.type);
  }

  if (SHOP_STATE.category !== "all") {
    list = list.filter(
      (item) => item.category.toLowerCase() === SHOP_STATE.category.toLowerCase()
    );
  }

  switch (SHOP_STATE.quick) {
    case "featured":
      list = list.filter((item) => item.featured);
      break;

    case "new":
      list = list.filter((item) => item.isNew);
      break;

    case "instock":
      list = list.filter((item) => item.stock === null || item.stock > 0);
      break;

    case "promo":
      list = list.filter(
        (item) =>
          item.oldPrice != null &&
          item.price != null &&
          item.oldPrice > item.price
      );
      break;

    case "beats":
      list = list.filter((item) => item.kind === "beat");
      break;
  }

  return sortItems(list);
}

function updateShopStats(allItems, visibleItems) {
  const count = $("shopCount");
  const featured = $("shopFeaturedCount");

  if (count) count.textContent = String(visibleItems.length);
  if (featured) {
    featured.textContent = String(allItems.filter((x) => x.featured).length);
  }
}

function populateCategoryFilter(items) {
  const el = $("shopCategoryFilter");
  if (!el) return;

  const current = SHOP_STATE.category;
  const categories = getCategories(items);

  el.innerHTML = `
    <option value="all">Todas as categorias</option>
    ${categories
      .map(
        (cat) =>
          `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`
      )
      .join("")}
  `;

  if (categories.some((cat) => cat.toLowerCase() === current.toLowerCase())) {
    el.value = current;
  } else {
    el.value = "all";
    SHOP_STATE.category = "all";
  }
}

function renderShop() {
  const grid = $("shopGrid");
  const empty = $("shopEmpty");
  if (!grid || !empty) return;

  const allItems = getActiveShopItems();
  populateCategoryFilter(allItems);

  const visibleItems = filterItems(allItems);

  updateShopStats(allItems, visibleItems);

  if (!visibleItems.length) {
    grid.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  grid.innerHTML = visibleItems.map(shopCardHTML).join("");

  document.querySelectorAll("[data-open-item]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.openItem;
      const item = allItems.find((x) => x.id === id);
      if (item) openShopModal(item);
    });
  });

  const paramSlug = new URL(window.location.href).searchParams.get("item");
  if (paramSlug) {
    const target = allItems.find((x) => x.slug === paramSlug);
    if (target) openShopModal(target, false);
  }
}

/* =========================
   MODAL
========================= */
function openShopModal(item, pushState = true) {
  const modal = $("shopModal");
  if (!modal) return;

  const title = $("modalTitle");
  const desc = $("modalDesc");
  const mainImg = $("modalMainImg");
  const thumbs = $("modalThumbs");
  const badges = $("modalBadges");
  const oldPrice = $("modalOldPrice");
  const price = $("modalPrice");
  const meta = $("modalMeta");
  const audioWrap = $("modalAudioWrap");
  const audio = $("modalAudio");
  const buy = $("modalBuy");
  const whatsapp = $("modalWhatsapp");
  const instagram = $("modalInstagram");

  if (title) title.textContent = item.title;
  if (desc) desc.textContent = item.desc || "";

  if (mainImg) {
    mainImg.src = item.img || "";
    mainImg.alt = item.title || "";
  }

  if (badges) {
    badges.innerHTML = buildBadges(item);
  }

  if (oldPrice) {
    const showOld =
      item.oldPrice != null &&
      item.price != null &&
      item.oldPrice > item.price;

    oldPrice.classList.toggle("hidden", !showOld);
    oldPrice.textContent = showOld ? moneyText(item.oldPrice) : "";
  }

  if (price) {
    price.textContent = moneyText(item.price) || "Consulte";
  }

  const metaItems = [
    item.category ? ["Categoria", item.category] : null,
    item.stock !== null
      ? ["Estoque", item.stock > 0 ? String(item.stock) : "Esgotado"]
      : null,
    item.kind === "beat" && item.bpm ? ["BPM", item.bpm] : null,
    item.kind === "beat" && item.key ? ["Tom", item.key] : null,
    item.kind === "beat" && item.genre ? ["Gênero", item.genre] : null,
    item.kind === "beat" && item.license ? ["Licença", item.license] : null
  ].filter(Boolean);

  if (meta) {
    meta.innerHTML = metaItems
      .map(
        ([k, v]) => `
        <div class="metaItem">
          <span>${escapeHtml(k)}</span>
          <strong>${escapeHtml(v)}</strong>
        </div>
      `
      )
      .join("");
  }

  if (thumbs) {
    thumbs.innerHTML = item.images
      .map(
        (img, idx) => `
        <button class="thumbBtn ${idx === 0 ? "active" : ""}" type="button" data-thumb="${escapeHtml(img)}">
          <img src="${escapeHtml(img)}" alt="${escapeHtml(item.title)}">
        </button>
      `
      )
      .join("");

    thumbs.querySelectorAll("[data-thumb]").forEach((btn) => {
      btn.addEventListener("click", () => {
        thumbs.querySelectorAll(".thumbBtn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        if (mainImg) {
          mainImg.src = btn.dataset.thumb || "";
        }
      });
    });
  }

  if (audioWrap && audio) {
    const showAudio = item.kind === "beat" && item.audio;
    audioWrap.classList.toggle("hidden", !showAudio);
    audio.src = showAudio ? item.audio : "";
  }

  if (buy) {
    if (item.link) {
      buy.href = item.link;
      buy.classList.remove("hidden");
    } else {
      buy.classList.add("hidden");
    }
  }

  if (whatsapp) {
    const href = buildWhatsappLink(item);
    if (href) {
      whatsapp.href = href;
      whatsapp.classList.remove("hidden");
    } else {
      whatsapp.classList.add("hidden");
    }
  }

  if (instagram) {
    if (item.instagram) {
      instagram.href = item.instagram;
      instagram.classList.remove("hidden");
    } else {
      instagram.classList.add("hidden");
    }
  }

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("noScroll");

  if (pushState) {
    const url = new URL(window.location.href);
    url.searchParams.set("item", item.slug);
    history.replaceState({}, "", url.toString());
  }
}

function closeShopModal() {
  const modal = $("shopModal");
  if (!modal) return;

  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("noScroll");

  const url = new URL(window.location.href);
  url.searchParams.delete("item");
  history.replaceState({}, "", url.toString());

  const audio = $("modalAudio");
  if (audio) {
    audio.pause();
    audio.src = "";
  }
}

function setupModal() {
  const closeBtn = $("modalClose");
  const modal = $("shopModal");
  const copyBtn = $("modalCopyLink");

  if (closeBtn) {
    closeBtn.addEventListener("click", closeShopModal);
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target?.dataset?.closeModal === "true") {
        closeShopModal();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && !modal.classList.contains("hidden")) {
      closeShopModal();
    }
  });

  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const current = window.location.href;

      try {
        await navigator.clipboard.writeText(current);
        copyBtn.textContent = "Link copiado";
        setTimeout(() => {
          copyBtn.textContent = "Copiar link";
        }, 1600);
      } catch {
        alert("Não consegui copiar o link.");
      }
    });
  }
}

/* =========================
   NAVEGAÇÃO / TABS
========================= */
function setTab(tab) {
  const home = $("tab-home");
  const shop = $("tab-shop");

  if (home) home.classList.toggle("hidden", tab !== "home");
  if (shop) shop.classList.toggle("hidden", tab !== "shop");

  document.querySelectorAll(".navBtn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
}

function setupTabs() {
  document.querySelectorAll(".navBtn").forEach((btn) => {
    btn.addEventListener("click", () => setTab(btn.dataset.tab));
  });

  const goShop = $("goShop");
  if (goShop) {
    goShop.addEventListener("click", () => setTab("shop"));
  }

  const scrollArtists = $("scrollArtists");
  if (scrollArtists) {
    scrollArtists.addEventListener("click", () => {
      const sec = $("artistsSection");
      if (sec) sec.scrollIntoView({ behavior: "smooth" });
    });
  }

  const scrollMusic = $("scrollMusic");
  if (scrollMusic) {
    scrollMusic.addEventListener("click", () => {
      const sec = $("spotifySection");
      if (sec) sec.scrollIntoView({ behavior: "smooth" });
    });
  }

  setTab("home");
}

function setupShopUI() {
  const search = $("shopSearch");
  const type = $("shopTypeFilter");
  const category = $("shopCategoryFilter");
  const sort = $("shopSort");

  if (search) {
    search.addEventListener("input", () => {
      SHOP_STATE.search = search.value.trim();
      renderShop();
    });
  }

  if (type) {
    type.addEventListener("change", () => {
      SHOP_STATE.type = type.value;
      renderShop();
    });
  }

  if (category) {
    category.addEventListener("change", () => {
      SHOP_STATE.category = category.value;
      renderShop();
    });
  }

  if (sort) {
    sort.addEventListener("change", () => {
      SHOP_STATE.sort = sort.value;
      renderShop();
    });
  }

  document.querySelectorAll(".chipBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".chipBtn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      SHOP_STATE.quick = btn.dataset.quick || "all";
      renderShop();
    });
  });
}

/* =========================
   RENDER GERAL
========================= */
function render() {
  const artistsGrid = $("artistsGrid");
  if (artistsGrid) {
    artistsGrid.innerHTML = (DB?.artists || []).map(artistCardHTML).join("");
  }

  renderHeroStats();
  renderShop();
  renderSpotify();

  try {
    if (window.gsap) {
      gsap.from(".heroInner", {
        opacity: 0,
        y: 18,
        duration: 0.45,
        ease: "power2.out"
      });
    }
  } catch {}
}

/* =========================
   LOAD
========================= */
async function loadPublic() {
  const res = await fetch("/api/public");
  DB = await res.json();

  DB.settings = DB.settings || {};
  DB.artists = Array.isArray(DB.artists) ? DB.artists : [];
  DB.shop = Array.isArray(DB.shop) ? DB.shop : [];

  applyTheme(DB.settings || {});
  render();
}

/* =========================
INIT
========================= */
setupTabs();
setupShopUI();
setupModal();
loadPublic();

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".footerLink");
  if (!btn) return;

  const tab = btn.dataset.tab;
  if (tab) {
    setTab(tab);
  }
});

/* =========================
HOOKS PRO ADMIN
========================= */
window.Zone7 = window.Zone7 || {};
window.Zone7.loadPublic = loadPublic;
window.Zone7.applyTheme = applyTheme;
window.Zone7.render = render;
window.Zone7.normalizeShopItem = normalizeShopItem;
window.Zone7.buildItemUrl = buildItemUrl;
