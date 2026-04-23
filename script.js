/* =========================================================================
   Sterling Smith — personal site interactions.
   No dependencies. Safe to edit.
   ========================================================================= */

(() => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none), (max-width: 820px)").matches;

  // ---- Year in footer --------------------------------------------------
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // ---- Custom cursor ---------------------------------------------------
  if (!isTouch && !prefersReduced) {
    const dot = document.querySelector(".cursor__dot");
    const ring = document.querySelector(".cursor__ring");
    if (dot && ring) {
      let mx = window.innerWidth / 2, my = window.innerHeight / 2;
      let dx = mx, dy = my, rx = mx, ry = my;

      window.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; });

      const loop = () => {
        // Dot: near-instant
        dx += (mx - dx) * 0.55;
        dy += (my - dy) * 0.55;
        dot.style.transform = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%)`;

        // Ring: trails with easing
        rx += (mx - rx) * 0.18;
        ry += (my - ry) * 0.18;
        ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;

        requestAnimationFrame(loop);
      };
      loop();

      // Hover state on interactive elements
      const hoverSel = 'a, button, [data-cursor="link"], input, textarea, label';
      document.addEventListener("mouseover", (e) => {
        if (e.target.closest(hoverSel)) document.body.classList.add("is-hover");
      });
      document.addEventListener("mouseout", (e) => {
        if (e.target.closest(hoverSel)) document.body.classList.remove("is-hover");
      });
    }
  }

  // ---- Scroll reveals --------------------------------------------------
  const revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !prefersReduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // ---- Scroll progress bar --------------------------------------------
  const progress = document.querySelector(".progress");
  if (progress) {
    const onScroll = () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct = total > 0 ? (scrolled / total) * 100 : 0;
      progress.style.width = `${pct}%`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ---- Sticky nav state + active link ---------------------------------
  const nav = document.querySelector(".nav");
  const navLinks = document.querySelectorAll(".nav__links a");
  const sections = Array.from(navLinks)
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if (nav) {
    const onScroll = () => {
      nav.classList.toggle("is-scrolled", window.scrollY > 24);

      // Active section tracking — only fires when there are in-page anchors
      if (sections.length) {
        let active = sections[0];
        const y = window.scrollY + 140;
        for (const s of sections) {
          if (s.offsetTop <= y) active = s;
        }
        navLinks.forEach((a) => {
          a.classList.toggle("is-active", a.getAttribute("href") === `#${active.id}`);
        });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ---- Magnetic buttons -----------------------------------------------
  if (!isTouch && !prefersReduced) {
    const magnets = document.querySelectorAll(".magnetic");
    magnets.forEach((el) => {
      const strength = 0.25;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "translate(0, 0)";
      });
    });
  }

  // ---- Smooth-scroll anchors (respects reduced motion) ----------------
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", id);
    });
  });
})();
