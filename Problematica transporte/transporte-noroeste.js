// ═══════════════════════════════════════════════════════════════════
// MÓDULO ESQUINA NOROESTE - Algoritmo de esquina noroeste
// ═══════════════════════════════════════════════════════════════════

function resolverEsquinaNoreste() {
  const totalFilas = filas + (filaFicticia ? 1 : 0);
  const totalCols = cols + (colFicticia ? 1 : 0);


  for (let i = 1; i <= totalFilas; i++) {
    for (let j = 1; j <= totalCols; j++) {
      const inpAsign = document.querySelector(`#tabla input[data-tipo="asign"][data-fila="${i}"][data-col="${j}"]`);
      if (inpAsign) inpAsign.value = '';
    }
  }
  asignaciones = {};


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

  let costoTotal = 0;
  let i = 1, j = 1;


  while (i <= totalFilas && j <= totalCols) {
    const cantidad = Math.min(ofertaDisp[i], demandaDisp[j]);
    
    if (cantidad > 0) {
      const inpAsign = document.querySelector(`#tabla input[data-tipo="asign"][data-fila="${i}"][data-col="${j}"]`);
      const inpCosto = document.querySelector(`#tabla input[data-tipo="costo"][data-fila="${i}"][data-col="${j}"]`);
      
      inpAsign.value = cantidad;
      asignaciones[`${i}-${j}`] = cantidad;

      const costo = parseFloat(inpCosto?.value) || 0;
      costoTotal += cantidad * costo;

      ofertaDisp[i] -= cantidad;
      demandaDisp[j] -= cantidad;
    }

    if (ofertaDisp[i] === 0) {
      i++;
    } else {
      j++;
    }
  }

  recalcular();
  mostrarResultado(costoTotal, 'Esquina Noroeste');
  setMensaje('Problema resuelto con Esquina Noroeste.', 'ok');
}
