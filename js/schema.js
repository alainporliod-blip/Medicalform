/*
 * Struttura del form di prima visita psichiatrica.
 *
 * L'articolazione dell'intervista segue le principali raccomandazioni
 * sulla valutazione psichiatrica dell'adulto:
 *  - APA, Practice Guideline for the Psychiatric Evaluation of Adults, 3rd ed. (2016)
 *  - NICE NG225, Self-harm: assessment, management and preventing recurrence (2022)
 *  - NICE CG136 / QS14, Service user experience in adult mental health
 *  - Royal College of Psychiatrists, Good Psychiatric Practice (CR154)
 *  - SIP – Società Italiana di Psichiatria / documenti di consenso sulla
 *    valutazione clinica, il rischio suicidario e il monitoraggio metabolico
 *
 * Notazione: "{o/a}" viene reso come "o/a" nel form e concordato col sesso
 * del paziente nel referto (es. "orientat{o/a}" -> "orientato" / "orientata").
 *
 * Tipi di campo: text, textarea, date, time, number, select, radio, checks,
 * check, matrix, table, info.
 * Larghezza (w): full | half | third | quarter (default: half; full per
 * textarea/checks/radio/matrix/table).
 */

const SCHEMA = [
  {
    id: "struttura",
    title: "Intestazione e medico",
    icon: "🏥",
    persistent: true,
    intro: "Dati memorizzati in questo browser e riproposti in ogni nuova visita.",
    fields: [
      { id: "str_azienda", label: "Azienda sanitaria", type: "text", placeholder: "es. ASL TO3" },
      { id: "str_dipartimento", label: "Dipartimento", type: "text", placeholder: "es. Dipartimento di Salute Mentale" },
      { id: "str_servizio", label: "Servizio / Struttura", type: "text", placeholder: "es. SC Psichiatria – CSM di ..." },
      { id: "str_indirizzo", label: "Indirizzo e recapiti", type: "text", placeholder: "Via ..., Città – Tel. ..." },
      { id: "medico_nome", label: "Medico (nome e cognome)", type: "text", placeholder: "Dott. ..." },
      { id: "medico_qualifica", label: "Qualifica", type: "text", placeholder: "Dirigente Medico – Specialista in Psichiatria" },
    ],
  },

  {
    id: "anagrafica",
    title: "Dati anagrafici e contesto",
    icon: "👤",
    fields: [
      { id: "cognome", label: "Cognome", type: "text", required: true, w: "third" },
      { id: "nome", label: "Nome", type: "text", required: true, w: "third" },
      { id: "sesso", label: "Sesso", type: "radio", options: ["M", "F", "Altro / non specificato"], w: "third" },
      { id: "data_nascita", label: "Data di nascita", type: "date", w: "quarter" },
      { id: "luogo_nascita", label: "Luogo di nascita", type: "text", w: "quarter" },
      { id: "codice_fiscale", label: "Codice fiscale", type: "text", w: "quarter", upper: true },
      { id: "telefono", label: "Recapito telefonico", type: "text", w: "quarter" },
      { id: "residenza", label: "Residenza / domicilio", type: "text" },
      { id: "mmg", label: "Medico di Medicina Generale", type: "text" },
      { id: "nazionalita", label: "Nazionalità / lingua", type: "text", w: "third" },
      {
        id: "stato_civile", label: "Stato civile", type: "select", w: "third",
        options: ["celibe/nubile", "coniugat{o/a}", "convivente", "separat{o/a}", "divorziat{o/a}", "vedov{o/a}", "unione civile"],
      },
      {
        id: "scolarita", label: "Scolarità", type: "select", w: "third",
        options: ["nessun titolo", "licenza elementare", "licenza media", "qualifica professionale", "diploma di scuola superiore", "laurea", "titolo post-laurea"],
      },
      {
        id: "occupazione", label: "Condizione lavorativa", type: "select", w: "third",
        options: ["occupat{o/a} a tempo pieno", "occupat{o/a} part-time", "lavoro precario / saltuario", "disoccupat{o/a}", "student{e/essa}", "casaling{o/a}", "pensionat{o/a}", "invalidità / pensione di invalidità", "in malattia / lungodegenza"],
      },
      { id: "professione", label: "Professione", type: "text", w: "third" },
      {
        id: "convivenza", label: "Convive con", type: "checks", w: "third",
        options: ["vive sol{o/a}", "partner", "figli", "genitori", "fratelli/sorelle", "altri familiari", "coinquilini", "struttura residenziale"],
        other: true,
      },

      { type: "subtitle", label: "Contesto della visita" },
      { id: "data_visita", label: "Data visita", type: "date", required: true, w: "quarter", today: true },
      { id: "ora_visita", label: "Ora", type: "time", w: "quarter" },
      {
        id: "sede_visita", label: "Sede", type: "select", w: "half",
        options: ["ambulatorio CSM", "domicilio", "Pronto Soccorso / DEA", "reparto ospedaliero (consulenza)", "SPDC", "struttura residenziale", "istituto penitenziario", "televisita"],
      },
      {
        id: "modalita_accesso", label: "Modalità di accesso", type: "radio",
        options: ["programmata su invio del MMG", "accesso diretto", "invio da altro specialista", "invio da altro servizio", "urgente / differibile", "consulenza in PS", "su richiesta dell'Autorità Giudiziaria"],
        other: true,
      },
      { id: "inviante", label: "Inviante / quesito clinico", type: "text", placeholder: "es. Dr. Rossi (MMG) – quesito: deflessione del tono dell'umore" },
      {
        id: "accompagnato", label: "Accompagnamento", type: "checks",
        options: ["da sol{o/a}", "accompagnat{o/a} dal partner", "accompagnat{o/a} da familiari", "accompagnat{o/a} da operatori", "accompagnat{o/a} dalle Forze dell'Ordine"],
        other: true,
      },
      {
        id: "fonti", label: "Fonti informative", type: "checks",
        options: ["paziente", "familiari / caregiver", "documentazione clinica", "MMG", "altri servizi", "Fascicolo Sanitario Elettronico"],
        other: true,
      },
      { id: "interprete", label: "Mediatore / interprete", type: "radio", options: ["non necessario", "presente", "necessario ma non disponibile"], w: "half" },
      { id: "consenso", label: "Informativa privacy e consenso al trattamento dei dati acquisiti", type: "check", w: "half" },
    ],
  },

  {
    id: "motivo",
    title: "Motivo della consultazione",
    icon: "💬",
    fields: [
      { id: "motivo_invio", label: "Motivo dell'invio / problema presentato", type: "textarea", rows: 4, placeholder: "Problema riferito, con le parole del paziente quando utile; quesito dell'inviante." },
      { id: "richiesta_paziente", label: "Richieste e aspettative del paziente", type: "textarea", rows: 3 },
    ],
  },

  {
    id: "storia",
    title: "Storia della malattia attuale",
    icon: "📈",
    fields: [
      {
        id: "esordio", label: "Esordio dei sintomi attuali", type: "select", w: "third",
        options: ["meno di 1 mese fa", "1–6 mesi fa", "6–12 mesi fa", "1–2 anni fa", "oltre 2 anni fa"],
      },
      { id: "modalita_esordio", label: "Modalità di esordio", type: "select", w: "third", options: ["acuta", "subacuta", "insidiosa"] },
      { id: "decorso", label: "Decorso", type: "select", w: "third", options: ["episodico", "continuo", "fluttuante", "ingravescente", "in miglioramento"] },
      {
        id: "sintomi", label: "Aree sintomatologiche prevalenti", type: "checks",
        options: [
          "deflessione del tono dell'umore", "anedonia", "elevazione del tono dell'umore / irritabilità", "ansia generalizzata",
          "attacchi di panico", "evitamento fobico", "ossessioni / compulsioni", "sintomi post-traumatici", "sintomi dissociativi",
          "sintomi psicotici positivi", "sintomi negativi", "alterazioni del sonno", "alterazioni del comportamento alimentare",
          "sintomi cognitivi", "somatizzazioni", "instabilità affettiva / disregolazione emotiva", "discontrollo degli impulsi",
          "condotte autolesive", "uso di sostanze", "difficoltà relazionali",
        ],
        other: true,
      },
      { id: "fattori_scatenanti", label: "Eventi / fattori precipitanti", type: "textarea", rows: 2 },
      { id: "storia_attuale", label: "Narrazione della storia attuale", type: "textarea", rows: 7, placeholder: "Sviluppo cronologico dei sintomi, gravità, impatto, trattamenti già tentati, risposta e aderenza." },
      { id: "compromissione", label: "Compromissione del funzionamento", type: "radio", options: ["assente", "lieve", "moderata", "grave"], w: "half" },
      { id: "vgf", label: "VGF / GAF (1–100)", type: "number", min: 1, max: 100, w: "quarter" },
      {
        id: "aree_compromesse", label: "Aree di funzionamento compromesse", type: "checks",
        options: ["lavoro / studio", "relazioni familiari", "relazioni sociali", "cura di sé", "gestione domestica / economica"],
      },
    ],
  },

  {
    id: "psichiatrica",
    title: "Anamnesi psichiatrica",
    icon: "📋",
    fields: [
      {
        id: "precedenti_contatti", label: "Precedenti contatti con i servizi", type: "radio",
        options: ["nessuno (primo contatto)", "CSM / DSM", "psichiatra privato", "SerD", "NPI in età evolutiva", "psicologo / psicoterapeuta"],
        other: true,
      },
      { id: "servizi_dettaglio", label: "Dettagli precedenti contatti", type: "text" },
      { id: "n_ricoveri", label: "Ricoveri psichiatrici (n.)", type: "number", min: 0, w: "quarter" },
      { id: "n_tso", label: "di cui TSO (n.)", type: "number", min: 0, w: "quarter" },
      { id: "ultimo_ricovero", label: "Ultimo ricovero (quando, dove, motivo)", type: "text", w: "half" },
      { id: "diagnosi_pregresse", label: "Diagnosi poste in precedenza", type: "text" },
      { id: "terapie_pregresse", label: "Trattamenti farmacologici pregressi", type: "textarea", rows: 3, placeholder: "Farmaco, dose massima, durata, risposta, effetti collaterali, motivo della sospensione." },
      { id: "psicoterapie", label: "Psicoterapie / interventi psicosociali pregressi", type: "text" },
      { id: "tentati_suicidi", label: "Tentativi di suicidio pregressi", type: "radio", options: ["no", "sì, uno", "sì, più di uno"], w: "half" },
      { id: "autolesionismo", label: "Autolesionismo non suicidario", type: "radio", options: ["mai", "pregresso", "attuale"], w: "half" },
      { id: "ts_dettaglio", label: "Dettagli (data, modalità, letalità, contesto)", type: "text" },
      { id: "aggressivita", label: "Condotte eteroaggressive", type: "radio", options: ["mai", "pregresse", "recenti"], w: "half" },
      { id: "aderenza", label: "Aderenza ai trattamenti in passato", type: "radio", options: ["buona", "parziale", "scarsa", "non valutabile"], w: "half" },
    ],
  },

  {
    id: "sostanze",
    title: "Uso di sostanze e dipendenze",
    icon: "🍷",
    fields: [
      {
        id: "sost", label: "Pattern di uso", type: "matrix",
        rows: [
          ["alcol", "Alcol"], ["tabacco", "Tabacco / nicotina"], ["cannabis", "Cannabinoidi"], ["cocaina", "Cocaina"],
          ["oppiacei", "Oppiacei"], ["stimolanti", "Amfetamine / stimolanti / MDMA"], ["allucinogeni", "Allucinogeni / NPS"],
          ["bzd", "Benzodiazepine / sedativi non prescritti"], ["gioco", "Gioco d'azzardo"], ["internet", "Internet / videogiochi"],
        ],
        options: ["mai", "pregresso", "occasionale", "a rischio / problematico", "dipendenza"],
      },
      { id: "sigarette_die", label: "Sigarette / die", type: "number", min: 0, w: "quarter" },
      { id: "audit_c", label: "AUDIT-C (0–12)", type: "number", min: 0, max: 12, w: "quarter" },
      { id: "sostanze_note", label: "Dettagli (quantità, via, ultimo uso, astinenze, trattamenti SerD)", type: "textarea", rows: 3 },
    ],
  },

  {
    id: "medica",
    title: "Anamnesi medica",
    icon: "🩺",
    fields: [
      {
        id: "patologie", label: "Patologie in atto o pregresse", type: "checks",
        options: [
          "ipertensione arteriosa", "diabete mellito", "dislipidemia", "obesità", "cardiopatia", "aritmie / QT lungo",
          "tireopatia", "epilessia", "trauma cranico", "malattia neurologica", "patologia epatica", "insufficienza renale",
          "BPCO / asma", "infezione da HIV / epatiti", "neoplasia", "dolore cronico", "disturbi del sonno (OSAS)",
        ],
        other: true,
      },
      { id: "anamnesi_medica", label: "Note anamnestiche mediche e chirurgiche", type: "textarea", rows: 3 },
      { id: "allergie", label: "Allergie / intolleranze farmacologiche", type: "text" },
      { id: "terapia_in_corso", label: "Terapia farmacologica in corso (psichiatrica e non)", type: "textarea", rows: 3 },
      { id: "gravidanza", label: "Gravidanza / allattamento", type: "radio", options: ["non pertinente", "esclusa", "gravidanza in corso", "allattamento", "pianificazione di gravidanza"] },
      { type: "subtitle", label: "Parametri (monitoraggio metabolico)" },
      { id: "peso", label: "Peso (kg)", type: "number", min: 0, step: "0.1", w: "quarter" },
      { id: "altezza", label: "Altezza (cm)", type: "number", min: 0, w: "quarter" },
      { id: "bmi", label: "BMI (calcolato)", type: "text", readonly: true, w: "quarter" },
      { id: "circ_vita", label: "Circonferenza vita (cm)", type: "number", min: 0, w: "quarter" },
      { id: "pa", label: "PA (mmHg)", type: "text", placeholder: "120/80", w: "quarter" },
      { id: "fc", label: "FC (bpm)", type: "number", min: 0, w: "quarter" },
      { id: "ecg", label: "ECG / QTc", type: "text", w: "half" },
    ],
  },

  {
    id: "familiare",
    title: "Anamnesi familiare",
    icon: "👪",
    fields: [
      {
        id: "familiarita", label: "Familiarità per", type: "checks",
        options: [
          "nessuna familiarità psichiatrica nota", "disturbi depressivi", "disturbo bipolare", "disturbi psicotici",
          "disturbi d'ansia", "suicidio / tentato suicidio", "dipendenze", "disturbi di personalità",
          "demenza", "disabilità intellettiva / disturbi del neurosviluppo", "epilessia",
        ],
        other: true,
      },
      { id: "familiare_note", label: "Dettagli (grado di parentela, trattamenti, risposta ai farmaci)", type: "textarea", rows: 3 },
    ],
  },

  {
    id: "personale",
    title: "Anamnesi personale e sociale",
    icon: "🏠",
    fields: [
      { id: "sviluppo", label: "Storia personale (gravidanza e parto, sviluppo, infanzia, scolarità, lavoro, relazioni affettive)", type: "textarea", rows: 5 },
      {
        id: "eventi_avversi", label: "Esperienze avverse / traumatiche", type: "checks",
        options: ["nessuna riferita", "abuso fisico", "abuso sessuale", "abuso emotivo", "trascuratezza", "violenza assistita", "lutti precoci", "bullismo", "violenza nella relazione attuale", "migrazione traumatica", "eventi bellici / catastrofi"],
        other: true,
      },
      {
        id: "abitazione", label: "Situazione abitativa", type: "select", w: "third",
        options: ["abitazione propria / in affitto", "presso famiglia di origine", "struttura residenziale / gruppo appartamento", "ospite presso terzi", "senza fissa dimora", "istituto penitenziario"],
      },
      {
        id: "reddito", label: "Fonte di reddito", type: "select", w: "third",
        options: ["lavoro", "pensione", "pensione / assegno di invalidità", "sostegno familiare", "sussidi / reddito di inclusione", "nessun reddito"],
      },
      { id: "rete_sociale", label: "Rete sociale e familiare", type: "select", w: "third", options: ["adeguata", "limitata", "conflittuale", "assente"] },
      { id: "invalidita", label: "Invalidità civile / L.104", type: "radio", options: ["no", "in corso di accertamento", "riconosciuta"], w: "half" },
      { id: "ads", label: "Amministratore di sostegno / tutela", type: "radio", options: ["no", "richiesto", "nominato"], w: "half" },
      { id: "persone_carico", label: "Minori o persone fragili a carico", type: "radio", options: ["no", "sì"], w: "half" },
      { id: "legali", label: "Problemi legali", type: "radio", options: ["nessuno", "pregressi", "in corso"], w: "half" },
      { id: "armi_patente", label: "Patente / porto d'armi / accesso ad armi", type: "checks", options: ["patente di guida", "porto d'armi", "detenzione di armi in casa", "lavoro con accesso ad armi o mezzi letali"] },
      { id: "sociale_note", label: "Note sociali, interessi, risorse personali", type: "textarea", rows: 3 },
    ],
  },

  {
    id: "esame",
    title: "Esame psichico",
    icon: "🧠",
    fields: [
      { id: "mse_aspetto", label: "Aspetto", type: "checks", report: "Aspetto", options: ["curato", "adeguato al contesto", "trascurato", "bizzarro", "eccentrico", "sovrappes{o/a}", "sottopes{o/a}"], other: true },
      { id: "mse_contatto", label: "Contatto e comportamento", type: "checks", report: "Contatto", options: ["collaborante", "adeguato", "cordiale", "diffidente", "reticente", "oppositivo", "ostile", "disinibito", "manierato", "seduttivo", "teatrale", "distaccato"], other: true },
      { id: "mse_coscienza", label: "Coscienza", type: "radio", options: ["vigile", "sopor{oso/osa}", "obnubilat{o/a}", "stato confusionale"], w: "half" },
      { id: "mse_orientamento", label: "Orientamento", type: "radio", options: ["orientat{o/a} nei tre parametri", "parzialmente disorientat{o/a} nel tempo", "disorientat{o/a} nel tempo e nello spazio", "disorientat{o/a} anche sulla persona"], w: "half" },
      { id: "mse_psicomotricita", label: "Psicomotricità", type: "radio", report: "Psicomotricità", options: ["nella norma", "rallentata", "agitata", "irrequieta", "manierismi / stereotipie", "segni catatonici"] },
      { id: "mse_attenzione", label: "Attenzione e concentrazione", type: "radio", report: "Attenzione", options: ["conservata", "lievemente ridotta", "marcatamente ridotta", "ipervigilante", "distraibile"], w: "half" },
      { id: "mse_memoria", label: "Memoria (valutazione clinica)", type: "radio", report: "Memoria", options: ["grossolanamente integra", "deficit della memoria recente", "deficit della memoria remota", "deficit globale"], w: "half" },
      { id: "mse_linguaggio", label: "Linguaggio / eloquio", type: "checks", report: "Eloquio", options: ["fluido", "spontaneo", "povero", "rallentato", "accelerato", "logorroico", "con pressione", "a basso tono", "neologismi"], other: true },
      { id: "mse_umore", label: "Umore", type: "checks", report: "Umore", options: ["eutimico", "deflesso", "ansioso", "disforico", "irritabile", "euforico / espanso", "labile", "apatico"], other: true },
      { id: "mse_affettivita", label: "Affettività", type: "checks", report: "Affettività", options: ["congrua", "modulata", "incongrua", "appiattita", "coartata", "labile", "ipermodulata"], other: true },
      { id: "mse_ansia", label: "Ansia", type: "radio", report: "Ansia", options: ["assente", "lieve", "moderata", "marcata", "con manifestazioni somatiche"] },
      { id: "mse_forma", label: "Forma del pensiero", type: "checks", report: "Pensiero formalmente", options: ["coerente e organizzato", "rallentato", "accelerato", "circostanziale", "tangenziale", "fuga delle idee", "deragliamento / allentamento dei nessi", "incoerente", "blocchi del pensiero", "povero"], other: true },
      {
        id: "mse_contenuto", label: "Contenuto del pensiero", type: "checks", report: "Contenuti",
        options: [
          "non alterati", "temi depressivi", "colpa / rovina", "inadeguatezza / autosvalutazione", "preoccupazioni ansiose", "ideazione prevalente",
          "ossessioni", "preoccupazioni ipocondriache", "deliri persecutori", "deliri di riferimento", "deliri di grandezza",
          "deliri di colpa / rovina", "deliri somatici", "deliri di gelosia", "deliri erotomanici", "deliri mistico-religiosi",
          "fenomeni di influenzamento / controllo", "furto / inserzione / diffusione del pensiero",
        ],
        other: true,
      },
      { id: "mse_percezione", label: "Percezione", type: "checks", report: "Percezione", options: ["assenza di alterazioni dispercettive", "allucinazioni uditive", "voci commentanti / dialoganti", "allucinazioni imperative", "allucinazioni visive", "allucinazioni olfattive / gustative", "allucinazioni cenestesiche", "illusioni", "depersonalizzazione / derealizzazione"], other: true },
      { id: "mse_sonno", label: "Sonno", type: "checks", report: "Sonno", options: ["regolare", "insonnia iniziale", "risvegli notturni", "risveglio precoce", "ipersonnia", "ridotto bisogno di sonno", "inversione del ritmo sonno-veglia"], other: true },
      { id: "mse_appetito", label: "Appetito", type: "radio", report: "Appetito", options: ["conservato", "ridotto", "aumentato", "condotte di restrizione / abbuffata / compensatorie"], w: "half" },
      { id: "mse_peso_var", label: "Variazioni ponderali recenti", type: "text", w: "half" },
      { id: "mse_volizione", label: "Volizione / iniziativa", type: "radio", report: "Volizione", options: ["conservata", "ridotta", "abulia", "aumentata"], w: "half" },
      { id: "mse_libido", label: "Libido", type: "radio", report: "Libido", options: ["conservata", "ridotta", "aumentata", "non indagata"], w: "half" },
      { id: "mse_insight", label: "Consapevolezza di malattia (insight)", type: "radio", report: "Consapevolezza di malattia", options: ["presente", "parziale", "assente"], w: "half" },
      { id: "mse_giudizio", label: "Capacità critica e di giudizio", type: "radio", report: "Critica e giudizio", options: ["conservati", "parzialmente compromessi", "compromessi"], w: "half" },
      { id: "mse_note", label: "Descrizione aggiuntiva dell'esame psichico", type: "textarea", rows: 4 },
    ],
  },

  {
    id: "rischio",
    title: "Valutazione del rischio",
    icon: "⚠️",
    intro: "Le linee guida NICE NG225 (2022) raccomandano di non utilizzare strumenti o scale di rischio per predire il suicidio né per decidere chi trattare: la valutazione deve essere individualizzata e orientata ai bisogni e alla sicurezza.",
    fields: [
      {
        id: "ideazione_suicidaria", label: "Ideazione suicidaria attuale", type: "radio",
        options: ["assente", "desiderio di morte passivo", "ideazione attiva senza piano", "ideazione con piano definito", "ideazione con intenzione / atti preparatori"],
      },
      { id: "comportamento_recente", label: "Comportamento suicidario / autolesivo recente", type: "radio", options: ["nessuno", "nell'ultimo anno", "nell'ultimo mese", "nell'ultima settimana"], w: "half" },
      { id: "cssrs", label: "C-SSRS screener (se somministrato)", type: "text", w: "half", placeholder: "es. item 1–2 positivi" },
      {
        id: "fattori_rischio", label: "Fattori di rischio presenti", type: "checks",
        options: [
          "precedenti tentativi di suicidio", "familiarità per suicidio", "disturbo dell'umore", "sintomi psicotici",
          "abuso di alcol / sostanze", "impulsività", "hopelessness / disperazione", "isolamento sociale",
          "perdite o eventi stressanti recenti", "patologia organica cronica / dolore", "accesso a mezzi letali",
          "recente dimissione da ricovero", "scarsa aderenza al trattamento", "difficoltà economiche / lavorative",
        ],
        other: true,
      },
      {
        id: "fattori_protettivi", label: "Fattori protettivi", type: "checks",
        options: ["supporto familiare / sociale", "responsabilità verso figli o familiari", "convinzioni religiose / culturali", "alleanza terapeutica", "progettualità futura", "buona capacità di coping", "consapevolezza di malattia", "accesso alle cure"],
        other: true,
      },
      { id: "rischio_etero", label: "Rischio eteroaggressivo", type: "radio", options: ["non evidente", "basso", "moderato", "elevato"], w: "half" },
      { id: "rischio_autotrascuratezza", label: "Rischio di autotrascuratezza / vulnerabilità", type: "radio", options: ["non evidente", "basso", "moderato", "elevato"], w: "half" },
      { id: "rischio_complessivo", label: "Giudizio clinico complessivo", type: "radio", options: ["basso", "moderato", "elevato", "imminente"] },
      { id: "rischio_note", label: "Formulazione del rischio e piano di sicurezza", type: "textarea", rows: 4, placeholder: "Sintesi del rischio, fattori modificabili, misure adottate, riduzione dell'accesso ai mezzi, contatti in caso di crisi." },
    ],
  },

  {
    id: "scale",
    title: "Valutazioni psicometriche",
    icon: "📊",
    fields: [
      {
        id: "scale_tab", label: "Scale somministrate", type: "table", addLabel: "Aggiungi scala",
        columns: [
          { id: "scala", label: "Scala", list: ["PHQ-9", "GAD-7", "BDI-II", "HAM-D", "HAM-A", "MADRS", "YMRS", "BPRS", "PANSS", "HoNOS", "MMSE", "MoCA", "Y-BOCS", "AUDIT", "PCL-5", "C-SSRS", "EAT-26", "ASRS"] },
          { id: "punteggio", label: "Punteggio", w: "110px" },
          { id: "interpretazione", label: "Interpretazione" },
        ],
      },
    ],
  },

  {
    id: "diagnosi",
    title: "Inquadramento diagnostico",
    icon: "🔎",
    fields: [
      { id: "sistema_class", label: "Sistema nosografico", type: "radio", options: ["ICD-10", "ICD-11", "DSM-5-TR", "ICD-10 / DSM-5-TR"], w: "full" },
      {
        id: "diagnosi_tab", label: "Diagnosi", type: "table", addLabel: "Aggiungi diagnosi", minRows: 1,
        columns: [
          { id: "tipo", label: "Tipo", type: "select", options: ["principale", "secondaria / comorbilità", "ipotesi diagnostica", "da escludere (diagnosi differenziale)"], w: "200px" },
          { id: "codice", label: "Codice", w: "110px" },
          { id: "descrizione", label: "Descrizione" },
        ],
      },
      { type: "subtitle", label: "Formulazione biopsicosociale (modello delle 4P)" },
      { id: "f_predisponenti", label: "Fattori predisponenti", type: "textarea", rows: 2, w: "half" },
      { id: "f_precipitanti", label: "Fattori precipitanti", type: "textarea", rows: 2, w: "half" },
      { id: "f_perpetuanti", label: "Fattori di mantenimento", type: "textarea", rows: 2, w: "half" },
      { id: "f_protettivi", label: "Fattori protettivi / risorse", type: "textarea", rows: 2, w: "half" },
      { id: "formulazione", label: "Sintesi della formulazione e diagnosi differenziale", type: "textarea", rows: 4 },
    ],
  },

  {
    id: "accertamenti",
    title: "Accertamenti",
    icon: "🧪",
    fields: [
      {
        id: "esami", label: "Accertamenti richiesti", type: "checks",
        options: [
          "emocromo", "funzionalità epatica e renale", "elettroliti", "glicemia / HbA1c", "assetto lipidico", "TSH reflex",
          "vitamina B12 / folati", "prolattina", "β-hCG", "dosaggio plasmatico farmaci", "screening tossicologico urinario",
          "sierologia HIV / HBV / HCV / VDRL", "ECG con QTc", "EEG", "TC / RM encefalo", "valutazione neuropsicologica", "test psicodiagnostici",
        ],
        other: true,
      },
      { id: "esami_disponibili", label: "Esiti di accertamenti già disponibili", type: "textarea", rows: 2 },
    ],
  },

  {
    id: "piano",
    title: "Piano di trattamento",
    icon: "🗂️",
    fields: [
      {
        id: "setting", label: "Esito della visita / percorso proposto", type: "radio",
        options: [
          "presa in carico presso il CSM", "assunzione in cura (trattamento ambulatoriale)", "consulenza con restituzione al MMG",
          "invio ad altro servizio", "inserimento in Centro Diurno / DH", "proposta di ricovero volontario in SPDC",
          "proposta di TSO", "inserimento in struttura residenziale",
        ],
        other: true,
      },
      { id: "invio_altro", label: "Servizio di invio / collaborazioni (SerD, NPIA, centro DCA, consultorio, servizi sociali...)", type: "text" },
      {
        id: "terapia_tab", label: "Terapia farmacologica prescritta / modificata", type: "table", addLabel: "Aggiungi farmaco",
        columns: [
          { id: "farmaco", label: "Farmaco" },
          { id: "dose", label: "Dose", w: "120px" },
          { id: "posologia", label: "Posologia", w: "190px" },
          { id: "azione", label: "Indicazione", type: "select", options: ["nuova prescrizione", "proseguire", "modificare dose", "scalare / sospendere"], w: "170px" },
        ],
      },
      {
        id: "interventi", label: "Interventi psicosociali", type: "checks",
        options: [
          "colloqui psichiatrici di monitoraggio", "psicoterapia individuale", "psicoterapia di gruppo", "psicoeducazione individuale",
          "psicoeducazione familiare", "interventi infermieristici / domiciliari", "intervento riabilitativo", "inserimento lavorativo / IPS",
          "supporto del servizio sociale", "gruppo di auto-mutuo aiuto", "PTI / progetto terapeutico individualizzato",
        ],
        other: true,
      },
      {
        id: "condivisione", label: "Informazione e condivisione", type: "checks",
        options: [
          "fornite informazioni sull'inquadramento clinico", "fornite informazioni su benefici ed effetti collaterali della terapia",
          "consenso informato alla terapia acquisito", "coinvolgimento dei familiari concordato con il paziente",
          "piano di crisi condiviso e recapiti forniti", "relazione per il MMG",
        ],
      },
      { id: "prossimo_controllo", label: "Prossimo controllo", type: "date", w: "quarter" },
      { id: "controllo_note", label: "Note sul controllo", type: "text", w: "half", placeholder: "es. con esiti degli esami ematici" },
      { id: "piano_note", label: "Ulteriori indicazioni", type: "textarea", rows: 3 },
    ],
  },

  {
    id: "conclusioni",
    title: "Conclusioni",
    icon: "✍️",
    fields: [
      { id: "conclusioni", label: "Conclusioni / sintesi per il referto", type: "textarea", rows: 5, placeholder: "Sintesi clinica, inquadramento e indicazioni essenziali per l'inviante." },
      { id: "certificazioni", label: "Certificazioni rilasciate", type: "text", placeholder: "es. certificato di malattia, certificato per esenzione ticket..." },
      { id: "luogo_firma", label: "Luogo", type: "text", w: "half", placeholder: "es. Collegno" },
    ],
  },
];
