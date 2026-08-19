// ═══════════════════════════════════════════════════════════════════
// MÓDULO COSTO MÍNIMO - Algoritmo de costo mínimo
// ═══════════════════════════════════════════════════════════════════

function resolverCostoMinimo() {
  const totalFilas = filas + (filaFicticia ? 1 : 0);
  const totalCols = cols + (colFicticia ? 1 : 0);

  // Limpiar asignaciones previas
  for (let i = 1; i <= totalFilas; i++) {
    for (let j = 1; j <= totalCols; j++) {
      const inpAsign = document.querySelector(`#tabla input[data-tipo="asign"][data-fila="${i}"][data-col="${j}"]`);
      if (inpAsign) inpAsign.value = '';
    }
  }
  asignaciones = {};

  // Crear matriz de oferta/demanda disponible
  const ofertaDisp = {};
  for (let i = 1; i <= totalFilas; i++) {
    const inpOf = document.querySelector(`#tabla input[data-tipo="oferta"][data-fila="${i}"]`);
    ofertaDisp[i] = parseFloat(inpOf?.dataset.base) || 0;
  }

  const demandaDisp = {};
  for (let j = 1; j <= totalCols; j++) {
    const inpDem = document.querySelector(`#tabla input[data-tipo="demanda"][data-col="${j}"]`);
    demandaDisp[j] = parseFloat(inpDem?.dataset.base) || 0;
  }

  // Crear matriz de costos
  const costosMatriz = {};
  for (let i = 1; i <= totalFilas; i++) {
    for (let j = 1; j <= totalCols; j++) {
      const inpCosto = document.querySelector(`#tabla input[data-tipo="costo"][data-fila="${i}"][data-col="${j}"]`);
      costosMatriz[`${i}-${j}`] = parseFloat(inpCosto?.value) || 0;
    }
  }

  let costoTotal = 0;

  // Algoritmo de Costo Mínimo
  const celdasDisp = [];
  for (let i = 1; i <= totalFilas; i++) {
    for (let j = 1; j <= totalCols; j++) {
      celdasDisp.push({ i, j, costo: costosMatriz[`${i}-${j}`] });
    }
  }

  while (celdasDisp.length > 0 && Object.values(ofertaDisp).some(v => v > 0)) {
    // Ordenar celdas por costo
    celdasDisp.sort((a, b) => a.costo - b.costo);

    const celdaMin = celdasDisp.shift();
    const i = celdaMin.i;
    const j = celdaMin.j;

    if (ofertaDisp[i] > 0 && demandaDisp[j] > 0) {
      const cantidad = Math.min(ofertaDisp[i], demandaDisp[j]);

      const inpAsign = document.querySelector(`#tabla input[data-tipo="asign"][data-fila="${i}"][data-col="${j}"]`);
      inpAsign.value = cantidad;
      asignaciones[`${i}-${j}`] = cantidad;

      costoTotal += cantidad * celdaMin.costo;

      ofertaDisp[i] -= cantidad;
      demandaDisp[j] -= cantidad;
    }
  }

  recalcular();
  mostrarResultado(costoTotal, 'Costo Mínimo');
  setMensaje('Problema resuelto con Costo Mínimo.', 'ok');
}
