const API_URL = "http://localhost:8080/api/movimientos";

export async function obtenerMovimientosPorCuenta(idCuenta, filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor) params.append(clave, valor); 
  });
  const query = params.toString() ? `?${params}` : "";
  const respuesta = await fetch(`${API_URL}/cuenta/${idCuenta}${query}`);
  const resultado = await respuesta.json();
  return { status: respuesta.status, ...resultado };
}

//total de ingresp
export async function obtenerResumendeCuenta(idCuenta) {
  const respuesta = await fetch(`${API_URL}/cuenta/${idCuenta}/resumen`);
  const resultado = await respuesta.json();
  return { status: respuesta.status, ...resultado };
}

export async function obtenerMovimientoPorId(id) {
  const respuesta = await fetch(`${API_URL}/${id}`);
  const resultado = await respuesta.json();
  return { status: respuesta.status, ...resultado };
}

export async function crearMovimiento(movimiento) {
  const respuesta = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(movimiento),
  });
  const resultado = await respuesta.json();
  return { status: respuesta.status, ...resultado };
}

export async function actualizarMovimiento(id, movimiento) {
  const respuesta = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(movimiento),
  });
  const resultado = await respuesta.json();
  return { status: respuesta.status, ...resultado };
}

export async function eliminarMovimiento(id) {
  const respuesta = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  const resultado = await respuesta.json();
  return { status: respuesta.status, ...resultado };
}
