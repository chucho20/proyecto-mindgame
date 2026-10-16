
/**
 * M.T.P.A. - Servicio de Integración IoT
 * Utilidades para calcular y agrupar estadísticas.
 *
 * IMPORTANTE:
 * Estas fórmulas deben mantenerse iguales que las utilizadas
 * en el backend para garantizar que ambos resultados coincidan.
 */

/**
 * Combina una lista de estadísticas numéricas.
 *
 * @param {Array<Object>} lista - Registros con el campo valor.
 * @returns {{cantidad: number, promedio: number, maximo: number,
 * minimo: number, desviacion: number}|null}
 */
export function combinarEstadisticas(lista) {
  if (!Array.isArray(lista) || lista.length === 0) {
    return null;
  }

  const valores = lista.map((item) => {
    const valor = Number(item.valor);

    if (!Number.isFinite(valor)) {
      throw new Error(
        "Cada estadística debe contener un valor numérico válido."
      );
    }

    return valor;
  });

  const cantidad = valores.length;

  const suma = valores.reduce(
    (acumulado, valor) => acumulado + valor,
    0
  );

  const promedio = suma / cantidad;
  const maximo = Math.max(...valores);
  const minimo = Math.min(...valores);

  // Desviación estándar poblacional.
  const sumaCuadrados = valores.reduce(
    (acumulado, valor) =>
      acumulado + Math.pow(valor - promedio, 2),
    0
  );

  const desviacion = Math.sqrt(sumaCuadrados / cantidad);

  return {
    cantidad,
    promedio,
    maximo,
    minimo,
    desviacion,
  };
}

/**
 * Obtiene la clave del período de una fecha YYYY-MM-DD.
 *
 * Día:    YYYY-MM-DD
 * Semana: YYYY-Www (semana ISO)
 * Mes:    YYYY-MM
 */
function obtenerClavePeriodo(fecha, periodo) {
  if (typeof fecha !== "string") {
    throw new Error(
      "La fecha debe ser un texto con formato YYYY-MM-DD."
    );
  }

  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);

  if (!coincidencia) {
    throw new Error(`Fecha no válida: ${fecha}`);
  }

  const anio = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const dia = Number(coincidencia[3]);

  const fechaUTC = new Date(
    Date.UTC(anio, mes - 1, dia)
  );

  if (
    fechaUTC.getUTCFullYear() !== anio ||
    fechaUTC.getUTCMonth() !== mes - 1 ||
    fechaUTC.getUTCDate() !== dia
  ) {
    throw new Error(`Fecha no válida: ${fecha}`);
  }

  if (periodo === "día") {
    return fecha;
  }

  if (periodo === "mes") {
    return `${anio}-${String(mes).padStart(2, "0")}`;
  }

  if (periodo === "semana") {
    // La semana ISO comienza el lunes.
    // El jueves determina el año ISO al que pertenece la semana.
    const diaSemana = fechaUTC.getUTCDay() || 7;

    fechaUTC.setUTCDate(
      fechaUTC.getUTCDate() + 4 - diaSemana
    );

    const anioISO = fechaUTC.getUTCFullYear();

    const inicioAnioISO = new Date(
      Date.UTC(anioISO, 0, 1)
    );

    const semana = Math.ceil(
      (
        (fechaUTC - inicioAnioISO) / 86400000 + 1
      ) / 7
    );

    return `${anioISO}-W${String(semana).padStart(2, "0")}`;
  }

  throw new Error(
    'Período no válido. Utiliza "día", "semana" o "mes".'
  );
}

/**
 * Agrupa estadísticas diarias por día, semana ISO o mes.
 *
 * @param {Array<Object>} estadisticasDiarias
 *   Registros con fecha y valor.
 * @param {"día"|"semana"|"mes"} periodo
 * @returns {Array<Object>}
 *
 * Cada resultado contiene la clave del período y los
 * valores calculados por combinarEstadisticas.
 *
 * IMPORTANTE:
 * Mantener las mismas fórmulas y reglas de agrupación
 * que el cálculo equivalente del backend.
 */
export function agruparPorPeriodo(
  estadisticasDiarias,
  periodo
) {
  if (!Array.isArray(estadisticasDiarias)) {
    throw new Error(
      "Las estadísticas diarias deben ser un arreglo."
    );
  }

  const grupos = new Map();

  for (const estadistica of estadisticasDiarias) {
    const clave = obtenerClavePeriodo(
      estadistica.fecha,
      periodo
    );

    if (!grupos.has(clave)) {
      grupos.set(clave, []);
    }

    grupos.get(clave).push(estadistica);
  }

  return Array.from(grupos.entries())
    .sort(([claveA], [claveB]) =>
      claveA.localeCompare(claveB)
    )
    .map(([periodoClave, registros]) => ({
      periodo: periodoClave,
      ...combinarEstadisticas(registros),
    }));
}
