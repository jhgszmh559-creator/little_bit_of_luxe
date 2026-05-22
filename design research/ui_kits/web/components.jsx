/* eslint-disable */
// Little Bit of Luxe — shared UI components.
// All components exported to window at the end so other JSX files can use them.

const { useState, useEffect } = React;

/* ---------- icons (Lucide-style, hairline 1.5) ---------- */
function IconSearch(props) {
  return (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
function IconBookmark(props) {
  return (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IconArrowRight(props) {
  return (
    <svg width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m13 5 7 7-7 7" />
    </svg>
  );
}
function IconClock(props) {
  return (
    <svg width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  );
}

/* ---------- logo (typeset, scales cleanly) ---------- */
function Logo({ variant = 'dark', height = 32 }) {
  // Use the actual logo image — visually correct and matches brand exactly.
  const src = variant === 'sand'
    ? '../../assets/logo-sand.png'
    : variant === 'white'
    ? '../../assets/logo-white.png'
    : '../../assets/logo-darkblue.png';
  return <img src={src} alt="Little Bit of Luxe" style={{ height, width: 'auto' }} />;
}

/* ---------- nav ---------- */
function Nav({ current, onNav }) {
  const links = [
    { id: 'home',     label: 'Reviews' },
    { id: 'search',   label: 'Dispatches' },
    { id: 'search',   label: 'The Edit' },
    { id: 'search',   label: 'Guides' },
  ];
  return (
    <nav className="nav">
      <div className="container nav__inner">
        <div className="nav__links">
          {links.map((l, i) => (
            <a key={i} className={"nav__link" + (current === l.id && i===0 ? '' : '')}
               href="#" onClick={(e) => { e.preventDefault(); onNav(l.id); }}>{l.label}</a>
          ))}
        </div>
        <a className="nav__logo" href="#" onClick={(e) => { e.preventDefault(); onNav('home'); }}>
          <Logo variant="dark" height={36} />
        </a>
        <div className="nav__icons">
          <button className="icon-btn" aria-label="Search" onClick={() => onNav('search')}><IconSearch /></button>
          <button className="icon-btn" aria-label="Saved"><IconBookmark /></button>
          <button
            className="btn-subscribe"
            onClick={() => {
              const el = document.querySelector('.newsletter');
              if (el) {
                const y = el.getBoundingClientRect().top + window.scrollY - 24;
                window.scrollTo({ top: y, behavior: 'smooth' });
              } else {
                onNav('home');
                setTimeout(() => {
                  const e2 = document.querySelector('.newsletter');
                  if (e2) window.scrollTo({ top: e2.getBoundingClientRect().top + window.scrollY - 24, behavior: 'smooth' });
                }, 50);
              }
            }}
          >Subscribe<span className="btn-subscribe__arrow">→</span></button>
        </div>
      </div>
    </nav>
  );
}

/* ---------- footer ---------- */
function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <Logo variant="sand" height={48} />
          <p className="footer__tag">A travel journal for the kind of places worth going slowly.</p>
        </div>
        <div className="footer__col">
          <h5>Sections</h5>
          <ul>
            <li><a href="#">Hotel Reviews</a></li>
            <li><a href="#">Dispatches</a></li>
            <li><a href="#">The Edit</a></li>
            <li><a href="#">Guides</a></li>
          </ul>
        </div>
        <div className="footer__col">
          <h5>Destinations</h5>
          <ul>
            <li><a href="#">Italy</a></li>
            <li><a href="#">France</a></li>
            <li><a href="#">Japan</a></li>
            <li><a href="#">The Americas</a></li>
          </ul>
        </div>
        <div className="footer__col">
          <h5>Editorial</h5>
          <ul>
            <li><a href="#">About</a></li>
            <li><a href="#">How we review</a></li>
            <li><a href="#">Press</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="container footer__bottom">
        <span>© 2026 Little Bit of Luxe</span>
        <span>Made carefully · London &amp; Lisbon</span>
      </div>
    </footer>
  );
}

/* ---------- eyebrow / kicker ---------- */
function Eyebrow({ children, tone, invert }) {
  let cls = 'eyebrow';
  if (tone === 'accent') cls += ' eyebrow--accent';
  if (invert) cls += ' eyebrow--invert';
  return <div className={cls}>{children}</div>;
}

/* ---------- numeric rating + stars ---------- */
function Rating({ score, max = 10 }) {
  const whole = Math.round(score);
  return (
    <span className="rating-stars" aria-label={score + ' out of ' + max}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < Math.round(score/2) ? '' : 'dim'}>★</span>
      ))}
    </span>
  );
}

/* ---------- editorial article card ---------- */
function ArticleCard({ article, onOpen }) {
  return (
    <article className="card-article" onClick={() => onOpen && onOpen(article.id)}>
      <div className="card-article__media">
        <img src={article.cover} alt="" loading="lazy" />
        {article.rating != null && (
          <div className="card-article__rating"><em>★</em> {article.rating}</div>
        )}
      </div>
      <div className="card-article__eyebrow"><Eyebrow>{article.eyebrow}</Eyebrow></div>
      <h3 className="card-article__title" dangerouslySetInnerHTML={{ __html: emphasiseTitle(article.title) }} />
      <div className="card-article__byline">By {article.author}</div>
      <div className="card-article__meta">{article.readTime}</div>
    </article>
  );
}

// Italicise the last meaningful word or two in a headline to keep brand rhythm.
function emphasiseTitle(t) {
  // Don't touch headlines that already include <em>
  if (t.includes('<em>')) return t;
  const tokens = t.split(' ');
  if (tokens.length < 4) return t;
  // emphasise word 3 if it's substantive
  const idx = Math.min(2, tokens.length - 1);
  tokens[idx] = '<em>' + tokens[idx] + '</em>';
  return tokens.join(' ');
}

/* ---------- the verdict / at-a-glance card ---------- */
function Verdict({ headline, score, rows }) {
  const [whole, dec] = String(score).split('.');
  return (
    <aside className="verdict">
      <div>
        <div className="verdict__eyebrow">The Verdict</div>
        <div className="verdict__head" dangerouslySetInnerHTML={{ __html: emphasiseTitle(headline) }} />
        <dl className="verdict__rows">
          {rows.map((r, i) => (
            <React.Fragment key={i}>
              <dt className="k">{r[0]}</dt>
              <dd style={{ margin: 0 }}>{r[1]}</dd>
            </React.Fragment>
          ))}
        </dl>
      </div>
      <div className="verdict__score">
        <div className="verdict__num">{whole}.<em>{dec || '0'}</em></div>
        <div className="verdict__den">/ 10</div>
      </div>
    </aside>
  );
}

/* ---------- newsletter ---------- */
function Newsletter() {
  const [val, setVal] = useState('');
  const [done, setDone] = useState(false);
  return (
    <section className="newsletter">
      <div className="newsletter__inner">
        <Eyebrow>The Letter · Saturdays</Eyebrow>
        <h2>One <em>email</em> a week. Worth opening.</h2>
        <p>Our editors' notes on where to go and where to skip, before the rush.</p>
        {done ? (
          <p style={{ marginTop: 0 }}>Thank you — check your inbox.</p>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setDone(true); }}>
            <input type="email" placeholder="your@email.com" value={val} onChange={(e) => setVal(e.target.value)} required />
            <button type="submit">Subscribe</button>
          </form>
        )}
      </div>
    </section>
  );
}

/* ---------- section header w/ rule + link ---------- */
function SectionHead({ title, link, onLink }) {
  return (
    <header className="section-head">
      <h2 dangerouslySetInnerHTML={{ __html: title }} />
      {link && <a className="section-head__link" href="#" onClick={(e) => { e.preventDefault(); onLink && onLink(); }}>{link} →</a>}
    </header>
  );
}

Object.assign(window, {
  Nav, Footer, Logo, Eyebrow, Rating, ArticleCard, Verdict, Newsletter, SectionHead,
  IconSearch, IconBookmark, IconArrowRight, IconClock,
  emphasiseTitle,
});
