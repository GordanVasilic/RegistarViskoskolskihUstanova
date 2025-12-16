import React from 'react';

export default function HtmlList() {
  const [items, setItems] = React.useState<Array<{ name: string; href: string }>>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    setLoading(true);
    fetch('/api/html/list')
      .then(async (r) => {
        if (!r.ok) throw new Error('Greška pri učitavanju');
        const data = await r.json();
        setItems(data || []);
        setError(null);
      })
      .catch((e) => {
        setError('Neuspješno učitavanje liste');
      })
      .finally(() => setLoading(false));
  }, []);
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">HTML stranice</h2>
      {loading && <div className="text-gray-600">Učitavanje...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && (
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
          {items.map((it) => (
            <li key={it.href} className="p-3 flex items-center justify-between">
              <span className="text-sm text-gray-800">{it.name}</span>
              <a
                href={it.href}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Otvori
              </a>
            </li>
          ))}
          {items.length === 0 && <li className="p-3 text-sm text-gray-600">Nema HTML fajlova</li>}
        </ul>
      )}
    </div>
  );
}
