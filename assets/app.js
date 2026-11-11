"use strict";
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];
  const el = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const read = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem("neuroscope:" + key)) ?? fallback;
    } catch {
      return fallback;
    }
  };
  const save = (key, value) => {
    try {
      localStorage.setItem("neuroscope:" + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  };
  const announce = (text) => {
    $("#announcement").textContent = text;
  };
  let completed = read("completed", []);
  if (!Array.isArray(completed)) completed = [];
  const chapterIds = [
    "top5",
    "terminology",
    "conditions",
    "school",
    "hndp",
    "factmyth",
    "learnmore",
    "sources",
  ];
  completed = [...new Set(completed.filter((id) => chapterIds.includes(id)))];
  function syncReading() {
    $("#reading-count").textContent = `${completed.length} / 8`;
    $("#reading-fill").style.width = `${(completed.length / 8) * 100}%`;
    $$("[data-status]").forEach((node) => {
      const done = completed.includes(node.dataset.status);
      node.textContent = done ? "✓" : "";
      node.setAttribute("aria-label", done ? "Read" : "");
    });
    $$("[data-complete]").forEach((button) => {
      const done = completed.includes(button.dataset.complete);
      $("span", button).textContent = done
        ? "Read · mark as unread"
        : "Mark as read";
      button.setAttribute("aria-pressed", String(done));
    });
  }
  syncReading();
  $$("[data-complete]").forEach((button) =>
    button.addEventListener("click", () => {
      const id = button.dataset.complete;
      completed = completed.includes(id)
        ? completed.filter((x) => x !== id)
        : [...completed, id];
      const persisted = save("completed", completed);
      syncReading();
      announce(
        persisted
          ? "Reading progress updated."
          : "Reading progress updated for this page. Browser storage is unavailable.",
      );
    }),
  );
  window.addEventListener("storage", (event) => {
    if (event.key === "neuroscope:completed") {
      const updated = read("completed", []);
      completed = Array.isArray(updated)
        ? [...new Set(updated.filter((x) => chapterIds.includes(x)))]
        : [];
      syncReading();
    }
  });

  let dialogOpener = null;
  function openDialog(dialog, opener) {
    closeMenu();
    dialogOpener = opener;
    dialog.showModal();
  }
  $$("[data-close-dialog]").forEach((b) =>
    b.addEventListener("click", () => b.closest("dialog").close()),
  );
  $$("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        dialog.close();
    });
    dialog.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        dialog.close();
      }
    });
    dialog.addEventListener("close", () => dialogOpener?.focus());
  });
  let preferences = read("preferences", {});
  if (
    !preferences ||
    typeof preferences !== "object" ||
    Array.isArray(preferences)
  )
    preferences = {};
  function syncPreferences() {
    document.documentElement.classList.toggle(
      "large-text",
      preferences.large === true,
    );
    document.documentElement.classList.toggle(
      "calm-mode",
      preferences.calm === true,
    );
    $("#large-text").checked = preferences.large === true;
    $("#calm-mode").checked = preferences.calm === true;
  }
  syncPreferences();
  $("#large-text").addEventListener("change", (event) => {
    preferences.large = event.target.checked;
    save("preferences", preferences);
    syncPreferences();
  });
  $("#calm-mode").addEventListener("change", (event) => {
    preferences.calm = event.target.checked;
    save("preferences", preferences);
    syncPreferences();
  });
  $("[data-open-settings]").addEventListener("click", (event) =>
    openDialog($("#settings-dialog"), event.currentTarget),
  );
  $("#clear-data")?.addEventListener("click", () => {
    completed = [];
    preferences = {};
    try {
      localStorage.removeItem("neuroscope:completed");
      localStorage.removeItem("neuroscope:preferences");
    } catch {
      /* Reset the active page even when persistence is unavailable. */
    }
    syncPreferences();
    syncReading();
    $("#reset-status").textContent =
      "Reading progress and display preferences have been reset.";
  });

  const menuButton = $(".mobile-menu"),
    sidebar = $("#sidebar"),
    overlay = $(".mobile-overlay");
  const mobileMedia = window.matchMedia("(max-width: 780px)");
  sidebar.inert = mobileMedia.matches;
  $(".mobile-nav-close").addEventListener("click", () => closeMenu(true));
  function closeMenu(restore = false) {
    if (!sidebar.classList.contains("open")) return;
    sidebar.classList.remove("open");
    overlay.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    $(".site-body").inert = false;
    sidebar.inert = mobileMedia.matches;
    if (restore) menuButton.focus();
  }
  menuButton.addEventListener("click", () => {
    sidebar.inert = false;
    sidebar.classList.add("open");
    overlay.hidden = false;
    menuButton.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    $(".site-body").inert = true;
    $("a", sidebar).focus();
  });
  overlay.addEventListener("click", () => closeMenu(true));
  document.addEventListener("keydown", (event) => {
    if (!sidebar.classList.contains("open")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
    }
    if (event.key === "Tab") {
      const links = $$("button,a", sidebar),
        first = links[0],
        last = links.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  mobileMedia.addEventListener("change", () => {
    closeMenu();
    sidebar.inert = mobileMedia.matches;
  });

  // Search is entirely local: downloaded once on demand, with token and typo matching.
  let searchData,
    searchPromise,
    selected = -1;
  const searchInput = $("#global-search"),
    searchResults = $("#search-results");
  const normalize = (text) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  function near(a, b) {
    if (a === b) return true;
    if (a.length < 5 || Math.abs(a.length - b.length) > 1) return false;
    let i = 0,
      j = 0,
      d = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) {
        i++;
        j++;
        continue;
      }
      if (++d > 1) return false;
      if (a.length > b.length) i++;
      else if (b.length > a.length) j++;
      else {
        i++;
        j++;
      }
    }
    return d + (a.length - i) + (b.length - j) <= 1;
  }
  function selectResult(index, focus = false) {
    const links = $$(".search-result", searchResults);
    selected = links.length
      ? Math.max(0, Math.min(index, links.length - 1))
      : -1;
    links.forEach((link, i) =>
      link.classList.toggle("selected", i === selected),
    );
    if (focus && selected >= 0) links[selected].focus();
  }
  function renderSearch() {
    if (!searchData) return;
    const query = normalize(searchInput.value.trim()).slice(0, 160),
      tokens = query.split(/\s+/).filter(Boolean);
    let matches = searchData
      .map((item, i) => {
        const title = normalize(item.title),
          text = normalize(item.text),
          words = title.split(/\W+/);
        const scores = tokens.map((t) =>
          title === t
            ? 30
            : title.startsWith(t)
              ? 15
              : title.includes(t)
                ? 10
                : text.includes(t)
                  ? 3
                  : words.some((w) => near(t, w))
                    ? 1
                    : 0,
        );
        return {
          item,
          score: scores.reduce((a, b) => a + b, 0),
          valid: scores.every((x) => x > 0),
          i,
        };
      })
      .filter((m) => (query ? m.valid : m.item.category === "Chapter"))
      .sort((a, b) => b.score - a.score || a.i - b.i)
      .slice(0, 12);
    searchResults.replaceChildren();
    if (!matches.length) {
      searchResults.append(
        el(
          "p",
          "No matches yet. Try a shorter phrase, a condition, or a term like “masking.”",
          "search-empty",
        ),
      );
      selected = -1;
      return;
    }
    const heading = el(
      "p",
      query
        ? `${matches.length} matching result${matches.length === 1 ? "" : "s"}`
        : "START EXPLORING",
      "eyebrow",
    );
    heading.style.padding = "8px 12px";
    searchResults.append(heading);
    for (const { item } of matches) {
      const a = el("a", null, "search-result");
      a.href = item.url;
      a.append(
        el("span", item.category, "eyebrow"),
        el("strong", item.title),
        el("p", item.text.slice(0, 155) + (item.text.length > 155 ? "…" : "")),
      );
      searchResults.append(a);
    }
    selectResult(0);
  }
  async function openSearch(opener) {
    openDialog($("#search-dialog"), opener);
    searchInput.focus();
    if (!searchData) {
      searchResults.replaceChildren(
        el("p", "Opening the handbook index…", "search-empty"),
      );
      try {
        searchPromise ??= fetch("assets/search-index.json").then((response) => {
          if (!response.ok) throw Error();
          return response.json();
        });
        searchData = await searchPromise;
      } catch {
        searchPromise = null;
        searchResults.replaceChildren(
          el(
            "p",
            "Search could not load. Close this window and use the chapter navigation, or try opening search again.",
            "search-empty",
          ),
        );
        return;
      }
    }
    renderSearch();
  }
  $("[data-open-search]").addEventListener("click", (event) =>
    openSearch(event.currentTarget),
  );
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if ($("#settings-dialog").open) $("#settings-dialog").close();
      if ($("#search-dialog").open) $("#search-dialog").close();
      else openSearch($("[data-open-search]"));
    }
  });
  searchInput.addEventListener("input", renderSearch);
  $("#search-dialog").addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      selectResult(
        document.activeElement === searchInput ? 0 : selected + 1,
        true,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (selected <= 0) {
        searchInput.focus();
        selectResult(0);
      } else selectResult(selected - 1, true);
    } else if (
      event.key === "Enter" &&
      document.activeElement === searchInput &&
      selected >= 0
    ) {
      event.preventDefault();
      $$(".search-result", searchResults)[selected]?.click();
    }
  });
  if (!/Mac|iPhone|iPad/.test(navigator.platform))
    $(".search-trigger kbd").textContent = "Ctrl K";

  $$("[data-chapter-filter]").forEach((button) =>
    button.addEventListener("click", () => {
      $$("[data-chapter-filter]").forEach((b) => {
        const active = b === button;
        b.classList.toggle("active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      let visible = 0;
      $$(".chapter-card").forEach((card) => {
        card.hidden =
          button.dataset.chapterFilter !== "All" &&
          $(".eyebrow", card).textContent !== button.dataset.chapterFilter;
        if (!card.hidden) visible++;
      });
      announce(`${visible} chapters shown.`);
    }),
  );
  let termCategory = "All";
  function filterTerms() {
    const query = normalize($("#term-search").value.trim());
    let count = 0;
    $$(".term").forEach((term) => {
      term.hidden =
        !(termCategory === "All" || term.dataset.category === termCategory) ||
        !normalize(term.textContent).includes(query);
      if (!term.hidden) count++;
    });
    $("#term-count").textContent =
      `${count} term${count === 1 ? "" : "s"} ${query ? "found" : "to explore"}`;
    $("#term-empty").hidden = count > 0;
  }
  $("#term-search")?.addEventListener("input", filterTerms);
  $$("[data-term-filter]").forEach((button) =>
    button.addEventListener("click", () => {
      termCategory = button.dataset.termFilter;
      $$("[data-term-filter]").forEach((b) => {
        b.classList.toggle("active", b === button);
        b.setAttribute("aria-pressed", String(b === button));
      });
      filterTerms();
    }),
  );
  $("[data-reset-terms]")?.addEventListener("click", () => {
    $("#term-search").value = "";
    $('[data-term-filter="All"]').click();
    $("#term-search").focus();
  });
  function revealHash() {
    let target;
    try {
      target = document.getElementById(
        decodeURIComponent(location.hash.slice(1)),
      );
    } catch {
      return;
    }
    if (target?.classList.contains("term")) {
      $("#term-search").value = "";
      $('[data-term-filter="All"]').click();
    }
    if (target?.classList.contains("condition"))
      $('[data-condition-filter="All"]').click();
    if (target)
      requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
  }
  $$("[data-condition-filter]").forEach((button) =>
    button.addEventListener("click", () => {
      $$("[data-condition-filter]").forEach((b) => {
        b.classList.toggle("active", b === button);
        b.setAttribute("aria-pressed", String(b === button));
      });
      let count = 0;
      $$(".condition").forEach((c) => {
        c.hidden =
          button.dataset.conditionFilter !== "All" &&
          c.dataset.group !== button.dataset.conditionFilter;
        if (!c.hidden) count++;
      });
      $("#condition-count").textContent = `${count} conditions to explore`;
    }),
  );
  if (location.hash) revealHash();
  window.addEventListener("hashchange", revealHash);

  const supportInputs = $$('input[name="support"]');
  function syncSupport() {
    const chosen = supportInputs.filter((input) => input.checked);
    $("#support-selection").replaceChildren(
      ...chosen.map((input) => el("li", input.value)),
    );
    $("#support-count").textContent = chosen.length
      ? `${chosen.length} idea${chosen.length === 1 ? "" : "s"} to discuss together.`
      : "Choose ideas from the list to get started.";
    $("#print-support").disabled = !chosen.length;
    $("#reset-support").disabled = !chosen.length;
  }
  supportInputs.forEach((input) =>
    input.addEventListener("change", syncSupport),
  );
  $("#print-support")?.addEventListener("click", () => window.print());
  $("#reset-support")?.addEventListener("click", () => {
    supportInputs.forEach((input) => (input.checked = false));
    syncSupport();
    supportInputs[0].focus();
  });
  if (supportInputs.length) syncSupport();

  $$("[data-play]").forEach((button) =>
    button.addEventListener("click", () => {
      const frame = document.createElement("iframe");
      frame.src = `https://www.youtube-nocookie.com/embed/${button.dataset.play}?autoplay=1`;
      frame.title = button
        .getAttribute("aria-label")
        .replace("Play video: ", "");
      frame.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      frame.allowFullscreen = true;
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      button.closest(".video-facade").replaceChildren(frame);
      frame.focus();
    }),
  );

  if ($("#quiz-app")) {
    let questions = [],
      current = 0,
      answers = [];
    const statement = $("#quiz-statement"),
      feedback = $("#quiz-feedback"),
      next = $("#quiz-next"),
      results = $("#quiz-results");
    function renderQuestion() {
      $("#quiz-question").hidden = false;
      results.hidden = true;
      feedback.hidden = true;
      next.hidden = true;
      statement.textContent = questions[current].statement;
      $("#quiz-position").textContent =
        `QUESTION ${String(current + 1).padStart(2, "0")} OF 06`;
      $("#quiz-score").textContent =
        `${answers.filter((a, i) => a === questions[i].answer).length} correct so far`;
      $("#quiz-progress-fill").style.width =
        `${(current / questions.length) * 100}%`;
      $$("[data-answer]").forEach((b) => {
        b.disabled = false;
        b.classList.remove("chosen");
        b.removeAttribute("aria-pressed");
      });
    }
    function answer(choice) {
      if (answers.length > current || !questions.length) return;
      answers.push(choice);
      const q = questions[current],
        correct = choice === q.answer;
      $$("[data-answer]").forEach((b) => {
        b.disabled = true;
        b.classList.toggle("chosen", b.dataset.answer === choice);
        b.setAttribute("aria-pressed", String(b.dataset.answer === choice));
      });
      const heading = el(
        "h3",
        correct
          ? `That’s right · ${q.answer}`
          : `A chance to rethink · ${q.answer}`,
      );
      const link = el("a", "Explore this idea →");
      link.href = q.link;
      feedback.replaceChildren(heading, el("p", q.explanation), link);
      feedback.hidden = false;
      $("#quiz-score").textContent =
        `${answers.filter((a, i) => a === questions[i].answer).length} correct so far`;
      next.hidden = false;
      next.firstChild.textContent =
        current === questions.length - 1 ? "See my results " : "Next question ";
      next.focus({ preventScroll: true });
    }
    function showResults() {
      $("#quiz-question").hidden = true;
      feedback.hidden = true;
      next.hidden = true;
      results.hidden = false;
      $("#quiz-position").textContent = "A NEW PERSPECTIVE";
      $("#quiz-progress-fill").style.width = "100%";
      const score = answers.filter((a, i) => a === questions[i].answer).length;
      results.replaceChildren(
        el("span", `${score} / ${questions.length}`, "result-score"),
        el("h2", "Curiosity is a good start."),
        el(
          "p",
          "Every question is a chance to see things differently. Keep exploring the ideas behind your answers.",
        ),
      );
      const list = el("ol", null, "quiz-review");
      questions.forEach((q, i) => {
        const li = el("li");
        const a = el("a", q.statement);
        a.href = q.link;
        const strong = el("strong");
        strong.append(a);
        li.append(
          strong,
          el("span", `You chose: ${answers[i]} · Answer: ${q.answer}`),
        );
        list.append(li);
      });
      const restart = el("button", "Try again", "button secondary");
      restart.addEventListener("click", () => {
        current = 0;
        answers = [];
        renderQuestion();
        statement.tabIndex = -1;
        statement.focus();
      });
      results.append(list, restart);
      results.tabIndex = -1;
      results.focus();
    }
    $$("[data-answer]").forEach((b) => {
      b.disabled = true;
      b.addEventListener("click", () => answer(b.dataset.answer));
    });
    next.addEventListener("click", () => {
      current++;
      if (current === questions.length) showResults();
      else {
        renderQuestion();
        statement.tabIndex = -1;
        statement.focus();
      }
    });
    fetch("assets/quiz.json")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((data) => {
        questions = data;
        renderQuestion();
      })
      .catch(() => {
        $("#quiz-question").hidden = true;
        feedback.hidden = false;
        feedback.replaceChildren(
          el("h3", "The interactive quiz could not load."),
          el(
            "p",
            "You can still read every question and explanation in the guide below.",
          ),
        );
      });
  }
})();
