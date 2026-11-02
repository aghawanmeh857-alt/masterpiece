// Raster pages preserve Arabic shaping without a font service or external PDF dependency.
export function imagePagesPDF(pages) {
  const encode = text => new TextEncoder().encode(text);
  const chunks = [], offsets = [0]; let length = 0;
  const push = value => { const bytes = typeof value === 'string' ? encode(value) : value; chunks.push(bytes); length += bytes.length; };
  const object = (id, body) => { offsets[id] = length; push(`${id} 0 obj\n`); push(body); push('\nendobj\n'); };
  push('%PDF-1.4\n');
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  object(2, `<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_,i) => `${3+i*3} 0 R`).join(' ')}] >>`);
  pages.forEach((page,i) => {
    const id = 3+i*3;
    object(id, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`);
    offsets[id+1] = length;
    push(`${id+1} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.length} >>\nstream\n`);
    push(page.bytes); push('\nendstream\nendobj\n');
    const command = 'q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\n';
    object(id+2, `<< /Length ${encode(command).length} >>\nstream\n${command}endstream`);
  });
  const xref = length;
  push(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
  offsets.slice(1).forEach(offset => push(`${String(offset).padStart(10,'0')} 00000 n \n`));
  push(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(chunks, {type:'application/pdf'});
}

export async function detailsPDF(title, sections) {
  await document.fonts.ready;
  const width = 1240, height = 1754, margin = 90, pages = [];
  let canvas, context, y;
  function begin() {
    canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    context = canvas.getContext('2d'); context.fillStyle = '#fff'; context.fillRect(0,0,width,height);
    context.direction = 'rtl'; context.textAlign = 'right'; context.fillStyle = '#bd491b';
    context.font = 'bold 28px Arial'; context.fillText('سعي | SAEI', width-margin, 64); y = 130;
  }
  function finish() {
    context.fillStyle = '#526681'; context.font = '20px Arial';
    context.fillText(String(pages.length+1), width-margin, height-45);
    const binary = atob(canvas.toDataURL('image/jpeg',.94).split(',')[1]);
    pages.push({width,height,bytes:Uint8Array.from(binary,char=>char.charCodeAt(0))});
  }
  function write(text, heading = false) {
    const size = heading ? 32 : 25, lineHeight = heading ? 49 : 42;
    context.font = `${heading ? 'bold ' : ''}${size}px Arial`;
    const lines = [];
    for (const paragraph of String(text).split('\n')) {
      let line = '';
      for (const word of paragraph.split(/\s+/)) {
        const candidate = line ? `${line} ${word}` : word;
        if (context.measureText(candidate).width <= width-margin*2) { line = candidate; continue; }
        if (line) { lines.push(line); line = ''; }
        // Break long links/tokens so imported content cannot run beyond the page.
        for (const char of word) {
          if (context.measureText(line+char).width > width-margin*2) { lines.push(line); line = ''; }
          line += char;
        }
      }
      lines.push(line);
    }
    for (const line of lines) {
      if (y+lineHeight > height-100) { finish(); begin(); }
      context.font = `${heading ? 'bold ' : ''}${size}px Arial`;
      context.fillStyle = heading ? '#17263b' : '#40566d';
      context.fillText(line,width-margin,y); y += lineHeight;
    }
    y += 15;
  }
  begin(); write(title,true);
  for (const section of sections) { write(section.heading,true); section.items.forEach(item=>write(item)); }
  finish(); return imagePagesPDF(pages);
}
