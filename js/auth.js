const { createClient } = await import(
  SUPABASE_CONFIGURED
    ? "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
    : "data:text/javascript,export const createClient = () => null;"
);

export const supabase = SUPABASE_CONFIGURED ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

export function pseudoToEmail(pseudo) {
  var clean = pseudo.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
  return clean + "@potachill.local";
}

export async function getCurrentUser() {
  if (!supabase) return null;
  var res = await supabase.auth.getSession();
  if (!res.data || !res.data.session) return null;
  return res.data.session.user;
}

export async function requireAuth() {
  if (!supabase) return null;
  var user = await getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  return user;
}

export async function signUp(nom, prenom, pseudo, password) {
  var res = await supabase.auth.signUp({
    email: pseudoToEmail(pseudo),
    password: password,
    options: {
      data: { nom: nom.trim(), prenom: prenom.trim(), pseudo: pseudo.trim() }
    }
  });
  return res;
}

export async function signIn(pseudo, password) {
  var res = await supabase.auth.signInWithPassword({
    email: pseudoToEmail(pseudo),
    password: password
  });
  return res;
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function renderUserChip() {
  if (!supabase) return;
  var user = await getCurrentUser();
  if (!user) return;

  var nav = document.querySelector(".nav-links");
  if (!nav || document.getElementById("user-chip")) return;

  var li = document.createElement("li");
  li.id = "user-chip";
  li.className = "user-chip";

  var name = document.createElement("span");
  name.className = "user-name";
  name.textContent =
    (user.user_metadata && user.user_metadata.pseudo) || user.email || "Interne";

  var logout = document.createElement("button");
  logout.className = "logout-btn";
  logout.textContent = "Déconnexion";
  logout.addEventListener("click", async function () {
    await signOut();
    window.location.href = "login.html";
  });

  li.appendChild(name);
  li.appendChild(logout);
  nav.appendChild(li);
}
