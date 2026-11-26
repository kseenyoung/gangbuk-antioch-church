const nav = document.querySelector(".primary-nav");
const navLinks = [
  ["사영리", "./four-laws.html"],
  ["교회소개", "./index.html#about"],
  ["담임목사 소개", "./pastor.html"],
  ["예배안내", "./index.html#worship"],
  ["주보보기", "./bulletin.html"],
  ["갤러리", "./gallery.html"],
  ["오시는길", "./index.html#directions"],
  ["베타 의견 남기기", "./index.html#beta-feedback"]
];

if (nav) {
  nav.replaceChildren();
  navLinks.forEach(([label, href]) => {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = label;
    nav.append(link);
  });
  const account = document.createElement("div");
  account.className = "account-links";
  nav.append(account);
}

const menuButton = document.querySelector(".menu-toggle");
menuButton?.addEventListener("click", () => {
  const expanded = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!expanded));
  menuButton.setAttribute("aria-label", expanded ? "메뉴 열기" : "메뉴 닫기");
  nav?.classList.toggle("is-open", !expanded);
});

nav?.addEventListener("click", (event) => {
  if (!event.target.closest("a, button")) return;
  menuButton?.setAttribute("aria-expanded", "false");
  menuButton?.setAttribute("aria-label", "메뉴 열기");
  nav.classList.remove("is-open");
});
