"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { crearActa } from "../../actions";
import { Campo, Seccion } from "@/components/form-fields";
import { CobroModal } from "@/components/cobro-modal";
import { PARTIDAS_POR_FOJA_DEFECTO } from "@/lib/libro";
import type { TipoActa } from "@/lib/tipos-acta";
import type { Iglesia, Ministro } from "@prisma/client";

const NUEVO_LIBRO = "__nuevo__";
const OTRO_MINISTRO = "__otro__";

type LibroInfo = { libro: string; siguientePartida: number; lleno: boolean };

export function ActaForm({
  tipo,
  iglesias,
  ministros,
  puedeAdministrarMinistros,
  libros,
  partidasPorFoja = PARTIDAS_POR_FOJA_DEFECTO,
  precioRegistro,
}: {
  tipo: TipoActa;
  iglesias: Iglesia[];
  ministros: Ministro[];
  puedeAdministrarMinistros: boolean;
  libros: LibroInfo[];
  partidasPorFoja?: number;
  precioRegistro?: number | null;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const ventanaRef = useRef<Window | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mostrarCobro, setMostrarCobro] = useState(false);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [iglesiaIdSeleccionada, setIglesiaIdSeleccionada] = useState(iglesias[0]?.id ?? "");
  const [ministroId, setMinistroId] = useState("");
  const ministrosDisponibles = useMemo(
    () =>
      iglesias.length > 0
        ? ministros.filter((m) => m.iglesiaId === iglesiaIdSeleccionada)
        : ministros,
    [ministros, iglesias.length, iglesiaIdSeleccionada],
  );
  const libroDisponible = [...libros].reverse().find((l) => !l.lleno);
  const [libroSeleccionado, setLibroSeleccionado] = useState(
    libroDisponible ? libroDisponible.libro : NUEVO_LIBRO,
  );
  const [nuevoLibro, setNuevoLibro] = useState("");

  const escribiendoLibroNuevo = libros.length === 0 || libroSeleccionado === NUEVO_LIBRO;
  const libro = escribiendoLibroNuevo ? nuevoLibro.trim() : libroSeleccionado;
  const infoLibroSeleccionado = libros.find((l) => l.libro === libroSeleccionado);
  const siguientePartida = escribiendoLibroNuevo ? 1 : infoLibroSeleccionado?.siguientePartida ?? 1;
  const foja = Math.ceil(siguientePartida / partidasPorFoja);
  const posicion = siguientePartida - (foja - 1) * partidasPorFoja;
  const libroSeleccionadoLleno = !escribiendoLibroNuevo && infoLibroSeleccionado?.lleno;

  const requierePago = !!precioRegistro && precioRegistro > 0;

  function guardar() {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    startTransition(async () => {
      const resultado = await crearActa(formData);
      if ("error" in resultado) {
        ventanaRef.current?.close();
        ventanaRef.current = null;
        setError(resultado.error);
        return;
      }
      setError(null);
      setMostrarCobro(false);
      if (ventanaRef.current) {
        ventanaRef.current.location.href = `/api/actas/${resultado.actaId}/pdf`;
      } else {
        window.open(`/api/actas/${resultado.actaId}/pdf`, "_blank");
      }
      router.push(`/actas/${resultado.actaId}`);
    });
  }

  function alHacerClicGuardar() {
    if (!formRef.current?.reportValidity()) return;
    // Se abre la pestaña ya (dentro del gesto del usuario) para que el PDF se
    // pueda imprimir automáticamente al guardar, sin que el navegador la bloquee.
    ventanaRef.current = window.open("", "_blank");
    if (requierePago) {
      setMostrarCobro(true);
    } else {
      guardar();
    }
  }

  return (
    <form ref={formRef} className="space-y-4">
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="libro" value={libro} />
      <input type="hidden" name="metodoPago" value={metodoPago} />
      {iglesias.length > 0 && (
        <Seccion titulo="Iglesia">
          <div>
            <label htmlFor="iglesiaId" className="block text-xs font-medium text-slate-600">
              Iglesia <span className="text-red-500">*</span>
            </label>
            <select
              id="iglesiaId"
              name="iglesiaId"
              required
              value={iglesiaIdSeleccionada}
              onChange={(e) => {
                setIglesiaIdSeleccionada(e.target.value);
                setMinistroId("");
              }}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {iglesias.map((iglesia) => (
                <option key={iglesia.id} value={iglesia.id}>
                  {iglesia.nombre}
                </option>
              ))}
            </select>
          </div>
        </Seccion>
      )}

      <Seccion titulo="Datos del acta">
        <div>
          <label className="block text-xs font-medium text-slate-600">
            Libro <span className="text-red-500">*</span>
          </label>
          {libros.length > 0 && (
            <select
              value={libroSeleccionado}
              onChange={(e) => setLibroSeleccionado(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {[...libros].reverse().map((l) => (
                <option key={l.libro} value={l.libro} disabled={l.lleno}>
                  Libro {l.libro} {l.lleno ? "(lleno)" : `(próxima partida: ${l.siguientePartida})`}
                </option>
              ))}
              <option value={NUEVO_LIBRO}>+ Abrir un libro nuevo</option>
            </select>
          )}
          {escribiendoLibroNuevo && (
            <input
              type="text"
              required
              autoFocus={libros.length > 0}
              value={nuevoLibro}
              onChange={(e) => setNuevoLibro(e.target.value)}
              placeholder="Número o identificador del libro, ej. 5"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          )}
          {libroSeleccionadoLleno ? (
            <p className="mt-1 text-xs text-red-600">
              Este libro ya está lleno. Elige &quot;Abrir un libro nuevo&quot; para continuar.
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">
              Se asignará automáticamente la partida No. {siguientePartida} — Foja {foja}, posición{" "}
              {posicion} de {partidasPorFoja}
            </p>
          )}
        </div>
        <Campo label="Fecha del sacramento" name="fecha" type="date" required />
        <Campo label="Lugar" name="lugar" />
        <div>
          <label htmlFor="ministroId" className="block text-xs font-medium text-slate-600">
            Ministro / celebrante
          </label>
          <select
            id="ministroId"
            name="ministroId"
            value={ministroId}
            onChange={(e) => setMinistroId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">-- Selecciona --</option>
            {ministrosDisponibles.map((ministro) => (
              <option key={ministro.id} value={ministro.id}>
                {ministro.titulo ? `${ministro.titulo} ` : ""}
                {ministro.nombre}
              </option>
            ))}
            <option value={OTRO_MINISTRO}>Otro (escribir manualmente)</option>
          </select>
          {ministroId === OTRO_MINISTRO && (
            <input
              type="text"
              name="ministro"
              autoFocus
              placeholder="Nombre del celebrante"
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          )}
          {puedeAdministrarMinistros && (
            <p className="mt-1 text-xs text-slate-500">
              <Link
                href={
                  iglesias.length > 0
                    ? `/ministros/nuevo?iglesiaId=${iglesiaIdSeleccionada}`
                    : "/ministros/nuevo"
                }
                target="_blank"
                className="underline hover:text-slate-700"
              >
                + Agregar un sacerdote nuevo al registro
              </Link>
            </p>
          )}
        </div>
      </Seccion>

      {tipo === "BAUTIZO" && (
        <Seccion titulo="Datos del bautizado">
          <Campo label="Nombre completo" name="nombreCompleto" required />
          <div>
            <label htmlFor="sexo" className="block text-xs font-medium text-slate-600">
              Sexo
            </label>
            <select
              id="sexo"
              name="sexo"
              defaultValue=""
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">-- Selecciona --</option>
              <option value="MASCULINO">Niño</option>
              <option value="FEMENINO">Niña</option>
            </select>
          </div>
          <Campo label="Fecha de nacimiento" name="fechaNacimiento" type="date" />
          <Campo label="Lugar de nacimiento" name="lugarNacimiento" />
          <Campo label="Domicilio" name="domicilio" />
          <Campo label="Nombre del padre" name="nombrePadre" />
          <Campo label="Nombre de la madre" name="nombreMadre" />
          <Campo label="Padrino" name="padrino" />
          <Campo label="Madrina" name="madrina" />
        </Seccion>
      )}

      {tipo === "PRIMERA_COMUNION" && (
        <>
          <Seccion titulo="Datos del comulgante">
            <Campo label="Nombre(s)" name="nombre" required />
            <Campo label="Apellidos" name="apellidos" required />
            <div>
              <label htmlFor="sexo" className="block text-xs font-medium text-slate-600">
                Sexo
              </label>
              <select
                id="sexo"
                name="sexo"
                defaultValue=""
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">-- Selecciona --</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
              </select>
            </div>
            <Campo label="Fecha de nacimiento" name="fechaNacimiento" type="date" />
            <Campo label="Nombre del padre" name="nombrePadre" />
            <Campo label="Nombre de la madre" name="nombreMadre" />
            <Campo label="Padrino" name="padrino" />
            <Campo label="Madrina" name="madrina" />
            <Campo label="Catequista" name="catequista" />
          </Seccion>
          <Seccion titulo="Bautismo de referencia">
            <Campo label="Parroquia donde fue bautizado" name="parroquiaBautismo" />
            <Campo label="Fecha de bautismo" name="fechaBautismo" type="date" />
          </Seccion>
        </>
      )}

      {tipo === "CONFIRMACION" && (
        <>
          <Seccion titulo="Datos del confirmando">
            <Campo label="Nombre completo" name="nombreCompleto" required />
            <div>
              <label htmlFor="sexo" className="block text-xs font-medium text-slate-600">
                Sexo
              </label>
              <select
                id="sexo"
                name="sexo"
                defaultValue=""
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">-- Selecciona --</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
              </select>
            </div>
            <Campo label="Fecha de nacimiento" name="fechaNacimiento" type="date" />
            <Campo label="Lugar de nacimiento" name="lugarNacimiento" />
            <Campo label="Nombre del padre" name="nombrePadre" />
            <Campo label="Nombre de la madre" name="nombreMadre" />
            <Campo label="Padrino" name="padrino" />
            <Campo label="Madrina" name="madrina" />
            <Campo label="Obispo / ministro" name="obispoMinistro" />
          </Seccion>
          <Seccion titulo="Bautismo de referencia">
            <Campo label="Parroquia donde fue bautizado" name="parroquiaBautismo" />
            <Campo label="Fecha de bautismo" name="fechaBautismo" type="date" />
            <Campo label="Libro de bautismos" name="libroBautismo" />
            <Campo label="Foja" name="fojaBautismo" type="number" min="1" />
            <Campo label="No. de acta de bautismo" name="actaBautismo" type="number" min="1" />
          </Seccion>
        </>
      )}

      {tipo === "MATRIMONIO" && (
        <>
          <Seccion titulo="Datos del esposo">
            <Campo label="Nombre completo" name="nombreEsposo" required />
            <Campo label="Fecha de nacimiento" name="fechaNacimientoEsposo" type="date" />
            <Campo
              label="Estado civil"
              name="estadoCivilEsposo"
              hint='Ej. "soltero", "viudo"'
            />
            <Campo label="Edad" name="edadEsposo" type="number" min="0" />
            <Campo label="Originario de" name="origenEsposo" />
            <Campo label="Domicilio" name="domicilioEsposo" />
            <Campo label="Nombre del padre" name="padreEsposo" />
            <Campo label="Nombre de la madre" name="madreEsposo" />
          </Seccion>
          <Seccion titulo="Datos de la esposa">
            <Campo label="Nombre completo" name="nombreEsposa" required />
            <Campo label="Fecha de nacimiento" name="fechaNacimientoEsposa" type="date" />
            <Campo
              label="Estado civil"
              name="estadoCivilEsposa"
              hint='Ej. "soltera", "viuda"'
            />
            <Campo label="Edad" name="edadEsposa" type="number" min="0" />
            <Campo label="Originaria de" name="origenEsposa" />
            <Campo label="Domicilio (vecina de)" name="domicilioEsposa" />
            <Campo label="Nombre del padre" name="padreEsposa" />
            <Campo label="Nombre de la madre" name="madreEsposa" />
          </Seccion>
          <Seccion titulo="Testigos y acta civil">
            <Campo label="Testigo 1" name="testigo1" />
            <Campo label="Testigo 2" name="testigo2" />
            <Campo label="No. de acta civil" name="actaCivilNumero" />
            <Campo label="Se tramitó en" name="lugarTramite" />
          </Seccion>
        </>
      )}

      <Seccion titulo="Observaciones">
        <div className="sm:col-span-2">
          <label htmlFor="observaciones" className="block text-xs font-medium text-slate-600">
            Observaciones
          </label>
          <textarea
            id="observaciones"
            name="observaciones"
            rows={3}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </Seccion>

      {error && !mostrarCobro && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          disabled={pending || !!libroSeleccionadoLleno}
          onClick={alHacerClicGuardar}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Guardando..." : "Guardar acta"}
        </button>
      </div>

      {mostrarCobro && (
        <CobroModal
          titulo="Confirma el cobro de registro"
          precio={precioRegistro ?? 0}
          metodoPago={metodoPago}
          onMetodoPagoChange={setMetodoPago}
          onCancelar={() => {
            ventanaRef.current?.close();
            ventanaRef.current = null;
            setMostrarCobro(false);
          }}
          error={error}
          botonConfirmar={
            <button
              type="button"
              onClick={guardar}
              disabled={pending}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {pending ? "Guardando..." : "Confirmar cobro y guardar"}
            </button>
          }
        />
      )}
    </form>
  );
}
