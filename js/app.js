/* Rendering del form, raccolta dati, salvataggio bozze ed esportazione. */
(function () {
  "use strict";

  const DRAFT_KEY = "pvp_bozza";
  const SETTINGS_KEY = "pvp_impostazioni";
  const AUTOSAVE_KEY = "pvp_autosave";

  const form = document.getElementById("visitForm");
  const sidebar = document.getElementById("sidebar");
  const dialog = document.getElementById("reportDialog");
  const preview = document.getElementById("reportPreview");

  const ALL_FIELDS = SCHEMA.flatMap((s) => s.fields.filter((f) => f.id).map((f) => ({ ...f, section: s })));
  const PERSISTENT_IDS = ALL_FIELDS.filter((f) => f.section.persistent).map((f) => f.id);

  // ---------- utilità ----------
  const formLabel = (s) => String(s).replace(/\{([^/}]*)\/([^}]*)\}/g, "$1/$2");

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k === "dataset") Object.assign(node.dataset, v);
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) {
      if (c === null || c === undefined) continue;
      node.append(c instanceof Node ? c : document.createTextNode(c));
    }
    return node;
  }

  function storageGet(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }
  function storageSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage non disponibile */ }
  }
  function storageDel(key) {
    try { localStorage.removeItem(key); } catch { /* storage non disponibile */ }
  }

  let toastTimer;
  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  function todayISO() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  // ---------- rendering ----------
  const defaultWidth = (f) =>
    f.w || (["textarea", "checks", "radio", "matrix", "table", "subtitle", "info"].includes(f.type) ? "full" : "half");

  function renderField(f) {
    if (f.type === "subtitle") return el("h3", { class: "subtitle w-full", text: f.label });
    if (f.type === "info") return el("p", { class: "info w-full", text: f.label });

    const wrap = el("div", { class: `field w-${defaultWidth(f)} t-${f.type}`, dataset: { field: f.id } });
    const labelText = f.label + (f.required ? " *" : "");

    switch (f.type) {
      case "text":
      case "date":
      case "time":
      case "number": {
        const input = el("input", {
          type: f.type, id: f.id, name: f.id, placeholder: f.placeholder, min: f.min, max: f.max,
          step: f.step, readonly: f.readonly, class: f.upper ? "upper" : null,
        });
        wrap.append(el("label", { for: f.id, text: labelText }), input);
        break;
      }
      case "textarea":
        wrap.append(
          el("label", { for: f.id, text: labelText }),
          el("textarea", { id: f.id, name: f.id, rows: f.rows || 3, placeholder: f.placeholder })
        );
        break;
      case "select": {
        const sel = el("select", { id: f.id, name: f.id }, el("option", { value: "", text: "—" }));
        f.options.forEach((o) => sel.append(el("option", { value: o, text: formLabel(o) })));
        wrap.append(el("label", { for: f.id, text: labelText }), sel);
        break;
      }
      case "check":
        wrap.append(el("label", { class: "single-check" }, el("input", { type: "checkbox", id: f.id, name: f.id }), f.label));
        break;
      case "radio":
      case "checks": {
        const group = el("div", { class: "chips", role: f.type === "radio" ? "radiogroup" : "group" });
        f.options.forEach((o) => {
          group.append(
            el("label", { class: "chip" },
              el("input", { type: f.type === "radio" ? "radio" : "checkbox", name: f.id, value: o }),
              el("span", { text: formLabel(o) }))
          );
        });
        wrap.append(el("div", { class: "group-label", text: labelText }), group);
        if (f.other) {
          wrap.append(el("input", { type: "text", class: "other", name: f.id + "_altro", placeholder: "Altro / specificare…" }));
        }
        break;
      }
      case "matrix": {
        const table = el("table", { class: "matrix" });
        table.append(el("thead", {}, el("tr", {}, el("th", {}), f.options.map((o) => el("th", { text: formLabel(o) })))));
        const tbody = el("tbody");
        f.rows.forEach(([rid, rlabel]) => {
          const name = `${f.id}_${rid}`;
          tbody.append(
            el("tr", {},
              el("th", { scope: "row", text: rlabel }),
              f.options.map((o) => el("td", {}, el("label", {}, el("input", { type: "radio", name, value: o, "aria-label": `${rlabel}: ${o}` })))))
          );
        });
        table.append(tbody);
        wrap.append(el("div", { class: "group-label", text: labelText }), el("div", { class: "matrix-scroll" }, table));
        break;
      }
      case "table": {
        const table = el("table", { class: "dyn", dataset: { table: f.id } });
        table.append(el("thead", {}, el("tr", {}, f.columns.map((c) => el("th", { text: c.label, style: c.w ? `width:${c.w}` : null })), el("th", { style: "width:40px" }))));
        table.append(el("tbody"));
        f.columns.forEach((c) => {
          if (c.list) {
            const dl = el("datalist", { id: `dl_${f.id}_${c.id}` });
            c.list.forEach((o) => dl.append(el("option", { value: o })));
            wrap.append(dl);
          }
        });
        wrap.append(
          el("div", { class: "group-label", text: labelText }),
          el("div", { class: "matrix-scroll" }, table),
          el("button", { type: "button", class: "btn small ghost", text: "+ " + (f.addLabel || "Aggiungi riga"), onclick: () => { addRow(f); markDirty(); } })
        );
        break;
      }
    }
    return wrap;
  }

  function addRow(f, values) {
    const tbody = form.querySelector(`table[data-table="${f.id}"] tbody`);
    const tr = el("tr");
    f.columns.forEach((c) => {
      let input;
      if (c.type === "select") {
        input = el("select", { dataset: { col: c.id } }, el("option", { value: "", text: "—" }), c.options.map((o) => el("option", { value: o, text: o })));
      } else {
        input = el("input", { type: "text", dataset: { col: c.id }, list: c.list ? `dl_${f.id}_${c.id}` : null });
      }
      if (values && values[c.id] != null) input.value = values[c.id];
      tr.append(el("td", {}, input));
    });
    tr.append(el("td", {}, el("button", {
      type: "button", class: "row-del", title: "Elimina riga", "aria-label": "Elimina riga", text: "×",
      onclick: () => { tr.remove(); markDirty(); },
    })));
    tbody.append(tr);
  }

  function render() {
    SCHEMA.forEach((s, i) => {
      const section = el("section", { class: "card", id: `sec-${s.id}`, dataset: { section: s.id } });
      section.append(el("h2", {}, el("span", { class: "sec-num", text: String(i + 1) }), s.title));
      if (s.intro) section.append(el("p", { class: "intro", text: s.intro }));
      const grid = el("div", { class: "grid" });
      s.fields.forEach((f) => grid.append(renderField(f)));
      section.append(grid);
      form.append(section);

      sidebar.append(el("a", { href: `#sec-${s.id}`, dataset: { nav: s.id } },
        el("span", { class: "nav-icon", text: s.icon || "•" }),
        el("span", { class: "nav-text", text: s.title }),
        el("span", { class: "nav-dot" })));
    });

    // radio deselezionabili con un secondo click
    form.addEventListener("click", (e) => {
      const input = e.target.closest("input[type=radio]");
      if (!input) return;
      if (input.dataset.wasChecked === "1") {
        input.checked = false;
        input.dataset.wasChecked = "0";
        markDirty();
      } else {
        form.querySelectorAll(`input[type=radio][name="${CSS.escape(input.name)}"]`).forEach((r) => (r.dataset.wasChecked = "0"));
        input.dataset.wasChecked = "1";
      }
    });
    form.addEventListener("input", onInput);
    form.addEventListener("change", onInput);
  }

  // ---------- raccolta / ripristino dati ----------
  function collect() {
    const data = {};
    ALL_FIELDS.forEach((f) => {
      switch (f.type) {
        case "radio": {
          const c = form.querySelector(`input[name="${f.id}"]:checked`);
          data[f.id] = c ? c.value : "";
          break;
        }
        case "checks":
          data[f.id] = [...form.querySelectorAll(`input[name="${f.id}"]:checked`)].map((i) => i.value);
          break;
        case "check":
          data[f.id] = form.querySelector(`#${f.id}`).checked;
          break;
        case "matrix":
          data[f.id] = {};
          f.rows.forEach(([rid]) => {
            const c = form.querySelector(`input[name="${f.id}_${rid}"]:checked`);
            if (c) data[f.id][rid] = c.value;
          });
          break;
        case "table":
          data[f.id] = [...form.querySelectorAll(`table[data-table="${f.id}"] tbody tr`)]
            .map((tr) => {
              const row = {};
              tr.querySelectorAll("[data-col]").forEach((i) => (row[i.dataset.col] = i.value.trim()));
              return row;
            })
            .filter((row) => Object.values(row).some(Boolean));
          break;
        default:
          data[f.id] = form.querySelector(`#${f.id}`).value.trim();
      }
      if (f.other) data[f.id + "_altro"] = form.querySelector(`input[name="${f.id}_altro"]`).value.trim();
    });
    return data;
  }

  function fill(data) {
    form.reset();
    form.querySelectorAll("input[type=radio]").forEach((r) => (r.dataset.wasChecked = "0"));
    ALL_FIELDS.forEach((f) => {
      const v = data[f.id];
      switch (f.type) {
        case "radio":
          form.querySelectorAll(`input[name="${f.id}"]`).forEach((i) => {
            i.checked = i.value === v;
            i.dataset.wasChecked = i.checked ? "1" : "0";
          });
          break;
        case "checks":
          form.querySelectorAll(`input[name="${f.id}"]`).forEach((i) => (i.checked = Array.isArray(v) && v.includes(i.value)));
          break;
        case "check":
          form.querySelector(`#${f.id}`).checked = !!v;
          break;
        case "matrix":
          f.rows.forEach(([rid]) => {
            form.querySelectorAll(`input[name="${f.id}_${rid}"]`).forEach((i) => {
              i.checked = !!v && v[rid] === i.value;
              i.dataset.wasChecked = i.checked ? "1" : "0";
            });
          });
          break;
        case "table": {
          form.querySelector(`table[data-table="${f.id}"] tbody`).innerHTML = "";
          const rows = Array.isArray(v) ? v : [];
          rows.forEach((r) => addRow(f, r));
          for (let i = rows.length; i < (f.minRows || 0); i++) addRow(f);
          break;
        }
        default: {
          const input = form.querySelector(`#${f.id}`);
          input.value = v != null ? v : f.today ? todayISO() : "";
        }
      }
      if (f.other) form.querySelector(`input[name="${f.id}_altro"]`).value = data[f.id + "_altro"] || "";
    });
    updateDerived();
  }

  // ---------- stato e salvataggio ----------
  let saveTimer;
  function onInput(e) {
    if (e.target.classList && e.target.classList.contains("upper")) {
      const pos = e.target.selectionStart;
      e.target.value = e.target.value.toUpperCase();
      e.target.setSelectionRange(pos, pos);
    }
    updateDerived();
    markDirty();
  }

  function markDirty() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 600);
  }

  function persist() {
    const data = collect();
    const settings = {};
    PERSISTENT_IDS.forEach((id) => (settings[id] = data[id]));
    storageSet(SETTINGS_KEY, settings);
    if (autosaveOn()) storageSet(DRAFT_KEY, { savedAt: new Date().toISOString(), data });
    updateProgress(data);
  }

  const autosaveOn = () => document.getElementById("autosaveToggle").checked;

  function isFilled(v) {
    if (Array.isArray(v)) return v.length > 0;
    if (v && typeof v === "object") return Object.keys(v).length > 0;
    return !!v;
  }

  function updateProgress(data) {
    data = data || collect();
    SCHEMA.forEach((s) => {
      const filled = s.fields.some((f) => f.id && !f.readonly && !f.today && (isFilled(data[f.id]) || (f.other && data[f.id + "_altro"])));
      const link = sidebar.querySelector(`[data-nav="${s.id}"]`);
      link.classList.toggle("done", filled);
    });
    const name = [data.cognome, data.nome].filter(Boolean).join(" ");
    document.getElementById("patientLabel").textContent = name ? `Paziente: ${name}` : "Nuova visita";
  }

  function updateDerived() {
    const peso = parseFloat(form.querySelector("#peso").value);
    const h = parseFloat(form.querySelector("#altezza").value) / 100;
    form.querySelector("#bmi").value = peso > 0 && h > 0 ? (peso / (h * h)).toFixed(1) : "";
  }

  function newVisit(skipConfirm) {
    if (!skipConfirm && !confirm("Iniziare una nuova visita? I dati non salvati della visita corrente verranno cancellati (l'intestazione resta memorizzata).")) return;
    storageDel(DRAFT_KEY);
    fill(storageGet(SETTINGS_KEY) || {});
    updateProgress();
    window.scrollTo({ top: 0 });
    if (!skipConfirm) toast("Nuova visita avviata");
  }

  function fileBaseName(data) {
    const clean = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "");
    const parts = ["PrimaVisita", clean(data.cognome), clean(data.nome), data.data_visita || todayISO()].filter(Boolean);
    return parts.join("_");
  }

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = el("a", { href: url, download: filename });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function saveDraftFile() {
    const data = collect();
    const payload = { tipo: "prima-visita-psichiatrica", versione: 1, salvato: new Date().toISOString(), data };
    download(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), fileBaseName(data) + ".json");
    toast("Bozza salvata come file .json");
  }

  function loadDraftFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        const data = payload.data || payload;
        fill({ ...(storageGet(SETTINGS_KEY) || {}), ...data });
        persist();
        toast("Bozza caricata");
      } catch {
        alert("Il file selezionato non è una bozza valida.");
      }
    };
    reader.readAsText(file);
  }

  // ---------- referto ----------
  function openReport() {
    const data = collect();
    const missing = ALL_FIELDS.filter((f) => f.required && !data[f.id]).map((f) => f.label);
    if (missing.length && !confirm(`Campi obbligatori mancanti: ${missing.join(", ")}.\nGenerare comunque la bozza del referto?`)) return;
    preview.innerHTML = buildReport(data);
    dialog.showModal();
    dialog.querySelector(".report-scroll").scrollTop = 0;
  }

  function exportDocx() {
    const data = collect();
    const blob = htmlToDocx(preview, { title: "Referto prima visita psichiatrica", author: data.medico_nome || "" });
    download(blob, fileBaseName(data) + ".docx");
    toast("Documento Word generato");
  }

  function printPdf() {
    const frame = el("iframe", { class: "print-frame", title: "stampa" });
    document.body.append(frame);
    const doc = frame.contentDocument;
    const data = collect();
    doc.open();
    doc.write(`<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${fileBaseName(data)}</title>
      <style>${REPORT_CSS}\n@page{size:A4;margin:18mm 18mm 20mm}body{margin:0}</style></head>
      <body><article class="report-page">${preview.innerHTML}</article></body></html>`);
    doc.close();
    setTimeout(() => {
      frame.contentWindow.focus();
      frame.contentWindow.print();
      setTimeout(() => frame.remove(), 1000);
    }, 250);
  }

  // ---------- avvio ----------
  document.head.append(el("style", { text: REPORT_CSS }));
  render();

  const autosave = storageGet(AUTOSAVE_KEY);
  document.getElementById("autosaveToggle").checked = autosave === null ? true : !!autosave;
  document.getElementById("autosaveToggle").addEventListener("change", (e) => {
    storageSet(AUTOSAVE_KEY, e.target.checked);
    if (!e.target.checked) { storageDel(DRAFT_KEY); toast("Salvataggio automatico disattivato: bozza locale rimossa"); }
    else persist();
  });

  const draft = storageGet(DRAFT_KEY);
  if (draft && draft.data && autosaveOn()) {
    fill({ ...(storageGet(SETTINGS_KEY) || {}), ...draft.data });
    toast("Ripristinata la bozza in corso");
  } else {
    newVisit(true);
  }
  updateProgress();

  document.getElementById("btnNew").addEventListener("click", () => newVisit(false));
  document.getElementById("btnSave").addEventListener("click", saveDraftFile);
  document.getElementById("btnLoad").addEventListener("click", () => document.getElementById("fileLoad").click());
  document.getElementById("fileLoad").addEventListener("change", (e) => {
    if (e.target.files[0]) loadDraftFile(e.target.files[0]);
    e.target.value = "";
  });
  document.getElementById("btnReport").addEventListener("click", openReport);
  document.getElementById("btnRegen").addEventListener("click", () => {
    if (confirm("Rigenerare il referto dal form? Le modifiche manuali al testo andranno perse.")) preview.innerHTML = buildReport(collect());
  });
  document.getElementById("btnDocx").addEventListener("click", exportDocx);
  document.getElementById("btnPdf").addEventListener("click", printPdf);
  document.getElementById("btnClose").addEventListener("click", () => dialog.close());

  // evidenzia la sezione visibile nella barra laterale
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        sidebar.querySelectorAll("a").forEach((a) => a.classList.toggle("active", a.dataset.nav === en.target.dataset.section));
      }
    });
  }, { rootMargin: "-30% 0px -65% 0px" });
  form.querySelectorAll("section").forEach((s) => observer.observe(s));
})();
