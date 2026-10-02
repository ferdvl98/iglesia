/** Pie de página con el crédito de la empresa. El año se calcula al renderizar, para no tener
 * que acordarse de actualizarlo cada enero. */
export function Footer() {
  return (
    <footer className="px-4 py-4 text-center text-xs text-slate-400 md:px-6">
      © {new Date().getFullYear()} Davilar Software
    </footer>
  );
}
