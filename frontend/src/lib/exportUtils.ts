function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Word's paste-from-clipboard HTML converter only respects inline `style`
 * attributes -- it ignores linked/external stylesheets entirely, so a table
 * copied with only Tailwind classes (as rendered on screen) pastes with no
 * visible borders at all. These inline styles reproduce the same APA 7th
 * edition look already used in the .docx export: a line above the header,
 * one below it, and one at the bottom of the table -- no vertical lines. */
function buildHtmlTable(rows: string[][], opts: { headerRow?: boolean } = {}): string {
  const hasHeader = opts.headerRow ?? true;
  const rowsHtml = rows
    .map((row, i) => {
      const isHeader = hasHeader && i === 0;
      const isTopRow = i === 0;
      const isLastRow = i === rows.length - 1;
      let style = "padding:4pt 8pt;text-align:left;font-family:'Times New Roman',serif;font-size:11pt;";
      if (isHeader) style += "font-weight:bold;border-top:1.5pt solid #000;border-bottom:1pt solid #000;";
      else if (isTopRow) style += "border-top:1.5pt solid #000;";
      if (isLastRow) style += "border-bottom:1.5pt solid #000;";
      const tag = isHeader ? "th" : "td";
      return `<tr>${row.map((cell) => `<${tag} style="${style}">${escapeHtml(cell)}</${tag}>`).join("")}</tr>`;
    })
    .join("");
  return `<table style="border-collapse:collapse;">${rowsHtml}</table>`;
}

async function writeHtmlToClipboard(html: string, text: string): Promise<boolean> {
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
      return true;
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function copyTableToClipboard(table: HTMLTableElement): Promise<boolean> {
  const cellText = (row: Element) => [...row.querySelectorAll("th, td")].map((c) => (c.textContent ?? "").trim());
  const theadRows = [...table.querySelectorAll("thead tr")].map(cellText);
  const tbodyRows = [...table.querySelectorAll("tbody tr")].map(cellText);
  const allRows = [...theadRows, ...tbodyRows];
  const html = buildHtmlTable(allRows, { headerRow: theadRows.length > 0 });
  const text = allRows.map((r) => r.join("\t")).join("\n");
  return writeHtmlToClipboard(html, text);
}

export async function copyHtmlTableToClipboard(headers: string[], rows: string[][]): Promise<boolean> {
  const allRows = headers.length > 0 ? [headers, ...rows] : rows;
  const html = buildHtmlTable(allRows, { headerRow: headers.length > 0 });
  const text = allRows.map((r) => r.join("\t")).join("\n");
  return writeHtmlToClipboard(html, text);
}

export function downloadBase64Png(base64: string, filename: string) {
  const a = document.createElement("a");
  a.href = `data:image/png;base64,${base64}`;
  a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  a.click();
}

export function downloadSvgAsPng(svg: SVGSVGElement, filename: string, scale = 2): Promise<void> {
  return new Promise((resolve, reject) => {
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const viewBox = svg.viewBox.baseVal;
      const width = (viewBox && viewBox.width) || svg.clientWidth || 800;
      const height = (viewBox && viewBox.height) || svg.clientHeight || 600;
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas tidak didukung"));
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
      a.click();
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Gagal memuat SVG untuk diekspor"));
    };
    img.src = url;
  });
}
