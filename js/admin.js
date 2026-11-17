const { createClient } = await import(
  SUPABASE_CONFIGURED
    ? "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
    : "data:text/javascript,export const createClient = () => null;"
);

var supabase = SUPABASE_CONFIGURED ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

var table = document.getElementById("members-table");
var body = document.getElementById("members-body");
var count = document.getElementById("members-count");
var error = document.getElementById("admin-error");

async function loadMembers() {
  if (!supabase) return;

  var res = await supabase
    .from("profiles")
    .select("pseudo, prenom, nom, created_at")
    .order("created_at", { ascending: true });

  if (res.error || !res.data || res.data.length === 0) {
    error.hidden = false;
    return;
  }

  error.hidden = true;
  table.hidden = false;
  count.hidden = false;
  count.textContent = res.data.length + " interne" + (res.data.length > 1 ? "s" : "") + " inscrit" + (res.data.length > 1 ? "s" : "") + ".";

  res.data.forEach(function (profile) {
    var tr = document.createElement("tr");

    var pseudoTd = document.createElement("td");
    pseudoTd.className = "member-pseudo";
    pseudoTd.textContent = profile.pseudo;

    var prenomTd = document.createElement("td");
    prenomTd.textContent = profile.prenom;

    var nomTd = document.createElement("td");
    nomTd.textContent = profile.nom;

    var dateTd = document.createElement("td");
    dateTd.className = "member-date";
    dateTd.textContent = new Date(profile.created_at).toLocaleDateString("fr-FR");

    tr.appendChild(pseudoTd);
    tr.appendChild(prenomTd);
    tr.appendChild(nomTd);
    tr.appendChild(dateTd);
    body.appendChild(tr);
  });
}

loadMembers();
