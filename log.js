let userActions = JSON.parse(localStorage.getItem("userActions") || "[]");
let lastInputValues = JSON.parse(
  localStorage.getItem("lastInputValues") || "{}"
);
let lastToggleStates = JSON.parse(
  localStorage.getItem("lastToggleStates") || "{}"
);
let currentPopupElements = [];
let logFilename = "activity_log.json";

function saveToLocalStorage() {
  localStorage.setItem("userActions", JSON.stringify(userActions));
  localStorage.setItem("lastInputValues", JSON.stringify(lastInputValues));
  localStorage.setItem("lastToggleStates", JSON.stringify(lastToggleStates));
}

function logAction(eventType, details) {
  const entry = {
    event: eventType,
    details: details,
    timestamp: new Date().toISOString(),
  };
  userActions.push(entry);
  saveToLocalStorage();
}

function isClickInPopup(target) {
  return currentPopupElements.some((popup) => popup.contains(target));
}

function registerPopupElement(el) {
  if (el && !currentPopupElements.includes(el)) {
    currentPopupElements.push(el);
  }
}

function downloadLog() {
  // Capture final values before download
  for (const [id, value] of Object.entries(lastInputValues)) {
    logAction("input", { fieldId: id, finalValue: value });
  }
  for (const [id, checked] of Object.entries(lastToggleStates)) {
    logAction("toggle-final", { id: id, finalChecked: checked });
  }

  saveToLocalStorage(); // Ensure everything is stored

  const blob = new Blob([JSON.stringify(userActions, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = logFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Optional: Clear log after download
  localStorage.removeItem("userActions");
  localStorage.removeItem("lastInputValues");
  localStorage.removeItem("lastToggleStates");
}

function initLogger(filename = "activity_log.json") {
  localStorage.removeItem("userActions");
  localStorage.removeItem("lastInputValues");
  localStorage.removeItem("lastToggleStates");

  logFilename = filename;

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (target.tagName.toLowerCase() !== "input") {
      const inPopup = isClickInPopup(target);
      logAction("click", {
        element: target.tagName.toLowerCase(),
        id: target.id || "none",
        classname: target.className || "none",
        elementText: target.textContent?.substring(0, 50) || "none",
        x: event.clientX,
        y: event.clientY,
        isInPopup: inPopup,
      });
    }
  });

  document.querySelectorAll("input[type='text'], textarea").forEach((input) => {
    input.addEventListener("input", (event) => {
      lastInputValues[event.target.id] = event.target.value;
    });
  });

  document
    .querySelectorAll("input[type='checkbox'], input[type='radio']")
    .forEach((toggle) => {
      toggle.addEventListener("change", (event) => {
        const toggleId = event.target.id || "none";
        const checked = event.target.checked;
        logAction("toggle", {
          id: toggleId,
          type: event.target.type,
          name: event.target.name || "none",
          checked: checked,
        });
        lastToggleStates[toggleId] = checked;
      });
    });
}
