// Generador estático del blog "Novedades de derecho" para Estudio Pellegrini.
// Se ejecuta en cada deploy de Netlify (build command: "npm run build").
// Lee los posts en markdown de content/blog/*.md (creados desde /admin) y
// genera blog/index.html (listado) y blog/<slug>/index.html (cada post),
// reutilizando el header, footer y estilos del sitio principal (index.html)
// para que el blog tenga siempre el mismo look & feel.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = __dirname;
const SITE_HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const CONTENT_DIR = path.join(ROOT, 'content', 'blog');
const OUT_DIR = path.join(ROOT, 'blog');

function extractBetween(html, startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  if (start === -1 || end === -1) {
    throw new Error(`No se pudo extraer el bloque entre "${startMarker}" y "${endMarker}"`);
  }
  return html.slice(start, end + endMarker.length);
}

const styleBlock = extractBetween(SITE_HTML, '<style>', '</style>');
let headerBlock = extractBetween(SITE_HTML, '<header>', '</header>');
let footerBlock = extractBetween(SITE_HTML, '<footer>', '</footer>');

// En el sitio principal el menú usa anclas (#inicio, #servicios, etc.).
// Dentro de /blog/ y /blog/<slug>/ esas anclas tienen que volver a la home.
function fixLinksForSubpage(html) {
  return html
    .replace(/href="#/g, 'href="/#')
    .replace(/href="\/blog\/"/g, 'href="/blog/"'); // ya es absoluto, se deja igual
}
headerBlock = fixLinksForSubpage(headerBlock);
footerBlock = fixLinksForSubpage(footerBlock);

const faviconMatch = SITE_HTML.match(/<link rel="icon"[^>]*>/);
const favicon = faviconMatch ? faviconMatch[0] : '';

const fontsMatch = SITE_HTML.match(/<link[^>]*fonts\.googleapis[^>]*>/g) || [];
const fontLinks = fontsMatch.join('\n');

function page({ title, description, body, extraStyle = '' }) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${description}">
${favicon}
${fontLinks}
${styleBlock}
<style>
  .blog-hero{
    padding:64px 0 28px;background:linear-gradient(160deg,var(--navy) 0%,var(--navy-dark) 100%);
    color:#fff;text-align:center;
  }
  .blog-hero h1{color:#fff;font-size:38px;margin-bottom:10px;}
  .blog-hero p{color:rgba(255,255,255,.82);max-width:560px;margin:0 auto;}
  .blog-list{padding:56px 0 90px;}
  .blog-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:28px;}
  .blog-card{
    background:var(--paper,#faf8f3);border:1px solid var(--border,#e6e1d6);border-radius:var(--radius,10px);
    padding:26px 24px;text-decoration:none;color:inherit;display:flex;flex-direction:column;gap:10px;
    transition:transform .25s var(--ease,ease),box-shadow .25s var(--ease,ease);
  }
  .blog-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg,0 12px 28px rgba(0,0,0,.12));}
  .blog-card .blog-date{font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--gold);font-weight:700;}
  .blog-card h2{font-size:21px;margin:0;line-height:1.3;}
  .blog-card p{font-size:14.5px;color:var(--muted);margin:0;}
  .blog-card .blog-readmore{margin-top:auto;font-size:14px;font-weight:600;color:var(--navy);}
  .blog-empty{text-align:center;padding:60px 20px;color:var(--muted);}
  .post-wrap{max-width:720px;margin:0 auto;padding:64px 24px 90px;}
  .post-wrap .blog-date{font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--gold);font-weight:700;}
  .post-wrap h1{font-size:36px;margin:10px 0 26px;line-height:1.2;}
  .post-wrap .post-cover{width:100%;border-radius:var(--radius,10px);margin-bottom:28px;display:block;}
  .post-body{font-size:17px;line-height:1.75;color:var(--ink);}
  .post-body h2{font-size:24px;margin:34px 0 14px;color:var(--navy);}
  .post-body h3{font-size:20px;margin:28px 0 12px;color:var(--navy);}
  .post-body p{margin:0 0 18px;}
  .post-body ul,.post-body ol{margin:0 0 18px 22px;}
  .post-body li{margin-bottom:8px;}
  .post-body a{color:var(--navy);text-decoration:underline;}
  .post-body blockquote{border-left:3px solid var(--gold);padding:4px 20px;margin:20px 0;color:var(--muted);font-style:italic;}
  .back-link{display:inline-flex;align-items:center;gap:6px;color:var(--navy);font-weight:600;text-decoration:none;margin-bottom:26px;font-size:14.5px;}
  .post-cta{
    margin-top:48px;padding:28px;border-radius:var(--radius,10px);background:var(--navy);color:#fff;
    display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between;
  }
  .post-cta p{margin:0;font-weight:600;}
  ${extraStyle}
</style>
</head>
<body>
${headerBlock}
${body}
${footerBlock}
<script>
  var y=document.getElementById('year'); if(y){ y.textContent = new Date().getFullYear(); }
  var mt=document.getElementById('menuToggle'), nl=document.getElementById('navLinks');
  if(mt && nl){ mt.addEventListener('click', function(){ nl.classList.toggle('open'); mt.classList.toggle('active'); }); }
</script>
<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
<script>
  if (window.netlifyIdentity) {
    window.netlifyIdentity.on("init", user => {
      if (!user) { window.netlifyIdentity.on("login", () => { document.location.href = "/admin/"; }); }
    });
  }
</script>
</body>
</html>
`;
}

function slugFromFilename(filename) {
  return filename.replace(/\.md$/, '');
}

function loadPosts() {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'));
  const posts = files.map(filename => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), 'utf8');
    const { data, content } = matter(raw);
    return {
      slug: slugFromFilename(filename),
      title: data.title || 'Sin título',
      date: data.date ? new Date(data.date) : new Date(),
      excerpt: data.excerpt || '',
      cover: data.cover || '',
      draft: !!data.draft,
      html: marked.parse(content || ''),
    };
  });
  return posts
    .filter(p => !p.draft)
    .sort((a, b) => b.date - a.date);
}

function formatDate(d) {
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function buildListingPage(posts) {
  const cardsHtml = posts.length
    ? posts.map(p => `
      <a class="blog-card" href="/blog/${p.slug}/">
        <span class="blog-date">${formatDate(p.date)}</span>
        <h2>${p.title}</h2>
        ${p.excerpt ? `<p>${p.excerpt}</p>` : ''}
        <span class="blog-readmore">Leer más &rarr;</span>
      </a>`).join('\n')
    : `<div class="blog-empty"><p>Todavía no hay novedades publicadas. ¡Pronto vamos a compartir novedades de derecho acá!</p></div>`;

  const body = `
  <section class="blog-hero">
    <div class="container">
      <span class="eyebrow" style="color:#fff">Estudio Pellegrini</span>
      <h1>Novedades de derecho</h1>
      <p>Actualizaciones, cambios normativos y consejos legales explicados en un lenguaje claro.</p>
    </div>
  </section>
  <section class="blog-list">
    <div class="container">
      <div class="blog-grid">
        ${cardsHtml}
      </div>
    </div>
  </section>`;

  const html = page({
    title: 'Novedades de derecho | Estudio Jurídico Pellegrini',
    description: 'Novedades, cambios normativos y consejos legales del Estudio Jurídico Pellegrini.',
    body,
  });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html, 'utf8');
}

function buildPostPage(post) {
  const body = `
  <article class="post-wrap">
    <a class="back-link" href="/blog/">&larr; Volver a Novedades</a>
    <span class="blog-date">${formatDate(post.date)}</span>
    <h1>${post.title}</h1>
    ${post.cover ? `<img class="post-cover" src="${post.cover}" alt="${post.title}">` : ''}
    <div class="post-body">${post.html}</div>
    <div class="post-cta">
      <p>¿Tenés una consulta sobre este tema?</p>
      <a href="https://wa.me/5491170545655?text=Hola%2C%20te%20escribo%20por%20la%20nota%20%22${encodeURIComponent(post.title)}%22" class="btn btn-primary" target="_blank" rel="noopener">Escribinos por WhatsApp</a>
    </div>
  </article>`;

  const html = page({
    title: `${post.title} | Blog Estudio Pellegrini`,
    description: post.excerpt || post.title,
    body,
  });

  const dir = path.join(OUT_DIR, post.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
}

function main() {
  const posts = loadPosts();
  buildListingPage(posts);
  posts.forEach(buildPostPage);
  console.log(`Blog generado: ${posts.length} nota(s) publicada(s).`);
}

main();
