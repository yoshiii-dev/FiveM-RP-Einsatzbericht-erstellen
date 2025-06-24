const berichtnameInput = document.getElementById('berichtname');
berichtnameInput.addEventListener('input', () => {
  berichtnameInput.value = berichtnameInput.value.replace(/[^a-zA-Z0-9 _-]/g, '');
});

function sanitizeFilename(name) {
  return name.trim();
}

function cleanUpContent(div) {
  while (div.firstChild && div.firstChild.nodeName === 'BR') div.removeChild(div.firstChild);
  while (div.lastChild &&  div.lastChild.nodeName === 'BR') div.removeChild(div.lastChild);
}

function handleImagePasteOrDrop(divId) {
  const div = document.getElementById(divId);

  // paste
  div.addEventListener('paste', e => {
    (e.clipboardData || e.originalEvent.clipboardData).items.forEach(item => {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        const reader = new FileReader();
        reader.onload = ev => {
          const img = document.createElement('img');
          img.src = ev.target.result;
          div.appendChild(img);
          cleanUpContent(div);
        };
        reader.readAsDataURL(file);
      }
    });
  });

  // drag & drop
  ['dragenter','dragover','dragleave','drop'].forEach(evt =>
    div.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); })
  );
  div.addEventListener('dragover',  () => div.style.border = '2px dashed #0f0');
  div.addEventListener('dragleave', () => div.style.border = '');
  div.addEventListener('drop', e => {
    div.style.border = '';
    Array.from(e.dataTransfer.files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = ev => {
          const img = document.createElement('img');
          img.src = ev.target.result;
          div.appendChild(img);
          cleanUpContent(div);
        };
        reader.readAsDataURL(file);
      }
    });
  });
}

handleImagePasteOrDrop('personen');
handleImagePasteOrDrop('gegenstaende');

function downloadPDF() {
  const ort            = document.getElementById('ort').value.trim();
  const rawDatum       = document.getElementById('datum').value;
  let datum = '';
  if (rawDatum) {
    const dt = new Date(rawDatum);
    datum = dt.toLocaleDateString('de-DE') +
            ' - ' +
            dt.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}) +
            ' Uhr';
  }
  const leitung        = document.getElementById('leitung').value.trim();
  const einheiten      = document.getElementById('einheiten').value.trim();
  const beschreibung = document.getElementById('beschreibung').value.trim();
  const personenHTML   = document.getElementById('personen').innerHTML.trim();
  const gegenstaendeHTML = document.getElementById('gegenstaende').innerHTML.trim();
  const zwischenfaelle = document.getElementById('zwischenfaelle').value.trim();
  const hafteinheiten  = document.getElementById('hafteinheiten').value.trim();
  const geldstrafe     = document.getElementById('geldstrafe').value.trim();
  let berichtname     = berichtnameInput.value.trim();

  if (!ort||!datum||!leitung||!einheiten||!beschreibung||
      !personenHTML||!gegenstaendeHTML||!hafteinheiten||
      !geldstrafe||!berichtname) {
    alert('Bitte alle Pflichtfelder ausfüllen.');
    return;
  }
  berichtname = sanitizeFilename(berichtname);
  if (!berichtname) {
    alert('Ungültiger Berichtname.'); return;
  }

  let urteilText = '';
  if (hafteinheiten||geldstrafe) {
    const parts = [];
    if (hafteinheiten) parts.push(`<span class="red-number">${hafteinheiten}</span> Hafteinheiten`);
    if (geldstrafe)    parts.push(`<span class="red-number">${geldstrafe}</span> Geldstrafe`);
    urteilText = `Jeder der festgenommenen Tatverdächtigen erhielt:<br/><strong>${parts.join(' + ')}</strong>`;
  }

  const html = `
<div class="pdf-header">
  LOS SANTOS POLICE DEPARTMENT<br/>
  S.W.A.T. – SPECIAL WEAPONS AND TACTICS UNIT
</div>
<hr/>

<h2>📄 Einsatzbericht – Razzia</h2>
<strong>Ort:</strong> ${ort}<br/>
<strong>Datum/Zeit:</strong> ${datum}<br/>
<strong>Einsatzleitung:</strong> ${leitung}<br/>
<strong>Beteiligte Einheiten:</strong> ${einheiten}
<hr/>

<h3>📌 Einsatzbeschreibung</h3>
<p>${beschreibung}</p>
<hr/>

<h3>👤 Festgenommene Personen</h3>
<div>${personenHTML}</div>
<hr/>

<h3>📦 Sichergestellte Gegenstände</h3>
<div>${gegenstaendeHTML}</div>
<hr/>

<div style="page-break-inside: avoid;">
  <h3>⚠️ Zwischenfälle</h3>
  <p>${zwischenfaelle || 'Keine Zwischenfälle'}</p>
</div>
<hr/>

<div style="page-break-inside: avoid;">
  <h3>📜 Urteil</h3>
  <p>${urteilText || ''}</p>
</div>
<hr/>

<div style="page-break-inside: avoid;">
  <strong>Unterschrift Einsatzleitung SWAT:</strong><br/>
  <div class="signature">${leitung}</div>
  <p>S.W.A.T. – Los Santos Police Department</p>
</div>`;

  const container = document.createElement('div');
  container.className = 'pdf-content';
  container.innerHTML = html;
  document.getElementById('hidden-pdf-wrapper').appendChild(container);

  html2pdf().from(container).set({
    margin: [10,7,10,10],
    filename: `${berichtname}.pdf`,
    html2canvas: { scale: 2, scrollY: 0 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).save().then(() => container.remove());
}
