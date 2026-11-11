import { createBrainGeometry } from "./neural-geometry.js";
/* The visual layer is optional. Every lesson and destination remains HTML. */
(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const isCalm = () =>
    reduced.matches || document.documentElement.classList.contains("calm-mode");
  const perspectives = {
    attention: {
      title: "There’s more than one way to focus.",
      description:
        "Attention, organization, and switching tasks can feel different from one person to the next.",
      link: "conditions.html#adhd",
      label: "Explore attention & ADHD",
      color: [184, 152, 255],
    },
    senses: {
      title: "The same room can feel very different.",
      description:
        "Sound, light, texture, and other sensory input can be experienced differently. Ask what feels comfortable.",
      link: "terminology.html#sensory-sensitivity",
      label: "Understand sensory sensitivity",
      color: [255, 158, 126],
    },
    connection: {
      title: "Connection doesn’t have one language.",
      description:
        "Direct language, written words, gestures, and different communication preferences can all be part of connecting.",
      link: "school.html",
      label: "Explore inclusive communication",
      color: [148, 226, 211],
    },
  };
  let palette = perspectives.attention.color;
  $$("[data-perspective]").forEach((button) =>
    button.addEventListener("click", () => {
      const item = perspectives[button.dataset.perspective];
      $$("[data-perspective]").forEach((b) => {
        b.classList.toggle("active", b === button);
        b.setAttribute("aria-pressed", String(b === button));
      });
      $("#perspective-title").textContent = item.title;
      $("#perspective-description").textContent = item.description;
      const link = $("#perspective-link");
      link.href = item.link;
      link.firstChild.textContent = item.label + " ";
      palette = item.color;
      $(".neural-experience").style.setProperty(
        "--scene-accent",
        `rgb(${palette.join(",")})`,
      );
      requestStill();
    }),
  );

  const canvas = $("#neural-canvas");
  let requestStill = () => {};
  if (canvas) {
    const context = canvas.getContext("2d", { alpha: true });
    if (context) {
      const scene = $(".neural-experience");
      let width = 0,
        height = 0,
        points = [],
        edges = [],
        frame = 0,
        visible = true,
        lastTime = 0,
        phase = 0;
      let aimX = 0,
        aimY = 0,
        rotationX = 0,
        rotationY = 0;
      function makeGeometry() {
        ({ points, edges } = createBrainGeometry(width < 600));
      }
      function size() {
        const rect = scene.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        const dpr = Math.min(devicePixelRatio || 1, 1.75);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        makeGeometry();
        draw();
      }
      function draw() {
        context.clearRect(0, 0, width, height);
        const time = phase;
        const yaw =
          -0.24 + rotationX + (isCalm() ? 0 : Math.sin(time * 0.19) * 0.1);
        const pitch = 0.24 + rotationY;
        const scale = Math.min(width * 0.31, height * 0.335);
        const centerX = width * 0.52,
          centerY = height * 0.51;
        const sy = Math.sin(yaw),
          cy = Math.cos(yaw),
          sx = Math.sin(pitch),
          cx = Math.cos(pitch);
        const projected = points.map((p) => {
          const x = p.x * cy + p.z * sy,
            z0 = -p.x * sy + p.z * cy,
            y = p.y * cx - z0 * sx,
            z = p.y * sx + z0 * cx;
          const perspective = 4.5 / (4.5 - z);
          return {
            x: centerX + x * scale * perspective,
            y: centerY - y * scale * perspective,
            z,
            seed: p.seed,
            side: p.side,
          };
        });
        const rgb = palette.join(",");
        // Sparse surrounding particles are deterministic and remain quiet.
        for (let i = 0; i < 54; i++) {
          const a = i * 2.39996,
            r = 0.44 + (i % 11) * 0.032;
          const x = centerX + Math.cos(a + time * 0.012) * width * r,
            y = centerY + Math.sin(a + time * 0.012) * height * r;
          context.beginPath();
          context.arc(x, y, i % 7 === 0 ? 1.2 : 0.6, 0, Math.PI * 2);
          context.fillStyle = `rgba(${rgb},${i % 7 === 0 ? 0.35 : 0.13})`;
          context.fill();
        }
        context.lineWidth = 0.6;
        context.beginPath();
        for (const [i, j] of edges) {
          const a = projected[i],
            b = projected[j];
          if (a.z < -0.35 || Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > 35)
            continue;
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
        }
        context.strokeStyle = `rgba(${rgb},.15)`;
        context.stroke();
        for (let i = 0; i < projected.length; i++) {
          const p = projected[i],
            depth = (p.z + 1.1) / 2.2;
          const signal = 0.5 + 0.5 * Math.sin(p.seed - time * 0.75);
          const alpha =
            0.055 + Math.pow(Math.max(0, depth), 1.7) * 0.7 + signal * 0.12;
          context.beginPath();
          context.arc(p.x, p.y, 0.38 + depth * 0.8, 0, Math.PI * 2);
          context.fillStyle = `rgba(${rgb},${Math.min(alpha, 0.95)})`;
          context.fill();
          if (i % 177 === 21 && p.z > 0.1) {
            const radius =
              2.1 + (isCalm() ? 0 : Math.sin(time + p.seed) * 0.45);
            context.shadowBlur = 13;
            context.shadowColor = `rgb(${rgb})`;
            context.beginPath();
            context.arc(p.x, p.y, radius, 0, Math.PI * 2);
            context.fillStyle = "#e9defe";
            context.fill();
            context.shadowBlur = 0;
          }
        }
        // A few cross-hemisphere connections communicate variation, not brain activity.
        context.lineWidth = 0.65;
        for (let i = 43; i < projected.length / 2; i += 211) {
          const a = projected[i],
            b =
              projected[
                Math.min(
                  projected.length - 1,
                  i + Math.floor(projected.length / 2) + 11,
                )
              ];
          if (a.z < 0 || b.z < 0) continue;
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.bezierCurveTo(centerX, a.y - 25, centerX, b.y + 25, b.x, b.y);
          context.strokeStyle = `rgba(${rgb},.2)`;
          context.stroke();
        }
        scene.classList.add("canvas-ready");
      }
      function tick(now) {
        frame = 0;
        if (!visible || document.hidden || isCalm()) return;
        if (now - lastTime > 32) {
          phase += Math.min((now - lastTime) / 1000, 0.05);
          lastTime = now;
          rotationX += (aimX - rotationX) * 0.055;
          rotationY += (aimY - rotationY) * 0.055;
          draw();
        }
        frame = requestAnimationFrame(tick);
      }
      function updateMotion() {
        if (frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
        syncMotionLabel();
        draw();
        if (visible && !document.hidden && !isCalm()) {
          lastTime = performance.now();
          frame = requestAnimationFrame(tick);
        }
      }
      requestStill = () => {
        if (!frame) draw();
      };
      scene.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") return;
        const r = scene.getBoundingClientRect();
        aimX = ((event.clientX - r.left) / r.width - 0.5) * 0.65;
        aimY = ((event.clientY - r.top) / r.height - 0.5) * 0.35;
        if (isCalm()) {
          rotationX = aimX;
          rotationY = aimY;
          requestStill();
        }
      });
      scene.addEventListener("pointerleave", () => {
        aimX = 0;
        aimY = 0;
      });
      new ResizeObserver(size).observe(scene);
      new IntersectionObserver(
        (entries) => {
          visible = entries[0].isIntersecting;
          updateMotion();
        },
        { threshold: 0.05 },
      ).observe(scene);
      new MutationObserver(updateMotion).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      document.addEventListener("visibilitychange", updateMotion);
      reduced.addEventListener("change", updateMotion);
      size();
      updateMotion();
    }
  }
  function syncMotionLabel() {
    const button = $("[data-motion-toggle]");
    if (!button) return;
    const paused = isCalm();
    button.setAttribute("aria-pressed", String(paused));
    $(".motion-label").textContent = reduced.matches
      ? "Reduced motion"
      : paused
        ? "Resume motion"
        : "Pause motion";
    button.disabled = reduced.matches;
  }
  $("[data-motion-toggle]")?.addEventListener("click", () => {
    const control = $("#calm-mode");
    control.checked = !control.checked;
    control.dispatchEvent(new Event("change", { bubbles: true }));
    syncMotionLabel();
  });
  syncMotionLabel();

  const scenarios = {
    classroom: {
      label: "A CLASSROOM",
      labels: ["ENVIRONMENT", "INSTRUCTIONS", "PARTICIPATION"],
      before: [
        "Background chatter",
        "Spoken directions only",
        "One written response",
      ],
      after: [
        "A quiet space option",
        "Written + spoken steps",
        "A choice of response format",
      ],
      takeaway:
        "The same setup can work well for some learners and create barriers for others.",
      access:
        "Offer options, then ask which ones help. A quieter space and different formats can make room for different learners.",
    },
    project: {
      label: "A GROUP PROJECT",
      labels: ["PLANNING", "COMMUNICATION", "CONTRIBUTION"],
      before: [
        "Unspoken expectations",
        "Fast, overlapping discussion",
        "Presenting aloud only",
      ],
      after: [
        "Clear roles + a shared checklist",
        "Time to respond in writing",
        "Different ways to contribute",
      ],
      takeaway:
        "A group may miss good ideas when there is only one way to share them.",
      access:
        "Make roles clear and invite more than one way to share an idea. Participation can include speaking, writing, or creating.",
    },
    routine: {
      label: "A NEW ROUTINE",
      labels: ["INFORMATION", "TRANSITIONS", "SUPPORT"],
      before: [
        "Last-minute changes",
        "An unexpected transition",
        "Guessing what comes next",
      ],
      after: [
        "Advance notice where possible",
        "A clear transition cue",
        "A simple plan to refer to",
      ],
      takeaway:
        "An unfamiliar routine can require extra effort, especially when expectations are unclear.",
      access:
        "Predictability and clear information can help someone prepare. Ask what kind of notice or planning is useful.",
    },
  };
  let scenario = "classroom",
    access = false;
  function renderEnvironment() {
    const s = scenarios[scenario];
    $("#environment-label").textContent =
      s.label + (access ? " / MORE WAYS IN" : " / ONE ROUTE IN");
    $(".environment-visual").dataset.access = String(access);
    ["one", "two", "three"].forEach((key, i) => {
      $("#factor-" + key + "-label").textContent = s.labels[i];
      $("#factor-" + key).textContent = (access ? s.after : s.before)[i];
    });
    $("#environment-takeaway").textContent = access ? s.access : s.takeaway;
    $("[data-access-toggle]").setAttribute("aria-pressed", String(access));
    $$("[data-scenario]").forEach((b) => {
      const active = b.dataset.scenario === scenario;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }
  $$("[data-scenario]").forEach((b) =>
    b.addEventListener("click", () => {
      scenario = b.dataset.scenario;
      renderEnvironment();
    }),
  );
  $("[data-access-toggle]")?.addEventListener("click", () => {
    access = !access;
    renderEnvironment();
  });
  $$("[data-quick-answer]").forEach((button) =>
    button.addEventListener("click", () => {
      const correct = button.dataset.quickAnswer === "Myth",
        result = $("#quick-feedback");
      result.replaceChildren();
      const title = document.createElement("strong");
      title.textContent = correct
        ? "Exactly. It’s a myth."
        : "A chance to rethink. It’s a myth.";
      const text = document.createElement("p");
      text.textContent =
        "Neurodiversity describes variation across human minds. Autism, ADHD, dyslexia, and many other experiences are part of the broader conversation.";
      result.append(title, text);
      result.hidden = false;
      $$("[data-quick-answer]").forEach((b) => {
        b.setAttribute("aria-pressed", String(b === button));
        b.classList.toggle("chosen", b === button);
      });
    }),
  );

  let scrollQueued = false;
  function updateScroll() {
    scrollQueued = false;
    const distance = document.documentElement.scrollHeight - innerHeight;
    $("#scroll-progress-fill").style.transform =
      `scaleX(${distance > 0 ? scrollY / distance : 0})`;
  }
  addEventListener(
    "scroll",
    () => {
      if (!scrollQueued) {
        scrollQueued = true;
        requestAnimationFrame(updateScroll);
      }
    },
    { passive: true },
  );
  updateScroll();
  if ("IntersectionObserver" in window) {
    const motionVisibility = new IntersectionObserver((entries) =>
      entries.forEach((e) => {
        e.target.dataset.animationVisible = String(e.isIntersecting);
      }),
    );
    $$(".voices-feature,.environment-section").forEach((node) =>
      motionVisibility.observe(node),
    );
    const reveal = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            reveal.unobserve(e.target);
          }
        }),
      { threshold: 0.12 },
    );
    $$(
      ".section-marker,.manifesto,.index-intro,.chapter-card,.story,.idea-section,.term,.voices-feature-content,.quick-check-layout",
    ).forEach((node) => {
      node.classList.add("reveal-ready");
      reveal.observe(node);
    });
  }
})();
