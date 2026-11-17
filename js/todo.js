var STORAGE_KEY = "potachill-todos";
var LIKED_KEY = "potachill-liked-ids";
var PRIORITY_ORDER = { urgent: 0, normal: 1, later: 2 };
var PRIORITY_LABELS = { urgent: "Urgent", normal: "Normal", later: "Ça peut attendre" };

var form = document.getElementById("todo-form");
var list = document.getElementById("todo-list");
var emptyMsg = document.getElementById("todo-empty");
var sortSelect = document.getElementById("todo-sort");

function loadTodos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveTodos(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function loadLikedIds() {
  try {
    return JSON.parse(localStorage.getItem(LIKED_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveLikedIds(ids) {
  localStorage.setItem(LIKED_KEY, JSON.stringify(ids));
}

function sortTodos(todos) {
  var sorted = todos.slice();
  if (sortSelect.value === "likes") {
    sorted.sort(function (a, b) {
      return (b.likes || 0) - (a.likes || 0) ||
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    });
  } else {
    sorted.sort(function (a, b) {
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
        (b.likes || 0) - (a.likes || 0);
    });
  }
  return sorted;
}

function render() {
  var likedIds = loadLikedIds();
  var todos = sortTodos(loadTodos());

  list.innerHTML = "";
  emptyMsg.hidden = todos.length > 0;

  todos.forEach(function (todo) {
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
      new Date(todo.createdAt).toLocaleDateString("fr-FR");

    content.appendChild(head);
    content.appendChild(body);
    content.appendChild(meta);

    var actions = document.createElement("div");
    actions.className = "todo-actions";

    var like = document.createElement("button");
    like.className = "todo-like" + (likedIds.indexOf(todo.id) !== -1 ? " liked" : "");
    like.setAttribute("aria-label", "Soutenir cette proposition");
    like.title = "J'aime cette proposition";
    like.innerHTML = '<span class="heart" aria-hidden="true">♥</span><span class="like-count">' + (todo.likes || 0) + "</span>";
    like.addEventListener("click", function () {
      var currentLiked = loadLikedIds();
      var todosNow = loadTodos();
      var target = todosNow.filter(function (t) { return t.id === todo.id; })[0];
      if (!target) return;

      var index = currentLiked.indexOf(todo.id);
      if (index !== -1) {
        currentLiked.splice(index, 1);
        target.likes = Math.max(0, (target.likes || 0) - 1);
      } else {
        currentLiked.push(todo.id);
        target.likes = (target.likes || 0) + 1;
      }

      saveLikedIds(currentLiked);
      saveTodos(todosNow);
      render();
    });

    var del = document.createElement("button");
    del.className = "todo-delete";
    del.title = "Supprimer";
    del.setAttribute("aria-label", "Supprimer la proposition");
    del.textContent = "✕";
    del.addEventListener("click", function () {
      var remaining = loadTodos().filter(function (t) {
        return t.id !== todo.id;
      });
      saveTodos(remaining);
      saveLikedIds(loadLikedIds().filter(function (id) {
        return id !== todo.id;
      }));
      render();
    });

    actions.appendChild(like);
    actions.appendChild(del);

    li.appendChild(content);
    li.appendChild(actions);
    list.appendChild(li);
  });
}

form.addEventListener("submit", function (e) {
  e.preventDefault();

  var todo = {
    id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
    title: form.title.value.trim(),
    description: form.description.value.trim(),
    budget: form.budget.value,
    priority: form.priority.value,
    likes: 0,
    createdAt: Date.now()
  };

  var todos = loadTodos();
  todos.push(todo);
  saveTodos(todos);

  form.reset();
  form.priority.value = "normal";
  render();
});

sortSelect.addEventListener("change", render);

render();
