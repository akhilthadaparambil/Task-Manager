const NOTE_KEY = "akhil.text.notes";
const TASK_KEY = "akhil.tasks";
const OLD_TASK_KEY = "agil.tasks";

const elements = {
  miniClock: document.querySelector("#miniClock"),
  currentTime: document.querySelector("#currentTime"),
  currentPeriod: document.querySelector("#currentPeriod"),
  currentDate: document.querySelector("#currentDate"),
  hourHand: document.querySelector("#hourHand"),
  minuteHand: document.querySelector("#minuteHand"),
  secondHand: document.querySelector("#secondHand"),
  noteForm: document.querySelector("#noteForm"),
  noteInput: document.querySelector("#noteInput"),
  noteMessage: document.querySelector("#noteMessage"),
  noteList: document.querySelector("#noteList"),
  emptyNotes: document.querySelector("#emptyNotes"),
  clearNotesBtn: document.querySelector("#clearNotesBtn"),
  taskForm: document.querySelector("#taskForm"),
  taskInput: document.querySelector("#taskInput"),
  taskList: document.querySelector("#taskList"),
  emptyTasks: document.querySelector("#emptyTasks"),
  clearDoneBtn: document.querySelector("#clearDoneBtn"),
  noteCount: document.querySelector("#noteCount"),
  taskCount: document.querySelector("#taskCount"),
  doneCount: document.querySelector("#doneCount"),
  tabs: document.querySelectorAll(".tab"),
  noteTemplate: document.querySelector("#noteTemplate"),
  taskTemplate: document.querySelector("#taskTemplate")
};

let notes = loadJson(NOTE_KEY, []);
let tasks = loadTasks();
let taskFilter = "all";

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadTasks() {
  const savedTasks = loadJson(TASK_KEY, null);
  if (savedTasks) return savedTasks;

  const oldTasks = loadJson(OLD_TASK_KEY, null);
  if (oldTasks) {
    saveJson(TASK_KEY, oldTasks);
    localStorage.removeItem(OLD_TASK_KEY);
    return oldTasks;
  }

  return [];
}

function updateClock() {
  const now = new Date();
  const timeText = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  const miniText = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
  const dateText = now.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
  const periodText = now.toLocaleTimeString([], {
    hour: "numeric",
    hour12: true
  }).replace(/[0-9:\s]/g, "");

  elements.currentTime.textContent = timeText;
  elements.miniClock.textContent = miniText;
  elements.currentDate.textContent = dateText;
  elements.currentPeriod.textContent = `${periodText || "Local"} time`;

  const seconds = now.getSeconds();
  const minutes = now.getMinutes() + seconds / 60;
  const hours = (now.getHours() % 12) + minutes / 60;
  elements.secondHand.style.transform = `rotate(${seconds * 6}deg)`;
  elements.minuteHand.style.transform = `rotate(${minutes * 6}deg)`;
  elements.hourHand.style.transform = `rotate(${hours * 30}deg)`;
}

function makeNoteTitle(body) {
  const firstLine = body.split("\n").find((line) => line.trim()) || "Untitled note";
  return firstLine.length > 44 ? `${firstLine.slice(0, 41)}...` : firstLine;
}

function renderNotes() {
  elements.noteList.innerHTML = "";
  elements.emptyNotes.classList.toggle("hidden", notes.length > 0);
  elements.clearNotesBtn.disabled = notes.length === 0;

  for (const note of notes) {
    const node = elements.noteTemplate.content.firstElementChild.cloneNode(true);
    const title = node.querySelector(".note-title");
    const body = node.querySelector(".note-body");
    const time = node.querySelector(".note-time");
    const deleteBtn = node.querySelector(".delete-note");

    title.value = note.title;
    body.value = note.body;
    time.textContent = new Date(note.createdAt).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });

    title.addEventListener("change", () => {
      note.title = title.value.trim() || makeNoteTitle(note.body);
      saveJson(NOTE_KEY, notes);
      renderNotes();
    });

    body.addEventListener("change", () => {
      note.body = body.value.trim();
      if (!note.body) {
        notes = notes.filter((item) => item.id !== note.id);
      }
      saveJson(NOTE_KEY, notes);
      renderNotes();
    });

    deleteBtn.addEventListener("click", () => {
      notes = notes.filter((item) => item.id !== note.id);
      elements.noteMessage.textContent = "";
      saveJson(NOTE_KEY, notes);
      renderNotes();
    });

    elements.noteList.append(node);
  }

  renderCounts();
}

function renderTasks() {
  const visibleTasks = tasks.filter((task) => {
    if (taskFilter === "open") return !task.done;
    if (taskFilter === "done") return task.done;
    return true;
  });

  elements.taskList.innerHTML = "";
  elements.emptyTasks.classList.toggle("hidden", visibleTasks.length > 0);
  elements.clearDoneBtn.disabled = !tasks.some((task) => task.done);

  for (const task of visibleTasks) {
    const node = elements.taskTemplate.content.firstElementChild.cloneNode(true);
    const toggle = node.querySelector(".task-toggle");
    const title = node.querySelector(".task-title");
    const deleteBtn = node.querySelector(".delete-task");

    node.classList.toggle("done", task.done);
    toggle.checked = task.done;
    title.value = task.title;

    toggle.addEventListener("change", () => {
      task.done = toggle.checked;
      saveJson(TASK_KEY, tasks);
      renderTasks();
    });

    title.addEventListener("change", () => {
      task.title = title.value.trim() || "Untitled task";
      saveJson(TASK_KEY, tasks);
      renderTasks();
    });

    deleteBtn.addEventListener("click", () => {
      tasks = tasks.filter((item) => item.id !== task.id);
      saveJson(TASK_KEY, tasks);
      renderTasks();
    });

    elements.taskList.append(node);
  }

  renderCounts();
}

function renderCounts() {
  elements.noteCount.textContent = notes.length;
  elements.taskCount.textContent = tasks.length;
  elements.doneCount.textContent = tasks.filter((task) => task.done).length;
}

elements.noteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const body = elements.noteInput.value.trim();
  if (!body) return;

  notes = [{
    id: crypto.randomUUID(),
    title: makeNoteTitle(body),
    body,
    createdAt: new Date().toISOString()
  }, ...notes];
  elements.noteInput.value = "";
  elements.noteMessage.textContent = "Note saved.";
  saveJson(NOTE_KEY, notes);
  renderNotes();
});

elements.clearNotesBtn.addEventListener("click", () => {
  notes = [];
  elements.noteMessage.textContent = "";
  saveJson(NOTE_KEY, notes);
  renderNotes();
});

elements.taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = elements.taskInput.value.trim();
  if (!title) return;
  tasks = [{ id: crypto.randomUUID(), title, done: false }, ...tasks];
  elements.taskInput.value = "";
  saveJson(TASK_KEY, tasks);
  renderTasks();
});

elements.clearDoneBtn.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.done);
  saveJson(TASK_KEY, tasks);
  renderTasks();
});

elements.tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    taskFilter = tab.dataset.filter;
    elements.tabs.forEach((item) => item.classList.toggle("active", item === tab));
    renderTasks();
  });
});

updateClock();
setInterval(updateClock, 1000);
renderNotes();
renderTasks();
