"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { crearActa, corregirActa } from "../../actions";
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
  libroInicial,
  historicoInicial = false,
  modo = "crear",
  actaId,
  valores,
}: {
  tipo: TipoActa;
  iglesias: Iglesia[];
  ministros: Ministro[];
  puedeAdministrarMinistros: boolean;
  libros: LibroInfo[];
  partidasPorFoja?: number;
  precioRegistro?: number | null;
  libroInicial?: string;
  historicoInicial?: boolean;
  /** "editar" corrige un acta ya registrada: no toca libro, partida ni cobro. */
  modo?: "crear" | "editar";
  actaId?: string;
  valores?: Record<string, string>;
}) {
  const editando = modo === "editar";
  /** Valor inicial de un campo al corregir; vacío al crear. */
  const v = (campo: string) => valores?.[campo];

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
    libroInicial && libros.some((l) => l.libro === libroInicial)
      ? libroInicial
      : libroDisponible
        ? libroDisponible.libro
        : NUEVO_LIBRO,
  );
  const [nuevoLibro, setNuevoLibro] = useState("");
  // Captura retroactiva: el libro viejo trae su propia numeración, con huecos
  // y sin orden, así que la partida la escribe el capturista.
  const [historico, setHistorico] = useState(historicoInicial);
  const [partidaManual, setPartidaManual] = useState("");

  const escribiendoLibroNuevo = libros.length === 0 || libroSeleccionado === NUEVO_LIBRO;
  const libro = escribiendoLibroNuevo ? nuevoLibro.trim() : libroSeleccionado;
  const infoLibroSeleccionado = libros.find((l) => l.libro === libroSeleccionado);
  const siguientePartida = escribiendoLibroNuevo ? 1 : infoLibroSeleccionado?.siguientePartida ?? 1;
  const partidaEfectiva =
    historico && /^\d+$/.test(partidaManual) ? Number(partidaManual) : siguientePartida;
  const foja = Math.ceil(partidaEfectiva / partidasPorFoja);
  const posicion = partidaEfectiva - (foja - 1) * partidasPorFoja;
  const libroSeleccionadoLleno = !escribiendoLibroNuevo && infoLibroSeleccionado?.lleno;

  // No se le cobra a la parroquia por digitalizar partidas que ya están en sus
  // libros; el cobro es por registrar un sacramento nuevo.
  const requierePago = !historico && !!precioRegistro && precioRegistro > 0;

  function guardar() {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    startTransition(async () => {
      if (editando) {
        // corregirActa redirige a la ficha al terminar; solo vuelve con error.
        const r = await corregirActa(null, formData);
        if (r && "error" in r) setError(r.error);
        return;
      }
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
      router.push(`/actas/${resultado.actaId}${historico ? "?modo=historico" : ""}`);
    });
  }

  function alHacerClicGuardar() {
    if (!formRef.current?.reportValidity()) return;
    if (editando) {
      guardar();
      return;
    }
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
      {editando ? (
        <input type="hidden" name="actaId" value={actaId} />
      ) : (
        <>
          <input type="hidden" name="libro" value={libro} />
          <input type="hidden" name="metodoPago" value={metodoPago} />
        </>
      )}
      {!editando && iglesias.length > 0 && (
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
        {/* La ubicación en el libro no es un dato corregible: es dónde está
            asentada la partida. Al corregir, ni se muestra ni se envía. */}
        <div className={editando ? "hidden" : undefined}>
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
          {libroSeleccionadoLleno && !historico ? (
            <p className="mt-1 text-xs text-red-600">
              Este libro ya está lleno. Elige &quot;Abrir un libro nuevo&quot; para continuar.
            </p>
          ) : (
            !historico && (
              <p className="mt-1 text-xs text-slate-500">
                Se asignará automáticamente la partida No. {siguientePartida} — Foja {foja},
                posición {posicion} de {partidasPorFoja}
              </p>
            )
          )}

          <label className="mt-3 flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={historico}
              onChange={(e) => {
                setHistorico(e.target.checked);
                if (!e.target.checked) setPartidaManual("");
              }}
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
            />
            <span>
              Captura de libro histórico
              <span className="block text-xs text-slate-500">
                Para pasar al sistema partidas ya asentadas en los libros. Escribes tú el número
                tal como aparece en el libro, y no se genera cobro.
              </span>
            </span>
          </label>

          {historico && (
            <div className="mt-2">
              <label
                htmlFor="numeroActaManual"
                className="block text-xs font-medium text-slate-600"
              >
                No. de partida en el libro <span className="text-red-500">*</span>
              </label>
              <input
                id="numeroActaManual"
                name="numeroActaManual"
                type="number"
                min="1"
                required
                value={partidaManual}
                onChange={(e) => setPartidaManual(e.target.value)}
                className="mt-1 w-40 rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              {/^\d+$/.test(partidaManual) && (
                <p className="mt-1 text-xs text-slate-500">
                  Foja {foja}, posición {posicion} de {partidasPorFoja}
                </p>
              )}
            </div>
          )}
        </div>
        <Campo label="Fecha del sacramento" name="fecha" defaultValue={v("fecha")} type="date" required />
        <Campo label="Lugar" name="lugar" defaultValue={v("lugar")} />
        <div>
          <label htmlFor="ministroId" className="block text-xs font-medium text-slate-600">
            Ministro / celebrante
          </label>
          <select
            id="ministroId"
            name="ministroId" defaultValue={v("ministroId")}
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
          <Campo label="Nombre completo" name="nombreCompleto" defaultValue={v("nombreCompleto")} required />
          <div>
            <label htmlFor="sexo" className="block text-xs font-medium text-slate-600">
              Sexo
            </label>
            <select
              id="sexo"
              name="sexo"
              defaultValue={v("sexo") ?? ""}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">-- Selecciona --</option>
              <option value="MASCULINO">Niño</option>
              <option value="FEMENINO">Niña</option>
            </select>
          </div>
          <Campo label="Fecha de nacimiento" name="fechaNacimiento" defaultValue={v("fechaNacimiento")} type="date" />
          <Campo label="Lugar de nacimiento" name="lugarNacimiento" defaultValue={v("lugarNacimiento")} />
          <Campo label="Domicilio" name="domicilio" defaultValue={v("domicilio")} />
          <Campo label="Nombre del padre" name="nombrePadre" defaultValue={v("nombrePadre")} />
          <Campo label="Nombre de la madre" name="nombreMadre" defaultValue={v("nombreMadre")} />
          <Campo label="Padrino" name="padrino" defaultValue={v("padrino")} />
          <Campo label="Madrina" name="madrina" defaultValue={v("madrina")} />
        </Seccion>
      )}

      {tipo === "PRIMERA_COMUNION" && (
        <>
          <Seccion titulo="Datos del comulgante">
            <Campo label="Nombre(s)" name="nombre" defaultValue={v("nombre")} required />
            <Campo label="Apellidos" name="apellidos" defaultValue={v("apellidos")} required />
            <div>
              <label htmlFor="sexo" className="block text-xs font-medium text-slate-600">
                Sexo
              </label>
              <select
                id="sexo"
                name="sexo"
                defaultValue={v("sexo") ?? ""}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">-- Selecciona --</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
              </select>
            </div>
            <Campo label="Fecha de nacimiento" name="fechaNacimiento" defaultValue={v("fechaNacimiento")} type="date" />
            <Campo label="Nombre del padre" name="nombrePadre" defaultValue={v("nombrePadre")} />
            <Campo label="Nombre de la madre" name="nombreMadre" defaultValue={v("nombreMadre")} />
            <Campo label="Padrino" name="padrino" defaultValue={v("padrino")} />
            <Campo label="Madrina" name="madrina" defaultValue={v("madrina")} />
            <Campo label="Catequista" name="catequista" defaultValue={v("catequista")} />
          </Seccion>
          <Seccion titulo="Bautismo de referencia">
            <Campo label="Parroquia donde fue bautizado" name="parroquiaBautismo" defaultValue={v("parroquiaBautismo")} />
            <Campo label="Fecha de bautismo" name="fechaBautismo" defaultValue={v("fechaBautismo")} type="date" />
          </Seccion>
        </>
      )}

      {tipo === "CONFIRMACION" && (
        <>
          <Seccion titulo="Datos del confirmando">
            <Campo label="Nombre completo" name="nombreCompleto" defaultValue={v("nombreCompleto")} required />
            <div>
              <label htmlFor="sexo" className="block text-xs font-medium text-slate-600">
                Sexo
              </label>
              <select
                id="sexo"
                name="sexo"
                defaultValue={v("sexo") ?? ""}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">-- Selecciona --</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
              </select>
            </div>
            <Campo label="Fecha de nacimiento" name="fechaNacimiento" defaultValue={v("fechaNacimiento")} type="date" />
            <Campo label="Lugar de nacimiento" name="lugarNacimiento" defaultValue={v("lugarNacimiento")} />
            <Campo label="Nombre del padre" name="nombrePadre" defaultValue={v("nombrePadre")} />
            <Campo label="Nombre de la madre" name="nombreMadre" defaultValue={v("nombreMadre")} />
            <Campo label="Padrino" name="padrino" defaultValue={v("padrino")} />
            <Campo label="Madrina" name="madrina" defaultValue={v("madrina")} />
            <Campo label="Obispo / ministro" name="obispoMinistro" defaultValue={v("obispoMinistro")} />
          </Seccion>
          <Seccion titulo="Bautismo de referencia">
            <Campo label="Parroquia donde fue bautizado" name="parroquiaBautismo" defaultValue={v("parroquiaBautismo")} />
            <Campo label="Fecha de bautismo" name="fechaBautismo" defaultValue={v("fechaBautismo")} type="date" />
            <Campo label="Libro de bautismos" name="libroBautismo" defaultValue={v("libroBautismo")} />
            <Campo label="Foja" name="fojaBautismo" defaultValue={v("fojaBautismo")} type="number" min="1" />
            <Campo label="No. de acta de bautismo" name="actaBautismo" defaultValue={v("actaBautismo")} type="number" min="1" />
          </Seccion>
        </>
      )}

      {tipo === "MATRIMONIO" && (
        <>
          <Seccion titulo="Datos del esposo">
            <Campo label="Nombre completo" name="nombreEsposo" defaultValue={v("nombreEsposo")} required />
            <Campo label="Fecha de nacimiento" name="fechaNacimientoEsposo" defaultValue={v("fechaNacimientoEsposo")} type="date" />
            <Campo
              label="Estado civil"
              name="estadoCivilEsposo" defaultValue={v("estadoCivilEsposo")}
              hint='Ej. "soltero", "viudo"'
            />
            <Campo label="Edad" name="edadEsposo" defaultValue={v("edadEsposo")} type="number" min="0" />
            <Campo label="Originario de" name="origenEsposo" defaultValue={v("origenEsposo")} />
            <Campo label="Domicilio" name="domicilioEsposo" defaultValue={v("domicilioEsposo")} />
            <Campo label="Nombre del padre" name="padreEsposo" defaultValue={v("padreEsposo")} />
            <Campo label="Nombre de la madre" name="madreEsposo" defaultValue={v("madreEsposo")} />
          </Seccion>
          <Seccion titulo="Datos de la esposa">
            <Campo label="Nombre completo" name="nombreEsposa" defaultValue={v("nombreEsposa")} required />
            <Campo label="Fecha de nacimiento" name="fechaNacimientoEsposa" defaultValue={v("fechaNacimientoEsposa")} type="date" />
            <Campo
              label="Estado civil"
              name="estadoCivilEsposa" defaultValue={v("estadoCivilEsposa")}
              hint='Ej. "soltera", "viuda"'
            />
            <Campo label="Edad" name="edadEsposa" defaultValue={v("edadEsposa")} type="number" min="0" />
            <Campo label="Originaria de" name="origenEsposa" defaultValue={v("origenEsposa")} />
            <Campo label="Domicilio (vecina de)" name="domicilioEsposa" defaultValue={v("domicilioEsposa")} />
            <Campo label="Nombre del padre" name="padreEsposa" defaultValue={v("padreEsposa")} />
            <Campo label="Nombre de la madre" name="madreEsposa" defaultValue={v("madreEsposa")} />
          </Seccion>
          <Seccion titulo="Testigos y acta civil">
            <Campo label="Testigo 1" name="testigo1" defaultValue={v("testigo1")} />
            <Campo label="Testigo 2" name="testigo2" defaultValue={v("testigo2")} />
            <Campo label="No. de acta civil" name="actaCivilNumero" defaultValue={v("actaCivilNumero")} />
            <Campo label="Se tramitó en" name="lugarTramite" defaultValue={v("lugarTramite")} />
          </Seccion>
        </>
      )}

      {editando && (
        <Seccion titulo="Motivo de la corrección">
          <Campo
            label="Motivo (opcional)"
            name="motivo"
            hint="Queda en el historial del acta, junto a qué cambió y quién lo cambió."
          />
        </Seccion>
      )}
      <Seccion titulo="Observaciones">
        <div className="sm:col-span-2">
          <label htmlFor="observaciones" className="block text-xs font-medium text-slate-600">
            Observaciones
          </label>
          <textarea
            id="observaciones"
            name="observaciones" defaultValue={v("observaciones")}
            rows={3}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </Seccion>

      {error && !mostrarCobro && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          disabled={pending || (!editando && !!libroSeleccionadoLleno)}
          onClick={alHacerClicGuardar}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Guardando..." : editando ? "Guardar correcciones" : "Guardar acta"}
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
