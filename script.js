const menuButton = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector(".primary-nav");

menuButton?.addEventListener("click", () => {
  const isExpanded = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isExpanded));
  menuButton.setAttribute("aria-label", isExpanded ? "메뉴 열기" : "메뉴 닫기");
  primaryNav?.classList.toggle("is-open", !isExpanded);
});

primaryNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuButton?.setAttribute("aria-expanded", "false");
    menuButton?.setAttribute("aria-label", "메뉴 열기");
    primaryNav.classList.remove("is-open");
  });
});

const sectionLinks = document.querySelectorAll(".section-nav a");
const observedSections = [...sectionLinks]
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    sectionLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${visible.target.id}`;
      link.classList.toggle("is-active", isActive);
      if (isActive) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-25% 0px -58% 0px", threshold: [0, 0.2, 0.5, 0.8] });
  observedSections.forEach((section) => sectionObserver.observe(section));
}

const siteConfig = window.SITE_CONFIG ?? {};
let supabaseClientPromise;

function getSupabaseClient() {
  if (!siteConfig.supabaseUrl || !siteConfig.supabaseKey) return Promise.resolve(null);
  if (!supabaseClientPromise) {
    supabaseClientPromise = import("https://esm.sh/@supabase/supabase-js@2")
      .then(({ createClient }) => createClient(siteConfig.supabaseUrl, siteConfig.supabaseKey));
  }
  return supabaseClientPromise;
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element && typeof value === "string" && value.trim()) element.textContent = value;
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value, window.location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function renderServices(rows) {
  const schedule = document.querySelector(".schedule");
  if (!schedule || !rows?.length) return;
  schedule.replaceChildren();
  rows.forEach((service) => {
    const row = document.createElement("div");
    row.className = "schedule-row";
    row.setAttribute("role", "row");
    for (const value of [service.name, service.time_text]) {
      const cell = document.createElement("span");
      cell.setAttribute("role", "cell");
      cell.textContent = value;
      row.append(cell);
    }
    schedule.append(row);
  });
}

function renderNews(rows) {
  const list = document.querySelector("#news-list");
  if (!list) return;
  if (!rows?.length) {
    const empty = document.createElement("p");
    empty.className = "news-empty";
    empty.textContent = "새로운 소식을 준비하고 있습니다.";
    list.replaceChildren(empty);
    return;
  }
  list.replaceChildren();
  rows.forEach((post) => {
    const article = document.createElement("article");
    article.className = "news-card";
    const image = document.createElement("img");
    image.src = safeHttpUrl(post.image_url) || "./public/assets/event-placeholder.png";
    image.alt = "";
    const meta = document.createElement("div");
    meta.className = "news-meta";
    const time = document.createElement("time");
    time.dateTime = post.published_at;
    time.textContent = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(post.published_at));
    const category = document.createElement("span");
    category.textContent = "교회 소식";
    meta.append(time, category);
    const title = document.createElement("h3");
    title.textContent = post.title;
    const summary = document.createElement("p");
    summary.className = "news-summary";
    summary.textContent = post.summary;
    article.append(image, meta, title, summary);
    list.append(article);
  });
}

function showMapMessage(message) {
  const placeholder = document.querySelector("#map-placeholder");
  const target = document.querySelector("#map-message");
  if (target) target.textContent = message;
  placeholder?.classList.remove("is-hidden");
}

async function loadFreeMap(settings) {
  const latitude = Number(settings.map_latitude || siteConfig.mapCenter?.latitude);
  const longitude = Number(settings.map_longitude || siteConfig.mapCenter?.longitude);
  const zoom = Number(settings.map_zoom || siteConfig.mapCenter?.zoom || 16);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    showMapMessage("관리자 페이지에서 지도 좌표를 입력해 주세요.");
    return;
  }

  try {
    const maplibregl = await import("https://unpkg.com/maplibre-gl@6.19.0/dist/maplibre-gl.mjs");
    const map = new maplibregl.Map({
      container: "church-map",
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [longitude, latitude],
      zoom,
      attributionControl: true
    });
    new maplibregl.Marker({ color: "#3059c8" })
      .setLngLat([longitude, latitude])
      .setPopup(new maplibregl.Popup({ offset: 25 }).setText(settings.church_name || "강북안디옥교회"))
      .addTo(map);
    map.once("load", () => document.querySelector("#map-placeholder")?.classList.add("is-hidden"));
    map.on("error", (event) => {
      console.error("지도를 불러오지 못했습니다.", event.error);
      if (!map.loaded()) showMapMessage("지도를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.");
    });
    const mapLink = document.querySelector(".map-link");
    if (mapLink) mapLink.href = `https://map.naver.com/p/search/${encodeURIComponent(settings.address || settings.church_name || "강북안디옥교회")}`;
  } catch (error) {
    console.error("무료 지도를 불러오지 못했습니다.", error);
    showMapMessage("무료 지도를 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.");
  }
}

async function loadPublicContent() {
  let settings = {};
  try {
    const client = await getSupabaseClient();
    if (client) {
      const [settingsResult, servicesResult, newsResult] = await Promise.all([
        client.from("site_settings").select("key,value"),
        client.from("worship_services").select("id,name,time_text,sort_order,is_visible").eq("is_visible", true).order("sort_order"),
        client.from("news_posts").select("id,title,summary,image_url,published_at").eq("is_published", true).order("published_at", { ascending: false }).limit(6)
      ]);
      for (const result of [settingsResult, servicesResult, newsResult]) {
        if (result.error) throw result.error;
      }
      settings = Object.fromEntries((settingsResult.data ?? []).map(({ key, value }) => [key, value]));
      setText(".brand span", settings.church_name);
      document.querySelectorAll(".brand span").forEach((element) => {
        if (settings.church_name) element.textContent = settings.church_name;
      });
      setText(".hero-message p", settings.hero_message);
      const title = document.querySelector(".section-heading h1");
      if (title && settings.intro_title) title.textContent = settings.intro_title;
      setText(".section-lede", settings.intro_body);
      const phone = settings.phone;
      if (phone) {
        document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
          link.href = `tel:${phone.replace(/[^+\d]/g, "")}`;
          link.textContent = phone;
        });
      }
      setText("#church-address", settings.address);
      setText("#footer-contact", [settings.address, phone ? `전화 ${phone}` : ""].filter(Boolean).join(" · "));
      renderServices(servicesResult.data);
      renderNews(newsResult.data);
    }
  } catch (error) {
    console.error("사이트 정보를 불러오지 못했습니다.", error);
  }

  loadFreeMap(settings);
}

loadPublicContent();
