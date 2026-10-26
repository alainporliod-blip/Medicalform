/*
 * Conversione dell'anteprima HTML del referto in un vero file .docx
 * (Office Open XML), senza librerie esterne. Gestisce i tag usati nel
 * referto e quelli prodotti dalla modifica manuale (p, div, h1-h3, ul/ol,
 * table, b/strong, i/em, u, br).
 */

function htmlToDocx(root, meta) {
  "use strict";
  meta = meta || {};
  const xmlEsc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const PAGE_W = 9638; // larghezza utile A4 con margini 2 cm, in twip

  // ---------- run di testo ----------
  function runs(node, fmt, out) {
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.nodeValue.replace(/\s+/g, " ");
        if (!text) continue;
        let rPr = "";
        if (fmt.b) rPr += "<w:b/>";
        if (fmt.i) rPr += "<w:i/>";
        if (fmt.caps) rPr += "<w:caps/>";
        if (fmt.color) rPr += `<w:color w:val="${fmt.color}"/>`;
        if (fmt.sz) rPr += `<w:sz w:val="${fmt.sz}"/><w:szCs w:val="${fmt.sz}"/>`;
        if (fmt.u) rPr += '<w:u w:val="single"/>';
        out.push(`<w:r>${rPr ? `<w:rPr>${rPr}</w:rPr>` : ""}<w:t xml:space="preserve">${xmlEsc(text)}</w:t></w:r>`);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const tag = child.tagName.toLowerCase();
        if (tag === "br") { out.push("<w:r><w:br/></w:r>"); continue; }
        const f = { ...fmt };
        if (tag === "b" || tag === "strong" || /font-weight:\s*(bold|[6-9]00)/.test(child.getAttribute("style") || "")) f.b = true;
        if (tag === "i" || tag === "em") f.i = true;
        if (tag === "u") f.u = true;
        runs(child, f, out);
      }
    }
    return out;
  }

  // rimuove spazi iniziali/finali superflui dei run
  function trimRuns(rs) {
    if (!rs.length) return rs;
    rs[0] = rs[0].replace(/(<w:t xml:space="preserve">)\s+/, "$1");
    const l = rs.length - 1;
    rs[l] = rs[l].replace(/\s+(<\/w:t>)/, "$1");
    return rs;
  }

  function paragraph(rs, opts) {
    opts = opts || {};
    let pPr = "";
    if (opts.style) pPr += `<w:pStyle w:val="${opts.style}"/>`;
    if (opts.keepNext) pPr += "<w:keepNext/>";
    if (opts.border) pPr += '<w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="333333"/></w:pBdr>';
    if (opts.spacing) pPr += `<w:spacing ${opts.spacing}/>`;
    if (opts.ind) pPr += `<w:ind ${opts.ind}/>`;
    if (opts.jc) pPr += `<w:jc w:val="${opts.jc}"/>`;
    return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ""}${trimRuns(rs).join("")}</w:p>`;
  }

  function alignOf(node, inherited) {
    const style = node.getAttribute ? node.getAttribute("style") || "" : "";
    const m = style.match(/text-align:\s*(left|right|center|justify)/);
    if (m) return { left: "left", right: "right", center: "center", justify: "both" }[m[1]];
    if (node.classList && (node.classList.contains("r-sub") || node.classList.contains("r-foot"))) return "center";
    return inherited;
  }

  // ---------- blocchi ----------
  function blocks(node, ctx, out) {
    let pending = [];
    const flush = () => {
      if (pending.length && pending.some((r) => /<w:t[^>]*>[^<]*\S/.test(r) || r.includes("<w:br/>"))) {
        out.push(paragraph(pending, { jc: ctx.jc }));
      }
      pending = [];
    };

    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        runs({ childNodes: [child] }, ctx.fmt || {}, pending);
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const tag = child.tagName.toLowerCase();
      const cls = child.classList;
      const jc = alignOf(child, ctx.jc);

      if (["b", "strong", "i", "em", "u", "span", "a", "br", "font"].includes(tag)) {
        runs({ childNodes: [child] }, ctx.fmt || {}, pending);
        continue;
      }
      flush();

      if (tag === "h1") {
        out.push(paragraph(runs(child, {}, []), { style: "Title" }));
      } else if (tag === "h2" || tag === "h3") {
        out.push(paragraph(runs(child, {}, []), { style: tag === "h2" ? "Heading1" : "Heading2" }));
      } else if (tag === "ul" || tag === "ol") {
        let n = 0;
        for (const li of child.children) {
          if (li.tagName.toLowerCase() !== "li") continue;
          n++;
          const bullet = tag === "ol" ? `${n}.` : "•";
          const rs = [`<w:r><w:t xml:space="preserve">${bullet}</w:t></w:r><w:r><w:tab/></w:r>`, ...runs(li, {}, [])];
          out.push(paragraph(rs, { ind: 'w:left="567" w:hanging="283"', spacing: 'w:after="40"' }));
        }
      } else if (tag === "table") {
        out.push(table(child));
      } else if (cls && cls.contains("r-head")) {
        const lines = [...child.children];
        lines.forEach((ln, i) => {
          const f = {};
          if (ln.classList.contains("r-az")) { f.b = true; f.caps = true; f.sz = 24; }
          if (ln.classList.contains("r-small")) { f.sz = 18; f.color = "444444"; }
          out.push(paragraph(runs(ln, f, []), { jc: "center", spacing: 'w:after="0"', border: i === lines.length - 1 }));
        });
        out.push(paragraph([], {}));
      } else if (cls && cls.contains("r-sign")) {
        out.push(paragraph([], {}));
        for (const ln of child.children) out.push(paragraph(runs(ln, {}, []), { jc: "right", spacing: 'w:after="0"' }));
      } else if (cls && cls.contains("r-foot")) {
        out.push(paragraph([], {}));
        out.push(paragraph(runs(child, { sz: 16, color: "555555" }, []), { jc: "center" }));
      } else if (tag === "p") {
        out.push(paragraph(runs(child, {}, []), { jc: jc || "both" }));
      } else {
        // div e altri contenitori: ricorsione
        blocks(child, { ...ctx, jc }, out);
      }
    }
    flush();
    return out;
  }

  function cellContent(td) {
    const inner = [];
    blocks(td, { jc: "left" }, inner);
    const fixed = inner.map((x) => x.replace(/<w:jc w:val="both"\/>/, '<w:jc w:val="left"/>'));
    return fixed.length ? fixed.join("") : "<w:p/>";
  }

  function table(tbl) {
    const rows = [...tbl.querySelectorAll(":scope > thead > tr, :scope > tbody > tr, :scope > tr")];
    const nCols = Math.max(1, ...rows.map((r) => [...r.children].reduce((a, c) => a + (c.colSpan || 1), 0)));
    const isAnag = tbl.classList.contains("r-anag");
    const widths = isAnag
      ? [1650, 3169, 1650, 3169]
      : Array.from({ length: nCols }, () => Math.floor(PAGE_W / nCols));
    const grid = widths.map((w) => `<w:gridCol w:w="${w}"/>`).join("");
    const border = (s) => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="999999"/>`;
    const tblPr = `<w:tblPr><w:tblW w:w="${PAGE_W}" w:type="dxa"/><w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"].map(border).join("")}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="85" w:type="dxa"/><w:right w:w="85" w:type="dxa"/></w:tblCellMar></w:tblPr>`;
    const trs = rows.map((tr) => {
      const header = tr.parentElement.tagName.toLowerCase() === "thead";
      let col = 0;
      const tcs = [...tr.children].map((td) => {
        const span = td.colSpan || 1;
        const w = widths.slice(col, col + span).reduce((a, b) => a + b, 0);
        col += span;
        const shade = header || td.tagName.toLowerCase() === "th" || td.classList.contains("r-lab");
        let content = cellContent(td);
        if (shade) content = content.replace(/<w:r>(?!<w:rPr>)/g, "<w:r><w:rPr><w:b/></w:rPr>");
        const tcPr = `<w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${span > 1 ? `<w:gridSpan w:val="${span}"/>` : ""}${shade ? '<w:shd w:val="clear" w:color="auto" w:fill="EEF2F6"/>' : ""}</w:tcPr>`;
        return `<w:tc>${tcPr}${content}</w:tc>`;
      });
      return `<w:tr>${header ? "<w:trPr><w:tblHeader/></w:trPr>" : ""}${tcs.join("")}</w:tr>`;
    });
    return `<w:tbl>${tblPr}<w:tblGrid>${grid}</w:tblGrid>${trs.join("")}</w:tbl><w:p><w:pPr><w:spacing w:after="0"/></w:pPr></w:p>`;
  }

  const body = blocks(root, {}, []).join("");

  const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document ${NS}><w:body>${body}<w:sectPr><w:footerReference w:type="default" r:id="rIdFooter"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;

  const footerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr ${NS}><w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:t xml:space="preserve">Pagina </w:t></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:t>1</w:t></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:t xml:space="preserve"> di </w:t></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:instrText xml:space="preserve"> NUMPAGES </w:instrText></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:t>1</w:t></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="it-IT"/></w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="200" w:after="60"/><w:jc w:val="center"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="BBBBBB"/></w:pBdr><w:spacing w:before="280" w:after="80"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:caps/><w:color w:val="1F3B57"/><w:sz w:val="23"/><w:szCs w:val="23"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="60"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:color w:val="1F3B57"/></w:rPr></w:style>
<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
</w:styles>`;

  const now = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xmlEsc(meta.title || "")}</dc:title><dc:creator>${xmlEsc(meta.author || "")}</dc:creator><dc:language>it-IT</dc:language><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`;

  const files = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`,
    "word/_rels/document.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>`,
    "word/document.xml": documentXml,
    "word/styles.xml": stylesXml,
    "word/footer1.xml": footerXml,
    "docProps/core.xml": coreXml,
  };

  return new Blob([zipStore(files)], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

/* Archivio ZIP non compresso (metodo "store"): sufficiente per un .docx valido. */
function zipStore(files) {
  const enc = new TextEncoder();
  const crcTable = zipStore.table || (zipStore.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  const crc32 = (buf) => {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };

  const d = new Date();
  const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();

  const chunks = [];
  const central = [];
  let offset = 0;

  for (const [name, content] of Object.entries(files)) {
    const nameBytes = enc.encode(name);
    const data = enc.encode(content);
    const crc = crc32(data);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);
    local.setUint16(8, 0, true);
    local.setUint16(10, dosTime, true);
    local.setUint16(12, dosDate, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true);
    chunks.push(new Uint8Array(local.buffer), nameBytes, data);

    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);
    cen.setUint16(4, 20, true);
    cen.setUint16(6, 20, true);
    cen.setUint16(8, 0x0800, true);
    cen.setUint16(10, 0, true);
    cen.setUint16(12, dosTime, true);
    cen.setUint16(14, dosDate, true);
    cen.setUint32(16, crc, true);
    cen.setUint32(20, data.length, true);
    cen.setUint32(24, data.length, true);
    cen.setUint16(28, nameBytes.length, true);
    cen.setUint32(42, offset, true);
    central.push(new Uint8Array(cen.buffer), nameBytes);

    offset += 30 + nameBytes.length + data.length;
  }

  const cenSize = central.reduce((a, c) => a + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, Object.keys(files).length, true);
  end.setUint16(10, Object.keys(files).length, true);
  end.setUint32(12, cenSize, true);
  end.setUint32(16, offset, true);

  const parts = [...chunks, ...central, new Uint8Array(end.buffer)];
  const total = parts.reduce((a, c) => a + c.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) { out.set(p, pos); pos += p.length; }
  return out;
}
