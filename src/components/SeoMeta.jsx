// src/components/SeoMeta.jsx

// Renders portfolio text content in the main DOM for search engine indexing.
// The OS content is inside a CSS3DRenderer iframe — invisible to crawlers.
// Uses the screen-reader-safe hidden pattern (not penalized by Google).
const srOnly = {
  position:   'absolute',
  width:      '1px',
  height:     '1px',
  padding:    0,
  margin:     '-1px',
  overflow:   'hidden',
  clip:       'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border:     0,
}

export function SeoMeta() {
  return (
    <div aria-hidden="true" style={srOnly}>
      <h1>Poncelet Tymeo — Developpeur Web Full Stack</h1>
      <p>
        Portfolio interactif simulant un environnement Windows 95 en 3D.
        Developpeur passionne par les interfaces creatives, la 3D web
        et l experience utilisateur.
      </p>
      <section>
        <h2>Projets</h2>
        <ul>
          <li>Portfolio 3D Windows 95 — Three.js, React Three Fiber, CSS3DRenderer</li>
        </ul>
      </section>
      <section>
        <h2>Competences techniques</h2>
        <ul>
          <li>React, Three.js, JavaScript, TypeScript, Node.js, CSS, Tailwind CSS, Git, Vite</li>
        </ul>
      </section>
      <section>
        <h2>Contact</h2>
        <p>Email : tymeo.poncelet@gmail.com</p>
      </section>
    </div>
  )
}
