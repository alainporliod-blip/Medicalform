/* Composizione della bozza di referto a partire dai dati del form. */

const REPORT_CSS = `
.report-page{font-family:Calibri,"Segoe UI",Arial,sans-serif;font-size:11pt;line-height:1.45;color:#111;background:#fff}
.report-page .r-head{text-align:center;border-bottom:1.5px solid #333;padding-bottom:6px;margin-bottom:14px}
.report-page .r-head p{margin:0;text-align:center}
.report-page .r-head .r-az{font-weight:bold;font-size:12pt;text-transform:uppercase}
.report-page .r-head .r-small{font-size:9pt;color:#444}
.report-page h1{font-size:14pt;text-align:center;margin:14px 0 4px;letter-spacing:.5px}
.report-page .r-sub{text-align:center;margin:0 0 12px;color:#333}
.report-page h2{font-size:11.5pt;margin:16px 0 4px;padding-bottom:2px;border-bottom:1px solid #bbb;text-transform:uppercase;color:#1f3b57;page-break-after:avoid}
.report-page p{margin:0 0 6px;text-align:justify}
.report-page ul{margin:0 0 6px;padding-left:20px}
.report-page table{border-collapse:collapse;width:100%;margin:4px 0 8px;font-size:10pt}
.report-page td,.report-page th{border:1px solid #999;padding:3px 6px;vertical-align:top;text-align:left}
.report-page th{background:#eef2f6}
.report-page .r-lab{font-weight:bold;background:#f5f7f9;width:18%}
.report-page .r-sign{margin-top:28px}
.report-page .r-sign p{text-align:right;margin:0}
.report-page .r-foot{margin-top:24px;font-size:8.5pt;color:#555;text-align:center}
`;

function buildReport(d) {
  const sex = d.sesso === "M" ? "M" : d.sesso === "F" ? "F" : "";
  const G = (s) =>
    String(s).replace(/\{([^/}]*)\/([^}]*)\}/g, (_, m, f) => (sex === "M" ? m : sex === "F" ? f : `${m}/${f}`));
  const paz = sex === "M" ? "il paziente" : sex === "F" ? "la paziente" : "il/la paziente";
  const Paz = cap(paz);

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  }
  function cap(s) {
    s = String(s || "");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function joinIt(arr) {
    arr = arr.filter(Boolean);
    if (arr.length <= 1) return arr.join("");
    return arr.slice(0, -1).join(", ") + " e " + arr[arr.length - 1];
  }
  function fmtDate(iso) {
    if (!iso) return "";
    const [y, m, g] = iso.split("-");
    return `${g}/${m}/${y}`;
  }
  function age(birth, ref) {
    if (!birth) return "";
    const b = new Date(birth), r = ref ? new Date(ref) : new Date();
    let a = r.getFullYear() - b.getFullYear();
    if (r.getMonth() < b.getMonth() || (r.getMonth() === b.getMonth() && r.getDate() < b.getDate())) a--;
    return a >= 0 ? a : "";
  }
  // valori di un campo checks + "altro", concordati e uniti
  function list(id) {
    const arr = (Array.isArray(d[id]) ? d[id] : d[id] ? [d[id]] : []).map(G);
    if (d[id + "_altro"]) arr.push(d[id + "_altro"]);
    return arr;
  }
  const val = (id) => joinIt(list(id));
  // testo libero -> paragrafi
  function para(text, label) {
    if (!text) return "";
    const blocks = String(text).split(/\n\s*\n/).map((b) => esc(b.trim()).replace(/\n/g, "<br>"));
    if (label) blocks[0] = `<b>${esc(label)}:</b> ${blocks[0]}`;
    return blocks.map((b) => `<p>${b}</p>`).join("");
  }
  const sentence = (s) => (s ? `${cap(s.trim()).replace(/[.;:,\s]+$/, "")}.` : "");
  const p = (...sentences) => {
    const t = sentences.filter(Boolean).join(" ");
    return t ? `<p>${t}</p>` : "";
  };
  const labeled = (label, text) => (text ? `<p><b>${esc(label)}:</b> ${esc(text)}</p>` : "");

  // ---------- sezioni ----------
  const sections = [];
  const add = (title, html) => { if (html && html.trim()) sections.push([title, html]); };

  // Accesso e fonti
  {
    const parts = [];
    if (d.modalita_accesso || d.modalita_accesso_altro) parts.push(sentence(`Visita ${esc(val("modalita_accesso"))}`));
    if (d.inviante) parts.push(sentence(`Inviante / quesito: ${esc(d.inviante)}`));
    if (list("accompagnato").length) parts.push(sentence(`${Paz} giunge ${esc(val("accompagnato"))}`));
    if (list("fonti").length) parts.push(sentence(`Fonti informative: ${esc(val("fonti"))}`));
    if (d.interprete === "presente") parts.push("Presente mediatore linguistico-culturale.");
    if (d.interprete === "necessario ma non disponibile") parts.push("Mediatore linguistico necessario ma non disponibile.");
    if (d.consenso) parts.push("Fornita l'informativa sul trattamento dei dati personali e acquisito il consenso.");
    add("Modalità di accesso e fonti", p(...parts));
  }

  // Motivo
  add("Motivo della consultazione", para(d.motivo_invio) + para(d.richiesta_paziente, "Richieste e aspettative"));

  // Storia attuale
  {
    let html = "";
    const onset = [];
    if (d.esordio) onset.push(`esordio ${esc(d.esordio)}`);
    if (d.modalita_esordio) onset.push(`con modalità ${esc(d.modalita_esordio)}`);
    if (d.decorso) onset.push(`decorso ${esc(d.decorso)}`);
    if (onset.length) html += p(sentence(`Sintomatologia attuale: ${onset.join(", ")}`));
    if (list("sintomi").length) html += p(sentence(`Aree sintomatologiche prevalenti: ${esc(val("sintomi"))}`));
    html += para(d.fattori_scatenanti, "Fattori precipitanti");
    html += para(d.storia_attuale);
    const funz = [];
    if (d.compromissione) funz.push(`compromissione del funzionamento ${esc(d.compromissione)}`);
    if (list("aree_compromesse").length) funz.push(`con interessamento delle aree: ${esc(val("aree_compromesse"))}`);
    if (d.vgf) funz.push(`VGF ${esc(d.vgf)}`);
    if (funz.length) html += p(sentence(funz.join(", ")));
    add("Storia della malattia attuale", html);
  }

  // Anamnesi psichiatrica
  {
    const s = [];
    if (d.precedenti_contatti === "nessuno (primo contatto)" && !d.precedenti_contatti_altro) s.push("Primo contatto con i servizi di salute mentale.");
    else if (d.precedenti_contatti || d.precedenti_contatti_altro) s.push(sentence(`Precedenti contatti: ${esc(val("precedenti_contatti"))}`));
    if (d.servizi_dettaglio) s.push(sentence(esc(d.servizi_dettaglio)));
    if (d.n_ricoveri !== "" && d.n_ricoveri != null) {
      const n = Number(d.n_ricoveri);
      let r = n === 0 ? "Nessun ricovero psichiatrico" : `Riferiti ${n} ricover${n === 1 ? "o" : "i"} psichiatric${n === 1 ? "o" : "i"}`;
      if (d.n_tso && Number(d.n_tso) > 0) r += ` (di cui ${esc(d.n_tso)} in regime di TSO)`;
      s.push(sentence(r));
    }
    if (d.ultimo_ricovero) s.push(sentence(`Ultimo ricovero: ${esc(d.ultimo_ricovero)}`));
    if (d.diagnosi_pregresse) s.push(sentence(`Diagnosi poste in precedenza: ${esc(d.diagnosi_pregresse)}`));
    let html = p(...s);
    html += para(d.terapie_pregresse, "Trattamenti farmacologici pregressi");
    html += labeled("Psicoterapie / interventi psicosociali", d.psicoterapie);
    const r = [];
    if (d.tentati_suicidi) r.push(d.tentati_suicidi === "no" ? "Nega pregressi tentativi di suicidio." : `Riferit${d.tentati_suicidi === "sì, uno" ? "o un" : "i più"} tentativ${d.tentati_suicidi === "sì, uno" ? "o" : "i"} di suicidio.`);
    if (d.autolesionismo) r.push(d.autolesionismo === "mai" ? "Nega condotte autolesive." : sentence(`Autolesionismo non suicidario ${esc(d.autolesionismo)}`));
    if (d.ts_dettaglio) r.push(sentence(esc(d.ts_dettaglio)));
    if (d.aggressivita) r.push(d.aggressivita === "mai" ? "Non riferite condotte eteroaggressive." : sentence(`Condotte eteroaggressive ${esc(d.aggressivita)}`));
    if (d.aderenza) r.push(sentence(`Aderenza ai trattamenti in passato: ${esc(d.aderenza)}`));
    html += p(...r);
    add("Anamnesi psichiatrica", html);
  }

  // Sostanze
  {
    const f = SCHEMA.flatMap((s) => s.fields).find((x) => x.id === "sost");
    const m = d.sost || {};
    const used = f.rows.filter(([id]) => m[id] && m[id] !== "mai").map(([id, label]) => `${label.toLowerCase()}: ${m[id]}`);
    const never = f.rows.filter(([id]) => m[id] === "mai").map(([, label]) => label.toLowerCase());
    let html = "";
    if (used.length) html += `<ul>${used.map((u) => `<li>${esc(cap(u))}</li>`).join("")}</ul>`;
    if (never.length) html += p(sentence(`Nega uso di: ${esc(joinIt(never))}`));
    const extra = [];
    if (d.sigarette_die) extra.push(`${esc(d.sigarette_die)} sigarette/die`);
    if (d.audit_c !== "" && d.audit_c != null) extra.push(`AUDIT-C: ${esc(d.audit_c)}/12`);
    if (extra.length) html += p(sentence(extra.join("; ")));
    html += para(d.sostanze_note);
    add("Uso di sostanze e dipendenze comportamentali", html);
  }

  // Anamnesi medica
  {
    let html = "";
    if (list("patologie").length) html += p(sentence(`Patologie riferite: ${esc(val("patologie"))}`));
    html += para(d.anamnesi_medica);
    html += labeled("Allergie", d.allergie);
    html += para(d.terapia_in_corso, "Terapia in corso");
    if (d.gravidanza && d.gravidanza !== "non pertinente") html += labeled("Gravidanza / allattamento", d.gravidanza);
    const par = [];
    if (d.peso) par.push(`peso ${esc(d.peso)} kg`);
    if (d.altezza) par.push(`altezza ${esc(d.altezza)} cm`);
    if (d.bmi) par.push(`BMI ${esc(d.bmi)} kg/m²`);
    if (d.circ_vita) par.push(`circonferenza vita ${esc(d.circ_vita)} cm`);
    if (d.pa) par.push(`PA ${esc(d.pa)} mmHg`);
    if (d.fc) par.push(`FC ${esc(d.fc)} bpm`);
    if (d.ecg) par.push(`ECG: ${esc(d.ecg)}`);
    if (par.length) html += `<p><b>Parametri:</b> ${par.join(", ")}.</p>`;
    add("Anamnesi medica", html);
  }

  // Familiare
  {
    const fam = list("familiarita");
    let html = "";
    if (fam.length === 1 && fam[0] === "nessuna familiarità psichiatrica nota") html += p("Nessuna familiarità psichiatrica nota.");
    else if (fam.length) html += p(sentence(`Familiarità per: ${esc(joinIt(fam.filter((x) => x !== "nessuna familiarità psichiatrica nota")))}`));
    html += para(d.familiare_note);
    add("Anamnesi familiare", html);
  }

  // Personale e sociale
  {
    let html = "";
    const info = [];
    if (d.data_nascita) info.push(`${cap(paz)} ha ${age(d.data_nascita, d.data_visita)} anni`);
    if (d.stato_civile) info.push(G(d.stato_civile));
    if (d.scolarita) info.push(`scolarità: ${d.scolarita}`);
    if (d.occupazione) info.push(G(d.occupazione) + (d.professione ? ` (${d.professione})` : ""));
    else if (d.professione) info.push(d.professione);
    if (info.length) html += p(sentence(esc(info.join(", "))));
    if (list("convivenza").length) html += p(sentence(`Convivenza: ${esc(val("convivenza"))}`));
    html += para(d.sviluppo);
    const ev = list("eventi_avversi");
    if (ev.length === 1 && ev[0] === "nessuna riferita") html += p("Non riferite esperienze avverse o traumatiche significative.");
    else if (ev.length) html += p(sentence(`Esperienze avverse riferite: ${esc(joinIt(ev.filter((x) => x !== "nessuna riferita")))}`));
    const soc = [];
    if (d.abitazione) soc.push(`situazione abitativa: ${d.abitazione}`);
    if (d.reddito) soc.push(`fonte di reddito: ${d.reddito}`);
    if (d.rete_sociale) soc.push(`rete sociale ${d.rete_sociale}`);
    if (d.invalidita && d.invalidita !== "no") soc.push(`invalidità civile ${d.invalidita}`);
    if (d.ads && d.ads !== "no") soc.push(`amministratore di sostegno ${d.ads}`);
    if (d.persone_carico === "sì") soc.push("presenza di minori o persone fragili a carico");
    if (d.legali && d.legali !== "nessuno") soc.push(`problemi legali ${d.legali}`);
    if (soc.length) html += p(sentence(esc(soc.join("; "))));
    if (list("armi_patente").length) html += p(sentence(`Riferisce: ${esc(val("armi_patente"))}`));
    html += para(d.sociale_note);
    add("Anamnesi personale e sociale", html);
  }

  // Esame psichico
  {
    const frags = [];
    const plain = (id) => { const v = val(id); if (v) frags.push(v); };
    const pref = (id, prefix) => { const v = val(id); if (v) frags.push(`${prefix} ${v}`); };
    plain("mse_coscienza");
    plain("mse_orientamento");
    pref("mse_aspetto", "aspetto");
    pref("mse_contatto", "contatto");
    pref("mse_psicomotricita", "psicomotricità");
    pref("mse_attenzione", "attenzione");
    pref("mse_memoria", "memoria");
    pref("mse_linguaggio", "eloquio");
    pref("mse_umore", "umore");
    pref("mse_affettivita", "affettività");
    if (d.mse_ansia) frags.push(d.mse_ansia === "assente" ? "non evidenti manifestazioni ansiose" : `ansia ${d.mse_ansia}`);
    pref("mse_forma", "pensiero formalmente");
    pref("mse_contenuto", "contenuti del pensiero:");
    pref("mse_percezione", "percezione:");
    pref("mse_sonno", "sonno");
    pref("mse_appetito", "appetito");
    if (d.mse_peso_var) frags.push(`variazioni ponderali: ${d.mse_peso_var}`);
    pref("mse_volizione", "volizione");
    if (d.mse_libido && d.mse_libido !== "non indagata") frags.push(`libido ${d.mse_libido}`);
    pref("mse_insight", "consapevolezza di malattia");
    pref("mse_giudizio", "capacità critica e di giudizio");
    let html = frags.length ? `<p>${esc(cap(frags.join(", ")))}.</p>` : "";
    html += para(d.mse_note);
    add("Esame psichico", html);
  }

  // Rischio
  {
    const s = [];
    if (d.ideazione_suicidaria) s.push(d.ideazione_suicidaria === "assente" ? "Ideazione suicidaria attualmente assente." : sentence(`Ideazione suicidaria: ${d.ideazione_suicidaria}`));
    if (d.comportamento_recente) s.push(d.comportamento_recente === "nessuno" ? "Non riferiti comportamenti suicidari o autolesivi recenti." : sentence(`Comportamento suicidario/autolesivo ${d.comportamento_recente}`));
    if (d.cssrs) s.push(sentence(`C-SSRS: ${d.cssrs}`));
    let html = p(...s.map(esc));
    if (list("fattori_rischio").length) html += p(sentence(`Fattori di rischio: ${esc(val("fattori_rischio"))}`));
    if (list("fattori_protettivi").length) html += p(sentence(`Fattori protettivi: ${esc(val("fattori_protettivi"))}`));
    const o = [];
    if (d.rischio_etero) o.push(`rischio eteroaggressivo ${d.rischio_etero}`);
    if (d.rischio_autotrascuratezza) o.push(`rischio di autotrascuratezza/vulnerabilità ${d.rischio_autotrascuratezza}`);
    if (o.length) html += p(sentence(esc(o.join("; "))));
    if (d.rischio_complessivo) html += `<p><b>Giudizio clinico complessivo del rischio: ${esc(d.rischio_complessivo)}.</b></p>`;
    html += para(d.rischio_note);
    add("Valutazione del rischio", html);
  }

  // Scale
  if (d.scale_tab && d.scale_tab.length) {
    add("Valutazioni psicometriche",
      `<table><thead><tr><th>Scala</th><th>Punteggio</th><th>Interpretazione</th></tr></thead><tbody>${d.scale_tab
        .map((r) => `<tr><td>${esc(r.scala)}</td><td>${esc(r.punteggio)}</td><td>${esc(r.interpretazione)}</td></tr>`)
        .join("")}</tbody></table>`);
  }

  // Diagnosi
  {
    let html = "";
    const four = [
      ["Fattori predisponenti", d.f_predisponenti], ["Fattori precipitanti", d.f_precipitanti],
      ["Fattori di mantenimento", d.f_perpetuanti], ["Fattori protettivi / risorse", d.f_protettivi],
    ].filter(([, v]) => v);
    if (four.length) {
      html += `<table><tbody>${four.map(([l, v]) => `<tr><td class="r-lab">${l}</td><td>${esc(v).replace(/\n/g, "<br>")}</td></tr>`).join("")}</tbody></table>`;
    }
    html += para(d.formulazione);
    const dx = d.diagnosi_tab || [];
    if (dx.length) {
      html += `<p><b>Diagnosi${d.sistema_class ? ` (${esc(d.sistema_class)})` : ""}:</b></p>`;
      html += `<table><thead><tr><th>Tipo</th><th>Codice</th><th>Descrizione</th></tr></thead><tbody>${dx
        .map((r) => `<tr><td>${esc(cap(r.tipo))}</td><td>${esc(r.codice)}</td><td>${esc(r.descrizione)}</td></tr>`)
        .join("")}</tbody></table>`;
    }
    add("Inquadramento diagnostico", html);
  }

  // Accertamenti
  add("Accertamenti", (list("esami").length ? p(sentence(`Si richiedono: ${esc(val("esami"))}`)) : "") + para(d.esami_disponibili, "Accertamenti disponibili"));

  // Piano
  {
    let html = "";
    if (d.setting || d.setting_altro) html += p(sentence(`Esito della visita: ${esc(val("setting"))}`));
    if (d.invio_altro) html += p(sentence(`Invio / collaborazione con: ${esc(d.invio_altro)}`));
    const tx = d.terapia_tab || [];
    if (tx.length) {
      html += "<p><b>Terapia farmacologica:</b></p>";
      html += `<table><thead><tr><th>Farmaco</th><th>Dose</th><th>Posologia</th><th>Indicazione</th></tr></thead><tbody>${tx
        .map((r) => `<tr><td>${esc(r.farmaco)}</td><td>${esc(r.dose)}</td><td>${esc(r.posologia)}</td><td>${esc(r.azione)}</td></tr>`)
        .join("")}</tbody></table>`;
    }
    if (list("interventi").length) html += p(sentence(`Interventi programmati: ${esc(val("interventi"))}`));
    const cond = list("condivisione");
    if (cond.length) html += `<ul>${cond.map((c) => `<li>${esc(cap(c))}</li>`).join("")}</ul>`;
    html += para(d.piano_note);
    if (d.prossimo_controllo) html += `<p><b>Prossimo controllo:</b> ${fmtDate(d.prossimo_controllo)}${d.controllo_note ? ` – ${esc(d.controllo_note)}` : ""}</p>`;
    else if (d.controllo_note) html += labeled("Prossimo controllo", d.controllo_note);
    add("Piano di trattamento", html);
  }

  add("Conclusioni", para(d.conclusioni) + labeled("Certificazioni rilasciate", d.certificazioni));

  // ---------- assemblaggio ----------
  const head = [
    d.str_azienda && `<p class="r-az">${esc(d.str_azienda)}</p>`,
    d.str_dipartimento && `<p>${esc(d.str_dipartimento)}</p>`,
    d.str_servizio && `<p><b>${esc(d.str_servizio)}</b></p>`,
    d.str_indirizzo && `<p class="r-small">${esc(d.str_indirizzo)}</p>`,
  ].filter(Boolean).join("");

  const sub = [
    d.data_visita && `Data: ${fmtDate(d.data_visita)}${d.ora_visita ? ` ore ${esc(d.ora_visita)}` : ""}`,
    d.sede_visita && `Sede: ${esc(d.sede_visita)}`,
  ].filter(Boolean).join(" – ");

  const nascita = [fmtDate(d.data_nascita), d.luogo_nascita && esc(d.luogo_nascita)].filter(Boolean).join(", ");
  const eta = age(d.data_nascita, d.data_visita);
  const anag = [
    ["Paziente", esc([d.cognome, d.nome].filter(Boolean).join(" ").toUpperCase()), "Sesso", esc(d.sesso)],
    [G("Nat{o/a} il"), nascita + (eta !== "" ? ` (${eta} anni)` : ""), "Codice fiscale", esc(d.codice_fiscale)],
    ["Residenza", esc(d.residenza), "Telefono", esc(d.telefono)],
    ["MMG", esc(d.mmg), "Nazionalità", esc(d.nazionalita)],
  ];
  const anagHtml = `<table class="r-anag"><tbody>${anag
    .map((r) => `<tr><td class="r-lab">${r[0]}</td><td>${r[1] || ""}</td><td class="r-lab">${r[2]}</td><td>${r[3] || ""}</td></tr>`)
    .join("")}</tbody></table>`;

  const body = sections.map(([t, h], i) => `<h2>${i + 1}. ${esc(t)}</h2>${h}`).join("");

  const sign = `<div class="r-sign">
    <p>${esc(d.luogo_firma ? d.luogo_firma + ", " : "")}${fmtDate(d.data_visita)}</p>
    <p>Il Medico</p>
    <p><b>${esc(d.medico_nome || "")}</b></p>
    ${d.medico_qualifica ? `<p>${esc(d.medico_qualifica)}</p>` : ""}
    <p>&nbsp;</p>
    <p>Firma ______________________________</p>
  </div>`;

  return `${head ? `<div class="r-head">${head}</div>` : ""}
    <h1>REFERTO DI PRIMA VISITA PSICHIATRICA</h1>
    ${sub ? `<p class="r-sub">${sub}</p>` : ""}
    ${anagHtml}
    ${body}
    ${sign}
    <p class="r-foot">Documento contenente dati personali relativi alla salute, trattati ai sensi del Reg. UE 2016/679 (GDPR) e del D.Lgs. 196/2003 e s.m.i.</p>`;
}
