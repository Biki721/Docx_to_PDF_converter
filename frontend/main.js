const fileInput = document.getElementById("file");
const dropzone = document.getElementById("dropzone");
const form = document.getElementById("uploadForm");
const statusBox = document.getElementById("status");
const statusText = document.getElementById("statusText");
const downloadLink = document.getElementById("downloadLink");
const convertBtn = document.getElementById("convertBtn");

function apiBase() {
  const base = (window.API_BASE || "").trim();
  if (!base) return "";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

function showStatus(text) {
  statusText.textContent = text;
  statusBox.classList.remove("hidden");
  statusBox.classList.remove("error");
  downloadLink.classList.add("hidden");
}

function hideStatus() {
  statusBox.classList.add("hidden");
}

dropzone.addEventListener("click", () => fileInput.click());

["dragenter", "dragover"].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add("dragover");
  });
});
["dragleave", "drop"].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove("dragover");
  });
});

dropzone.addEventListener("drop", (e) => {
  const dt = e.dataTransfer;
  if (dt && dt.files && dt.files.length) {
    fileInput.files = dt.files;
    updateSelectedFileUI();
  }
});

fileInput.addEventListener("change", updateSelectedFileUI);

function updateSelectedFileUI() {
  const strong = dropzone.querySelector(".dz-text strong");
  const span = dropzone.querySelector(".dz-text span");
  if (fileInput.files && fileInput.files.length) {
    const f = fileInput.files[0];
    strong.textContent = f.name;
    span.textContent = "Ready to convert";
  } else {
    strong.textContent = "Choose a .docx file";
    span.textContent = "or drag & drop here";
  }
  downloadLink.classList.add("hidden");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!fileInput.files.length) {
    alert("Please choose a .docx file");
    return;
  }
  const file = fileInput.files[0];
  if (!file.name.toLowerCase().endsWith(".docx")) {
    alert("Only .docx files are supported");
    return;
  }

  const target = `${apiBase()}/api/convert`;

  const formData = new FormData();
  formData.append("file", file, file.name);

  try {
    showStatus("Converting…");
    convertBtn.disabled = true;
    const response = await fetch(target, { method: "POST", body: formData });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Conversion failed");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = file.name.replace(/\.docx$/i, ".pdf");
    downloadLink.classList.remove("hidden");
    hideStatus();
  } catch (err) {
    console.error(err);
    statusText.textContent = "Error: " + (err?.message || "Unknown");
    statusBox.classList.add("error");
    statusBox.classList.remove("hidden");
  } finally {
    convertBtn.disabled = false;
  }
});
