/* ============================================================
   ReLife AI — app.js  (Phase 2 · Full API Integration)
   Backend: POST http://127.0.0.1:5001/analyze
   ============================================================ */
("use strict");

// ─── Config ─────────────────────────────────────────────────
const CONFIG = {
  API_URL: "http://127.0.0.1:5001/analyze",
  API_TIMEOUT: 30000, // 30 s
  USE_MOCK: false, // set true to force demo mode
};

// ─── Utility ────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ─── Toast system ────────────────────────────────────────────
const Toast = (() => {
  let container;
  function getContainer() {
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      document.body.appendChild(container);
    }
    return container;
  }
  function show(msg, type = "info", duration = 4000) {
    const icons = { success: "✅", error: "⚠️", info: "ℹ️" };
    const c = getContainer();
    const t = document.createElement("div");
    t.className = `toast ${type}`;
    t.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-msg">${msg}</span>
      <span class="toast-close" role="button" aria-label="Close">✕</span>
    `;
    const close = () => {
      t.classList.add("hide");
      setTimeout(() => t.remove(), 300);
    };
    t.querySelector(".toast-close").addEventListener("click", close);
    c.appendChild(t);
    if (duration > 0) setTimeout(close, duration);
    return { close };
  }
  return {
    show,
    success: (m, d) => show(m, "success", d),
    error: (m, d) => show(m, "error", d),
    info: (m, d) => show(m, "info", d),
  };
})();

// ─── Page Transitions ────────────────────────────────────────
function navigateTo(url) {
  document.body.classList.add("page-transition-out");
  setTimeout(() => {
    window.location.href = url;
  }, 300);
}

// ─── Nav ────────────────────────────────────────────────────
function initNav() {
  const nav = $(".nav");
  if (!nav) return;
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 30);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const toggle = $(".nav-mobile-toggle");
  const links = $(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      const spans = $$("span", toggle);
      if (open) {
        spans[0].style.transform = "rotate(45deg) translate(5px, 5px)";
        spans[1].style.opacity = "0";
        spans[2].style.transform = "rotate(-45deg) translate(5px, -5px)";
      } else {
        spans.forEach((s) => {
          s.style.transform = "";
          s.style.opacity = "";
        });
      }
    });
    $$("a", links).forEach((a) =>
      a.addEventListener("click", () => links.classList.remove("open")),
    );
  }

  // Intercept nav links for smooth transition
  $$(".nav a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    if (href && !href.startsWith("#") && !href.startsWith("http")) {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        navigateTo(href);
      });
    }
  });
}

// ─── Reveal on scroll ────────────────────────────────────────
function initReveal() {
  const els = $$(".reveal");
  if (!els.length || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("visible"));
    return;
  }
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add("visible"), i * 80);
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1 },
  );
  els.forEach((el) => obs.observe(el));
}

// ─── Animated counters ───────────────────────────────────────
function animateCounters() {
  const counters = $$("[data-count]");
  if (!counters.length || !("IntersectionObserver" in window)) return;
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        obs.unobserve(e.target);
        const target = parseFloat(e.target.dataset.count);
        const suffix = e.target.dataset.suffix || "";
        const prefix = e.target.dataset.prefix || "";
        const decimals = target % 1 !== 0 ? 1 : 0;
        const duration = 1800;
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          e.target.textContent =
            prefix + (target * ease).toFixed(decimals) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.4 },
  );
  counters.forEach((el) => obs.observe(el));
}

// ─── Progress bar animations ─────────────────────────────────
function initProgressBars() {
  const fills = $$("[data-width]");
  if (!fills.length || !("IntersectionObserver" in window)) return;
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.style.width = e.target.dataset.width;
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.2 },
  );
  fills.forEach((el) => {
    el.style.width = "0";
    obs.observe(el);
  });
}

// ─── API call to Flask backend ───────────────────────────────
async function analyzeImage(file) {
  const formData = new FormData();
  formData.append("image", file); // field name expected by Flask

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);

  const response = await fetch(CONFIG.API_URL, {
    method: "POST",
    body: formData,
    signal: controller.signal,
  });
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(
      `Server error ${response.status}: ${errText || response.statusText}`,
    );
  }
  return response.json();
}

// Map flat Flask response → internal shape used by result page
function normalizeApiResponse(raw) {
  // Flask returns: { item_name, category, condition, estimated_value,
  //                  recommendation, eco_score, reason }
  const conditionMap = {
    Poor: 1,
    Fair: 2,
    Good: 3,
    "Very Good": 4,
    Excellent: 5,
  };
  const condScore = conditionMap[raw.condition] || 3;

  // Build recommendation cards from the single recommendation field
  const recoId = (raw.recommendation || "recycle").toLowerCase().trim();
  const recos = buildRecoCards(recoId, raw.reason);

  return {
    name: raw.item_name || "Unknown Item",
    category: raw.category || "Uncategorised",
    condition: condScore,
    conditionLabel: raw.condition || "Good",
    estimatedValue: raw.estimated_value || "—",
    material: raw.material || null,
    age: raw.age || null,
    ecoScore: Number(raw.eco_score) || 60,
    bestMatch: recoId,
    reason: raw.reason || "",
    recommendations: recos,
  };
}

function buildRecoCards(bestId, reason) {
  const all = {
    sell: {
      id: "sell",
      icon: "💰",
      name: "Sell",
      desc: reason || "List on Depop, eBay, or Vinted to earn money.",
      impact: "Earn value back",
      impactIcon: "📈",
    },
    donate: {
      id: "donate",
      icon: "🤝",
      name: "Donate",
      desc: reason || "Give to local shelters, Goodwill, or community drives.",
      impact: "Help someone",
      impactIcon: "💙",
    },
    repair: {
      id: "repair",
      icon: "🪡",
      name: "Upcycle / Repair",
      desc: reason || "A small fix could extend its life by years.",
      impact: "Extend life 5+ yrs",
      impactIcon: "✨",
    },
    recycle: {
      id: "recycle",
      icon: "♻️",
      name: "Recycle",
      desc:
        reason || "Use a certified textile or materials recycling programme.",
      impact: "CO₂ savings",
      impactIcon: "🌱",
    },
  };
  // Put the bestMatch first, then the rest
  const ordered = [
    bestId,
    ...["sell", "donate", "repair", "recycle"].filter((k) => k !== bestId),
  ];
  return ordered.map((k) => all[k] || all.recycle);
}

// ─── UPLOAD PAGE ─────────────────────────────────────────────
function initUpload() {
  const dropZone = $("#dropZone");
  const fileInput = $("#fileInput");
  const previewArea = $("#previewArea");
  const previewImg = $("#previewImg");
  const previewName = $("#previewName");
  const removeBtn = $("#removeBtn");
  const analyzeBtn = $("#analyzeBtn");
  const loadingOverlay = $("#loadingOverlay");
  const errorBanner = $("#errorBanner");
  const apiModeBadge = $("#apiModeBadge");

  if (!dropZone) return;

  let currentFile = null;

  // ── Set API mode badge ──
  if (apiModeBadge) {
    apiModeBadge.className =
      "api-mode-badge " + (CONFIG.USE_MOCK ? "demo" : "live");
    apiModeBadge.innerHTML = CONFIG.USE_MOCK
      ? "<span>🟡</span> Demo Mode"
      : '<span class="tag-dot"></span> Live API — Flask :5001';
  }

  // ── Show/hide helper ──
  const previewObserver = new MutationObserver(() => {
    const visible = previewArea.classList.contains("visible");
    const divider = $(".upload-divider");
    const actions = $(".upload-actions");
    if (divider) divider.style.display = visible ? "" : "none";
    if (actions) actions.style.display = visible ? "" : "none";
  });
  previewArea &&
    previewObserver.observe(previewArea, {
      attributes: true,
      attributeFilter: ["class"],
    });

  // Hide initially
  const divider = $(".upload-divider");
  const actions = $(".upload-actions");
  if (divider) divider.style.display = "none";
  if (actions) actions.style.display = "none";

  // ── Drag & drop ──
  dropZone.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });
  ["dragleave", "dragend"].forEach((ev) =>
    dropZone.addEventListener(ev, () => dropZone.classList.remove("drag-over")),
  );
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
    else Toast.error("Please drop a valid image file (JPG, PNG, WEBP, HEIC).");
  });
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) handleFile(file);
  });

  function handleFile(file) {
    currentFile = file;
    hideError();
    const reader = new FileReader();
    reader.onload = (ev) => {
      previewImg.src = ev.target.result;
      previewName.textContent = `${file.name}  ·  ${(file.size / 1024).toFixed(0)} KB`;
      dropZone.style.display = "none";
      previewArea.classList.add("visible");
      sessionStorage.setItem("relife_image", ev.target.result);
      sessionStorage.setItem("relife_filename", file.name);
    };
    reader.readAsDataURL(file);
  }

  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      previewArea.classList.remove("visible");
      dropZone.style.display = "";
      previewImg.src = "";
      fileInput.value = "";
      currentFile = null;
      hideError();
      sessionStorage.removeItem("relife_image");
    });
  }
if (analyzeBtn) {
  analyzeBtn.addEventListener("click", () => {
    if (!currentFile && !previewImg.src) {
      Toast.error("Please upload an image first.");
      return;
    }
    startAnalysis();
  });
}
  // ── Error UI ──
  function showError(title, detail) {
    if (!errorBanner) {
      Toast.error(`${title}: ${detail}`);
      return;
    }
    errorBanner.querySelector(".error-banner-title").textContent = title;
    errorBanner.querySelector(".error-banner-detail").textContent = detail;
    errorBanner.classList.add("visible");
  }
  function hideError() {
    if (errorBanner) errorBanner.classList.remove("visible");
  }

  // ── Loading step sequencer ──
  function runLoadingSteps(steps) {
    return new Promise((resolve) => {
      let i = 0;
      function next() {
        if (i > 0) steps[i - 1].classList.replace("active", "done");
        if (i < steps.length) {
          steps[i].classList.add("active");
          i++;
          setTimeout(next, 800 + Math.random() * 500);
        } else {
          resolve();
        }
      }
      next();
    });
  }

  async function startAnalysis() {
    hideError();
    loadingOverlay.classList.add("visible");
    const steps = $$(".loading-step", loadingOverlay);
    steps.forEach((s) => s.classList.remove("active", "done"));

    // Run visual steps concurrently with the API call
    const stepsPromise = runLoadingSteps(steps);

    try {
      let result;

      if (CONFIG.USE_MOCK || !currentFile) {
        // Demo / fallback
        await new Promise((r) => setTimeout(r, 3200));
        result = getMockResult();
      } else {
        // Real API
        const [raw] = await Promise.all([
          analyzeImage(currentFile),
          stepsPromise,
        ]);
        result = normalizeApiResponse(raw);
        console.log("RAW RESPONSE:", raw);
        console.log("NORMALIZED:", result);
      }

      sessionStorage.setItem("relife_result", JSON.stringify(result));
      sessionStorage.setItem(
        "relife_api_mode",
        CONFIG.USE_MOCK || !currentFile ? "demo" : "live",
      );

      setTimeout(() => {
        navigateTo("result.html");
      }, 600);
    } catch (err) {
      loadingOverlay.classList.remove("visible");
      steps.forEach((s) => s.classList.remove("active", "done"));

      let title = "Analysis failed";
      let detail = err.message || "Unknown error";

      if (err.name === "AbortError") {
        title = "Request timed out";
        detail =
          "The backend took too long to respond. Make sure Flask is running on :5001.";
      } else if (
        err.message.includes("Failed to fetch") ||
        err.message.includes("NetworkError")
      ) {
        title = "Cannot reach backend";
        detail =
          "Flask server not found at http://127.0.0.1:5001. Start it with: python app.py";
      }

      showError(title, detail);
      Toast.error(`${title}: ${detail}`, 8000);
      console.error("[ReLife AI] API error:", err);
    }
  }
}

// ─── RESULT PAGE ─────────────────────────────────────────────
function initResult() {
  const page = $(".result-page");
  if (!page) return;

  // Restore image
  const img = sessionStorage.getItem("relife_image");
  const imgEl = $("#resultImg");
  const ph = $("#imgPlaceholder");
  if (img && imgEl) {
    imgEl.src = img;
    imgEl.style.display = "block";
    if (ph) ph.style.display = "none";
  }

  // API mode badge
  const modeBadge = $("#resultModeBadge");
  const apiMode = sessionStorage.getItem("relife_api_mode") || "demo";
  if (modeBadge) {
    modeBadge.className = "api-mode-badge " + apiMode;
    modeBadge.innerHTML =
      apiMode === "live"
        ? '<span class="tag-dot"></span> Live result from Flask API'
        : "<span>🟡</span> Demo mode — connect Flask to see real results";
  }

  // Load data
  let data;
  try {
    data = JSON.parse(sessionStorage.getItem("relife_result"));
  } catch {
    data = null;
  }
  if (!data) data = getMockResult();

  // Populate
  setField("itemName", data.name);
  setField("itemCategory", data.category);
  setField("itemCondition", null, () =>
    renderCondition(data.condition, data.conditionLabel),
  );
  setField("itemValue", null, () => renderValue(data.estimatedValue));
  setField("itemMaterial", data.material || "—");
  setField("itemAge", data.age || "—");

  // Reason / AI explanation
  const reasonEl = $("#itemReason");
  if (reasonEl && data.reason) {
    reasonEl.textContent = data.reason;
    const reasonRow = $("#reasonRow");
    if (reasonRow) reasonRow.style.display = "flex";
  }

  renderEcoRing(data.ecoScore || 60);
  renderRecoCards(data.recommendations || defaultRecos(), data.bestMatch);

  // Save to dashboard history
  saveToDashboard(data, img);

  // Buttons
  const newScan = $("#newScan");
  if (newScan)
    newScan.addEventListener("click", () => navigateTo("upload.html"));

  const shareBtn = $("#shareBtn");
  if (shareBtn)
    shareBtn.addEventListener("click", () => {
      if (navigator.share) {
        navigator
          .share({ title: `${data.name} — ReLife AI`, url: location.href })
          .catch(() => {});
      } else {
        navigator.clipboard
          ?.writeText(location.href)
          .then(() => Toast.success("Link copied!"));
      }
    });
}

function setField(id, value, renderFn) {
  const el = $(`#${id}`);
  if (!el) return;
  if (renderFn) {
    renderFn(el);
    return;
  }
  if (value !== null && value !== undefined) el.textContent = value;
}

function renderCondition(score, label) {
  const el = $("#itemCondition");
  if (!el) return;
  label =
    label ||
    ["Poor", "Fair", "Good", "Very Good", "Excellent"][score - 1] ||
    "Good";
  let dots = "";
  for (let i = 1; i <= 5; i++)
    dots += `<span class="condition-dot ${i <= score ? "filled" : ""}"></span>`;
  el.innerHTML = `<span class="condition-dots">${dots}</span><span style="margin-left:8px;font-size:12px;color:var(--text-muted)">${label}</span>`;
}

function renderValue(val) {
  const el = $("#itemValue");
  if (el) el.innerHTML = `<span class="value-badge">${val}</span>`;
}

function renderEcoRing(score) {
  const svg = $("#ecoRingSvg");
  if (!svg) return;
  const size = 110,
    r = 44,
    cx = size / 2,
    cy = size / 2;
  const circ = 2 * Math.PI * r;
  const color =
    score >= 75 ? "var(--green)" : score >= 50 ? "#FBBF24" : "#EF4444";
  const label = score >= 75 ? "Excellent" : score >= 50 ? "Average" : "Poor";

  svg.innerHTML = `
    <circle class="eco-ring-track" cx="${cx}" cy="${cy}" r="${r}"/>
    <circle class="eco-ring-fill" cx="${cx}" cy="${cy}" r="${r}"
      stroke="${color}" stroke-dasharray="${circ}" stroke-dashoffset="${circ}"
      transform="rotate(-90 ${cx} ${cy})" id="ecoFill"/>
    <text class="eco-ring-text-num" x="${cx}" y="${cy - 6}" text-anchor="middle" dominant-baseline="middle">${score}</text>
    <text class="eco-ring-text-label" x="${cx}" y="${cy + 14}" text-anchor="middle">ECO SCORE</text>
  `;
  // Update the label below ring
  const labelEl = $("#ecoScoreLabel");
  if (labelEl) labelEl.textContent = `${label} · above average recyclability`;

  requestAnimationFrame(() => {
    const fill = $("#ecoFill");
    if (fill)
      setTimeout(() => {
        fill.style.strokeDashoffset = circ * (1 - score / 100);
      }, 200);
  });
}

function renderRecoCards(recos, bestMatch) {
  const grid = $("#recoCards");
  if (!grid) return;
  grid.innerHTML = "";
  recos.forEach((r) => {
    const isBest = r.id === bestMatch;
    const card = document.createElement("div");
    card.className = `reco-card glass${isBest ? " best-match" : ""}`;
    card.innerHTML = `
      <div class="reco-icon">${r.icon}</div>
      <div class="reco-name">${r.name}</div>
      <div class="reco-desc">${r.desc}</div>
      <div class="reco-impact ${r.id}"><span>${r.impactIcon}</span> ${r.impact}</div>
    `;
    card.addEventListener("click", () => {
      $$(".reco-card").forEach((c) => (c.style.outline = ""));
      card.style.outline = "2px solid var(--green)";
      Toast.success(`${r.name} selected as your action!`, 2500);
    });
    grid.appendChild(card);
  });
}

// ─── Dashboard history (localStorage) ───────────────────────
const HISTORY_KEY = "relife_history";

function saveToDashboard(data, imageDataUrl) {
  try {
    const history = getHistory();
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      name: data.name,
      category: data.category,
      ecoScore: data.ecoScore,
      value: data.estimatedValue,
      bestMatch: data.bestMatch,
      condition: data.condition,
      thumb: imageDataUrl ? imageDataUrl.substring(0, 120) : null, // tiny ref
    };
    history.unshift(entry);
    if (history.length > 50) history.pop();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    /* localStorage may be unavailable */
  }
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

// ─── DASHBOARD PAGE ──────────────────────────────────────────
function initDashboard() {
  const page = $(".dashboard-page");
  if (!page) return;

  const history = getHistory();
  populateKPIs(history);
  renderActivityFeed(history);
  renderGoals(history);
  renderCategoryChart(history);
  renderCO2Chart(history);
  initProgressBars();

  const clearBtn = $("#clearHistory");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (confirm("Clear all scan history? This cannot be undone.")) {
        localStorage.removeItem(HISTORY_KEY);
        Toast.success("History cleared.");
        setTimeout(() => location.reload(), 800);
      }
    });
  }
}

function populateKPIs(history) {
  const totalScans = history.length;
  const co2Saved = history.reduce(
    (s, h) => s + (h.ecoScore >= 60 ? 4.2 : 1.8),
    0,
  );
  const wasteDiverted = (totalScans * 0.82).toFixed(1); // kg estimate
  const circularity = totalScans
    ? Math.min(
        95,
        Math.round(history.reduce((s, h) => s + h.ecoScore, 0) / totalScans),
      )
    : 0;

  setText("kpiScans", totalScans);
  setText("kpiCO2", co2Saved.toFixed(1) + " kg");
  setText("kpiWaste", wasteDiverted + " kg");
  setText("kpiCircularity", circularity + "%");

  // Progress fills
  setDataWidth("#kpiScansFill", Math.min(100, totalScans * 2) + "%");
  setDataWidth("#kpiCO2Fill", Math.min(100, co2Saved * 3) + "%");
  setDataWidth("#kpiWasteFill", Math.min(100, wasteDiverted * 5) + "%");
  setDataWidth("#kpiCircularityFill", circularity + "%");
}

function setText(id, val) {
  const el = $(`#${id}`);
  if (el) el.textContent = val;
}

function setDataWidth(sel, w) {
  const el = $(sel);
  if (el) {
    el.dataset.width = w;
  }
}

function renderActivityFeed(history) {
  const list = $("#activityList");
  if (!list) return;
  if (!history.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>No scans yet. <a href="upload.html" style="color:var(--sky)">Upload your first item</a> to see history here.</p></div>`;
    return;
  }
  const icons = { sell: "💰", donate: "💙", repair: "🪡", recycle: "♻️" };
  list.innerHTML = history
    .slice(0, 8)
    .map((h) => {
      const date = new Date(h.timestamp).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
      const time = new Date(h.timestamp).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const action = h.bestMatch || "recycle";
      return `
      <div class="activity-item">
        <div class="activity-icon ${action}">${icons[action] || "♻️"}</div>
        <div class="activity-body">
          <div class="activity-name">${h.name}</div>
          <div class="activity-meta">${h.category} · ${date}, ${time}</div>
        </div>
        <span class="activity-badge ${action}">${action.charAt(0).toUpperCase() + action.slice(1)}</span>
      </div>
    `;
    })
    .join("");
}

function renderGoals(history) {
  const totalScans = history.length;
  const monthly = history.filter((h) => {
    const d = new Date(h.timestamp);
    const now = new Date();
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }).length;

  const goals = [
    { label: "Monthly scans", val: monthly, target: 20, cls: "g" },
    {
      label: "Items recycled",
      val: history.filter((h) => h.bestMatch === "recycle").length,
      target: 15,
      cls: "s",
    },
    {
      label: "Items donated",
      val: history.filter((h) => h.bestMatch === "donate").length,
      target: 10,
      cls: "v",
    },
    {
      label: "Items sold",
      val: history.filter((h) => h.bestMatch === "sell").length,
      target: 10,
      cls: "a",
    },
  ];

  const list = $("#goalList");
  if (!list) return;
  list.innerHTML = goals
    .map((g) => {
      const pct = Math.min(100, Math.round((g.val / g.target) * 100));
      return `
      <div class="goal-item">
        <div class="goal-header">
          <span class="goal-name">${g.label}</span>
          <span class="goal-pct" style="color:var(--${g.cls === "g" ? "green" : g.cls === "s" ? "sky" : g.cls === "v" ? "violet" : "amber"})">${g.val}/${g.target}</span>
        </div>
        <div class="goal-bar"><div class="goal-fill ${g.cls}" data-width="${pct}%" style="width:0"></div></div>
      </div>
    `;
    })
    .join("");
}

function renderCategoryChart(history) {
  const catEl = $("#categoryBars");
  if (!catEl) return;
  const counts = {};
  history.forEach((h) => {
    counts[h.category] = (counts[h.category] || 0) + 1;
  });
  const top = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const max = top[0]?.[1] || 1;
  if (!top.length) {
    catEl.innerHTML =
      '<div class="empty-state" style="padding:20px 0"><p style="font-size:13px">No data yet</p></div>';
    return;
  }
  const colors = [
    "var(--green)",
    "var(--sky)",
    "#a78bfa",
    "#FBBF24",
    "#34d399",
    "#38bdf8",
  ];
  catEl.innerHTML = top
    .map(
      ([cat, n], i) => `
    <div class="cat-row">
      <span class="cat-label">${cat.split(" ")[0]}</span>
      <div class="cat-track">
        <div class="cat-fill" data-width="${Math.round((n / max) * 100)}%" style="width:0;background:${colors[i % colors.length]}"></div>
      </div>
      <span class="cat-count">${n}</span>
    </div>
  `,
    )
    .join("");
}

function renderCO2Chart(history) {
  const svgEl = $("#co2ChartSvg");
  if (!svgEl || !history.length) return;

  // Group by day (last 7 days)
  const days = 7;
  const dayData = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-GB", { weekday: "short" });
    const items = history.filter((h) => {
      const hd = new Date(h.timestamp);
      return hd.toDateString() === d.toDateString();
    });
    const co2 = items.reduce((s, h) => s + (h.ecoScore >= 60 ? 4.2 : 1.8), 0);
    dayData.push({ label, co2: parseFloat(co2.toFixed(1)) });
  }

  const W = 480,
    H = 180,
    padL = 32,
    padB = 28,
    padT = 16,
    padR = 16;
  const maxVal = Math.max(...dayData.map((d) => d.co2), 5);
  const stepX = (W - padL - padR) / (dayData.length - 1);

  const pts = dayData.map((d, i) => {
    const x = padL + i * stepX;
    const y = padT + (H - padB - padT) * (1 - d.co2 / maxVal);
    return { x, y, ...d };
  });

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area =
    `${padL},${H - padB} ` +
    pts.map((p) => `${p.x},${p.y}`).join(" ") +
    ` ${W - padR},${H - padB}`;

  svgEl.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svgEl.innerHTML = `
    <defs>
      <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--green)" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="var(--green)" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <!-- Grid lines -->
    ${[0, 0.25, 0.5, 0.75, 1]
      .map((t) => {
        const y = padT + (H - padB - padT) * t;
        return `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`;
      })
      .join("")}
    <!-- Area fill -->
    <polygon points="${area}" fill="url(#co2Grad)"/>
    <!-- Line -->
    <polyline points="${polyline}" fill="none" stroke="var(--green)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Dots -->
    ${pts
      .map(
        (p) => `
      <circle cx="${p.x}" cy="${p.y}" r="4" fill="var(--green)" stroke="var(--ocean)" stroke-width="2"/>
      <title>${p.label}: ${p.co2} kg CO₂</title>
    `,
      )
      .join("")}
    <!-- X labels -->
    ${pts.map((p) => `<text x="${p.x}" y="${H - 6}" text-anchor="middle" font-size="10" fill="rgba(148,163,184,0.8)">${p.label}</text>`).join("")}
  `;
}

// ─── Circular economy donut (dashboard) ─────────────────────
function renderEconomyDonut() {
  const svg = $("#economyDonut");
  if (!svg) return;
  const history = getHistory();
  const total = history.length || 1;
  const sell = history.filter((h) => h.bestMatch === "sell").length;
  const donate = history.filter((h) => h.bestMatch === "donate").length;
  const repair = history.filter((h) => h.bestMatch === "repair").length;
  const recycle = history.filter((h) => h.bestMatch === "recycle").length;

  const segments = [
    { val: sell, color: "#FBBF24", label: "Sell" },
    { val: donate, color: "#0EA5E9", label: "Donate" },
    { val: repair, color: "#a78bfa", label: "Repair" },
    { val: recycle, color: "#1DB954", label: "Recycle" },
  ];
  // Fallback if no history
  if (!history.length) {
    segments[0].val = 25;
    segments[1].val = 30;
    segments[2].val = 15;
    segments[3].val = 30;
  }

  const size = 120,
    cx = 60,
    cy = 60,
    r = 44,
    strokeW = 14;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const totalVal = segments.reduce((s, g) => s + g.val, 0) || 1;

  let paths = "";
  segments.forEach((seg) => {
    const pct = seg.val / totalVal;
    const dash = circ * pct;
    paths += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
      stroke="${seg.color}" stroke-width="${strokeW}"
      stroke-dasharray="${dash} ${circ - dash}"
      stroke-dashoffset="${-offset + circ * 0.25}"
      stroke-linecap="butt" opacity="0.85"/>`;
    offset += dash;
  });

  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.innerHTML = `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="${strokeW}"/>
    ${paths}
    <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="16" font-weight="800" fill="var(--text-primary)">${history.length}</text>
    <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-size="9" fill="rgba(148,163,184,0.8)">ITEMS</text>
  `;
}

// ─── Shared Mock Data ────────────────────────────────────────
function getMockResult() {
  return {
    name: "Vintage Denim Jacket",
    category: "Clothing & Apparel",
    condition: 4,
    conditionLabel: "Very Good",
    estimatedValue: "$45 – $80",
    material: "Denim (95% Cotton)",
    age: "8–12 years",
    ecoScore: 78,
    bestMatch: "sell",
    reason:
      "Vintage denim jackets are trending on resale platforms. Yours is in very good condition and should sell quickly.",
    recommendations: buildRecoCards(
      "sell",
      "Vintage denim jackets are in high demand on Depop and Vinted right now.",
    ),
  };
}
function defaultRecos() {
  return buildRecoCards("recycle", "");
}

// ─── Init ────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initReveal();
  animateCounters();
  initProgressBars();
  initUpload();
  initResult();
  initDashboard();
  renderEconomyDonut();
});