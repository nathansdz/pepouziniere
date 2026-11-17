import { supabase, signUp, signIn, getCurrentUser } from "./auth.js";

var tabLogin = document.getElementById("tab-login");
var tabSignup = document.getElementById("tab-signup");
var formLogin = document.getElementById("form-login");
var formSignup = document.getElementById("form-signup");
var message = document.getElementById("auth-message");

function showMessage(text, isError) {
  message.textContent = text;
  message.hidden = false;
  message.className = "auth-message" + (isError ? " error" : "");
}

function switchTab(signup) {
  tabLogin.setAttribute("aria-selected", String(!signup));
  tabSignup.setAttribute("aria-selected", String(signup));
  formLogin.hidden = signup;
  formSignup.hidden = !signup;
  message.hidden = true;
}

tabLogin.addEventListener("click", function () { switchTab(false); });
tabSignup.addEventListener("click", function () { switchTab(true); });

formLogin.addEventListener("submit", async function (e) {
  e.preventDefault();
  try {
    var res = await signIn(formLogin["login-pseudo"].value, formLogin["login-password"].value);
    if (res.error) {
      showMessage("Pseudo ou mot de passe incorrect.", true);
      return;
    }
    window.location.href = "index.html";
  } catch (err) {
    showMessage("Impossible de se connecter pour l'instant.", true);
  }
});

formSignup.addEventListener("submit", async function (e) {
  e.preventDefault();
  var password = formSignup["signup-password"].value;
  var password2 = formSignup["signup-password2"].value;

  if (password !== password2) {
    showMessage("Les deux mots de passe ne correspondent pas.", true);
    return;
  }
  if (password.length < 6) {
    showMessage("Le mot de passe doit contenir au moins 6 caractères.", true);
    return;
  }

  try {
    var res = await signUp(
      formSignup["signup-nom"].value,
      formSignup["signup-prenom"].value,
      formSignup["signup-pseudo"].value,
      password
    );
    if (res.error) {
      if (res.error.message && res.error.message.indexOf("already") !== -1) {
        showMessage("Ce pseudo est déjà pris. Choisis-en un autre.", true);
      } else {
        showMessage("Inscription impossible : " + res.error.message, true);
      }
      return;
    }
    window.location.href = "index.html";
  } catch (err) {
    showMessage("Impossible de s'inscrire pour l'instant.", true);
  }
});

if (await getCurrentUser()) {
  window.location.href = "index.html";
}
if (!supabase) {
  showMessage("Le site n'est pas encore connecté à Supabase. Voir README.md.", true);
}
