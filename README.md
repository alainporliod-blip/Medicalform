# Prima visita psichiatrica – form e referto

Pagina web per la compilazione guidata della prima visita psichiatrica, con
generazione di una bozza di referto modificabile ed esportabile in **Word
(.docx)** o **PDF**.

## Utilizzo

Aprire `index.html` in un browser recente (Chrome, Edge, Firefox, Safari).
Non serve installazione né connessione: tutto funziona in locale e i dati
**non vengono trasmessi a nessun server**.

1. Compilare l'**intestazione** (azienda, dipartimento, servizio, medico): viene
   ricordata dal browser e riproposta a ogni nuova visita.
2. Compilare le sezioni: risposte a scelta (chip, matrici) per i dati
   schematizzabili, campi di testo libero per le parti narrative. Un secondo
   clic su un'opzione a scelta singola la deseleziona.
3. **Genera referto** produce la bozza in prosa; il testo si può correggere
   direttamente nell'anteprima.
4. **Scarica Word (.docx)** oppure **Stampa / PDF** (scegliere "Salva come PDF"
   come stampante).

Altre funzioni:

- **Salvataggio automatico** della visita in corso nel browser (disattivabile;
  su postazioni condivise si consiglia di disattivarlo o di usare *Nuova visita*
  a fine compilazione, che cancella la bozza locale).
- **Salva bozza / Apri bozza**: esporta e reimporta la visita come file `.json`
  per completarla in un secondo momento.
- Concordanza di genere automatica nel referto (es. "orientato/orientata")
  in base al sesso indicato; calcolo automatico del BMI.

## Struttura dell'intervista

Le sezioni seguono le raccomandazioni su contenuti e sequenza della valutazione
psichiatrica dell'adulto:

| Sezione | Riferimento principale |
|---|---|
| Motivo della consultazione, storia attuale, anamnesi psichiatrica, sostanze, anamnesi medica, familiare, personale-sociale | APA Practice Guideline for the Psychiatric Evaluation of Adults, 3rd ed. (2016) |
| Esame psichico | APA 2016; RCPsych |
| Valutazione del rischio (giudizio clinico individualizzato, non predittivo) | NICE NG225 (2022); APA 2016 |
| Parametri metabolici (peso, BMI, circonferenza vita, PA, ECG/QTc) | APA 2016; documenti SIP sulla salute fisica |
| Formulazione biopsicosociale (4P) e diagnosi ICD-10/ICD-11/DSM-5-TR | RCPsych; APA 2016 |
| Condivisione del piano, informazione e consenso | NICE CG136 |

## File

- `index.html` – pagina principale
- `js/schema.js` – definizione di sezioni, campi e opzioni (modificabile per
  adattare il form alla propria pratica)
- `js/report.js` – composizione del testo del referto
- `js/docx.js` – generazione del file .docx senza librerie esterne
- `js/app.js` – interfaccia, salvataggi, esportazione
- `css/style.css` – stile

## Avvertenze

Il referto generato è una **bozza** che va sempre riletta e validata dal medico
prima della firma e dell'archiviazione. La conservazione dei documenti deve
avvenire secondo le procedure aziendali e la normativa sulla protezione dei
dati (Reg. UE 2016/679).
