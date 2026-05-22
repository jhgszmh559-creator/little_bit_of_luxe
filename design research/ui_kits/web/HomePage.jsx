/* eslint-disable */
function HomePage({ onOpen, onSearch }) {
  const D = window.LBL_DATA;
  const featured = D.featured;
  const rest = D.articles;

  return (
    <main data-screen-label="01 Home">
      {/* Featured / hero story */}
      <div className="container">
        <article className="featured">
          <div className="featured__media" onClick={() => onOpen(featured.id)}>
            <img src={featured.cover} alt="" />
            <span className="featured__pill">{featured.location}</span>
          </div>
          <div className="featured__body">
            <Eyebrow tone="accent">{featured.eyebrow}</Eyebrow>
            <h1 className="featured__title" onClick={() => onOpen(featured.id)}
              dangerouslySetInnerHTML={{ __html: emphasiseTitle(featured.title) }} />
            <p className="featured__dek">{featured.dek}</p>
            <div className="featured__byline">
              <span style={{ fontFamily: 'var(--lbl-serif)', fontStyle: 'italic', fontSize: 16 }}>By {featured.author}</span>
              <span style={{ fontFamily: 'var(--lbl-sans)', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--lbl-ink-3)' }}>
                {featured.readTime} · {featured.date}
              </span>
              <span className="rating-stars" style={{ marginLeft: 'auto' }}>
                <em style={{ fontStyle: 'normal', fontFamily: 'var(--lbl-serif)', fontSize: 28 }}>★ {featured.rating}</em>
                <span style={{ fontFamily: 'var(--lbl-sans)', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--lbl-ink-3)', marginLeft: 8 }}>/ 10</span>
              </span>
            </div>
          </div>
        </article>
      </div>

      {/* Latest */}
      <section className="container" style={{ marginTop: 64 }}>
        <SectionHead title="Latest <em>dispatches</em>" link="All stories" onLink={onSearch} />
        <div className="grid-3">
          {rest.slice(0, 3).map(a => <ArticleCard key={a.id} article={a} onOpen={onOpen} />)}
        </div>
      </section>

      {/* The Edit — midnight rail */}
      <section className="edit-rail">
        <div className="container">
          <SectionHead title="The <em>Edit</em>" link="Browse the edit" onLink={onSearch} />
          <div className="grid-4">
            {rest.slice(3, 7).map(a => <ArticleCard key={a.id} article={a} onOpen={onOpen} />)}
          </div>
        </div>
      </section>

      {/* More to read */}
      <section className="container" style={{ marginTop: 96 }}>
        <SectionHead title="More to <em>read</em>" link="Search the archive" onLink={onSearch} />
        <div className="grid-3">
          {rest.slice(5, 8).map(a => <ArticleCard key={a.id} article={a} onOpen={onOpen} />)}
        </div>
      </section>

      <Newsletter />
    </main>
  );
}

window.HomePage = HomePage;
