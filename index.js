import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
  databaseURL:
    "https://leads-tracker-app-65f01-default-rtdb.europe-west1.firebasedatabase.app/",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const leadsRef = ref(database, "leads");

// DOM Elements
const titleEl = document.getElementById("title-el");
const inputEl = document.getElementById("input-el");
const inputBtn = document.getElementById("input-btn");
const ulEl = document.getElementById("ul-el");
const deleteBtn = document.getElementById("delete-btn");
const searchEl = document.getElementById("search-el");
const sortBtn = document.getElementById("sort-btn");

let allLeads = []; // Store all leads for searching and sorting

// Fetch Leads from Firebase
onValue(leadsRef, (snapshot) => {
  if (snapshot.exists()) {
    allLeads = Object.entries(snapshot.val()); // Store all leads for filtering
    renderLeads(allLeads, true); // Sort from latest to oldest by default
  } else {
    allLeads = [];
    ulEl.innerHTML = `<p class="text-gray-400 text-center">No leads found. Start adding some!</p>`;
  }
});

// Save a New Lead to Firebase
inputBtn.addEventListener("click", () => {
  const title = titleEl.value.trim();
  const url = inputEl.value.trim();

  if (title && url) {
    push(leadsRef, { title, url, timestamp: Date.now() });
    titleEl.value = "";
    inputEl.value = "";
  } else {
    alert("Please enter both a title and a URL.");
  }
});

// Delete All Leads
deleteBtn.addEventListener("dblclick", () => {
  if (confirm("Are you sure you want to delete all leads?")) {
    remove(leadsRef);
    ulEl.innerHTML = "";
  }
});

// Render Leads in UI
function renderLeads(leads, sortLatest = true) {
  ulEl.innerHTML = ""; // Clear previous list

  // Sort leads (latest to oldest by default)
  const sortedLeads = [...leads].sort((a, b) => {
    return sortLatest
      ? b[1].timestamp - a[1].timestamp // Newest first
      : a[1].timestamp - b[1].timestamp; // Oldest first
  });

  sortedLeads.forEach(([id, lead]) => {
    const li = document.createElement("li");
    li.className =
      "fade-in p-3 bg-gray-800 rounded-lg flex justify-between items-center hover:bg-gray-700 transition-all";
    li.dataset.id = id; // Store Firebase ID

    li.innerHTML = `
      <div>
        <div class="text-lg font-semibold">${lead.title}</div>
        <a href="${lead.url}" target="_blank" class="text-blue-400 hover:underline">${lead.url}</a>
      </div>
      <div class="flex gap-2">
        <button class="copy-btn bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded">Copy Link</button>
        <button class="delete-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">Delete</button>
      </div>
    `;

    // Copy Link Functionality
    li.querySelector(".copy-btn").addEventListener("click", () => {
      navigator.clipboard.writeText(lead.url);
      alert("Link copied to clipboard!");
    });

    // Delete individual lead
    li.querySelector(".delete-btn").addEventListener("click", () => {
      remove(ref(database, `leads/${id}`));
    });

    ulEl.appendChild(li);
  });
}

// Search Leads
searchEl.addEventListener("input", function () {
  const query = searchEl.value.toLowerCase();
  const filteredLeads = allLeads.filter(([_, lead]) =>
    lead.title.toLowerCase().includes(query) || lead.url.toLowerCase().includes(query)
  );
  renderLeads(filteredLeads, true); // Keep latest first while searching
});

// Sort Leads (Toggle)
let sortLatest = true;
sortBtn.addEventListener("click", () => {
  sortLatest = !sortLatest;
  renderLeads(allLeads, sortLatest);
  sortBtn.innerText = sortLatest ? "Sort: Newest" : "Sort: Oldest";
});
