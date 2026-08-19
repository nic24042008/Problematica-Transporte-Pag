// ═══════════════════════════════════════════════════════════════════
// MÓDULO VOGEL - Algoritmo de aproximación de Vogel
// ═══════════════════════════════════════════════════════════════════

function resolverVogel() {
  const totalFilas = filas + (filaFicticia ? 1 : 0);
  const totalCols = cols + (colFicticia ? 1 : 0);

  // ── Limpiar asignaciones previas ──
  for (let i = 1; i <= totalFilas; i++) {
    for (let j = 1; j <= totalCols; j++) {
      const inpAsign = document.querySelector(`#tabla input[data-tipo="asign"][data-fila="${i}"][data-col="${j}"]`);
      if (inpAsign) inpAsign.value = '';
    }
  }
  asignaciones = {};

  // ── Crear matriz de oferta disponible ──
  const ofertaDisp = {};
  for (let i = 1; i <= totalFilas; i++) {
    const inpOf = document.querySelector(`#tabla input[data-tipo="oferta"][data-fila="${i}"]`);
    ofertaDisp[i] = parseFloat(inpOf?.dataset.base) || 0;
  }

  // ── Crear matriz de demanda disponible ──
  const demandaDisp = {};
  for (let j = 1; j <= totalCols; j++) {
    const inpDem = document.querySelector(`#tabla input[data-tipo="demanda"][data-col="${j}"]`);
    demandaDisp[j] = parseFloat(inpDem?.dataset.base) || 0;
  }

  // ── Crear matriz de costos ──
  const costosMatriz = {};
  for (let i = 1; i <= totalFilas; i++) {
    for (let j = 1; j <= totalCols; j++) {
      const inpCosto = document.querySelector(`#tabla input[data-tipo="costo"][data-fila="${i}"][data-col="${j}"]`);
      costosMatriz[`${i}-${j}`] = parseFloat(inpCosto?.value) || 0;
    }
  }

  // ── Inicializar filas y columnas activas ──
  const filasActivas = new Set(Array.from({length: totalFilas}, (_, i) => i + 1));
  const colsActivas = new Set(Array.from({length: totalCols}, (_, i) => i + 1));

  let costoTotal = 0;
  let logIteraciones = []; // Guardar penalizaciones de cada iteración

  // ═══════════════════════════════════════════════════════════════════
  // CICLO PRINCIPAL DE VOGEL
  // ═══════════════════════════════════════════════════════════════════

  let iteracion = 0;
  while (filasActivas.size > 0 && colsActivas.size > 0) {
    iteracion++;

    // 1️⃣ CALCULAR PENALIZACIONES
    const penFilas = calcularPenalizacionesFilas(filasActivas, colsActivas, costosMatriz);
    const penCols = calcularPenalizacionesCols(filasActivas, colsActivas, costosMatriz);

    // 2️⃣ ENCONTRAR MÁXIMA PENALIZACIÓN
    const maxPenFila = Math.max(...Object.values(penFilas));
    const maxPenCol = Math.max(...Object.values(penCols));

    let filaSeleccionada, colSeleccionada;
    let decisor = '';

    // 3️⃣ DECIDIR: ¿FILA O COLUMNA TIENE MAYOR PENALIZACIÓN?
    if (maxPenFila >= maxPenCol) {
      decisor = 'FILA';
      // ── La máxima penalización está en una FILA ──
      filaSeleccionada = Object.keys(penFilas).find(f => penFilas[f] === maxPenFila);
      filaSeleccionada = parseInt(filaSeleccionada);

      // Buscar COSTO MÍNIMO dentro de esa fila
      let costoMin = Infinity;
      for (const j of colsActivas) {
        const costo = costosMatriz[`${filaSeleccionada}-${j}`];
        if (costo < costoMin) {
          costoMin = costo;
          colSeleccionada = j;
        }
      }

    } else {
      decisor = 'COLUMNA';
      // ── La máxima penalización está en una COLUMNA ──
      colSeleccionada = Object.keys(penCols).find(c => penCols[c] === maxPenCol);
      colSeleccionada = parseInt(colSeleccionada);

      // Buscar COSTO MÍNIMO dentro de esa columna
      let costoMin = Infinity;
      for (const i of filasActivas) {
        const costo = costosMatriz[`${i}-${colSeleccionada}`];
        if (costo < costoMin) {
          costoMin = costo;
          filaSeleccionada = i;
        }
      }
    }

    // 4️⃣ CALCULAR CANTIDAD A ASIGNAR
    const cantidad = Math.min(
      ofertaDisp[filaSeleccionada],
      demandaDisp[colSeleccionada]
    );

    // Guardar en log de iteración
    logIteraciones.push({
      iteracion,
      penFilas: {...penFilas},
      penCols: {...penCols},
      maxPenFila,
      maxPenCol,
      decisor,
      filaSeleccionada,
      colSeleccionada,
      cantidad,
      costo: costosMatriz[`${filaSeleccionada}-${colSeleccionada}`]
    });

    if (cantidad > 0) {
      // ── Actualizar en la tabla HTML ──
      const inpAsign = document.querySelector(
        `#tabla input[data-tipo="asign"][data-fila="${filaSeleccionada}"][data-col="${colSeleccionada}"]`
      );
      inpAsign.value = cantidad;
      asignaciones[`${filaSeleccionada}-${colSeleccionada}`] = cantidad;

      // ── Calcular contribución al costo total ──
      const costo = costosMatriz[`${filaSeleccionada}-${colSeleccionada}`];
      costoTotal += cantidad * costo;

      // 5️⃣ ACTUALIZAR DISPONIBILIDADES
      ofertaDisp[filaSeleccionada] -= cantidad;
      demandaDisp[colSeleccionada] -= cantidad;

      // 6️⃣ ELIMINAR FILAS/COLUMNAS AGOTADAS
      if (ofertaDisp[filaSeleccionada] === 0) {
        filasActivas.delete(filaSeleccionada);
      }
      if (demandaDisp[colSeleccionada] === 0) {
        colsActivas.delete(colSeleccionada);
      }
    }
  }

  recalcular();
  mostrarResultadoVogel(costoTotal, logIteraciones);
  setMensaje('Problema resuelto con Método de Vogel.', 'ok');
}

/**
 * Calcula las penalizaciones para todas las filas activas
 * Penalización = (2do costo mínimo) - (costo mínimo)
 */
function calcularPenalizacionesFilas(filasActivas, colsActivas, costosMatriz) {
  const penalizaciones = {};

  // Para CADA fila activa
  for (const i of filasActivas) {
    // Obtener todos los costos de esa fila (solo columnas activas)
    const costos = [];
    for (const j of colsActivas) {
      costos.push(costosMatriz[`${i}-${j}`]);
    }

    // Ordenar costos de menor a mayor
    costos.sort((a, b) => a - b);

    // Penalización = 2do costo - 1er costo (2do mínimo - mínimo)
    if (costos.length >= 2) {
      penalizaciones[i] = costos[1] - costos[0];
    } else if (costos.length === 1) {
      // Si solo hay una columna, la penalización es 0
      penalizaciones[i] = 0;
    }
  }

  return penalizaciones;
}

/**
 * Calcula las penalizaciones para todas las columnas activas
 * Penalización = (2do costo mínimo) - (costo mínimo)
 */
function calcularPenalizacionesCols(filasActivas, colsActivas, costosMatriz) {
  const penalizaciones = {};

  // Para CADA columna activa
  for (const j of colsActivas) {
    // Obtener todos los costos de esa columna (solo filas activas)
    const costos = [];
    for (const i of filasActivas) {
      costos.push(costosMatriz[`${i}-${j}`]);
    }

    // Ordenar costos de menor a mayor
    costos.sort((a, b) => a - b);

    // Penalización = 2do costo - 1er costo (2do mínimo - mínimo)
    if (costos.length >= 2) {
      penalizaciones[j] = costos[1] - costos[0];
    } else if (costos.length === 1) {
      // Si solo hay una fila, la penalización es 0
      penalizaciones[j] = 0;
    }
  }

  return penalizaciones;
}