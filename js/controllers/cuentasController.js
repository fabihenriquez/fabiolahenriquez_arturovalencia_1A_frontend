import { obtenerUsuarios } from "../services/usuariosService.js";
import { obtenerCuentasPorUsuario, crearCuenta, actualizarCuenta, eliminarCuenta } from "../services/cuentasService.js";

const TIPOS_CUENTA = ["EFECTIVO", "BANCARIA", "TARJETA"];


const ERROR_CONEXION = "no se pudo conectar con el servidor¿Esta corriendo la API?";

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


function parametroUrl(nombre) {
  return new URLSearchParams(window.location.search).get(nombre);
}


const selectUsuario = document.getElementById("selectUsuario");
const btnNueva = document.getElementById("btnNueva");
const tabla = document.getElementById("tablaCuentas");
const totalCuentas = document.getElementById("totalCuentas");
const saldoTotal = document.getElementById("saldoTotal");
const form = document.getElementById("formCuenta");
const modal = new bootstrap.Modal(document.getElementById("modalCuenta"));
const tituloModal = document.getElementById("tituloModal");

const inputId = document.getElementById("idCuenta");
const inputNombre = document.getElementById("nombre");
const selectTipo = document.getElementById("tipo");
const inputSaldo = document.getElementById("saldoInicial");
const grupoActiva = document.getElementById("grupoActiva");
const selectActiva = document.getElementById("activa");

let cuentas = [];

function llenarTipos() {
  selectTipo.innerHTML = '<option value="">Seleccione</option>' +
    TIPOS_CUENTA.map((t) => `<option value="${t}">${t}</option>`).join("");
}

function renderTabla() {
  btnNueva.disabled = !selectUsuario.value;
  totalCuentas.textContent = cuentas.length;
  saldoTotal.textContent = dinero(cuentas.reduce((suma, c) => suma + Number(c.saldoActual ?? 0), 0));

  if (!selectUsuario.value) {
    tabla.innerHTML = '<tr><td colspan="7"><div class="vacio"><i class="bi bi-person-check"></i>Seleccione un usuario para ver sus cuentas ahora</div></td></tr>';
    return;
  }
  if (cuentas.length === 0) {
    tabla.innerHTML = '<tr><td colspan="7"><div class="vacio"><i class="bi bi-bank"></i>Este usuario no tiene cuentas todavia</div></td></tr>';
    return;
  }
  tabla.innerHTML = cuentas.map((c) => {
    const activa = estaActiva(c.activa);
    return `
    <tr class="${activa ? "" : "fila-inactiva"}">
      <td>${c.idCuenta}</td>
      <td class="fw-semibold">${escapar(c.nombre)}</td>
      <td><span class="badge badge-tipo">${escapar(c.tipo)}</span></td>
      <td>${dinero(c.saldoInicial)}</td>
      <td class="fw-bold">${dinero(c.saldoActual)}</td>
      <td><span class="badge ${activa ? "bg-success" : "bg-secondary"}">${activa ? "Activa" : "Inactiva"}</span></td>
      <td class="text-end text-nowrap">
        <a class="btn btn-sm btn-outline-success" title="Movimientos"
           href="movimientos.html?usuario=${selectUsuario.value}&cuenta=${c.idCuenta}"><i class="bi bi-arrow-left-right"></i></a>
        <button class="btn btn-sm btn-outline-primary" title="Editar" data-accion="editar" data-id="${c.idCuenta}"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-warning" title="${activa ? "Desactivar" : "Activar"}" data-accion="estado" data-id="${c.idCuenta}">
          <i class="bi ${activa ? "bi-toggle-on" : "bi-toggle-off"}"></i></button>
        <button class="btn btn-sm btn-outline-danger" title="Eliminar" data-accion="eliminar" data-id="${c.idCuenta}"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`;
  }).join("");
}

async function cargarUsuarios() {
  const resultado = await obtenerUsuarios();
  selectUsuario.innerHTML = '<option value="">Seleccione un usuario:</option>' +
    (resultado.data ?? []).map((u) => `<option value="${u.idUsuario}">${escapar(u.nombre)}</option>`).join("");
  const previo = URLSearchParams("usuario"); 
  if (previo) {
    selectUsuario.value = previo;
    await cargarCuentas();
  }
}

async function cargarCuentas() {
  if (!selectUsuario.value) {
    cuentas = [];
    renderTabla();
    return;
  }
  try {
    const resultado = await obtenerCuentasPorUsuario(selectUsuario.value);
    if (resultado.success) {
      cuentas = resultado.data;
    } else {
      cuentas = [];
      mostrarAlerta(resultado.message, "danger");
    }
    renderTabla();
  } catch (error) {
    mostrarAlerta(ERROR_CONEXION, "danger");
  }
}

function validarFormulario() {
  const errores = [];
  if (!inputNombre.value.trim()) errores.push("El nombre de la cuenta es obligatorio");
  if (!selectTipo.value) errores.push("Seleccione el tipo de cuenta.");
  if (inputSaldo.value === "" || isNaN(Number(inputSaldo.value)) || Number(inputSaldo.value) < 0)
    errores.push("el saldo inicial debe ser un número mayor o igual a cero");
  return errores;
}

selectUsuario.addEventListener("change", cargarCuentas);

btnNueva.addEventListener("click", () => {
  form.reset();
  inputId.value = "";
  grupoActiva.classList.add("d-none"); 
  tituloModal.textContent = "Nueva cuenta";
  modal.show();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errores = validarFormulario();
  if (errores.length > 0) {
    mostrarAlerta(errores.join(" "), "warning");
    return;
  }

  const cuenta = {
    nombre: inputNombre.value.trim(),
    tipo: selectTipo.value,
    saldoInicial: Number(inputSaldo.value),
  };

  try {
    let resultado;
    if (inputId.value) {
      cuenta.activa = selectActiva.value;               
      resultado = await actualizarCuenta(inputId.value, cuenta);
    } else {
      cuenta.idUsuario = Number(selectUsuario.value);   
      resultado = await crearCuenta(cuenta);
    }

    if (resultado.success) {
      modal.hide();
      mostrarResultado(resultado);
      await cargarCuentas();
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
  const cuenta = cuentas.find((c) => c.idCuenta === Number(boton.dataset.id));

  if (boton.dataset.accion === "editar") {
    inputId.value = cuenta.idCuenta;
    inputNombre.value = cuenta.nombre;
    selectTipo.value = cuenta.tipo;
    inputSaldo.value = cuenta.saldoInicial;
    selectActiva.value = cuenta.activa;
    grupoActiva.classList.remove("d-none");
    tituloModal.textContent = "Editar cuenta";
    modal.show();
  }

  if (boton.dataset.accion === "estado") {
    const nuevoEstado = estaActiva(cuenta.activa) ? ACTIVA_NO : ACTIVA_SI;

    try {
      const resultado = await actualizarCuenta(cuenta.idCuenta, {
        nombre: cuenta.nombre, tipo: cuenta.tipo, saldoInicial: cuenta.saldoInicial, activa: nuevoEstado,
      });
      mostrarResultado(resultado);
      if (resultado.success) await cargarCuentas();
    } catch (error) {
      mostrarAlerta(ERROR_CONEXION, "danger");
    }
  }

  if (boton.dataset.accion === "eliminar") {
    if (!confirm("¿Eliminar esta cuenta? Solo se puede si no tiene movimientos")) return;
    try {
      const resultado = await eliminarCuenta(cuenta.idCuenta);
      mostrarResultado(resultado);
      if (resultado.success) await cargarCuentas();
    } catch (error) {
      mostrarAlerta(ERROR_CONEXION, "danger");
    }
  }
});
