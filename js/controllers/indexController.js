import { obtenerUsuarios, obtenerUsuarioPorId, eliminarUsuario } from "../services/usuariosService.js";
import { obtenerCuentasPorUsuario } from "../services/cuentasService.js";

const ERROR_CONEXION = "No se pudo conectar con el servidor. ¿Está corriendo la API?";

const ACTIVA_SI = "S";
const ACTIVA_NO = "N";
const estaActiva = (valor) => valor === ACTIVA_SI;

function mostrarAlerta(mensaje, tipo = "success") {
  const contenedor = document.getElementById("contenedorAlertas");
  const div = document.createElement("div");
  div.className = `alert alert-${tipo} alert-dismissible fade show shadow`;
  const texto = document.createElement("span");
  texto.textContent = mensaje;
  div.appendChild(texto);
  div.insertAdjacentHTML("beforeend", '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>');
  contenedor.appendChild(div);
  setTimeout(() => div.remove(), 5000);
}


function mostrarResultado(resultado) {
  mostrarAlerta(resultado.message, resultado.success ? "success" : "danger");
}

function escapar(texto) {
  const d = document.createElement("div");
  d.textContent = texto ?? "";
  return d.innerHTML;
}

function dinero(valor) {
  return "$" + Number(valor ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function soloFecha(fecha) {
  return fecha ? String(fecha).slice(0, 10) : "";
}

const tabla = document.getElementById("tablaUsuarios");
const buscador = document.getElementById("buscador");
const totalUsuarios = document.getElementById("totalUsuarios");
const detalleBody = document.getElementById("detalleBody");
const modalDetalle = new bootstrap.Modal(document.getElementById("modalDetalle"));

let usuarios = [];

function renderTabla(lista) {
  if (lista.length === 0) {
    tabla.innerHTML = '<tr><td colspan="4"><div class="vacio"><i class="bi bi-people"></i>No se encontraron usuarios</div></td></tr>';
    return;
  }
  tabla.innerHTML = lista.map((u) => `
    <tr>
      <td>
        <div class="d-flex align-items-center gap-2">
          <div class="avatar">${escapar((u.nombre ?? "?").charAt(0).toUpperCase())}</div>
          <div><div class="fw-semibold">${escapar(u.nombre)}</div><small class="text-muted">ID ${u.idUsuario}</small></div>
        </div>
      </td>
      <td>${escapar(u.correo)}</td>
      <td>${soloFecha(u.fechaRegistro)}</td>
      <td class="text-end text-nowrap">
        <button class="btn btn-sm btn-outline-primary" data-accion="ver" data-id="${u.idUsuario}"><i class="bi bi-eye"></i> Ver cuentas</button>
        <a class="btn btn-sm btn-outline-secondary" href="cuentas.html?usuario=${u.idUsuario}"><i class="bi bi-bank"></i> Administrar</a>
        <button class="btn btn-sm btn-outline-danger" data-accion="eliminar" data-id="${u.idUsuario}"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join("");
}

async function cargarUsuarios() {
  try {
    const resultado = await obtenerUsuarios();
    if (resultado.success) {
      usuarios = resultado.data;
      totalUsuarios.textContent = usuarios.length;
      renderizarTabla(usuarios);
    } else {
      mostrarAlerta(resultado.message, "danger");
    }
  } catch (error) {
    mostrarAlerta(ERROR_CONEXION, "danger");
  }
}

async function verDetalle(id) {
  try {
    const [resUsuario, resCuentas] = await Promise.all([obtenerUsuarioPorId(id), obtenerCuentasPorUsuario(id)]);
    if (!resUsuario.success) {
      mostrarAlerta(resUsuario.message, "danger");
      return;
    }
    const u = resUsuario.data;
    const cuentas = resCuentas.success ? resCuentas.data : [];
    const lista = cuentas.length === 0
      ? '<p class="text-muted">Este usuario aún no tiene cuentas.</p>'
      : `<ul class="list-group">${cuentas.map((c) => `
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <span><b>${escapar(c.nombre)}</b> <span class="badge badge-tipo">${escapar(c.tipo)}</span></span>
            <span>${dinero(c.saldoActual)}
              <span class="badge ${estaActiva(c.activa) ? "bg-success" : "bg-secondary"}">${estaActiva(c.activa) ? "Activa" : "Inactiva"}</span>
            </span>
          </li>`).join("")}</ul>`;
    detalleBody.innerHTML = `
      <h5 class="mb-1">${escapar(u.nombre)}</h5>
      <p class="text-muted mb-3"><i class="bi bi-envelope"></i> ${escapar(u.correo)} &nbsp; <i class="bi bi-calendar3"></i> ${soloFecha(u.fechaRegistro)}</p>
      <h6>Cuentas asociadas (${cuentas.length})</h6>
      ${lista}
      <a class="btn btn-fin mt-3" href="cuentas.html?usuario=${u.idUsuario}"><i class="bi bi-bank"></i> Administrar cuentas</a>`;
    modalDetalle.show();
  } catch (error) {
    mostrarAlerta(ERROR_CONEXION, "danger");
  }
}

buscador.addEventListener("input", () => {
  const texto = buscador.value.toLowerCase().trim();
  renderTabla(usuarios.filter((u) =>
    (u.nombre ?? "").toLowerCase().includes(texto) || (u.correo ?? "").toLowerCase().includes(texto)));
});

tabla.addEventListener("click", async (e) => {
  const boton = e.target.closest("button[data-accion]");
  if (!boton) return;
  const id = Number(boton.dataset.id);

  if (boton.dataset.accion === "ver") await verDetalle(id);

  if (boton.dataset.accion === "eliminar") {
    if (!confirm("¿Eliminar este usuario? Solo se puede si no tiene cuentas.")) return;
    try {
      const resultado = await eliminarUsuario(id);
      mostrarResultado(resultado);
      if (resultado.success) await cargarUsuarios();
    } catch (error) {
      mostrarAlerta(ERROR_CONEXION, "danger");
    }
  }
});

cargarUsuarios();
