import { writeFile, readFile, mkdir } from "node:fs/promises";
import { format } from "prettier";
import {
  chapters,
  ideas,
  terms,
  conditions,
  quiz,
  voices,
  supports,
} from "../content/handbook.mjs";
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-$/, "");
const paths = {
  home: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  spark:
    '<path d="m12 3 2.8 6.2L21 12l-6.2 2.8L12 21l-2.8-6.2L3 12l6.2-2.8Z"/>',
  book: '<path d="M12 5v16M12 5C8 2 4 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-2-1-6-2-10 1Z"/>',
  brain:
    '<path d="M12 5c-3-5-8-1-7 2-5 1-4 7-1 8-2 5 5 8 8 4 3 4 10 1 8-4 3-1 4-7-1-8 1-3-4-7-7-2Zm0 0v14M5 7l3 2M4 15l4-2m11-6-3 2m4 6-4-2"/>',
  school: '<path d="m2 8 10-5 10 5-10 5L2 8Zm4 3v6c4 3 8 3 12 0v-6m4-3v8"/>',
  voices:
    '<path d="M21 11a8 8 0 0 1-8 8H6l-4 3V10a8 8 0 0 1 8-8h3a8 8 0 0 1 8 9ZM7 8h9M7 12h6"/>',
  quiz: '<path d="M9 8a3 3 0 1 1 4 3c-1 .5-1 1-1 3m0 3h.01"/><circle cx="12" cy="12" r="10"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16 8-3 5-5 3 3-5 5-3Z"/>',
  link: '<path d="m10 13 4-4m-6 6-2 2a3 3 0 0 1-4-4l5-5a3 3 0 0 1 4 0m2 3a3 3 0 0 0 4 0l5-5a3 3 0 0 0-4-4l-2 2"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  settings:
    '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  play: '<path d="m9 5 11 7-11 7V5Z"/>',
  heart:
    '<path d="M20 5c-3-3-7-1-8 1-1-2-5-4-8-1-5 5 3 11 8 15 5-4 13-10 8-15Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
};
const icon = (name, cls = "") =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.book}</svg>`;
const arrow = icon("arrow");
const external = (url, title) =>
  `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${title} <span class="external-mark" aria-label="opens in new tab">↗</span></a>`;
const citation = (url, publisher) =>
  `<p class="citation">Read the reference · ${external(url, esc(publisher))}</p>`;
const note = (title, text) =>
  `<aside class="note">${icon("spark")}<div><strong>${title}</strong><p>${text}</p></div></aside>`;
const pageIntro = (eyebrow, title, description) =>
  `<header class="page-intro"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p class="lede">${description}</p></header>`;
const card = (c, i) =>
  `<a class="chapter-card ${c.color}" href="${c.id}.html"><div class="card-top"><span class="icon-box">${icon(c.icon)}</span><span class="chapter-index">0${i + 1}</span></div><span class="eyebrow">${c.category}</span><h3>${c.label}</h3><p>${c.description}</p><div class="card-bottom"><span>${c.time} min read</span><span class="card-status" data-status="${c.id}"></span>${arrow}</div></a>`;
const next = (id) => {
  const i = chapters.findIndex((c) => c.id === id);
  const n = chapters[(i + 1) % chapters.length];
  return `<div class="article-end"><button class="button secondary" data-complete="${id}">${icon("check")}<span>Mark as read</span></button><a class="next-chapter" href="${n.id}.html"><span><small>Up next</small>${n.label}</span>${arrow}</a></div>`;
};
function home() {
  return `<section class="home-hero"><div class="hero-copy"><span class="eyebrow"><span class="live-dot"></span> A DIFFERENT WAY TO SEE DIFFERENCE</span><h1>Different minds.<br><em>A wider world.</em></h1><p>A little understanding opens up a lot of possibility. Explore neurodiversity, challenge assumptions, and learn how to make room for every mind.</p><div class="hero-actions"><a class="button" href="top5.html">Start with the essentials ${arrow}</a><a class="text-link" href="#explore">Explore the handbook <span>↓</span></a></div><div class="hero-footnote">${icon("book")} A free handbook for students, educators & curious minds</div></div><figure class="brain-figure"><img src="assets/mind-map.svg" width="600" height="510" alt="An illustrated mind made of distinct, connected pathways, with labels for thinking, sensing, learning, and connecting."><figcaption>Different connections. Endless perspectives.</figcaption></figure></section><section class="principle-strip"><span class="eyebrow">THE IDEA AT THE HEART OF IT ALL</span><p>There is no single “right” way<br class="desktop-break"> to think, learn, or experience the world.</p><span class="strip-mark" aria-hidden="true">✳</span></section><section id="explore" class="section-block"><div class="section-heading"><div><span class="eyebrow">YOUR FIELD GUIDE TO NEURODIVERSITY</span><h2>A little curiosity.<br>A new perspective.</h2></div><p>Start at the beginning, or follow what interests you.<br>There’s more than one way to learn here.</p></div><div class="filter-tabs" role="group" aria-label="Filter handbook chapters"><button class="active" data-chapter-filter="All" aria-pressed="true">All chapters <span>8</span></button><button data-chapter-filter="The foundations" aria-pressed="false">The foundations</button><button data-chapter-filter="Everyday inclusion" aria-pressed="false">Everyday inclusion</button><button data-chapter-filter="Resources" aria-pressed="false">Resources</button></div><div class="chapter-grid">${chapters.map(card).join("")}</div><p class="filter-empty" hidden>No chapters match this filter.</p></section><section class="voices-feature"><div class="voices-art" aria-hidden="true"><div class="quote-mark">“</div><div class="voice-lines"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span>LISTEN. LEARN. UNDERSTAND.</span></div><div><span class="eyebrow">LIVED EXPERIENCE, FIRSTHAND</span><h2>Understanding starts<br>with listening.</h2><p>No definition can tell the whole story. Hear neurodivergent people talk about their lives, in their own words.</p><a class="button" href="hndp.html">Meet the people behind the perspectives ${arrow}</a></div></section><section class="quiz-banner"><div class="quiz-symbol" aria-hidden="true">?</div><div><span class="eyebrow">A MOMENT TO RETHINK</span><h2>Fact, myth, or more to it?</h2><p>Six questions. A few assumptions worth questioning.</p></div><a class="button secondary" href="factmyth.html">Test your understanding ${arrow}</a></section>`;
}
function foundations() {
  return (
    pageIntro(
      "01 / THE ESSENTIALS",
      "Five ideas.<br><em>A broader perspective.</em>",
      "New to neurodiversity? Start here. These ideas are the foundation for understanding others and making everyday spaces more inclusive.",
    ) +
    `<div class="article-layout"><aside class="on-this-page"><span class="eyebrow">IN THIS CHAPTER</span>${ideas.map((x, i) => `<a href="#idea-${i + 1}"><span>0${i + 1}</span>${x[0]}</a>`).join("")}</aside><div class="article-body">${ideas.map((x, i) => `<section class="idea-section" id="idea-${i + 1}"><span class="big-number">0${i + 1}</span><div><h2>${x[0]}</h2><p>${x[1]}</p><div class="try-this"><span class="eyebrow">PUT IT INTO PRACTICE</span><p>${x[2]}</p></div></div></section>`).join("")}${citation("https://www.nih.gov/about-nih/what-we-do/science-health-public-trust/perspectives/writing-respectfully-person-first-identity-first-language", "NIH · Respectful language")}${next("top5")}</div></div>`
  );
}
function glossary() {
  return (
    pageIntro(
      "02 / THE FOUNDATIONS",
      "Words build<br><em>understanding.</em>",
      "A plain-language glossary for a more thoughtful conversation. Explore the terms, then see what they can mean in everyday life.",
    ) +
    `<div class="library-tools"><label class="inline-search">${icon("search")}<input id="term-search" type="search" placeholder="Find a term, like stimming or masking" aria-label="Search terminology"></label><div class="filter-tabs" role="group" aria-label="Filter terminology">${["All", "Foundations", "Language", "Everyday experiences", "Support"].map((x, i) => `<button data-term-filter="${x}" aria-pressed="${i === 0}" class="${i === 0 ? "active" : ""}">${x}</button>`).join("")}</div><p id="term-count" class="result-count" role="status">${terms.length} terms to explore</p></div><div class="glossary-grid">${terms.map((t) => `<article class="term" id="${slug(t[0])}" data-category="${t[1]}"><span class="eyebrow">${t[1]}</span><h2><a href="#${slug(t[0])}">${t[0]}</a></h2><p>${t[2]}</p><div class="term-example"><span>IN EVERYDAY LIFE</span><p>${t[3]}</p></div></article>`).join("")}</div><div id="term-empty" class="empty-state" hidden><h2>No matching terms</h2><p>Try a shorter word or choose a different category.</p><button class="button secondary" data-reset-terms>Reset filters</button></div>${note("A small distinction, a useful one.", "A group can be <strong>neurodiverse</strong>. An individual may be <strong>neurodivergent</strong>. Respect how people choose to describe themselves.")}${citation("https://my.clevelandclinic.org/health/symptoms/23154-neurodivergent", "Cleveland Clinic · Neurodivergent")}${citation("https://www.nih.gov/about-nih/what-we-do/science-health-public-trust/perspectives/writing-respectfully-person-first-identity-first-language", "NIH · Person-first and identity-first language")}${next("terminology")}`
  );
}
function conditionPage() {
  return (
    pageIntro(
      "03 / THE FOUNDATIONS",
      "One label.<br><em>Many experiences.</em>",
      "Get to know some of the conditions discussed in conversations about neurodiversity. Start with understanding, and stay curious about the individual.",
    ) +
    note(
      "A guide to understanding, not a diagnostic tool.",
      "These are brief educational overviews. Neurodivergent is not a medical diagnosis, and its boundaries vary. Mental health and neurological conditions are included here to reflect the original handbook’s broader scope. A qualified professional can assess individual concerns.",
    ) +
    `<div class="filter-tabs sticky-filters" role="group" aria-label="Filter conditions">${["All", "Development & attention", "Learning & movement", "Other related conditions"].map((g, i) => `<button data-condition-filter="${g}" aria-pressed="${!i}" class="${!i ? "active" : ""}">${g}</button>`).join("")}</div><p id="condition-count" class="result-count" role="status">9 conditions to explore</p><div class="conditions-list">${conditions.map((c, i) => `<article class="condition" id="${c.id}" data-group="${esc(c.group)}"><div class="condition-label"><span class="chapter-index">0${i + 1}</span><h2>${c.name}</h2><span>${c.full}</span><span class="pill">${esc(c.group)}</span></div><div class="condition-content"><p class="condition-intro">${c.intro}</p><details><summary>What might this look like? <span>+</span></summary><ul>${c.experience.map((x) => `<li>${x}</li>`).join("")}</ul></details><div class="support-tip"><span class="eyebrow">MAKE ROOM FOR DIFFERENCE</span><p>${c.support}</p></div>${citation(c.source, c.publisher)}</div></article>`).join("")}</div>${next("conditions")}`
  );
}
function school() {
  return (
    pageIntro(
      "04 / EVERYDAY INCLUSION",
      "Better support.<br><em>More possibility.</em>",
      "An inclusive school makes it easier for every student to participate. Start by listening, then work together to remove barriers.",
    ) +
    `<div class="school-principles"><article>${icon("voices")}<h2>Ask, then listen.</h2><p>A student knows things about their experience that you cannot see. Ask privately what helps.</p></article><article>${icon("book")}<h2>Offer different routes.</h2><p>Instructions, participation, and assessment can take more than one form.</p></article><article>${icon("heart")}<h2>Keep dignity central.</h2><p>Protect privacy. Avoid assumptions about ability, effort, or what someone should find easy.</p></article></div><section class="section-block" id="support-planner"><div class="section-heading"><div><span class="eyebrow">FROM UNDERSTANDING TO ACTION</span><h2>Build a conversation starter.</h2></div><p>Select ideas to discuss with a student, teacher, or support team. This checklist is a starting point, not a formal plan.</p></div><div class="support-planner"><div class="support-options">${supports.map((g) => `<fieldset><legend>${g.group}</legend>${g.items.map((x) => `<label><input type="checkbox" name="support" value="${esc(x)}"><span>${x}</span></label>`).join("")}</fieldset>`).join("")}</div><aside class="selected-support"><span class="eyebrow">MY DISCUSSION CHECKLIST</span><h3>Small changes.<br>Meaningful access.</h3><p id="support-count" role="status">Choose ideas from the list to get started.</p><ul id="support-selection"></ul><div class="planner-actions"><button class="button" id="print-support" disabled>Print my checklist ${arrow}</button><button class="text-link" id="reset-support" disabled>Clear selection</button></div><p class="fine-print">Your selections stay on this page and are not sent anywhere.</p></aside></div></section><section class="section-block"><span class="eyebrow">UNDERSTANDING SCHOOL SUPPORT IN THE U.S.</span><h2>Two different frameworks for access.</h2><div class="comparison-wrap"><table class="comparison"><caption>General overview of IEPs and Section 504 plans in U.S. public schools</caption><thead><tr><th scope="col">At a glance</th><th scope="col">IEP</th><th scope="col">Section 504 plan</th></tr></thead><tbody><tr><th scope="row">Purpose</th><td>Special education and related services for an eligible student.</td><td>Equal access for an eligible student with a disability.</td></tr><tr><th scope="row">Framework</th><td>Individuals with Disabilities Education Act (IDEA).</td><td>Section 504 of the Rehabilitation Act.</td></tr><tr><th scope="row">What it can include</th><td>Individualized goals, specially designed instruction, accommodations, and services.</td><td>Accommodations, related aids, and services needed for equal access.</td></tr><tr><th scope="row">Getting started</th><td>Ask the school about an evaluation and the IEP process.</td><td>Ask the school’s Section 504 coordinator about evaluation and support.</td></tr></tbody></table></div><p class="fine-print">Eligibility is individualized. A diagnosis does not automatically establish eligibility, and the setting is not determined by the plan’s name. Ask your school about applicable procedures.</p>${citation("https://sites.ed.gov/idea/", "U.S. Department of Education · IDEA")}${citation("https://www.ed.gov/laws-and-policy/individuals-disabilities/section-504", "U.S. Department of Education · Section 504")}</section><section class="section-block"><span class="eyebrow">CONNECTION WITHOUT ASSUMPTIONS</span><h2>Make communication a shared responsibility.</h2><div class="two-column"><div><h3>Say what you mean.</h3><p>Unspoken rules, sarcasm, and indirect requests are not equally clear to everyone. Explain expectations directly and offer time to respond. Eye contact is not a reliable measure of listening.</p></div><div><h3>Make space to reset.</h3><p>A noisy cafeteria, bright classroom, or sudden change can feel overwhelming. Offer predictable routines and a quieter place to regroup without treating a break as a punishment.</p></div></div></section>${next("school")}`
  );
}
function voicePage() {
  return (
    pageIntro(
      "05 / EVERYDAY INCLUSION",
      "Real people.<br><em>Their own words.</em>",
      "Definitions are only a beginning. Make time for the people whose experiences bring these ideas to life.",
    ) +
    note(
      "One person’s story is one person’s story.",
      "These videos were selected by the original NeuroScope team. Individual accounts offer a perspective, not a description of everyone with a shared diagnosis.",
    ) +
    `<div class="stories">${voices.map((v, i) => `<article class="story"><div class="video-facade ${["peach", "sage", "lavender", "butter"][i % 4]}" data-video="${v.video}"><span class="video-number">PERSPECTIVE 0${i + 1}</span><button class="play-button" data-play="${v.video}" aria-label="Play video: ${esc(v.title)}">${icon("play")}</button><span class="video-name">${v.name}</span><span class="video-host">PLAY ON THIS PAGE · YOUTUBE</span></div><div class="story-copy"><span class="eyebrow">${v.tag}</span><h2>${v.title}</h2><p>${v.description}</p>${external("https://www.youtube.com/watch?v=" + v.video, "Watch on YouTube")}</div></article>`).join("")}</div>${next("hndp")}`
  );
}
function quizPage() {
  return (
    pageIntro(
      "06 / PUT IT INTO PRACTICE",
      "A little rethink.<br><em>A clearer picture.</em>",
      "What have you heard about neurodiversity? Explore six statements, make a choice, and discover the context behind each answer.",
    ) +
    `<div id="quiz-app" class="quiz-app"><div class="quiz-topline"><span class="eyebrow" id="quiz-position">QUESTION 01 OF 06</span><span id="quiz-score">0 correct so far</span></div><div class="quiz-progress"><span id="quiz-progress-fill"></span></div><div id="quiz-question"><span class="question-mark" aria-hidden="true">“</span><h2 id="quiz-statement">${quiz[0].statement}</h2><p>How would you describe this statement?</p><div class="quiz-choices">${["Fact", "Myth", "More to it"].map((x) => `<button class="button secondary" data-answer="${x}">${x}</button>`).join("")}</div></div><div id="quiz-feedback" class="quiz-feedback" hidden role="status"></div><button class="button" id="quiz-next" hidden>Next question ${arrow}</button><div id="quiz-results" hidden></div></div><noscript><div class="note"><p>Turn on JavaScript to take the interactive quiz, or read the statements and answers below.</p></div></noscript><details class="answer-guide"><summary>Prefer to read? View all questions and explanations. <span>+</span></summary>${quiz.map((q, i) => `<article><span class="eyebrow">${i + 1} / ${q.answer}</span><h3>${q.statement}</h3><p>${q.explanation}</p><a class="text-link" href="${q.link}">Explore this idea ${arrow}</a></article>`).join("")}</details>${next("factmyth")}`
  );
}
function learnmore() {
  const more = [
    [
      "Understanding synesthesia",
      "Sensory experiences",
      "Explore a different way of experiencing the senses, where an experience in one sense can be associated with another.",
      "ZVC3E16FCrk",
    ],
    [
      "An inclusive workplace",
      "Inclusion at work",
      "Andrew Pfeiffer talks about the value of creating a genuinely inclusive workplace.",
      "LYAJGkNU9Rw",
    ],
    [
      "Drawing a city from memory",
      "Art & individual experience",
      "Watch artist Stephen Wiltshire draw the New York skyline after observing it from a helicopter. One extraordinary artist’s story is not a general expectation of autistic people.",
      "JL6NAIVpl54",
    ],
  ];
  return (
    pageIntro(
      "07 / KEEP EXPLORING",
      "Let curiosity<br><em>take you further.</em>",
      "Reading, listening, and watching can open up new perspectives. Here are a few places the original team recommends exploring.",
    ) +
    `<section><div class="section-heading"><div><span class="eyebrow">A PLACE ON YOUR READING LIST</span><h2>Keep turning the page.</h2></div></div><div class="resource-grid"><a class="resource-card sage" href="https://sites.google.com/berkeley.net/neurodiversityreadinglist" target="_blank" rel="noopener noreferrer">${icon("book")}<span class="eyebrow">CURATED READING</span><h3>Berkeley neurodiversity reading list</h3><p>Explore a collection of books about neurodiversity and lived experience.</p><span>Browse the list ↗<span class="sr-only"> (opens in new tab)</span></span></a><a class="resource-card peach" href="https://www.drkatielinder.com/a-neurodiversity-reading-list/" target="_blank" rel="noopener noreferrer">${icon("book")}<span class="eyebrow">CURATED READING</span><h3>Katie Linder’s reading list</h3><p>Discover another route into learning about different minds and experiences.</p><span>Browse the list ↗<span class="sr-only"> (opens in new tab)</span></span></a></div></section><section class="section-block"><span class="eyebrow">WATCH & REFLECT</span><h2>Perspectives beyond the page.</h2><div class="stories">${more.map((v, i) => `<article class="story"><div class="video-facade ${["lavender", "butter", "sage"][i]}" data-video="${v[3]}"><span class="video-number">WATCH & REFLECT</span><button class="play-button" data-play="${v[3]}" aria-label="Play video: ${v[0]}">${icon("play")}</button><span class="video-name">${v[0]}</span><span class="video-host">YOUTUBE · CLICK TO LOAD</span></div><div class="story-copy"><span class="eyebrow">${v[1]}</span><h3>${v[0]}</h3><p>${v[2]}</p>${external("https://www.youtube.com/watch?v=" + v[3], "Watch on YouTube")}</div></article>`).join("")}</div></section>${note("A film to discuss: Front of the Class", "This 2008 film dramatizes teacher Brad Cohen’s experience with Tourette syndrome. Consider what the story shows about access, expectations, and belonging; a dramatization does not represent every person’s experience.")}${next("learnmore")}`
  );
}
const originalSources = JSON.parse(
  await readFile(new URL("../content/original-sources.json", import.meta.url)),
);
const primarySources = [
  [
    "Neurodivergent",
    "Cleveland Clinic",
    "https://my.clevelandclinic.org/health/symptoms/23154-neurodivergent",
  ],
  [
    "Person-first and identity-first language",
    "National Institutes of Health",
    "https://www.nih.gov/about-nih/what-we-do/science-health-public-trust/perspectives/writing-respectfully-person-first-identity-first-language",
  ],
  ...conditions.map((c) => [c.full, c.publisher, c.source]),
  [
    "Individuals with Disabilities Education Act",
    "U.S. Department of Education",
    "https://sites.ed.gov/idea/",
  ],
  [
    "Section 504",
    "U.S. Department of Education",
    "https://www.ed.gov/laws-and-policy/individuals-disabilities/section-504",
  ],
];
function sources() {
  return (
    pageIntro(
      "08 / THE REFERENCE SHELF",
      "Follow the sources.<br><em>Keep asking questions.</em>",
      "Good understanding leaves a trail. Explore the references behind the handbook, alongside the original team’s reading and research.",
    ) +
    `<section><span class="eyebrow">REFERENCES FOR THIS EDITION</span><h2>Start with the source.</h2><p>Clinical overviews link directly to health organizations. School support links to U.S. Department of Education resources. These links support introductory learning and do not replace individual professional advice.</p><div class="source-list">${primarySources.map((s, i) => `<article><span class="source-number">${String(i + 1).padStart(2, "0")}</span><div><span class="eyebrow">${s[1]}</span><h3>${external(s[2], esc(s[0]))}</h3></div></article>`).join("")}</div></section><section class="section-block"><span class="eyebrow">THE ORIGINAL HANDBOOK</span><h2>The team’s reference collection.</h2><p>Retained from the original project for transparency and further exploration. This collection includes secondary commentary and visual references; inclusion does not imply that every claim in a source has been independently verified.</p><details class="answer-guide"><summary>Browse all ${originalSources.length} original references <span>+</span></summary><ol class="original-sources">${originalSources.map((s) => `<li>${external(s.url, esc(s.title || s.url))}</li>`).join("")}</ol></details></section>${next("sources")}`
  );
}
function about() {
  return (
    pageIntro(
      "OUR PURPOSE",
      "More understanding.<br><em>More belonging.</em>",
      "NeuroScope is a student-built learning resource for high school students and adults who want to better understand neurodiversity.",
    ) +
    `<div class="about-statement"><span class="eyebrow">WHY THIS HANDBOOK EXISTS</span><h2>Awareness can change<br>how we treat each other.</h2><p>The original team created NeuroScope to build awareness in social, academic, and professional environments, and help people recognize different strengths, experiences, and support needs.</p><p>This handbook invites you to learn the language, listen to lived experiences, question stereotypes, and take small steps toward more inclusive communities.</p></div><section class="section-block"><span class="eyebrow">THE PEOPLE BEHIND THE PROJECT</span><h2>Built together.</h2><div class="credits-grid"><article><h3>Project & team lead</h3><p>Andrew Regan</p></article><article><h3>Research team</h3><p>Shreya Goel<br>Karim Meleis<br>Camden Nguyen</p></article><article><h3>Website development team</h3><p>Jeff Jone Rajarupan<br>Sai Sathanapalli<br>Yazat Sinha</p></article><article><h3>Stanford Neurodiversity Project<br><small>(SNP REACH contributors)</small></h3><p>Hannah Karsting<br>Sundari Enkhtugs<br>Sreya Komati<br>Briseis Rubio<br>Dawon Shin<br>Audrey Tai<br>Rihana Abdulvahid<br>Ella Song<br>Matthew Higgins</p></article><article><h3>Additional adult contributors</h3><p>Shawn Mansanger<br>Julie Bartholomew</p></article></div></section>${note("Learning with care.", "NeuroScope offers general education, not diagnosis, treatment, or individual legal guidance. Respect each person’s preferences and seek qualified support for individual concerns.")}<div class="section-block"><h2>Make yourself at home.</h2><p>Your reading progress and display preferences can be saved in this browser. There are no accounts or analytics. The site contacts YouTube only when you choose to load a video, and external links take you to other sites.</p><button class="button secondary" id="clear-data">Reset reading progress & preferences</button><p id="reset-status" role="status"></p><a class="text-link" href="https://github.com/Jeffjone/nueroscope" target="_blank" rel="noopener noreferrer">Explore the project on GitHub ↗<span class="sr-only"> (opens in new tab)</span></a></div>`
  );
}
const renderers = {
  index: home,
  top5: foundations,
  terminology: glossary,
  conditions: conditionPage,
  school,
  hndp: voicePage,
  factmyth: quizPage,
  learnmore,
  sources,
  about,
};
function shell(id, body) {
  const c = chapters.find((c) => c.id === id);
  const title =
    c?.label ||
    (id === "about" ? "About the project" : "The neurodiversity handbook");
  const description =
    c?.description ||
    (id === "about"
      ? "Meet the student team behind NeuroScope and its mission to build understanding."
      : "A free, approachable guide to neurodiversity. Understand different minds, hear lived experiences, and build a more inclusive world.");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#f7f8f2"><meta name="description" content="${description}"><title>${title} · NeuroScope</title><link rel="canonical" href="https://neuroscope.us/${id === "index" ? "" : id + ".html"}"><meta property="og:type" content="website"><meta property="og:title" content="${title} · NeuroScope"><meta property="og:description" content="${description}"><meta property="og:image" content="https://neuroscope.us/assets/social.png"><meta name="twitter:card" content="summary_large_image"><link rel="icon" type="image/svg+xml" href="assets/favicon.svg"><link rel="stylesheet" href="assets/styles.css"><noscript><link rel="stylesheet" href="assets/no-script.css"></noscript><script src="assets/preferences.js"></script><script src="assets/app.js" defer></script></head><body data-page="${id}"><a class="skip-link" href="#main">Skip to content</a><div class="mobile-overlay" hidden></div><aside class="sidebar" id="sidebar"><button class="icon-button mobile-nav-close" aria-label="Close navigation">${icon("close")}</button><a href="index.html" class="brand" aria-label="NeuroScope home"><span class="brand-icon">${icon("brain")}</span>NeuroScope<span class="brand-period">.</span></a><div class="sidebar-label">THE NEURODIVERSITY HANDBOOK</div><nav aria-label="Main navigation"><a class="nav-home ${id === "index" ? "current" : ""}" ${id === "index" ? 'aria-current="page"' : ""} href="index.html">${icon("home")}<span>Overview</span></a>${[
    ["START HERE", ["top5"]],
    ["UNDERSTAND", ["terminology", "conditions"]],
    ["CONNECT & INCLUDE", ["school", "hndp", "factmyth"]],
    ["GO FURTHER", ["learnmore", "sources"]],
  ]
    .map(
      ([label, ids]) =>
        `<div class="nav-group"><span>${label}</span>${ids
          .map((cid) => {
            let item = chapters.find((x) => x.id === cid);
            return `<a href="${cid}.html" ${id === cid ? 'class="current" aria-current="page"' : ""}>${icon(item.icon)}<span>${item.label}</span><i class="nav-read" data-status="${cid}" aria-label="Read"></i></a>`;
          })
          .join("")}</div>`,
    )
    .join(
      "",
    )}</nav><div class="sidebar-bottom"><div class="reading-tracker"><div><span>Your reading journey</span><strong id="reading-count">0 / 8</strong></div><div class="reading-track"><span id="reading-fill"></span></div><small>One perspective at a time.</small></div><a href="about.html" ${id === "about" ? 'aria-current="page"' : ""}>About the project ${arrow}</a><span class="sidebar-signoff">Different minds. Shared humanity.</span></div></aside><div class="site-body"><header class="topbar"><button class="icon-button mobile-menu" aria-label="Open navigation" aria-controls="sidebar" aria-expanded="false">${icon("menu")}</button><div class="breadcrumb"><span>The handbook</span><span>/</span><strong>${id === "index" ? "Overview" : id === "about" ? "About" : c.label}</strong></div><div class="topbar-actions"><button class="search-trigger" aria-label="Search the handbook" data-open-search>${icon("search")}<span>Search the handbook</span><kbd>⌘ K</kbd></button><button class="icon-button" data-open-settings aria-label="Reading preferences" title="Reading preferences">${icon("settings")}</button></div></header><main id="main" tabindex="-1">${body}</main><footer class="footer"><a class="footer-brand" href="index.html">NeuroScope.</a><p>A wider world starts with understanding.</p><div><a href="about.html">About</a><a href="sources.html">Sources</a><a href="#main">Back to top ↑</a></div><small>A student-built educational resource. Made for every kind of mind.</small></footer></div><dialog id="search-dialog" class="search-dialog" aria-labelledby="search-title"><div class="dialog-top"><h2 id="search-title">Follow your curiosity.</h2><button class="icon-button" data-close-dialog aria-label="Close search">${icon("close")}</button></div><label class="modal-search">${icon("search")}<input id="global-search" type="search" autocomplete="off" placeholder="Try ADHD, school support, or masking…" aria-label="Search all handbook content"></label><div id="search-results" class="search-results" aria-live="polite"></div><div class="search-footer"><span>↑ ↓ to navigate · Enter to open</span><span>Esc to close</span></div></dialog><dialog id="settings-dialog" class="settings-dialog" aria-labelledby="settings-title"><div class="dialog-top"><h2 id="settings-title">Make room for your mind.</h2><button class="icon-button" data-close-dialog aria-label="Close reading preferences">${icon("close")}</button></div><p>A few ways to make reading more comfortable. Your choices stay in this browser.</p><label class="preference-row"><span><strong>Larger text</strong><small>A little more room for every word.</small></span><input id="large-text" type="checkbox" role="switch"></label><label class="preference-row"><span><strong>Calm mode</strong><small>Softer decoration, no transitions.</small></span><input id="calm-mode" type="checkbox" role="switch"></label><button class="button" data-close-dialog>Keep exploring ${arrow}</button></dialog><div class="sr-only" id="announcement" role="status"></div></body></html>`;
}
await mkdir("assets", { recursive: true });
for (const [id, render] of Object.entries(renderers))
  await writeFile(
    id + ".html",
    await format(shell(id, render()), { parser: "html", printWidth: 100 }),
  );
const search = [
  ...chapters.map((c) => ({
    title: c.label,
    text: c.description + " " + c.category,
    url: c.id + ".html",
    category: "Chapter",
  })),
  ...terms.map((t) => ({
    title: t[0],
    text: t[2] + " " + t[3],
    url: "terminology.html#" + slug(t[0]),
    category: "Terminology",
  })),
  ...conditions.map((c) => ({
    title: c.name,
    text: c.full + " " + c.intro + " " + c.support,
    url: "conditions.html#" + c.id,
    category: "Condition",
  })),
  ...voices.map((v) => ({
    title: v.name,
    text: v.description,
    url: "hndp.html",
    category: "Lived experience",
  })),
  {
    title: "IEP and 504 plans",
    text: "School support accommodations special education",
    url: "school.html#support-planner",
    category: "School support",
  },
  {
    title: "About NeuroScope",
    text: "Project contributors team mission",
    url: "about.html",
    category: "About",
  },
];
await writeFile("assets/search-index.json", JSON.stringify(search));
await writeFile("assets/quiz.json", JSON.stringify(quiz));
await writeFile(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(
    renderers,
  )
    .map(
      (id) =>
        `<url><loc>https://neuroscope.us/${id === "index" ? "" : id + ".html"}</loc></url>`,
    )
    .join("")}</urlset>\n`,
);
await writeFile(
  "robots.txt",
  "User-agent: *\nAllow: /\nSitemap: https://neuroscope.us/sitemap.xml\n",
);
console.log(
  "Built 10 accessible static pages, search index, quiz data, and sitemap.",
);
