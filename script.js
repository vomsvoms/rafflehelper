// Persistent store using Set for fast lookup and dedup
const STORAGE_KEY = "raffle_numbers_v1";

let numberSet = loadNumbers();
updateUI();

// Elements
const addInput = document.getElementById("addInput");
const addBtn = document.getElementById("addBtn");
const bulkBtn = document.getElementById("bulkBtn");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const result = document.getElementById("result");
const list = document.getElementById("list");
const count = document.getElementById("count");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const clearBtn = document.getElementById("clearBtn");

// Events
addBtn.addEventListener("click", () => {
  const n = parseInt(addInput.value, 10);
  if (Number.isInteger(n)) {
    numberSet.add(n);
    persist(); updateUI();
    toast(`Saved number: ${n}`);
    addInput.value = "";
  } else {
    toast("Please enter a valid integer.");
  }
});

bulkBtn.addEventListener("click", () => {
  const text = prompt("Enter numbers (commas and ranges allowed, e.g., 1-10, 42, 100-105):");
  if (!text) return;
  const added = parseNumbers(text);
  if (added.length === 0) return toast("No valid numbers found.");
  for (const n of added) numberSet.add(n);
  persist(); updateUI();
  toast(`Added ${added.length} number(s).`);
});

searchBtn.addEventListener("click", () => {
  const n = parseInt(searchInput.value, 10);
  if (!Number.isInteger(n)) return toast("Enter a valid integer to search.");
  const found = numberSet.has(n);
  result.className = "result " + (found ? "ok" : "not");
  result.textContent = found ? `✅ Number ${n} is in the list.` : `❌ Number ${n} not found.`;
});

exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify([...numberSet].sort((a,b)=>a-b))], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "numbers.json"; a.click();
  URL.revokeObjectURL(url);
});

importFile.addEventListener("change", async () => {
  const file = importFile.files[0];
  if (!file) return;
  const text = await file.text();
  try {
    const arr = JSON.parse(text);
    const valid = arr.filter(Number.isInteger);
    valid.forEach(n => numberSet.add(n));
    persist(); updateUI();
    toast(`Imported ${valid.length} number(s).`);
    importFile.value = "";
  } catch {
    toast("Invalid JSON file.");
  }
});

clearBtn.addEventListener("click", () => {
  if (confirm("Clear all saved numbers? This cannot be undone.")) {
    numberSet = new Set();
    persist(); updateUI();
    toast("All numbers cleared.");
  }
});

// Helpers
function parseNumbers(input) {
  const parts = input.split(/[,;\s]+/).filter(Boolean);
  const out = [];
  for (const part of parts) {
    if (/^\d+-\d+$/.test(part)) {
      const [a, b] = part.split("-").map(n => parseInt(n, 10));
      if (Number.isInteger(a) && Number.isInteger(b)) {
        const [start, end] = a <= b ? [a, b] : [b, a];
        for (let i = start; i <= end; i++) out.push(i);
      }
    } else {
      const n = parseInt(part, 10);
      if (Number.isInteger(n)) out.push(n);
    }
  }
  return out;
}

function loadNumbers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(arr.filter(Number.isInteger));
  } catch {
    return new Set();
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...numberSet]));
}

function updateUI() {
  count.textContent = `Count: ${numberSet.size}`;
  list.innerHTML = "";
  const sorted = [...numberSet].sort((a, b) => a - b);
  for (const n of sorted) {
    const span = document.createElement("span");
    span.textContent = n;
    list.appendChild(span);
  }
  result.textContent = "";
  result.className = "result";
}

function toast(msg) {
  // Minimal feedback via result area if no search context
  if (!result.textContent) {
    result.className = "result";
    result.textContent = msg;
  } else {
    console.log(msg);
  }
}