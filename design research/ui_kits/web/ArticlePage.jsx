/* eslint-disable */
function ArticlePage({ id, onOpen }) {
  const D = window.LBL_DATA;
  // We render the same body content regardless of id — single template demonstrates fidelity.
  const article = D.featured;
  const related = D.articles.slice(0, 3);

  return (
    <main data-screen-label="02 Article">
      <div className="container container--narrow">
        <div className="article-hero__crumbs">
          <a href="#">REVIEWS</a>
          <span>/</span>
          <a href="#">ITALY</a>
          <span>/</span>
          <span>PORTOFINO</span>
        </div>
        <Eyebrow tone="accent">{article.eyebrow}</Eyebrow>
        <h1 className="article-hero__title">
          A weekend at the <em>Splendido</em> that lived up to its name.
        </h1>
        <p className="article-hero__dek">{article.dek}</p>
        <div className="article-hero__meta">
          <div className="article-hero__byline"><strong>By</strong> Eliza Marchetti</div>
          <div className="article-hero__metabits">
            <span>{article.readTime}</span>
            <span>·</span>
            <span>{article.date}</span>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: 40 }}>
        <div className="article-hero__media">
          <img src={article.cover} alt="" />
        </div>
        <p className="article-hero__caption" style={{ maxWidth: 760, margin: '12px auto 0' }}>
          The hotel from the harbour, photographed just after the last ferry. — Eliza Marchetti
        </p>
      </div>

      <article className="container container--narrow" style={{ marginTop: 56 }}>
        <div className="prose">
          <p>There is a particular hush to the lobby at the Splendido — somewhere between a private library and a small chapel — that I keep wanting to bottle. Whatever a hotel of this generation is supposed to be, the Splendido has, since 1901, decided to remain something else entirely: a slightly elevated villa in which everyone seems to have been quietly briefed about you in advance.</p>
          <p>I came up the hill on a Friday, the harbour already beginning its long evening of pretending nobody had to leave. There is a way the air changes as you ascend through the umbrella pines, even now, that the brochures do not quite manage to communicate. By the time you arrive at the gravel turn, you are already half-in.</p>

          <h3>The <em>rooms</em></h3>
          <p>Of the property's 67 rooms and suites, the courtyard category is the one most worth requesting. The harbour-facing rooms are spectacular, of course, in the way harbour-facing rooms always are, but they pay for the view in moped noise after about ten in the morning. The courtyard rooms are quieter and you'll wake up to bell-ringing instead.</p>
          <p>Bathrooms have been touched recently, sensibly, with travertine and unfussy brass. The bed linens are the only part of the experience that feel actively bought, rather than inherited; that is a compliment.</p>
        </div>

        <Verdict
          headline="Quiet, considered, and worth the boat ride."
          score={9.4}
          rows={[
            ['From', '€620 / night, B&B'],
            ['Best for', 'Slow weeks, two travellers, no agenda'],
            ['Skip if', 'You need a lift, or air conditioning at full speed'],
            ['Book', '+39 0185 267 801 · belmond.com'],
          ]}
        />

        <div className="prose">
          <h3>The <em>verdict</em>, in long form</h3>
          <p>I keep returning to a thought I had on the last night, sitting on the terrace with a tomato in front of me that had been picked, demonstrably, that morning: very few hotels still know what they are. The Splendido does. It is not trying to be a wellness destination, or a club, or a brand activation — it is trying to be a hotel that you don't want to leave, and so you don't.</p>
        </div>

        <blockquote className="pullquote">
          "Very few hotels still know what they are. The Splendido does — and so it doesn't need to keep telling you."
          <span className="pullquote__attr">— Eliza Marchetti</span>
        </blockquote>

        <div className="prose">
          <p>Whether the price is justified depends, as ever, on what you think you are paying for. If it is the marble, the linen, or the lobster, then almost any hotel of this class will deliver a respectable version. If it is the sense of being held — gently, attentively, without anyone making a show of it — then there is nowhere else, currently, doing it better. We're booking again for September.</p>
        </div>
      </article>

      <section className="container" style={{ marginTop: 96 }}>
        <SectionHead title="Keep <em>reading</em>" />
        <div className="grid-3">
          {related.map(a => <ArticleCard key={a.id} article={a} onOpen={onOpen} />)}
        </div>
      </section>
    </main>
  );
}

window.ArticlePage = ArticlePage;
