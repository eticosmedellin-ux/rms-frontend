interface ComingSoonPageProps {
  titulo: string;
  descripcion: string;
}

export function ComingSoonPage({ titulo, descripcion }: ComingSoonPageProps) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-800">{titulo}</h1>
      <p className="mt-1 text-sm text-ink-400">{descripcion}</p>

      <div className="mt-6 rounded-xl border border-dashed border-ink-200 bg-white p-12 text-center text-sm text-ink-400">
        Este módulo se conecta a la API en el próximo incremento del frontend.
      </div>
    </div>
  );
}
