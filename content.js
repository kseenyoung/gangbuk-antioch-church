const config = window.SITE_CONFIG ?? {};
const root = document.querySelector("[data-content-page]");
const pageType = root?.dataset.contentPage;

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function dateLabel(value) {
  if (!value) return "";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.valueOf()) ? "" : new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(date);
}
function safeHttpsUrl(value) {
  try { const url = new URL(value); return url.protocol === "https:" ? url.href : ""; }
  catch { return ""; }
}
function setEmpty(message) {
  root.innerHTML = `<p class="content-empty">${escapeHtml(message)}</p>`;
}
async function load() {
  if (!config.supabaseUrl || !config.supabaseKey) {
    setEmpty("콘텐츠 연결 설정이 필요합니다. 관리자에게 문의해 주세요.");
    return;
  }
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const client = createClient(config.supabaseUrl, config.supabaseKey);
    if (pageType === "pastor") {
      const { data, error } = await client.from("site_settings").select("key,value").in("key", ["pastor_name", "pastor_title", "pastor_bio", "pastor_image_url"]);
      if (error) throw error;
      const settings = Object.fromEntries((data ?? []).map(({ key, value }) => [key, value]));
      const pastorImageUrl = safeHttpsUrl(settings.pastor_image_url ?? "");
      const image = pastorImageUrl
        ? `<img class="pastor-photo" src="${escapeHtml(pastorImageUrl)}" alt="${escapeHtml(settings.pastor_name || "담임목사님")}" />`
        : `<div class="pastor-photo pastor-photo-placeholder" aria-hidden="true">강북안디옥교회</div>`;
      root.innerHTML = `<div class="pastor-layout">${image}<div class="pastor-copy"><p class="eyebrow">PASTOR</p><p class="pastor-title">${escapeHtml(settings.pastor_title || "담임목사")}</p><h2>${escapeHtml(settings.pastor_name || "소개를 준비하고 있습니다")}</h2><div class="pastor-bio">${escapeHtml(settings.pastor_bio || "담임목사님의 인사말과 소개를 준비하고 있습니다.").replace(/\n/g, "<br>")}</div></div></div>`;
      return;
    }
    if (pageType === "bulletin") {
      const { data, error } = await client.from("bulletins").select("id,title,description,file_url,published_at").eq("is_published", true).order("published_at", { ascending: false });
      if (error) throw error;
      if (!data?.length) return setEmpty("등록된 주보가 없습니다. 새로운 주보를 준비하고 있습니다.");
      root.innerHTML = data.map((item) => `<article class="bulletin-card"><div><time>${escapeHtml(dateLabel(item.published_at))}</time><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.description)}</p></div><a class="outline-button" href="${escapeHtml(safeHttpsUrl(item.file_url) || "#")}" target="_blank" rel="noopener noreferrer">${item.title.includes("예시") ? "예시 확인" : "주보 보기"} <span aria-hidden="true">↗</span></a></article>`).join("");
      return;
    }
    const { data, error } = await client.from("gallery_items").select("id,title,description,image_url,event_date").eq("is_published", true).order("sort_order").order("event_date", { ascending: false });
    if (error) throw error;
    if (!data?.length) return setEmpty("등록된 사진이 없습니다. 교회 소식을 사진으로 나눌 예정입니다.");
    renderGallery(data);
  } catch (error) {
    console.error("콘텐츠를 불러오지 못했습니다.", error);
    setEmpty("콘텐츠를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.");
  }
}

function galleryGroupKey(item) {
  return `${item.event_date ?? ""}|${item.title ?? ""}`;
}

function renderGallery(items) {
  photosForAllGroups = items;
  const groups = new Map();
  items.forEach((item) => {
    const key = galleryGroupKey(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });

  const activityKey = location.hash.startsWith("#activity=")
    ? decodeURIComponent(location.hash.slice("#activity=".length))
    : "";
  if (activityKey && groups.has(activityKey)) {
    renderGalleryActivity(activityKey, groups.get(activityKey));
    return;
  }

  root.className = "gallery-grid subpage-content";
  root.innerHTML = [...groups.entries()].map(([key, photos]) => {
    const cover = safeHttpsUrl(photos[0].image_url) || "./public/assets/event-placeholder.png";
    const description = photos[0].description || "활동 사진을 모아 보세요.";
    return `<button class="gallery-card" type="button" data-gallery-activity="${escapeHtml(key)}" aria-label="${escapeHtml(photos[0].title)} 활동 사진 ${photos.length}장 보기"><img src="${escapeHtml(cover)}" alt="${escapeHtml(photos[0].title)}" loading="lazy"><span class="gallery-card-copy"><time>${escapeHtml(dateLabel(photos[0].event_date))}</time><strong>${escapeHtml(photos[0].title)}</strong><span>${escapeHtml(description)}</span><span class="gallery-photo-count">사진 ${photos.length}장 보기　›</span></span></button>`;
  }).join("");

  root.querySelectorAll("[data-gallery-activity]").forEach((card) => {
    card.addEventListener("click", () => {
      const key = card.dataset.galleryActivity;
      history.pushState(null, "", `${location.pathname}${location.search}#activity=${encodeURIComponent(key)}`);
      renderGallery(items);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

function renderGalleryActivity(key, photos) {
  root.className = "gallery-activity subpage-content";
  const back = document.createElement("button");
  back.className = "gallery-back";
  back.type = "button";
  back.textContent = "‹ 활동 목록으로";
  back.addEventListener("click", () => {
    history.pushState(null, "", `${location.pathname}${location.search}`);
    renderGallery(photosForAllGroups);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  const title = document.createElement("h2");
  title.textContent = photos[0].title;
  const date = document.createElement("p");
  date.className = "gallery-activity-date";
  date.textContent = dateLabel(photos[0].event_date);
  const description = document.createElement("p");
  description.className = "gallery-activity-description";
  description.textContent = photos[0].description || `이 활동의 사진 ${photos.length}장을 모았습니다.`;
  const grid = document.createElement("div");
  grid.className = "gallery-photo-grid";
  photos.forEach((photo, index) => {
    const image = document.createElement("img");
    image.src = safeHttpsUrl(photo.image_url) || "./public/assets/event-placeholder.png";
    image.alt = `${photos[0].title} 사진 ${index + 1}`;
    image.loading = "lazy";
    grid.append(image);
  });
  root.replaceChildren(back, title, date, description, grid);
}

let photosForAllGroups = [];
window.addEventListener("popstate", () => {
  if (pageType === "gallery" && photosForAllGroups.length) renderGallery(photosForAllGroups);
});
window.addEventListener("hashchange", () => {
  if (pageType === "gallery" && photosForAllGroups.length) renderGallery(photosForAllGroups);
});

load();
