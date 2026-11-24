const config = window.SITE_CONFIG ?? {};
const authCard = document.querySelector("#auth-card");
const dashboard = document.querySelector("#admin-dashboard");
const authForm = document.querySelector("#auth-form");
const resetRequestForm = document.querySelector("#password-reset-request");
const passwordUpdateForm = document.querySelector("#password-update-form");
const authMessage = document.querySelector("#admin-message");
const dashboardMessage = document.querySelector("#dashboard-message");
const tabs = [...document.querySelectorAll(".auth-tab")];
let supabase;

function setMessage(element, message, isError = false) {
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("is-error", isError);
}

function setMode(mode, updateUrl = true) {
  const isSignup = mode === "signup";
  document.querySelector(".auth-tabs").hidden = false;
  authForm.hidden = false;
  resetRequestForm.hidden = true;
  passwordUpdateForm.hidden = true;
  document.querySelector(".auth-note").hidden = false;
  document.querySelector("#auth-title").textContent = isSignup ? "회원가입" : "관리자 로그인";
  document.querySelector("#auth-submit").textContent = isSignup ? "계정 만들기" : "로그인";
  document.querySelector("#forgot-password").hidden = isSignup;
  document.querySelector('[name="password"]').autocomplete = isSignup ? "new-password" : "current-password";
  tabs.forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  if (updateUrl) history.replaceState(null, "", `?mode=${mode}`);
}

function showResetRequest() {
  document.querySelector(".auth-tabs").hidden = true;
  authForm.hidden = true;
  resetRequestForm.hidden = false;
  passwordUpdateForm.hidden = true;
  document.querySelector(".auth-note").hidden = true;
  document.querySelector("#auth-title").textContent = "비밀번호 찾기";
  const email = authForm.elements.namedItem("email").value.trim();
  if (email) resetRequestForm.elements.namedItem("reset_email").value = email;
  history.replaceState(null, "", "?mode=reset");
}

function showPasswordUpdate() {
  document.querySelector(".auth-tabs").hidden = true;
  authForm.hidden = true;
  resetRequestForm.hidden = true;
  passwordUpdateForm.hidden = false;
  document.querySelector(".auth-note").hidden = true;
  document.querySelector("#auth-title").textContent = "새 비밀번호 설정";
  setMessage(authMessage, "새 비밀번호를 입력해 주세요.");
}

function makeField(labelText, name, value, type = "text", options = {}) {
  const label = document.createElement("label");
  label.textContent = labelText;
  if (options.className) label.className = options.className;
  const input = document.createElement(type === "textarea" ? "textarea" : "input");
  input.name = name;
  if (type !== "textarea") input.type = type;
  if (options.step) input.step = options.step;
  if (options.min != null) input.min = options.min;
  if (options.required) input.required = true;
  input.value = value ?? "";
  label.append(input);
  return label;
}

function makeActionButton(text, className, type = "button", action = "") {
  const button = document.createElement("button");
  button.type = type;
  button.className = className;
  button.textContent = text;
  if (action) button.dataset.action = action;
  return button;
}

function formatDateInput(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.valueOf())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function renderServiceForm(service = {}) {
  const form = document.createElement("form");
  form.className = "editor-form service-form";
  if (service.id) form.dataset.id = service.id;
  form.append(
    makeField("예배 이름", "name", service.name ?? "", "text", { required: true }),
    makeField("예배 시간", "time_text", service.time_text ?? "", "text", { required: true }),
    makeField("정렬 순서", "sort_order", service.sort_order ?? 0, "number", { min: 0 })
  );
  const actions = document.createElement("div");
  actions.className = "editor-actions";
  const visibility = document.createElement("label");
  visibility.className = "visibility-toggle";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.name = "is_visible";
  checkbox.checked = service.is_visible ?? true;
  visibility.append(checkbox, document.createTextNode("홈페이지에 표시"));
  actions.append(visibility, makeActionButton("저장", "admin-primary-button", "submit"));
  if (service.id) actions.append(makeActionButton("삭제", "admin-danger-button", "button", "delete-service"));
  form.append(actions);
  return form;
}

function renderNewsForm(post = {}) {
  const form = document.createElement("form");
  form.className = "editor-form news-form";
  if (post.id) form.dataset.id = post.id;
  const titleField = makeField("제목", "title", post.title ?? "", "text", { required: true });
  const dateField = makeField("게시 날짜", "published_at", formatDateInput(post.published_at ?? new Date()), "datetime-local", { required: true });
  const summaryField = makeField("요약", "summary", post.summary ?? "", "textarea", { className: "wide-field" });
  const imageField = makeField("이미지 URL (선택)", "image_url", post.image_url ?? "", "url", { className: "wide-field" });
  form.append(titleField, dateField, summaryField, imageField);
  const actions = document.createElement("div");
  actions.className = "editor-actions";
  const visibility = document.createElement("label");
  visibility.className = "visibility-toggle";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.name = "is_published";
  checkbox.checked = post.is_published ?? false;
  visibility.append(checkbox, document.createTextNode("홈페이지에 게시"));
  actions.append(visibility, makeActionButton("저장", "admin-primary-button", "submit"));
  if (post.id) actions.append(makeActionButton("삭제", "admin-danger-button", "button", "delete-news"));
  form.append(actions);
  return form;
}

function renderBulletinForm(item = {}) {
  const form = document.createElement("form");
  form.className = "editor-form bulletin-form";
  if (item.id) form.dataset.id = item.id;
  form.append(
    makeField("주보 제목", "title", item.title ?? "", "text", { required: true }),
    makeField("게시 날짜", "published_at", item.published_at ?? new Date().toISOString().slice(0, 10), "date", { required: true }),
    makeField("설명", "description", item.description ?? "", "textarea", { className: "wide-field" }),
    makeField("PDF 주소", "file_url", item.file_url ?? "", "url", { className: "wide-field", required: true })
  );
  const actions = document.createElement("div");
  actions.className = "editor-actions";
  const visibility = document.createElement("label");
  visibility.className = "visibility-toggle";
  const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.name = "is_published"; checkbox.checked = item.is_published ?? false;
  visibility.append(checkbox, document.createTextNode("주보 페이지에 게시"));
  actions.append(visibility, makeActionButton("저장", "admin-primary-button", "submit"));
  if (item.id) actions.append(makeActionButton("삭제", "admin-danger-button", "button", "delete-bulletin"));
  form.append(actions);
  return form;
}

function renderGalleryForm(item = {}) {
  const form = document.createElement("form");
  form.className = "editor-form gallery-form";
  if (item.id) form.dataset.id = item.id;
  form.append(
    makeField("사진 제목", "title", item.title ?? "", "text", { required: true }),
    makeField("행사 날짜", "event_date", item.event_date ?? new Date().toISOString().slice(0, 10), "date", { required: true }),
    makeField("사진 설명", "description", item.description ?? "", "textarea", { className: "wide-field" }),
    makeField("이미지 주소", "image_url", item.image_url ?? "", "url", { className: "wide-field", required: true }),
    makeField("정렬 순서", "sort_order", item.sort_order ?? 0, "number", { min: 0 })
  );
  const actions = document.createElement("div");
  actions.className = "editor-actions";
  const visibility = document.createElement("label");
  visibility.className = "visibility-toggle";
  const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.name = "is_published"; checkbox.checked = item.is_published ?? false;
  visibility.append(checkbox, document.createTextNode("갤러리에 게시"));
  actions.append(visibility, makeActionButton("저장", "admin-primary-button", "submit"));
  if (item.id) actions.append(makeActionButton("삭제", "admin-danger-button", "button", "delete-gallery"));
  form.append(actions);
  return form;
}

async function loadAdminContent() {
  const settingsResult = await supabase.from("site_settings").select("key,value");
  const servicesResult = await supabase.from("worship_services").select("id,name,time_text,sort_order,is_visible").order("sort_order");
  const newsResult = await supabase.from("news_posts").select("id,title,summary,image_url,published_at,is_published").order("published_at", { ascending: false });
  const bulletinsResult = await supabase.from("bulletins").select("id,title,description,file_url,published_at,is_published").order("published_at", { ascending: false });
  const galleryResult = await supabase.from("gallery_items").select("id,title,description,image_url,event_date,is_published,sort_order").order("sort_order").order("event_date", { ascending: false });
  for (const result of [settingsResult, servicesResult, newsResult, bulletinsResult, galleryResult]) {
    if (result.error) throw result.error;
  }

  const settings = Object.fromEntries((settingsResult.data ?? []).map(({ key, value }) => [key, value]));
  const settingsForm = document.querySelector("#settings-form");
  Object.entries(settings).forEach(([key, value]) => {
    const input = settingsForm.elements.namedItem(key);
    if (input) input.value = value;
  });
  const servicesEditor = document.querySelector("#services-editor");
  servicesEditor.replaceChildren();
  if (!servicesResult.data?.length) servicesEditor.append(Object.assign(document.createElement("p"), { className: "admin-empty", textContent: "등록된 예배가 없습니다." }));
  else servicesResult.data.forEach((service) => servicesEditor.append(renderServiceForm(service)));

  const newsEditor = document.querySelector("#news-editor");
  newsEditor.replaceChildren();
  if (!newsResult.data?.length) newsEditor.append(Object.assign(document.createElement("p"), { className: "admin-empty", textContent: "등록된 소식이 없습니다." }));
  else newsResult.data.forEach((post) => newsEditor.append(renderNewsForm(post)));

  const bulletinsEditor = document.querySelector("#bulletins-editor");
  bulletinsEditor.replaceChildren();
  if (!bulletinsResult.data?.length) bulletinsEditor.append(Object.assign(document.createElement("p"), { className: "admin-empty", textContent: "등록된 주보가 없습니다." }));
  else bulletinsResult.data.forEach((item) => bulletinsEditor.append(renderBulletinForm(item)));
  const galleryEditor = document.querySelector("#gallery-editor");
  galleryEditor.replaceChildren();
  if (!galleryResult.data?.length) galleryEditor.append(Object.assign(document.createElement("p"), { className: "admin-empty", textContent: "등록된 사진이 없습니다." }));
  else galleryResult.data.forEach((item) => galleryEditor.append(renderGalleryForm(item)));
}

async function enterDashboard(user) {
  const { data: isAdmin, error } = await supabase.rpc("is_site_admin");
  if (error) throw error;
  if (!isAdmin) {
    authCard.hidden = false;
    dashboard.hidden = true;
    setMessage(authMessage, `${user.email} 계정에 관리자 권한이 없습니다. 관리자 등록 후 이용할 수 있습니다.`, true);
    return;
  }
  authCard.hidden = true;
  dashboard.hidden = false;
  setMessage(dashboardMessage, `${user.email} 계정으로 로그인했습니다.`);
  await loadAdminContent();
}

async function saveSettings(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const keys = ["church_name", "hero_message", "intro_title", "intro_body", "pastor_name", "pastor_title", "pastor_bio", "pastor_image_url", "phone", "address", "map_latitude", "map_longitude", "map_zoom"];
  const rows = keys.map((key) => ({ key, value: String(form.elements.namedItem(key).value).trim(), updated_at: new Date().toISOString() }));
  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
  if (error) setMessage(dashboardMessage, error.message, true);
  else setMessage(dashboardMessage, "교회 정보를 저장했습니다.");
}

async function saveContentForm(event, table, fields, label) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  const record = Object.fromEntries(fields.map((key) => [key, key === "sort_order" ? Number(values.get(key) || 0) : String(values.get(key) ?? "").trim()]));
  record.is_published = values.has("is_published");
  record.updated_at = new Date().toISOString();
  const query = form.dataset.id
    ? supabase.from(table).update(record).eq("id", form.dataset.id)
    : supabase.from(table).insert(record);
  const { error } = await query;
  if (error) setMessage(dashboardMessage, error.message, true);
  else { setMessage(dashboardMessage, `${label}을(를) 저장했습니다.`); await loadAdminContent(); }
}

async function saveService(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  const record = {
    name: String(values.get("name")).trim(),
    time_text: String(values.get("time_text")).trim(),
    sort_order: Number(values.get("sort_order") || 0),
    is_visible: values.has("is_visible"),
    updated_at: new Date().toISOString()
  };
  const request = form.dataset.id
    ? supabase.from("worship_services").update(record).eq("id", form.dataset.id)
    : supabase.from("worship_services").insert(record);
  const { error } = await request;
  if (error) setMessage(dashboardMessage, error.message, true);
  else { setMessage(dashboardMessage, "예배 정보를 저장했습니다."); await loadAdminContent(); }
}

async function saveNews(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  const publishedAt = new Date(String(values.get("published_at")));
  if (Number.isNaN(publishedAt.valueOf())) {
    setMessage(dashboardMessage, "게시 날짜를 확인해 주세요.", true);
    return;
  }
  const record = {
    title: String(values.get("title")).trim(),
    summary: String(values.get("summary") ?? "").trim(),
    image_url: String(values.get("image_url") ?? "").trim(),
    published_at: publishedAt.toISOString(),
    is_published: values.has("is_published"),
    updated_at: new Date().toISOString()
  };
  const request = form.dataset.id
    ? supabase.from("news_posts").update(record).eq("id", form.dataset.id)
    : supabase.from("news_posts").insert(record);
  const { error } = await request;
  if (error) setMessage(dashboardMessage, error.message, true);
  else { setMessage(dashboardMessage, "교회 소식을 저장했습니다."); await loadAdminContent(); }
}

async function deleteRecord(table, id, label) {
  if (!window.confirm(`${label}을(를) 삭제할까요?`)) return;
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) setMessage(dashboardMessage, error.message, true);
  else { setMessage(dashboardMessage, `${label}을(를) 삭제했습니다.`); await loadAdminContent(); }
}

tabs.forEach((tab) => tab.addEventListener("click", () => {
  setMode(tab.dataset.mode);
  setMessage(authMessage, "");
}));

document.querySelector("#forgot-password")?.addEventListener("click", showResetRequest);
document.querySelector("#back-to-login")?.addEventListener("click", () => {
  setMode("login");
  setMessage(authMessage, "");
});

resetRequestForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = resetRequestForm.querySelector('button[type="submit"]');
  button.disabled = true;
  setMessage(authMessage, "재설정 이메일을 보내고 있습니다.");
  try {
    const email = String(new FormData(resetRequestForm).get("reset_email")).trim();
    const redirectTo = new URL("./admin.html?mode=recovery", window.location.href).toString();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    setMessage(authMessage, "해당 주소로 계정이 있다면 비밀번호 재설정 링크를 보냈습니다. 이메일을 확인해 주세요.");
  } catch (error) {
    setMessage(authMessage, error.message || "재설정 이메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.", true);
  } finally {
    button.disabled = false;
  }
});

passwordUpdateForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = new FormData(passwordUpdateForm);
  const password = String(values.get("new_password"));
  const confirmation = String(values.get("confirm_password"));
  if (password !== confirmation) {
    setMessage(authMessage, "두 비밀번호가 일치하지 않습니다.", true);
    return;
  }
  const button = passwordUpdateForm.querySelector('button[type="submit"]');
  button.disabled = true;
  setMessage(authMessage, "비밀번호를 변경하고 있습니다.");
  try {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    history.replaceState(null, "", "./admin.html?mode=login");
    await enterDashboard(data.user);
  } catch (error) {
    setMessage(authMessage, error.message || "비밀번호를 변경하지 못했습니다. 링크가 만료되었는지 확인해 주세요.", true);
  } finally {
    button.disabled = false;
  }
});

authForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const mode = document.querySelector(".auth-tab.is-active")?.dataset.mode ?? "login";
  const values = new FormData(authForm);
  const email = String(values.get("email")).trim();
  const password = String(values.get("password"));
  const button = document.querySelector("#auth-submit");
  button.disabled = true;
  setMessage(authMessage, "처리 중입니다.");
  try {
    if (mode === "signup") {
      const emailRedirectTo = new URL(window.location.href);
      emailRedirectTo.searchParams.set("mode", "login");
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: emailRedirectTo.toString() }
      });
      if (error) throw error;
      setMessage(authMessage, "가입 요청을 완료했습니다. 이메일 인증 후 관리자 권한을 등록해 주세요.");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await enterDashboard(data.user);
    }
  } catch (error) {
    setMessage(authMessage, error.message || "요청을 처리하지 못했습니다.", true);
  } finally {
    button.disabled = false;
  }
});

document.querySelector("#settings-form")?.addEventListener("submit", (event) => saveSettings(event).catch((error) => setMessage(dashboardMessage, error.message, true)));
document.querySelector("#add-service")?.addEventListener("click", () => document.querySelector("#services-editor").prepend(renderServiceForm()));
document.querySelector("#add-news")?.addEventListener("click", () => document.querySelector("#news-editor").prepend(renderNewsForm()));
document.querySelector("#services-editor")?.addEventListener("submit", (event) => {
  if (event.target.matches(".service-form")) saveService(event).catch((error) => setMessage(dashboardMessage, error.message, true));
});
document.querySelector("#news-editor")?.addEventListener("submit", (event) => {
  if (event.target.matches(".news-form")) saveNews(event).catch((error) => setMessage(dashboardMessage, error.message, true));
});
document.querySelector("#services-editor")?.addEventListener("click", (event) => {
  const button = event.target.closest('[data-action="delete-service"]');
  const form = button?.closest("form");
  if (form?.dataset.id) deleteRecord("worship_services", form.dataset.id, "예배 항목").catch((error) => setMessage(dashboardMessage, error.message, true));
});
document.querySelector("#news-editor")?.addEventListener("click", (event) => {
  const button = event.target.closest('[data-action="delete-news"]');
  const form = button?.closest("form");
  if (form?.dataset.id) deleteRecord("news_posts", form.dataset.id, "교회 소식").catch((error) => setMessage(dashboardMessage, error.message, true));
});
document.querySelector("#add-bulletin")?.addEventListener("click", () => document.querySelector("#bulletins-editor").prepend(renderBulletinForm()));
document.querySelector("#add-gallery")?.addEventListener("click", () => document.querySelector("#gallery-editor").prepend(renderGalleryForm()));
document.querySelector("#bulletins-editor")?.addEventListener("submit", (event) => {
  if (event.target.matches(".bulletin-form")) saveContentForm(event, "bulletins", ["title", "description", "file_url", "published_at"], "주보").catch((error) => setMessage(dashboardMessage, error.message, true));
});
document.querySelector("#gallery-editor")?.addEventListener("submit", (event) => {
  if (event.target.matches(".gallery-form")) saveContentForm(event, "gallery_items", ["title", "description", "image_url", "event_date", "sort_order"], "갤러리 사진").catch((error) => setMessage(dashboardMessage, error.message, true));
});
document.querySelector("#bulletins-editor")?.addEventListener("click", (event) => {
  const form = event.target.closest('[data-action="delete-bulletin"]')?.closest("form");
  if (form?.dataset.id) deleteRecord("bulletins", form.dataset.id, "주보").catch((error) => setMessage(dashboardMessage, error.message, true));
});
document.querySelector("#gallery-editor")?.addEventListener("click", (event) => {
  const form = event.target.closest('[data-action="delete-gallery"]')?.closest("form");
  if (form?.dataset.id) deleteRecord("gallery_items", form.dataset.id, "갤러리 사진").catch((error) => setMessage(dashboardMessage, error.message, true));
});
document.querySelector("#sign-out")?.addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();
  if (error) setMessage(dashboardMessage, error.message, true);
  else { dashboard.hidden = true; authCard.hidden = false; setMessage(authMessage, "로그아웃했습니다."); }
});

async function initializeAdmin() {
  const params = new URLSearchParams(window.location.search);
  setMode(params.get("mode") === "signup" ? "signup" : "login", false);
  if (params.get("mode") === "recovery") showPasswordUpdate();
  else if (params.get("mode") === "reset") showResetRequest();
  if (!config.supabaseUrl || !config.supabaseKey) {
    setMessage(authMessage, "Supabase 연결 설정이 필요합니다. README의 설정 안내를 확인해 주세요.", true);
    return;
  }
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    supabase = createClient(config.supabaseUrl, config.supabaseKey);
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") showPasswordUpdate();
    });
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (session?.user && params.get("mode") !== "recovery") await enterDashboard(session.user);
  } catch (error) {
    setMessage(authMessage, error.message || "Supabase에 연결하지 못했습니다.", true);
  }
}

initializeAdmin();
