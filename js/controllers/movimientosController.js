
import { obtenerUsuarios } from "../services/usuariosService.js";
import { obtenerCuentasPorUsuario } from "../services/cuentasService.js";
import {
  obtenerMovimientosPorCuenta, obtenerResumen, crearMovimiento, actualizarMovimiento, eliminarMovimiento,
} from "../services/movimientosService.js";

const INGRESO = "INGRESO"; 
const GASTO = "GASTO";

const ERROR_CONEXION = "No se pudo conectar con el servidor ¿Esta corriendo la API??";

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

function parametroUrl(nombre) {
  return new URLSearchParams(window.location.search).get(nombre);
}
 //dom
const selectUsuario = document.getElementById("selectUsuario");
const selectCuenta = document.getElementById("selectCuenta");
const btnNuevo = document.getElementById("btnNuevo");
const tabla = document.getElementById("tablaMovimientos");
const totalIngresos = document.getElementById("totalIngresos");
const totalGastos = document.getElementById("totalGastos");
const saldoActual = document.getElementById("saldoActual");
const avisoCuenta = document.getElementById("avisoCuenta");

const filtroTipo = document.getElementById("filtroTipo");
const filtroCategoria = document.getElementById("filtroCategoria");
const filtroDesde = document.getElementById("filtroDesde");
const filtroHasta = document.getElementById("filtroHasta");

const form = document.getElementById("formMovimiento");
const modal = new bootstrap.Modal(document.getElementById("modalMovimiento"));
const tituloModal = document.getElementById("tituloModal");
const inputId = document.getElementById("idMovimiento");
const inputFecha = document.getElementById("fecha");
const selectTipo = document.getElementById("tipo");
const inputCategoria = document.getElementById("categoria");
const inputDescripcion = document.getElementById("descripcion");
const inputMonto = document.getElementById("monto");

let cuentas = [];
let movimientos = [];

const cuentaSeleccionada = () => cuentas.find((c) => String(c.idCuenta) === selectCuenta.value);

async function cargarUsuarios() {
  const resultado = await obtenerUsuarios();
  selectUsuario.innerHTML = '<option value="">Seleccione un usuario:</option>' +
    (resultado.data ?? []).map((u) => `<option value="${u.idUsuario}">${escapar(u.nombre)}</option>`).join("");
  const usuarioUrl = parametroUrl("usuario");
  if (usuarioUrl) {
    selectUsuario.value = usuarioUrl;
    await cargarCuentas();
  }
}

async function cargarCuentas() {
  cuentas = [];
  selectCuenta.innerHTML = '<option value="">Seleccione una cuenta...</option>';
  if (selectUsuario.value) {
    const resultado = await obtenerCuentasPorUsuario(selectUsuario.value);
    cuentas = resultado.success ? resultado.data : [];
    selectCuenta.innerHTML += cuentas.map((c) =>
      `<option value="${c.idCuenta}">${escapar(c.nombre)} (${escapar(c.tipo)})${estaActiva(c.activa) ? "" : " - inactiva"}</option>`).join("");
  }
  const cuentaUrl = parametroUrl("cuenta");
  if (cuentaUrl && selectCuenta.value === "") selectCuenta.value = cuentaUrl;
  await cargarTodo();
}

async function cargarTodo() {
  const cuenta = cuentaSeleccionada();
  btnNuevo.disabled = !cuenta || !estaActiva(cuenta.activa);
  avisoCuenta.classList.toggle("d-none", !cuenta || estaActiva(cuenta.activa));

  if (!cuenta) {
    movimientos = [];
    totalIngresos.textContent = totalGastos.textContent = saldoActual.textContent = dinero(0);
    renderTabla();
    return;
  }
  try {
    const filtros = {
      tipo: filtroTipo.value,
      categoria: filtroCategoria.value.trim(),
      desde: filtroDesde.value,
      hasta: filtroHasta.value,
    };
    const [resMovs, resResumen] = await Promise.all([
      obtenerMovimientosPorCuenta(cuenta.idCuenta, filtros),
      obtenerResumen(cuenta.idCuenta),
    ]);
    movimientos = resMovs.success ? resMovs.data : [];
    if (!resMovs.success) mostrarAlerta(resMovs.message, "danger");
    if (resResumen.success) {
      totalIngresos.textContent = dinero(resResumen.data.totalIngresos);
      totalGastos.textContent = dinero(resResumen.data.totalGastos);
      saldoActual.textContent = dinero(resResumen.data.saldoActual);
    }
    renderTabla();
  } catch (error) {
    mostrarAlerta(ERROR_CONEXION, "danger");
  }
}

function renderTabla() {
  if (!selectCuenta.value) {
    tabla.innerHTML = '<tr><td colspan="6"><div class="vacio"><i class="bi bi-wallet2"></i>Seleccione un usuario y una cuenta</div></td></tr>';
    return;
  }
  if (movimientos.length === 0) {
    tabla.innerHTML = '<tr><td colspan="6"><div class="vacio"><i class="bi bi-inbox"></i>No hay movimientos para mostrar</div></td></tr>';
    return;
  }
  tabla.innerHTML = movimientos.map((m) => {
    const esIngreso = m.tipo === INGRESO;
    return `
    <tr>
      <td>${soloFecha(m.fecha)}</td>
      <td><span class="badge ${esIngreso ? "bg-success" : "bg-danger"}">${escapar(m.tipo)}</span></td>
      <td>${escapar(m.categoria)}</td>
      <td>${escapar(m.descripcion)}</td>
      <td class="${esIngreso ? "monto-ingreso" : "monto-gasto"}">${esIngreso ? "+" : "-"}${dinero(m.monto)}</td>
      <td class="text-end text-nowrap">
        <button class="btn btn-sm btn-outline-primary" data-accion="editar" data-id="${m.idMovimiento}"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger" data-accion="eliminar" data-id="${m.idMovimiento}"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`;
  }).join("");
}

function validarFormulario() {
  const errores = [];
  if (!inputFecha.value) errores.push("La fecha es obligatoria");
  if (!selectTipo.value) errores.push("Seleccione el tipo ingreso o gasto ");
  if (!inputCategoria.value.trim()) errores.push("la categoria es obligatoria");
  if (inputMonto.value === "" || isNaN(Number(inputMonto.value)) || Number(inputMonto.value) <= 0)
    errores.push("el monto debe ser un número mayor a 0");
  return errores;
}

selectUsuario.addEventListener("change", cargarCuentas);
selectCuenta.addEventListener("change", cargarTodo);


form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errores = validarFormulario();
  if (errores.length > 0) {
    mostrarAlerta(errores.join(" "), "warning");
    return;
  }

  const movimiento = {
    idCuenta: Number(selectCuenta.value),
    fecha: inputFecha.value,
    tipo: selectTipo.value,
    categoria: inputCategoria.value.trim(),
    descripcion: inputDescripcion.value.trim(),
    monto: Number(inputMonto.value),
  };

  try {
    const resultado = inputId.value
      ? await actualizarMovimiento(inputId.value, movimiento)
      : await crearMovimiento(movimiento);

    if (resultado.success) {
      modal.hide();
      mostrarResultado(resultado);
      await cargarTodo();
    } else {
      mostrarResultado(resultado);
    }
  } catch (error) {
    mostrarAlerta(ERROR_CONEXION, "danger");
  }
});

tabla.addEventListener("click", async (e) => {
  const boton = e.target.closest("button[data-accion]");
  if (!boton) return;
  const id = Number(boton.dataset.id); 
});