const { createClient } = await import(
  SUPABASE_CONFIGURED
    ? "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
    : "data:text/javascript,export const createClient = () => null;"
);

var supabase = SUPABASE_CONFIGURED ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

var balanceCard = document.getElementById("pot-balance-card");
var amountDisplay = document.getElementById("pot-amount");
var updateForm = document.getElementById("pot-update-form");
var updateInput = document.getElementById("pot-amount-input");
var updateMsg = document.getElementById("pot-update-message");

async function loadBalance() {
  if (!supabase) return;
  var res = await supabase
    .from("pot_balance")
    .select("amount, updated_at")
    .eq("id", 1)
    .maybeSingle();
  if (res.error || !res.data) return;
  amountDisplay.textContent = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(res.data.amount);
  var date = new Date(res.data.updated_at);
  var updated = document.getElementById("pot-updated");
  if (updated) {
    updated.textContent = "Dernière mise à jour : " +
      date.toLocaleDateString("fr-FR") + " " +
      date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
}

async function updateBalance(amount) {
  var res = await supabase
    .from("pot_balance")
    .update({ amount: amount, updated_at: new Date().toISOString() })
    .eq("id", 1);
  return res.error;
}

if (balanceCard) {
  loadBalance();

  if (updateForm) {
    updateForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      var value = Number(updateInput.value.replace(",", "."));
      if (isNaN(value) || value < 0) {
        updateMsg.textContent = "Montant invalide.";
        updateMsg.hidden = false;
        return;
      }
      var error = await updateBalance(value);
      if (error) {
        updateMsg.textContent = "Mise à jour impossible pour l'instant.";
        updateMsg.hidden = false;
        return;
      }
      updateMsg.hidden = true;
      updateInput.value = "";
      loadBalance();
      var editor = document.getElementById("pot-editor");
      if (editor) editor.hidden = true;
    });

    var toggle = document.getElementById("pot-edit-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var editor = document.getElementById("pot-editor");
        if (editor) editor.hidden = !editor.hidden;
      });
    }
  }
}
