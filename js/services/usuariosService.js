const API_URL = "http://localhost:8080/api/usuarios";

export async function obtenerUsuarios() {
  const respuesta = await fetch(API_URL);
  const resultado = await respuesta.json();
  return { status: respuesta.status, ...resultado };
}

export async function obtenerUsuarioPorId(id) {
  const respuesta = await fetch(`${API_URL}/${id}`);
  const resultado = await respuesta.json();
  return { status: respuesta.status, ...resultado };
}

export async function eliminarUsuario(id) {
  const respuesta = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  const resultado = await respuesta.json();
  return { status: respuesta.status, ...resultado };
}
