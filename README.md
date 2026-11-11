# NeuroScope

A student-built neurodiversity handbook for high school students, educators, and curious adults. The site helps readers understand terminology and conditions, listen to lived experiences, question stereotypes, and make schools more inclusive.

## Develop

Requires Node.js 22+ and npm. No framework or production JavaScript dependencies are required.

```sh
npm ci
npm run build
npm run dev
```

Open http://127.0.0.1:4173. The preview serves the repository root. Regenerate pages after changing the content or templates; asset edits appear on refresh.

## Edit content

- `content/handbook.mjs`: chapters, glossary, condition overviews, quiz, lived-experience videos, and school support ideas.
- `content/original-sources.json`: the original team's bibliography, retained separately from current chapter references.
- `scripts/build.mjs`: shared page shell, page templates, metadata, and generation of all ten HTML pages, search data, and sitemap.
- `assets/styles.css`: responsive design, typography, focus styles, reduced-motion support, and print layout.
- `assets/app.js`: local search, filters, quiz, reading progress, preferences, and checklist interactions.

Run `npm run build` and commit the generated root HTML and data files with their source changes. This keeps the existing `.html` URLs and supports direct static hosting without a build server. `CNAME` retains the existing `neuroscope.us` domain. Production hosting configuration is managed separately; this repository does not provision hosting or change DNS.

The redesign preserves the original contributor credits, all nine condition topics, all original lived-experience videos, and the bibliography. Clinical and school support summaries were rewritten to avoid unsupported ability stereotypes, outdated prevalence statistics, and misleading generalizations about educational plans. Chapter references link to the relevant health organizations and U.S. Department of Education. Future editors should verify those sources when changing substantive claims. Videos and external resources remain subject to their providers' availability.

## Verify

```sh
npm run check
npm test
```

`check` verifies headings, unique IDs, local links, assets, and search destinations. Browser tests cover all ten pages, WCAG A/AA automated checks through axe, keyboard interactions, phone/tablet/desktop widths, larger text, progress persistence, the full quiz, printable support selections, deferred video loading, and graceful failure when JavaScript, storage, or optional requests are unavailable. Automated accessibility checks do not replace testing with users and assistive technology.

On macOS, browser tests use installed Google Chrome. On Linux, run `npx playwright install --with-deps chromium` first. GitHub Actions builds, checks generation consistency, and runs the browser suite for pushes and pull requests.

## Design and privacy

The site uses a self-hosted Manrope font (SIL Open Font License in `assets/OFL-Manrope.txt`), system serif typography, original SVG artwork, and a light palette. No fonts, scripts, analytics, accounts, or search queries are sent to third-party services. Optional reading progress and display choices use browser local storage and can be reset on the About page. School checklist selections remain in page memory. YouTube privacy-enhanced embeds load only after a reader clicks play. Following external links contacts their respective providers.

Regenerate the social preview with `node scripts/social.mjs` after changing the visual identity. Existing legacy image files remain available to preserve any incoming asset links; the new layout uses original vector artwork.
