const API_URL = "http://localhost:8080/api/cuentas";

export async function obtenerCuentasPorUsuario(idUsuario) {
  const respuesta = await fetch(`${API_URL}/usuario/${idUsuario}`);
  const resultado = await respuesta.json();
  return { status: respuesta.status, ...resultado };
}

export async function obtenerCuentaPorId(id) {
  const respuesta = await fetch(`${API_URL}/${id}`);
  const resultado = await respuesta.json();
  return { status: respuesta.status, ...resultado };
}

export async function crearCuenta(cuenta) {
  const respuesta = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuenta),
  });
  const resultado = await respuesta.json();
  return { status: respuesta.status, ...resultado };
}

export async function actualizarCuenta(id, cuenta) {
  const respuesta = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuenta),
  });
  const resultado = await respuesta.json();
  return { status: respuesta.status, ...resultado };
}

export async function eliminarCuenta(id) {
  const respuesta = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  const resultado = await respuesta.json();
  return { status: respuesta.status, ...resultado };
}
