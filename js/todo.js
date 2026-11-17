const { createClient } = await import(
  SUPABASE_CONFIGURED
    ? "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
    : "data:text/javascript,export const createClient = () => null;"
);

var STORAGE_KEY = "potachill-todos";
var LIKED_KEY = "potachill-liked-ids";
var USER_KEY = "potachill-user-key";
var PRIORITY_ORDER = { urgent: 0, normal: 1, later: 2 };
var PRIORITY_LABELS = { urgent: "Urgent", normal: "Normal", later: "Ça peut attendre" };

var supabase = SUPABASE_CONFIGURED ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

var form = document.getElementById("todo-form");
var list = document.getElementById("todo-list");
var emptyMsg = document.getElementById("todo-empty");
var sortSelect = document.getElementById("todo-sort");

function getUserKey() {
  var key = localStorage.getItem(USER_KEY);
  if (!key) {
    key = (crypto.randomUUID && crypto.randomUUID()) ||
      "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });
    localStorage.setItem(USER_KEY, key);
  }
  return key;
}

function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveLocal(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function loadLikedLocal() {
  try {
    return JSON.parse(localStorage.getItem(LIKED_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveLikedLocal(ids) {
  localStorage.setItem(LIKED_KEY, JSON.stringify(ids));
}

async function fetchTodos() {
  if (!supabase) return loadLocal();
  var res = await supabase
    .from("todos")
    .select("id, title, description, budget, priority, likes_count, created_at");
  return res.error ? [] : res.data;
}

async function addTodo(todo) {
  if (!supabase) {
    var todos = loadLocal();
    todos.push(todo);
    saveLocal(todos);
    return;
  }
  await supabase.from("todos").insert([
    { title: todo.title, description: todo.description, budget: Number(todo.budget) || 0, priority: todo.priority }
  ]);
}

async function deleteTodo(id) {
  if (!supabase) {
    saveLocal(loadLocal().filter(function (t) { return t.id !== id; }));
    saveLikedLocal(loadLikedLocal().filter(function (lid) { return lid !== id; }));
    return;
  }
  await supabase.from("todos").delete().eq("id", id);
}

async function fetchLikedIds(todos) {
  if (!supabase) return loadLikedLocal();
  var res = await supabase
    .from("todo_likes")
    .select("todo_id")
    .eq("user_key", getUserKey());
  return res.error ? [] : res.data.map(function (r) { return r.todo_id; });
}

async function toggleLike(id) {
  if (!supabase) {
    var liked = loadLikedLocal();
    var todos = loadLocal();
    var target = todos.filter(function (t) { return t.id === id; })[0];
    if (!target) return;
    var index = liked.indexOf(id);
    if (index !== -1) {
      liked.splice(index, 1);
      target.likes = Math.max(0, (target.likes || 0) - 1);
    } else {
      liked.push(id);
      target.likes = (target.likes || 0) + 1;
    }
    saveLikedLocal(liked);
    saveLocal(todos);
    return;
  }
  await supabase.rpc("toggle_like", { p_todo_id: id, p_user_key: getUserKey() });
}

function sortTodos(todos) {
  var sorted = todos.slice();
  if (sortSelect.value === "likes") {
    sorted.sort(function (a, b) {
      return (b.likes_count || 0) - (a.likes_count || 0) ||
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    });
  } else {
    sorted.sort(function (a, b) {
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
        (b.likes_count || 0) - (a.likes_count || 0);
    });
  }
  return sorted;
}

async function render() {
  var todos = await fetchTodos();
  var likedIds = await fetchLikedIds(todos);
  todos = sortTodos(todos);

  list.innerHTML = "";
  emptyMsg.hidden = todos.length > 0;

  todos.forEach(function (todo) {
    var likes = todo.likes_count || 0;
    var li = document.createElement("li");
    li.className = "todo-item priority-" + todo.priority;

    var content = document.createElement("div");

    var head = document.createElement("div");
    head.className = "todo-item-head";

    var title = document.createElement("span");
    title.className = "todo-item-title";
    title.textContent = todo.title;

    var badge = document.createElement("span");
    badge.className = "priority-badge";
    badge.textContent = PRIORITY_LABELS[todo.priority];

    head.appendChild(title);
    head.appendChild(badge);

    var body = document.createElement("p");
    body.className = "todo-item-body";
    body.textContent = todo.description;

    var meta = document.createElement("p");
    meta.className = "todo-item-meta";
    meta.textContent =
      "Budget estimé : " + (Number(todo.budget) || 0) + " € — proposé le " +
      new Date(todo.created_at).toLocaleDateString("fr-FR");

    content.appendChild(head);
    content.appendChild(body);
    content.appendChild(meta);

    var actions = document.createElement("div");
    actions.className = "todo-actions";

    var like = document.createElement("button");
    like.className = "todo-like" + (likedIds.indexOf(todo.id) !== -1 ? " liked" : "");
    like.setAttribute("aria-label", "Soutenir cette proposition");
    like.title = "J'aime cette proposition";
    like.innerHTML = '<span class="heart" aria-hidden="true">♥</span><span class="like-count">' + likes + "</span>";
    like.addEventListener("click", async function () {
      like.disabled = true;
      await toggleLike(todo.id);
      await render();
    });

    var del = document.createElement("button");
    del.className = "todo-delete";
    del.title = "Supprimer";
    del.setAttribute("aria-label", "Supprimer la proposition");
    del.textContent = "✕";
    del.addEventListener("click", async function () {
      del.disabled = true;
      await deleteTodo(todo.id);
      await render();
    });

    actions.appendChild(like);
    actions.appendChild(del);

    li.appendChild(content);
    li.appendChild(actions);
    list.appendChild(li);
  });
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  var todo = {
    id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
    title: form.title.value.trim(),
    description: form.description.value.trim(),
    budget: form.budget.value,
    priority: form.priority.value,
    likes_count: 0,
    created_at: Date.now()
  };

  if (!todo.title || !todo.description) return;

  await addTodo(todo);
  form.reset();
  form.priority.value = "normal";
  await render();
});

sortSelect.addEventListener("change", function () { render(); });

render();
