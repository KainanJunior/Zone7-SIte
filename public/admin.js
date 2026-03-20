let token = "";
let adminDB = null;

const adminShell = document.getElementById("adminShell");
const adminPanel = document.getElementById("adminPanel");
const adminDrag  = document.getElementById("adminDrag");
const adminLogin = document.getElementById("adminLogin");
const adminBody  = document.getElementById("adminBody");

const btnLogin      = document.getElementById("btnLogin");
const btnCloseAdmin = document.getElementById("btnCloseAdmin");
const btnLogout     = document.getElementById("btnLogout");
const adminPassword = document.getElementById("adminPassword");
const floatingAdminBtn = document.getElementById("floatingAdminBtn");

const setBrand        = document.getElementById("setBrand");
const setAccent       = document.getElementById("setAccent");
const setBg           = document.getElementById("setBg");
const setHeroTitle    = document.getElementById("setHeroTitle");
const setHeroSub      = document.getElementById("setHeroSub");
const setAbout        = document.getElementById("setAbout");
const setSpotify      = document.getElementById("setSpotify");
const setLogoFile     = document.getElementById("setLogoFile");
const setHeroBgFile   = document.getElementById("setHeroBgFile");
const btnSaveSettings = document.getElementById("btnSaveSettings");

const artTitle        = document.getElementById("artTitle");
const artDesc         = document.getElementById("artDesc");
const artLink         = document.getElementById("artLink");
const artImgFile      = document.getElementById("artImgFile");
const btnAddArtist    = document.getElementById("btnAddArtist");
const btnUpdateArtist = document.getElementById("btnUpdateArtist");
const artistsList     = document.getElementById("artistsList");

const shopType        = document.getElementById("shopType");
const beatFields      = document.getElementById("beatFields");
const shopTitle       = document.getElementById("shopTitle");
const shopCategory    = document.getElementById("shopCategory");
const shopLink        = document.getElementById("shopLink");
const shopWhatsapp    = document.getElementById("shopWhatsapp");
const shopInstagram   = document.getElementById("shopInstagram");
const shopStock       = document.getElementById("shopStock");
const shopPrice       = document.getElementById("shopPrice");
const shopOldPrice    = document.getElementById("shopOldPrice");
const shopBadge       = document.getElementById("shopBadge");
const shopSlug        = document.getElementById("shopSlug");
const shopDesc        = document.getElementById("shopDesc");
const shopImgFile     = document.getElementById("shopImgFile");
const shopGallery     = document.getElementById("shopGallery");
const shopFeatured    = document.getElementById("shopFeatured");
const shopIsNew       = document.getElementById("shopIsNew");
const shopBestSeller  = document.getElementById("shopBestSeller");
const shopActive      = document.getElementById("shopActive");
const shopAudioFile   = document.getElementById("shopAudioFile");
const shopBpm         = document.getElementById("shopBpm");
const shopKey         = document.getElementById("shopKey");
const shopGenre       = document.getElementById("shopGenre");
const shopLicense     = document.getElementById("shopLicense");
const btnAddShop      = document.getElementById("btnAddShop");
const btnUpdateShop   = document.getElementById("btnUpdateShop");
const shopList        = document.getElementById("shopList");

let editingArtistId = null;
let editingShopId = null;

function makeId(){
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function escapeHtml(str){
  return (str ?? "").toString()
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function makeSlug(text){
  return (text ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isAdminOpen(){
  return adminShell && !adminShell.classList.contains("hidden");
}

function openAdmin(){
  if(!adminShell) return;
  adminShell.classList.remove("hidden");
  try{
    if(window.gsap && adminPanel){
      gsap.fromTo(adminPanel, { opacity:0, y:10 }, { opacity:1, y:0, duration:.18 });
    }
  }catch{}
}

function closeAdmin(){
  if(!adminShell) return;
  adminShell.classList.add("hidden");
}

function toggleAdmin(){
  isAdminOpen() ? closeAdmin() : openAdmin();
}

function isAdminShortcut(e){
  return (
    (e.ctrlKey && e.code === "Digit7") ||
    (e.ctrlKey && e.key === "7") ||
    (e.ctrlKey && e.code === "Numpad7") ||
    e.key === ""
  );
}

document.addEventListener("keydown", (e)=>{
  if(isAdminShortcut(e)){
    e.preventDefault();
    toggleAdmin();
    return;
  }
  if(e.key === "Escape" && isAdminOpen()){
    closeAdmin();
  }
});

if(floatingAdminBtn){
  floatingAdminBtn.addEventListener("click", toggleAdmin);
}

if(adminShell){
  adminShell.addEventListener("click", (e)=>{
    if(e.target === adminShell) closeAdmin();
  });
}

if(btnCloseAdmin) btnCloseAdmin.onclick = closeAdmin;

(function makeDraggable(){
  if(!adminDrag || !adminPanel) return;

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  adminDrag.addEventListener("mousedown", (e)=>{
    dragging = true;
    const rect = adminPanel.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;

    adminPanel.style.position = "fixed";
    adminPanel.style.margin = "0";
    adminPanel.style.left = `${rect.left}px`;
    adminPanel.style.top = `${rect.top}px`;
  });

  window.addEventListener("mousemove", (e)=>{
    if(!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    adminPanel.style.left = `${startLeft + dx}px`;
    adminPanel.style.top = `${startTop + dy}px`;
  });

  window.addEventListener("mouseup", ()=>{
    dragging = false;
  });
})();

async function api(path, options = {}){
  const headers = options.headers || {};
  if(token) headers.Authorization = `Bearer ${token}`;
  options.headers = headers;
  return fetch(path, options);
}

async function login(){
  const pass = adminPassword ? adminPassword.value : "";

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ password: pass })
  });

  if(!res.ok){
    alert("Senha errada!");
    return;
  }

  const j = await res.json();
  token = j.token;

  if(adminPassword) adminPassword.value = "";

  if(adminLogin) adminLogin.classList.add("hidden");
  if(adminBody) adminBody.classList.remove("hidden");

  await loadAdminDB();
  fillSettingsUI();
  renderLists();
  resetArtistForm();
  resetShopForm();
  updateShopTypeUI();
}

async function logout(){
  if(token){
    await api("/api/logout", { method:"POST" }).catch(()=>{});
  }
  token = "";
  if(adminBody) adminBody.classList.add("hidden");
  if(adminLogin) adminLogin.classList.remove("hidden");
}

if(btnLogin) btnLogin.onclick = login;
if(btnLogout) btnLogout.onclick = logout;

document.querySelectorAll(".adminTab").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".adminTab").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");

    const atab = btn.dataset.atab;
    const s = document.getElementById("a-settings");
    const a = document.getElementById("a-artists");
    const p = document.getElementById("a-shop");

    if(s) s.classList.toggle("hidden", atab !== "settings");
    if(a) a.classList.toggle("hidden", atab !== "artists");
    if(p) p.classList.toggle("hidden", atab !== "shop");
  });
});

async function loadAdminDB(){
  const res = await api("/api/admin");
  if(!res.ok){
    alert("Erro ao carregar DB.");
    return;
  }

  adminDB = await res.json();
  adminDB.settings = adminDB.settings || {};
  adminDB.artists = Array.isArray(adminDB.artists) ? adminDB.artists : [];
  adminDB.shop = Array.isArray(adminDB.shop) ? adminDB.shop : [];
}

async function saveAdminDB(){
  const res = await api("/api/admin", {
    method: "PUT",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(adminDB)
  });

  if(!res.ok){
    alert("Erro ao salvar no servidor.");
    return;
  }

  if(window.Zone7 && typeof window.Zone7.loadPublic === "function"){
    await window.Zone7.loadPublic();
  } else {
    location.reload();
  }
}

async function uploadFile(file){
  const form = new FormData();
  form.append("file", file);

  const res = await api("/api/upload", {
    method: "POST",
    body: form
  });

  if(!res.ok){
    const txt = await res.text().catch(()=> "");
    console.error("UPLOAD FAIL:", res.status, txt);
    alert("Falha no upload (ver console F12).");
    return "";
  }

  const j = await res.json();
  return j.url || "";
}

function fillSettingsUI(){
  const s = adminDB.settings || {};

  if(setBrand) setBrand.value = s.brand || "";
  if(setAccent) setAccent.value = s.accent || "#7a00ff";
  if(setBg) setBg.value = s.bg || "#0b0b0b";
  if(setHeroTitle) setHeroTitle.value = s.heroTitle || "";
  if(setHeroSub) setHeroSub.value = s.heroSub || "";
  if(setAbout) setAbout.value = s.about || "";
  if(setSpotify) setSpotify.value = Array.isArray(s.spotify) ? s.spotify.join("\n\n") : "";
}

if(btnSaveSettings){
  btnSaveSettings.onclick = async ()=>{
    const s = adminDB.settings || (adminDB.settings = {});

    if(setBrand) s.brand = setBrand.value.trim();
    if(setAccent) s.accent = setAccent.value;
    if(setBg) s.bg = setBg.value;
    if(setHeroTitle) s.heroTitle = setHeroTitle.value.trim();
    if(setHeroSub) s.heroSub = setHeroSub.value.trim();
    if(setAbout) s.about = setAbout.value;
    if(setSpotify){
      s.spotify = setSpotify.value
        .split("\n\n")
        .map(x=>x.trim())
        .filter(Boolean);
    }

    if(setLogoFile?.files?.[0]){
      const url = await uploadFile(setLogoFile.files[0]);
      if(url) s.logo = url;
      setLogoFile.value = "";
    }

    if(setHeroBgFile?.files?.[0]){
      const url = await uploadFile(setHeroBgFile.files[0]);
      if(url) s.heroBg = url;
      setHeroBgFile.value = "";
    }

    await saveAdminDB();
    alert("Site salvo!");
  };
}

function updateShopTypeUI(){
  if(!shopType || !beatFields) return;
  beatFields.classList.toggle("hidden", shopType.value !== "beat");
}

if(shopType){
  shopType.addEventListener("change", updateShopTypeUI);
}

function galleryTextToArray(text){
  return (text || "")
    .split("\n")
    .map(x=>x.trim())
    .filter(Boolean);
}

function normalizeItemForPreview(item){
  const price = item.price ? `R$ ${item.price}` : "Sem preço";
  const oldPrice = item.oldPrice ? `de R$ ${item.oldPrice}` : "";
  const status = item.active === false ? "INATIVO" : "ATIVO";
  return {
    ...item,
    previewPrice: [oldPrice, price].filter(Boolean).join(" "),
    previewCategory: item.category || "Sem categoria",
    previewStock: item.stock === "" || item.stock === null || item.stock === undefined ? "Estoque livre" : `Estoque: ${item.stock}`,
    previewStatus: status
  };
}

function listItemHTML(item, type){
  const x = normalizeItemForPreview(item);

  if(type === "artists"){
    return `
      <div class="listItem" draggable="true" data-id="${x.id}" data-type="artists">
        <img class="thumb" src="${escapeHtml(x.img || "")}" alt="">
        <div class="listMain">
          <b>${escapeHtml(x.title || "")}</b>
          <span>${escapeHtml(x.desc || "")}</span>
          <span class="badge">${escapeHtml(x.link || "")}</span>
        </div>
        <div class="listBtns">
          <button class="ghostBtn" data-action="edit" type="button">Editar</button>
          <button class="ghostBtn" data-action="del" type="button">Excluir</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="listItem" draggable="true" data-id="${x.id}" data-type="shop">
      <img class="thumb" src="${escapeHtml(x.img || "")}" alt="">
      <div class="listMain">
        <b>${escapeHtml(x.title || "")}</b>
        <span>${escapeHtml(x.desc || "")}</span>
        <span>${escapeHtml(x.previewCategory)}</span>
        <span>${escapeHtml(x.previewPrice)}</span>
        <span>${escapeHtml(x.previewStock)}</span>
        <span class="badge">${escapeHtml(x.kind === "beat" ? "BEAT" : "SHOP")}</span>
        ${x.featured ? `<span class="badge">DESTAQUE</span>` : ``}
        ${x.isNew ? `<span class="badge">NOVO</span>` : ``}
        ${x.bestSeller ? `<span class="badge">MAIS VENDIDO</span>` : ``}
        <span class="badge">${escapeHtml(x.previewStatus)}</span>
      </div>
      <div class="listBtns">
        <button class="ghostBtn" data-action="edit" type="button">Editar</button>
        <button class="ghostBtn" data-action="del" type="button">Excluir</button>
      </div>
    </div>
  `;
}

function renderLists(){
  if(artistsList){
    artistsList.innerHTML = (adminDB.artists || []).map(a=>listItemHTML(a, "artists")).join("");
    bindListEvents(artistsList, "artists");
    enableDnD(artistsList, "artists");
  }

  if(shopList){
    shopList.innerHTML = (adminDB.shop || []).map(p=>listItemHTML(p, "shop")).join("");
    bindListEvents(shopList, "shop");
    enableDnD(shopList, "shop");
  }
}

function bindListEvents(container, type){
  container.querySelectorAll(".listItem").forEach(el=>{
    el.addEventListener("click", async (e)=>{
      const action = e.target?.dataset?.action;
      if(!action) return;

      const itemId = el.dataset.id;

      if(action === "del"){
        if(!confirm("Excluir mesmo?")) return;

        if(type === "artists"){
          adminDB.artists = adminDB.artists.filter(x=>x.id !== itemId);
          if(editingArtistId === itemId) resetArtistForm();
        } else {
          adminDB.shop = adminDB.shop.filter(x=>x.id !== itemId);
          if(editingShopId === itemId) resetShopForm();
        }

        await saveAdminDB();
        renderLists();
      }

      if(action === "edit"){
        if(type === "artists"){
          const a = adminDB.artists.find(x=>x.id === itemId);
          if(!a) return;

          editingArtistId = itemId;
          artTitle.value = a.title || "";
          artDesc.value = a.desc || "";
          artLink.value = a.link || "";
          artImgFile.value = "";

          btnAddArtist.classList.add("hidden");
          btnUpdateArtist.classList.remove("hidden");
        } else {
          const p = adminDB.shop.find(x=>x.id === itemId);
          if(!p) return;

          editingShopId = itemId;

          shopType.value = p.kind || "product";
          shopTitle.value = p.title || "";
          shopCategory.value = p.category || "";
          shopLink.value = p.link || "";
          shopWhatsapp.value = p.whatsapp || "";
          shopInstagram.value = p.instagram || "";
          shopStock.value = p.stock ?? "";
          shopPrice.value = p.price ?? "";
          shopOldPrice.value = p.oldPrice ?? "";
          shopBadge.value = p.badge || "";
          shopSlug.value = p.slug || "";
          shopDesc.value = p.desc || "";
          shopGallery.value = Array.isArray(p.gallery) ? p.gallery.join("\n") : "";
          shopFeatured.checked = Boolean(p.featured);
          shopIsNew.checked = Boolean(p.isNew);
          shopBestSeller.checked = Boolean(p.bestSeller);
          shopActive.checked = p.active !== false;
          shopBpm.value = p.bpm || "";
          shopKey.value = p.key || "";
          shopGenre.value = p.genre || "";
          shopLicense.value = p.license || "";
          shopImgFile.value = "";
          shopAudioFile.value = "";

          updateShopTypeUI();
          btnAddShop.classList.add("hidden");
          btnUpdateShop.classList.remove("hidden");
        }
      }
    });
  });
}

function resetArtistForm(){
  editingArtistId = null;
  artTitle.value = "";
  artDesc.value = "";
  artLink.value = "";
  artImgFile.value = "";
  btnAddArtist.classList.remove("hidden");
  btnUpdateArtist.classList.add("hidden");
}

function resetShopForm(){
  editingShopId = null;

  shopType.value = "product";
  shopTitle.value = "";
  shopCategory.value = "";
  shopLink.value = "";
  shopWhatsapp.value = "";
  shopInstagram.value = "";
  shopStock.value = "";
  shopPrice.value = "";
  shopOldPrice.value = "";
  shopBadge.value = "";
  shopSlug.value = "";
  shopDesc.value = "";
  shopImgFile.value = "";
  shopGallery.value = "";
  shopFeatured.checked = false;
  shopIsNew.checked = false;
  shopBestSeller.checked = false;
  shopActive.checked = true;
  shopAudioFile.value = "";
  shopBpm.value = "";
  shopKey.value = "";
  shopGenre.value = "";
  shopLicense.value = "";

  updateShopTypeUI();
  btnAddShop.classList.remove("hidden");
  btnUpdateShop.classList.add("hidden");
}

function collectShopFormData(existing = {}){
  const kind = shopType.value || "product";
  return {
    ...existing,
    kind,
    title: shopTitle.value.trim(),
    category: shopCategory.value.trim(),
    link: shopLink.value.trim(),
    whatsapp: shopWhatsapp.value.trim(),
    instagram: shopInstagram.value.trim(),
    stock: shopStock.value === "" ? null : Number(shopStock.value),
    price: shopPrice.value.trim(),
    oldPrice: shopOldPrice.value.trim(),
    badge: shopBadge.value.trim(),
    slug: shopSlug.value.trim() || makeSlug(shopTitle.value.trim()),
    desc: shopDesc.value.trim(),
    gallery: galleryTextToArray(shopGallery.value),
    featured: shopFeatured.checked,
    isNew: shopIsNew.checked,
    bestSeller: shopBestSeller.checked,
    active: shopActive.checked,
    bpm: kind === "beat" ? shopBpm.value.trim() : "",
    key: kind === "beat" ? shopKey.value.trim() : "",
    genre: kind === "beat" ? shopGenre.value.trim() : "",
    license: kind === "beat" ? shopLicense.value.trim() : "",
    audio: kind === "beat" ? (existing.audio || "") : "",
    createdAt: existing.createdAt || Date.now()
  };
}

if(btnAddArtist){
  btnAddArtist.onclick = async ()=>{
    if(!artTitle.value.trim()) return alert("Coloca o nome.");
    if(!artImgFile?.files?.[0]) return alert("Escolha uma imagem.");

    const url = await uploadFile(artImgFile.files[0]);
    if(!url) return;

    adminDB.artists.push({
      id: makeId(),
      img: url,
      title: artTitle.value.trim(),
      desc: artDesc.value.trim(),
      link: artLink.value.trim()
    });

    await saveAdminDB();
    resetArtistForm();
    renderLists();
  };
}

if(btnUpdateArtist){
  btnUpdateArtist.onclick = async ()=>{
    const a = adminDB.artists.find(x=>x.id === editingArtistId);
    if(!a) return;

    a.title = artTitle.value.trim();
    a.desc = artDesc.value.trim();
    a.link = artLink.value.trim();

    if(artImgFile?.files?.[0]){
      const url = await uploadFile(artImgFile.files[0]);
      if(url) a.img = url;
      artImgFile.value = "";
    }

    await saveAdminDB();
    resetArtistForm();
    renderLists();
  };
}

if(btnAddShop){
  btnAddShop.onclick = async ()=>{
    if(!shopTitle.value.trim()) return alert("Coloca o nome.");
    if(!shopImgFile?.files?.[0]) return alert("Escolha uma imagem principal.");

    const imgUrl = await uploadFile(shopImgFile.files[0]);
    if(!imgUrl) return;

    const base = collectShopFormData({
      id: makeId(),
      img: imgUrl
    });

    if(base.kind === "beat"){
      if(!shopAudioFile?.files?.[0]) return alert("Escolha o áudio do beat.");
      const audioUrl = await uploadFile(shopAudioFile.files[0]);
      if(!audioUrl) return;
      base.audio = audioUrl;
    }

    adminDB.shop.push(base);

    await saveAdminDB();
    resetShopForm();
    renderLists();
  };
}

if(btnUpdateShop){
  btnUpdateShop.onclick = async ()=>{
    const p = adminDB.shop.find(x=>x.id === editingShopId);
    if(!p) return;

    Object.assign(p, collectShopFormData(p));

    if(shopImgFile?.files?.[0]){
      const imgUrl = await uploadFile(shopImgFile.files[0]);
      if(imgUrl) p.img = imgUrl;
      shopImgFile.value = "";
    }

    if(p.kind === "beat"){
      if(shopAudioFile?.files?.[0]){
        const audioUrl = await uploadFile(shopAudioFile.files[0]);
        if(audioUrl) p.audio = audioUrl;
        shopAudioFile.value = "";
      }
    } else {
      p.audio = "";
    }

    await saveAdminDB();
    resetShopForm();
    renderLists();
  };
}

function enableDnD(container, type){
  let draggingId = null;

  container.querySelectorAll(".listItem").forEach(item=>{
    item.addEventListener("dragstart", ()=>{
      draggingId = item.dataset.id;
      item.style.opacity = "0.6";
    });

    item.addEventListener("dragend", ()=>{
      item.style.opacity = "1";
    });

    item.addEventListener("dragover", (e)=> e.preventDefault());

    item.addEventListener("drop", async (e)=>{
      e.preventDefault();
      const targetId = item.dataset.id;
      if(!draggingId || draggingId === targetId) return;

      const arr = type === "artists" ? adminDB.artists : adminDB.shop;
      const from = arr.findIndex(x=>x.id === draggingId);
      const to = arr.findIndex(x=>x.id === targetId);
      if(from < 0 || to < 0) return;

      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);

      await saveAdminDB();
      renderLists();
    });
  });
}

updateShopTypeUI();
