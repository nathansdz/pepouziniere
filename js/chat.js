const { createClient } = await import(
  SUPABASE_CONFIGURED
    ? "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
    : "data:text/javascript,export const createClient = () => null;"
);

var supabase = SUPABASE_CONFIGURED ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

var list = document.getElementById("chat-list");
var emptyMsg = document.getElementById("chat-empty");
var form = document.getElementById("chat-form");
var input = document.getElementById("chat-input");
var photoInput = document.getElementById("chat-photo-input");
var photoBtn = document.getElementById("chat-photo-btn");
var photoPreview = document.getElementById("chat-photo-preview");
var errorMsg = document.getElementById("chat-error");

var selectedFile = null;

function showError(text) {
  errorMsg.textContent = text;
  errorMsg.hidden = false;
  setTimeout(function () { errorMsg.hidden = true; }, 4000);
}

async function getCurrentUser() {
  if (!supabase) return null;
  var res = await supabase.auth.getSession();
  return res.data && res.data.session ? res.data.session.user : null;
}

function resizeImage(file, maxWidth, quality) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, maxWidth / img.width);
        var canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(function (blob) {
          if (blob) resolve(blob);
          else reject(new Error("compression impossible"));
        }, "image/jpeg", quality);
      };
      img.onerror = function () { reject(new Error("image illisible")); };
      img.src = e.target.result;
    };
    reader.onerror = function () { reject(new Error("lecture impossible")); };
    reader.readAsDataURL(file);
  });
}

photoBtn.addEventListener("click", function () {
  photoInput.click();
});

photoInput.addEventListener("change", function () {
  var file = photoInput.files && photoInput.files[0];
  if (!file) return;
  selectedFile = file;
  photoPreview.src = URL.createObjectURL(file);
  photoPreview.hidden = false;
});

function clearPhoto() {
  selectedFile = null;
  photoInput.value = "";
  photoPreview.src = "";
  photoPreview.hidden = true;
}

photoPreview.addEventListener("click", clearPhoto);

async function sendMessage() {
  var content = input.value.trim();
  if (!content && !selectedFile) return;

  var user = await getCurrentUser();
  if (!user) return;

  var imagePath = null;

  if (selectedFile) {
    try {
      var blob = await resizeImage(selectedFile, 1200, 0.75);
      var path = user.id + "/" + Date.now() + ".jpg";
      var up = await supabase.storage.from("chat").upload(path, blob, {
        contentType: "image/jpeg",
        upsert: false
      });
      if (up.error) {
        showError("Envoi de la photo impossible : " + up.error.message);
        return;
      }
      imagePath = path;
    } catch (err) {
      showError("Traitement de la photo impossible.");
      return;
    }
  }

  var pseudo =
    (user.user_metadata && user.user_metadata.pseudo) || "Interne";

  var res = await supabase.from("chat_messages").insert([
    { user_id: user.id, pseudo: pseudo, content: content || null, image_path: imagePath }
  ]);

  if (res.error) {
    showError("Envoi impossible : " + res.error.message);
    return;
  }

  input.value = "";
  clearPhoto();
  await render();
}

form.addEventListener("submit", function (e) {
  e.preventDefault();
  sendMessage();
});

input.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

function timeLabel(date) {
  var now = new Date();
  var diff = (now - date) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return "il y a " + Math.floor(diff / 60) + " min";
  if (diff < 86400) return "il y a " + Math.floor(diff / 3600) + " h";
  return "le " + date.toLocaleDateString("fr-FR") + " à " +
    date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

async function render() {
  if (!supabase) return;

  var res = await supabase
    .from("chat_messages")
    .select("id, pseudo, content, image_path, created_at")
    .order("created_at", { ascending: true })
    .limit(200);

  if (res.error) {
    showError("Chargement impossible : " + res.error.message);
    return;
  }

  var messages = res.data;
  list.innerHTML = "";
  emptyMsg.hidden = messages.length > 0;

  var user = await getCurrentUser();
  var myId = user ? user.id : null;

  messages.forEach(function (msg) {
    var li = document.createElement("li");
    li.className = "chat-message" + (msg.user_id === myId ? " mine" : "");

    var head = document.createElement("div");
    head.className = "chat-message-head";

    var avatar = document.createElement("span");
    avatar.className = "chat-avatar";
    avatar.textContent = msg.pseudo.charAt(0).toUpperCase();

    var name = document.createElement("span");
    name.className = "chat-message-name";
    name.textContent = msg.pseudo;

    var time = document.createElement("span");
    time.className = "chat-message-time";
    time.textContent = timeLabel(new Date(msg.created_at));

    head.appendChild(avatar);
    head.appendChild(name);
    head.appendChild(time);

    li.appendChild(head);

    if (msg.content) {
      var body = document.createElement("p");
      body.className = "chat-message-content";
      body.textContent = msg.content;
      li.appendChild(body);
    }

    if (msg.image_path) {
      var url = supabase.storage.from("chat").getPublicUrl(msg.image_path).data.publicUrl;
      var img = document.createElement("img");
      img.className = "chat-message-image";
      img.src = url;
      img.alt = "Photo partagée par " + msg.pseudo;
      img.loading = "lazy";
      li.appendChild(img);
    }

    list.appendChild(li);
  });

  list.scrollTop = list.scrollHeight;
}

render();
setInterval(render, 30000);
