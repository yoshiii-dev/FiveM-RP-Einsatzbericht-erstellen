function populateDropdown(id, options) {
  const select = document.getElementById(id);
  options.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  populateDropdown('leitung', einsatzleiterNamen);
  populateDropdown('leitung2', einsatzleiterNamen);
});

const berichtnameInput = document.getElementById('berichtname');
berichtnameInput.addEventListener('input', () => {
  berichtnameInput.value = berichtnameInput.value.replace(/[^a-zA-Z0-9 _-]/g, '');
});

const fields = [
  'ort', 'datum', 'leitung', 'leitung2', 'beschreibung',
  'personen', 'gegenstaende', 'zwischenfaelle', 'hafteinheiten', 'geldstrafe', 'berichtname'
];

function cleanDivEdges(div) {
  while (div.firstChild?.nodeName === 'BR') div.removeChild(div.firstChild);
  while (div.lastChild?.nodeName === 'BR') div.removeChild(div.lastChild);
}

function enableImagePasteAndDrop(id) {
  const div = document.getElementById(id);

  div.addEventListener('paste', e => {
    const imgItem = [...e.clipboardData.items].find(i => i.type.startsWith('image/'));
    if (imgItem) {
      e.preventDefault();
      const file = imgItem.getAsFile();
      const reader = new FileReader();
      reader.onload = ev => {
        div.appendChild(Object.assign(document.createElement('img'), { src: ev.target.result }));
        cleanDivEdges(div);
      };
      reader.readAsDataURL(file);
    }
  });

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt =>
    div.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); })
  );

  div.addEventListener('dragover', () => div.style.border = '2px dashed #0f0');
  div.addEventListener('dragleave', () => div.style.border = '');
  div.addEventListener('drop', e => {
    div.style.border = '';
    [...e.dataTransfer.files].filter(f => f.type.startsWith('image/')).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        div.appendChild(Object.assign(document.createElement('img'), { src: ev.target.result }));
        cleanDivEdges(div);
      };
      reader.readAsDataURL(file);
    });
  });
}

enableImagePasteAndDrop('personen');
enableImagePasteAndDrop('gegenstaende');

function downloadPDF() {
  const data = Object.fromEntries(fields.map(id => [id, document.getElementById(id)?.value?.trim() || '']));
  data.personen = document.getElementById('personen').innerHTML.trim();
  data.gegenstaende = document.getElementById('gegenstaende').innerHTML.trim();

  const einheitenCheckboxes = document.querySelectorAll('.einheiten-checkbox:checked');
  const selectedUnits = Array.from(einheitenCheckboxes).map(cb => cb.value);
  data.einheiten = ['Army', ...selectedUnits].join(', ');

  if (!data.ort || !data.datum || !data.leitung || !data.beschreibung ||
      !data.personen || !data.gegenstaende || !data.hafteinheiten || !data.geldstrafe || !data.berichtname) {
    alert('Bitte alle Pflichtfelder ausfüllen.');
    return;
  }

  const dt = new Date(data.datum);
  const formattedDatum = `${dt.toLocaleDateString('de-DE')} - ${dt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`;

  const urteilParts = [];
  if (data.hafteinheiten) urteilParts.push(`<span class="red-number">${data.hafteinheiten}</span> Hafteinheiten`);
  if (data.geldstrafe)    urteilParts.push(`<span class="red-number">${data.geldstrafe}</span> Geldstrafe`);
  const urteilHTML = urteilParts.length
  ? `<div class="typewriter-block">
       <p>Jeder der festgenommenen Tatverdächtigen erhielt:</p>
       <p><strong>${urteilParts.join(' + ')}</strong></p>
     </div>`
  : '';

  const html = `
  <div class="pdf-header with-logos">
    <img src="img/Navy.png" class="logo left-logo" />
    <img src="img/Wolfpack.png" class="logo right-logo" />
    <strong>DEPARTMENT OF THE NAVY</strong><br/>
    <div class="typewriter-block">
      OFFICE OF THE NAVY SEALS Admiral<br/>
      5006 Fort Zancudo Corleone City<br/>90002, California
    </div>
  </div>
  <hr/>
  <h2><strong>Einsatzbericht – Razzia</strong></h2>
  <div class="typewriter-block">
    <p><strong>Ort:</strong> ${data.ort}</p>
    <p><strong>Datum/Zeit:</strong> ${formattedDatum}</p>
    <p><strong>1. Einsatzleitung:</strong> ${data.leitung}</p>
    ${data.leitung2 ? `<p><strong>2. Einsatzleitung:</strong> ${data.leitung2}</p>` : ''}
    <p><strong>Beteiligte Einheiten:</strong> ${data.einheiten}</p>
  </div>
  <hr/>
  <div class="no-break">
    <h3>Einsatzbeschreibung</h3>
    <div class="typewriter-block"><p>${data.beschreibung}</p></div>
  </div><hr/>

  <div class="no-break">
    <h3>Festgenommene Personen</h3>
    <div class="typewriter-block">${data.personen}</div>
  </div><hr/>

  <div class="no-break">
    <h3>Sichergestellte Gegenstände</h3>
    <div class="typewriter-block">${data.gegenstaende}</div>
  </div><hr/>

  <div class="no-break">
    <h3>Zwischenfälle</h3>
    <div class="typewriter-block"><p>${data.zwischenfaelle || 'Keine Zwischenfälle gemeldet.'}</p></div>
  </div><hr/>
  <div class="no-break"><h3><strong>Urteil</strong></h3><p>${urteilHTML}</p></div><hr/>
  <div class="no-break typewriter-block signature-block">
    <p><strong>Unterschrift:</strong> <span class="redacted">████████████████████</span></p>
    <p><strong>Admiral, Department of Navy Seals</strong></p>
    <p><strong>Operator ID:</strong> ${data.leitung}</p>
    <p><strong>Telefon:</strong> <span class="redacted">████████████</span></p>
  </div>`;

  const wrapper = document.createElement('div');
  wrapper.className = 'pdf-content';
  wrapper.innerHTML = html;
  document.getElementById('hidden-pdf-wrapper').appendChild(wrapper);

  html2pdf().from(wrapper).set({
    margin: [10, 7, 10, 10],
    filename: `${data.berichtname}.pdf`,
    html2canvas: { scale: 2, scrollY: 0 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).save().then(() => wrapper.remove());
}
