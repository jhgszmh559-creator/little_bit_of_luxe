/* eslint-disable */
function SearchPage({ onOpen }) {
  const D = window.LBL_DATA;
  const [q, setQ] = React.useState('');
  const [cat, setCat] = React.useState('All');

  const filtered = D.articles.filter(a => {
    const matchesCat = cat === 'All' || a.category === cat;
    const matchesQ = !q || (a.title + ' ' + a.location).toLowerCase().includes(q.toLowerCase());
    return matchesCat && matchesQ;
  });

  return (
    <main data-screen-label="03 Search">
      <section className="container search-hero">
        <Eyebrow>The Archive</Eyebrow>
        <h1>Search the <em>archive</em></h1>
        <div className="search-input">
          <IconSearch size={22} />
          <input
            type="text"
            placeholder="Pantelleria, Splendido, ryokan…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
        </div>
      </section>

      <section className="container">
        <div className="filters">
          <span className="filters__label">Section</span>
          <div className="filters__chips">
            {D.categories.map(c => (
              <button key={c} className={"tag " + (cat === c ? 'is-active' : '')} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
        </div>

        <div className="results-head">
          <span className="results-head__count">
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
            {q && <span> · "{q}"</span>}
          </span>
          <span className="results-head__sort">
            Sort · <span style={{ borderBottom: '1px solid currentColor', paddingBottom: 1 }}>Newest first</span>
          </span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--lbl-serif)', fontStyle: 'italic', fontSize: 24, color: 'var(--lbl-ink-2)' }}>
              Nothing in the archive matches that — try a different word.
            </p>
          </div>
        ) : (
          <div className="grid-3" style={{ marginBottom: 96 }}>
            {filtered.map(a => <ArticleCard key={a.id} article={a} onOpen={onOpen} />)}
          </div>
        )}
      </section>
    </main>
  );
}

window.SearchPage = SearchPage;
