var STORAGE_KEY = "potachill-todos";
var PRIORITY_ORDER = { urgent: 0, normal: 1, later: 2 };
var PRIORITY_LABELS = { urgent: "Urgent", normal: "Normal", later: "Ça peut attendre" };

var form = document.getElementById("todo-form");
var list = document.getElementById("todo-list");
var emptyMsg = document.getElementById("todo-empty");

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

function render() {
  var todos = loadTodos().sort(function (a, b) {
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  });

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
      render();
    });

    li.appendChild(content);
    li.appendChild(del);
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
    createdAt: Date.now()
  };

  var todos = loadTodos();
  todos.push(todo);
  saveTodos(todos);

  form.reset();
  form.priority.value = "normal";
  render();
});

render();
