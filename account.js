const accountConfig = window.SITE_CONFIG ?? {};
const accountContainers = [...document.querySelectorAll(".account-links")];

async function setupAccountNavigation() {
  if (!accountContainers.length || !accountConfig.supabaseUrl || !accountConfig.supabaseKey) return;
  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(accountConfig.supabaseUrl, accountConfig.supabaseKey);

    const render = async (session) => {
      for (const container of accountContainers) {
        container.replaceChildren();
        if (!session?.user) {
          const signup = document.createElement("a");
          signup.href = "./admin.html?mode=signup";
          signup.textContent = "회원가입";
          const login = document.createElement("a");
          login.href = "./admin.html?mode=login";
          login.textContent = "로그인";
          container.append(signup, login);
          continue;
        }

        const { data: isAdmin, error } = await supabase.rpc("is_site_admin");
        if (error) console.warn("관리자 상태를 확인하지 못했습니다.", error.message);
        if (isAdmin) {
          const dashboard = document.createElement("a");
          dashboard.href = "./admin.html?mode=login";
          dashboard.textContent = "관리자 화면";
          container.append(dashboard);
        } else {
          const status = document.createElement("span");
          status.className = "account-status";
          status.textContent = "로그인됨";
          container.append(status);
        }
        const logout = document.createElement("button");
        logout.type = "button";
        logout.className = "account-logout";
        logout.textContent = "로그아웃";
        container.append(logout);
      }
    };

    accountContainers.forEach((container) => container.addEventListener("click", async (event) => {
      if (!event.target.closest(".account-logout")) return;
      const button = event.target.closest(".account-logout");
      button.disabled = true;
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("로그아웃하지 못했습니다.", error);
        button.disabled = false;
      }
    }));

    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    await render(session);
    supabase.auth.onAuthStateChange((_event, nextSession) => {
      window.setTimeout(() => render(nextSession), 0);
    });
  } catch (error) {
    console.error("계정 메뉴를 불러오지 못했습니다.", error);
  }
}

setupAccountNavigation();
