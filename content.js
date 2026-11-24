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
      root.innerHTML = data.map((item) => `<article class="bulletin-card"><div><time>${escapeHtml(dateLabel(item.published_at))}</time><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.description)}</p></div><a class="outline-button" href="${escapeHtml(safeHttpsUrl(item.file_url) || "#")}" target="_blank" rel="noopener noreferrer">주보 보기 <span aria-hidden="true">↗</span></a></article>`).join("");
      return;
    }
    const { data, error } = await client.from("gallery_items").select("id,title,description,image_url,event_date").eq("is_published", true).order("sort_order").order("event_date", { ascending: false });
    if (error) throw error;
    if (!data?.length) return setEmpty("등록된 사진이 없습니다. 교회 소식을 사진으로 나눌 예정입니다.");
    root.innerHTML = data.map((item) => `<article class="gallery-card"><img src="${escapeHtml(safeHttpsUrl(item.image_url) || "./public/assets/event-placeholder.png")}" alt="${escapeHtml(item.title)}" loading="lazy"><div><time>${escapeHtml(dateLabel(item.event_date))}</time><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.description)}</p></div></article>`).join("");
  } catch (error) {
    console.error("콘텐츠를 불러오지 못했습니다.", error);
    setEmpty("콘텐츠를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.");
  }
}
load();
