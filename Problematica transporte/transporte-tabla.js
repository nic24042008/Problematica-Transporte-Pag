// ═══════════════════════════════════════════════════════════════════
// MÓDULO TABLA - Construcción, estado y funciones auxiliares
// ═══════════════════════════════════════════════════════════════════

let filas = 3, cols = 3;
let desbloqueado = true;  

let nombresOrigen  = {};
let nombresDestino = {};
let basesOferta    = {};
let basesDemanda   = {};
let costos         = {};
let asignaciones   = {};


let colFicticia  = false;
let filaFicticia = false;


function initEstado() {
  for (let i = 1; i <= filas; i++) {
    if (!nombresOrigen[i])  nombresOrigen[i]  = `Origen ${i}`;
    if (!basesOferta[i])    basesOferta[i]    = 100;
  }
  for (let j = 1; j <= cols; j++) {
    if (!nombresDestino[j]) nombresDestino[j] = `Destino ${j}`;
    if (!basesDemanda[j])   basesDemanda[j]   = 100;
  }
}


function construirTabla() {
  initEstado();
  verificarFicticio();

  const tabla = document.getElementById('tabla');
  tabla.innerHTML = '';

  const totalCols = cols + (colFicticia ? 1 : 0);


  const thead = tabla.createTHead();
  const tr0 = thead.insertRow();
  crearTh(tr0, 'Orig \\ Dest', '');
  for (let j = 1; j <= totalCols; j++) {
    const th = document.createElement('th');
    th.className = j > cols ? 'th-ficticio' : '';
    if (j > cols) {
      th.textContent = 'Dest. Ficticio';
    } else {
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.className = 'input-nombre';
      inp.value = nombresDestino[j] || `Destino ${j}`;
      inp.dataset.tipo = 'nombre-destino';
      inp.dataset.col  = j;
      inp.readOnly = !desbloqueado;
      inp.addEventListener('change', () => { nombresDestino[j] = inp.value; });
      inp.addEventListener('focus', () => inp.select());
      th.appendChild(inp);
    }
    tr0.appendChild(th);
  }
  crearTh(tr0, 'OFERTA', 'th-oferta');

  const tbody = tabla.createTBody();
  const totalFilas = filas + (filaFicticia ? 1 : 0);

  for (let i = 1; i <= totalFilas; i++) {
    const esFict = i > filas;
    const tr = tbody.insertRow();

    const tdOrig = tr.insertCell();
    tdOrig.className = 'td-origen' + (esFict ? ' td-ficticio' : '');
    if (esFict) {
      tdOrig.textContent = 'Orig. Ficticio';
    } else {
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.className = 'input-nombre';
      inp.value = nombresOrigen[i] || `Origen ${i}`;
      inp.dataset.tipo = 'nombre-origen';
      inp.dataset.fila = i;
      inp.readOnly = !desbloqueado;
      inp.addEventListener('change', () => { nombresOrigen[i] = inp.value; });
      inp.addEventListener('focus', () => inp.select());
      tdOrig.appendChild(inp);
    }

    for (let j = 1; j <= totalCols; j++) {
      const esFictCelda = esFict || j > cols;
      const key = `${i}-${j}`;
      const td = tr.insertCell();
      td.className = 'td-celda' + (esFictCelda ? ' td-ficticio-celda' : '');

      const inner = document.createElement('div');
      inner.className = 'celda-inner';

      const inputCosto = document.createElement('input');
      inputCosto.type = 'text';
      inputCosto.className = 'input-costo';
      inputCosto.placeholder = 'costo';
      inputCosto.value = esFictCelda ? '0' : (costos[key] ?? '0');
      inputCosto.dataset.tipo = 'costo';
      inputCosto.dataset.fila = i;
      inputCosto.dataset.col  = j;
      inputCosto.readOnly = !desbloqueado || esFictCelda;
      if (esFictCelda) inputCosto.style.opacity = '0.3';
      inputCosto.addEventListener('focus', () => inputCosto.select());
      inputCosto.addEventListener('change', () => { costos[key] = inputCosto.value; });

      const inputAsign = document.createElement('input');
      inputAsign.type = 'text';
      inputAsign.className = 'input-asign';
      inputAsign.placeholder = '—';
      inputAsign.value = asignaciones[key] ?? '';
      inputAsign.dataset.tipo = 'asign';
      inputAsign.dataset.fila = i;
      inputAsign.dataset.col  = j;
      inputAsign.readOnly = false;
      inputAsign.addEventListener('focus', () => inputAsign.select());
      inputAsign.addEventListener('input', () => {
        asignaciones[key] = inputAsign.value;
        recalcular();
      });

      inner.appendChild(inputCosto);
      inner.appendChild(inputAsign);
      td.appendChild(inner);
    }

    const tdOf = tr.insertCell();
    tdOf.className = 'td-oferta' + (esFict ? ' td-ficticio' : '');
    const inpOf = document.createElement('input');
    inpOf.type = 'text';
    inpOf.className = 'input-oferta';
    inpOf.dataset.tipo = 'oferta';
    inpOf.dataset.fila = i;

    if (esFict) {
      const exceso = getTotalDemanda() - getTotalOferta();
      inpOf.value = exceso > 0 ? exceso : 0;
      inpOf.dataset.base = inpOf.value;
      inpOf.readOnly = true;
      inpOf.style.opacity = '0.5';
    } else {
      inpOf.value = basesOferta[i] ?? 100;
      inpOf.dataset.base = inpOf.value;
      inpOf.readOnly = !desbloqueado;
      inpOf.addEventListener('focus', () => inpOf.select());
      inpOf.addEventListener('change', () => {
        basesOferta[i] = parseFloat(inpOf.value) || 0;
        inpOf.dataset.base = basesOferta[i];
        verificarFicticio();
        construirTabla();
      });
    }
    tdOf.appendChild(inpOf);
  }

  const trDem = tbody.insertRow();
  const tdDemLabel = trDem.insertCell();
  tdDemLabel.className = 'td-origen';
  tdDemLabel.textContent = 'DEMANDA';

  for (let j = 1; j <= totalCols; j++) {
    const esFictCol = j > cols;
    const td = trDem.insertCell();
    td.className = 'td-demanda' + (esFictCol ? ' td-ficticio' : '');
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'input-demanda';
    inp.dataset.tipo = 'demanda';
    inp.dataset.col  = j;

    if (esFictCol) {
      const exceso = getTotalOferta() - getTotalDemanda();
      inp.value = exceso > 0 ? exceso : 0;
      inp.dataset.base = inp.value;
      inp.readOnly = true;
      inp.style.opacity = '0.5';
    } else {
      inp.value = basesDemanda[j] ?? 100;
      inp.dataset.base = inp.value;
      inp.readOnly = !desbloqueado;
      inp.addEventListener('focus', () => inp.select());
      inp.addEventListener('change', () => {
        basesDemanda[j] = parseFloat(inp.value) || 0;
        inp.dataset.base = basesDemanda[j];
        verificarFicticio();
        construirTabla();
      });
    }
    td.appendChild(inp);
  }

  const tdTotal = trDem.insertCell();
  tdTotal.className = 'td-total';
  tdTotal.textContent = '—';

  recalcular();
}

function getTotalOferta() {
  let s = 0;
  for (let i = 1; i <= filas; i++) s += basesOferta[i] || 0;
  return s;
}

function getTotalDemanda() {
  let s = 0;
  for (let j = 1; j <= cols; j++) s += basesDemanda[j] || 0;
  return s;
}

function verificarFicticio() {
  const sumOf = getTotalOferta();
  const sumDem = getTotalDemanda();
  const diff = sumOf - sumDem;

  colFicticia  = diff > 0;
  filaFicticia = diff < 0;

  if (diff > 0)      setMensaje(`Oferta (${sumOf}) > Demanda (${sumDem}). Se agrega Destino Ficticio con demanda ${diff}.`, 'warn');
  else if (diff < 0) setMensaje(`Demanda (${sumDem}) > Oferta (${sumOf}). Se agrega Origen Ficticio con oferta ${Math.abs(diff)}.`, 'warn');
  else               setMensaje('Problema equilibrado.', 'ok');
}

function recalcular() {
  const totalCols  = cols  + (colFicticia  ? 1 : 0);
  const totalFilas = filas + (filaFicticia ? 1 : 0);

  for (let i = 1; i <= totalFilas; i++) {
    const inpOf = document.querySelector(`#tabla input[data-tipo="oferta"][data-fila="${i}"]`);
    if (!inpOf) continue;
    const base = parseFloat(inpOf.dataset.base) || 0;
    let usado = 0;
    for (let j = 1; j <= totalCols; j++) {
      const a = document.querySelector(`#tabla input[data-tipo="asign"][data-fila="${i}"][data-col="${j}"]`);
      usado += parseFloat(a?.value) || 0;
    }
    const rest = base - usado;
    inpOf.value = rest;
    inpOf.style.color = rest < 0 ? 'var(--danger)' : rest === 0 ? 'var(--accent2)' : 'var(--accent)';
  }

  for (let j = 1; j <= totalCols; j++) {
    const inpDem = document.querySelector(`#tabla input[data-tipo="demanda"][data-col="${j}"]`);
    if (!inpDem) continue;
    const base = parseFloat(inpDem.dataset.base) || 0;
    let usado = 0;
    for (let i = 1; i <= totalFilas; i++) {
      const a = document.querySelector(`#tabla input[data-tipo="asign"][data-fila="${i}"][data-col="${j}"]`);
      usado += parseFloat(a?.value) || 0;
    }
    const rest = base - usado;
    inpDem.value = rest;
    inpDem.style.color = rest < 0 ? 'var(--danger)' : rest === 0 ? 'var(--accent2)' : 'var(--accent2)';
  }
}

function crearTh(tr, texto, cls) {
  const el = document.createElement('th');
  el.textContent = texto;
  if (cls) el.className = cls;
  tr.appendChild(el);
}

function addFila() {
  if (!desbloqueado) return;
  filas++;
  nombresOrigen[filas]  = `Origen ${filas}`;
  basesOferta[filas]    = 100;
  verificarFicticio();
  construirTabla();
}

function remFila() {
  if (!desbloqueado || filas <= 2) return;
  delete nombresOrigen[filas];
  delete basesOferta[filas];
  filas--;
  verificarFicticio();
  construirTabla();
}

function addCol() {
  if (!desbloqueado) return;
  cols++;
  nombresDestino[cols] = `Destino ${cols}`;
  basesDemanda[cols]   = 100;
  verificarFicticio();
  construirTabla();
}

function remCol() {
  if (!desbloqueado || cols <= 2) return;
  delete nombresDestino[cols];
  delete basesDemanda[cols];
  cols--;
  verificarFicticio();
  construirTabla();
}

function reiniciar() {
  if (!desbloqueado) return;
  filas = 3; cols = 3;
  nombresOrigen = {}; nombresDestino = {};
  basesOferta   = {}; basesDemanda   = {};
  costos = {}; asignaciones = {};
  colFicticia = false; filaFicticia = false;
  construirTabla();
  setMensaje('Tabla reiniciada.', 'ok');
}

function setMensaje(txt, tipo) {
  const el = document.getElementById('mensaje');
  el.textContent = txt;
  el.className = tipo || '';
}

function abrirSelectorMetodo() {
  document.getElementById('modalMetodo').style.display = 'flex';
}

function cerrarSelectorMetodo() {
  document.getElementById('modalMetodo').style.display = 'none';
}

function resolverAutomatico(metodo) {
  cerrarSelectorMetodo();
  
  if (metodo === 'noroeste') {
    resolverEsquinaNoreste();
  } else if (metodo === 'costo-minimo') {
    resolverCostoMinimo();
  } else if (metodo === 'vogel') {
    resolverVogel();
  }
}

function mostrarResultado(costoTotal, metodo = '') {
  const resultDiv = document.getElementById('resultado');
  const totalFilas = filas + (filaFicticia ? 1 : 0);
  const totalCols = cols + (colFicticia ? 1 : 0);

  let html = `<div class="resultado-content">
    <h3>Resultado Final${metodo ? ` - ${metodo}` : ''}</h3>
    <table class="resultado-tabla">
      <thead>
        <tr>
          <th>Origen</th>
          <th>Destino</th>
          <th>Cantidad</th>
          <th>Costo Unitario</th>
          <th>Costo Total</th>
        </tr>
      </thead>
      <tbody>`;

  let costoTotalGlobal = 0;

  for (let i = 1; i <= totalFilas; i++) {
    for (let j = 1; j <= totalCols; j++) {
      const asign = parseFloat(document.querySelector(`#tabla input[data-tipo="asign"][data-fila="${i}"][data-col="${j}"]`)?.value) || 0;
      if (asign > 0) {
        const costo = parseFloat(document.querySelector(`#tabla input[data-tipo="costo"][data-fila="${i}"][data-col="${j}"]`)?.value) || 0;
        const costoFila = asign * costo;
        costoTotalGlobal += costoFila;

        let nomOrigen = nombresOrigen[i];
        let nomDestino = nombresDestino[j];
        
        if (i > filas) nomOrigen = 'Origen Ficticio';
        if (j > cols) nomDestino = 'Destino Ficticio';

        html += `<tr>
          <td>${nomOrigen}</td>
          <td>${nomDestino}</td>
          <td>${asign}</td>
          <td>${costo}</td>
          <td>${costoFila}</td>
        </tr>`;
      }
    }
  }

  html += `</tbody>
    </table>
    <div class="resultado-total">
      <strong>COSTO TOTAL: ${costoTotalGlobal}</strong>
    </div>
  </div>`;

  resultDiv.innerHTML = html;
}

function mostrarResultadoVogel(costoTotal, logIteraciones) {
  const resultDiv = document.getElementById('resultado');
  const totalFilas = filas + (filaFicticia ? 1 : 0);
  const totalCols = cols + (colFicticia ? 1 : 0);

  let html = `<div class="resultado-content">
    <h3>Resultado Final - Método de Vogel</h3>
    
    <!-- TABLA ASIGNACIONES -->
    <table class="resultado-tabla">
      <thead>
        <tr>
          <th>Origen</th>
          <th>Destino</th>
          <th>Cantidad</th>
          <th>Costo Unitario</th>
          <th>Costo Total</th>
        </tr>
      </thead>
      <tbody>`;

  let costoTotalGlobal = 0;

  for (let i = 1; i <= totalFilas; i++) {
    for (let j = 1; j <= totalCols; j++) {
      const asign = parseFloat(document.querySelector(`#tabla input[data-tipo="asign"][data-fila="${i}"][data-col="${j}"]`)?.value) || 0;
      if (asign > 0) {
        const costo = parseFloat(document.querySelector(`#tabla input[data-tipo="costo"][data-fila="${i}"][data-col="${j}"]`)?.value) || 0;
        const costoFila = asign * costo;
        costoTotalGlobal += costoFila;

        let nomOrigen = nombresOrigen[i];
        let nomDestino = nombresDestino[j];
        
        if (i > filas) nomOrigen = 'Origen Ficticio';
        if (j > cols) nomDestino = 'Destino Ficticio';

        html += `<tr>
          <td>${nomOrigen}</td>
          <td>${nomDestino}</td>
          <td>${asign}</td>
          <td>${costo}</td>
          <td>${costoFila}</td>
        </tr>`;
      }
    }
  }

  html += `</tbody>
    </table>
    <div class="resultado-total">
      <strong>COSTO TOTAL: ${costoTotalGlobal}</strong>
    </div>

    <!-- HISTORIAL DE PENALIZACIONES -->
    <div class="vogel-penalizaciones">
      <h4>Análisis de Penalizaciones por Iteración</h4>
      <div class="iteraciones-list">`;

  logIteraciones.forEach(log => {
    html += `<div class="iteracion-card">
      <div class="iter-header">
        <strong>Iteración ${log.iteracion}</strong>
        <span class="iter-decision">${log.decisor}</span>
      </div>
      
      <div class="iter-penalizaciones">
        <div class="pen-filas">
          <strong>Penalizaciones Filas:</strong>
          <div class="pen-valores">`;
      
      Object.entries(log.penFilas).forEach(([fil, pen]) => {
        const esFicticia = parseInt(fil) > filas;
        const nombreFila = esFicticia ? 'Origen Ficticio' : (nombresOrigen[fil] || `Origen ${fil}`);
        const highlight = log.decisor === 'FILA' && parseInt(fil) === log.filaSeleccionada ? ' highlight' : '';
        html += `<span class="pen-badge${highlight}">
          <small>${nombreFila}</small>: <strong>${pen.toFixed(2)}</strong>
        </span>`;
      });

      html += `</div>
        </div>
        
        <div class="pen-cols">
          <strong>Penalizaciones Columnas:</strong>
          <div class="pen-valores">`;
      
      Object.entries(log.penCols).forEach(([col, pen]) => {
        const esFicticia = parseInt(col) > cols;
        const nombreCol = esFicticia ? 'Destino Ficticio' : (nombresDestino[col] || `Destino ${col}`);
        const highlight = log.decisor === 'COLUMNA' && parseInt(col) === log.colSeleccionada ? ' highlight' : '';
        html += `<span class="pen-badge${highlight}">
          <small>${nombreCol}</small>: <strong>${pen.toFixed(2)}</strong>
        </span>`;
      });

      html += `</div>
        </div>
      </div>
      
      <div class="iter-asignacion">
        <strong>✓ Celda Seleccionada:</strong> ${nombresOrigen[log.filaSeleccionada] || `Origen ${log.filaSeleccionada}`} → ${nombresDestino[log.colSeleccionada] || `Destino ${log.colSeleccionada}`}
        <br />
        <strong>Cantidad:</strong> ${log.cantidad} | <strong>Costo Unit:</strong> ${log.costo} | <strong>Subtotal:</strong> ${log.cantidad * log.costo}
      </div>
    </div>`;
  });

  html += `</div>
    </div>
  </div>`;

  resultDiv.innerHTML = html;
}

/* ── INIT ── */
construirTabla();
