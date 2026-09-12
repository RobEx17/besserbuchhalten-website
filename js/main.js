(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Mobile nav */
  const navToggle = document.getElementById("navToggle");
  const navClose = document.getElementById("navClose");
  const mobileNav = document.getElementById("mobileNav");

  const openNav = () => {
    mobileNav.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  };
  const closeNav = () => {
    mobileNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };
  navToggle.addEventListener("click", openNav);
  navClose.addEventListener("click", closeNav);
  mobileNav.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeNav));
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNav();
  });

  /* Back to top */
  const backToTop = document.getElementById("backToTop");
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });

  /* Scroll-linked hero: a preloaded JPEG frame sequence is drawn to canvas
     as the hero is scrolled through (no <video> seeking, which is unreliable
     on iOS Safari); the floating nav pill only reveals once it has (almost)
     finished. */
  const heroScroll = document.querySelector(".hero-scroll");
  const heroCanvas = document.getElementById("heroCanvas");
  const heroCtx = heroCanvas ? heroCanvas.getContext("2d") : null;
  const siteChrome = document.getElementById("siteChrome");
  const REVEAL_THRESHOLD = 0.92;
  const FRAME_COUNT = 90;
  const frameSrc = (n) => `assets/video/frames/frame-${String(n).padStart(3, "0")}.jpg`;

  const canScrubHero = !!(heroScroll && heroCanvas && heroCtx && siteChrome);
  if (canScrubHero) {
    document.body.classList.add("has-scroll-hero");
  }

  const heroFrames = [];
  if (canScrubHero) {
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = frameSrc(i);
      heroFrames.push(img);
    }
    heroFrames[0].addEventListener("load", () => drawHeroFrame(heroFrames[0]));
  }

  function drawHeroFrame(img) {
    if (!img || !img.complete || !img.naturalWidth) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = heroCanvas.clientWidth;
    const ch = heroCanvas.clientHeight;
    const targetW = Math.round(cw * dpr);
    const targetH = Math.round(ch * dpr);
    if (heroCanvas.width !== targetW || heroCanvas.height !== targetH) {
      heroCanvas.width = targetW;
      heroCanvas.height = targetH;
    }
    const scale = Math.max(heroCanvas.width / img.naturalWidth, heroCanvas.height / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = (heroCanvas.width - dw) / 2;
    const dy = (heroCanvas.height - dh) / 2;
    heroCtx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);
    heroCtx.drawImage(img, dx, dy, dw, dh);
  }

  /* Scroll-linked hero logo: starts large and centered on the hero, then
     travels + shrinks into its normal header position as soon as scrolling
     begins, fully docked well before the header chrome itself fades in.
     `.brand` (the <a>) is never transformed, so its getBoundingClientRect()
     always reflects the natural resting position/size to animate towards. */
  const heroBrand = document.getElementById("heroBrand");
  const heroBrandImg = document.getElementById("heroBrandImg");
  const LOGO_DOCK_RANGE = 0.25; // fraction of hero scroll over which the logo docks
  const LOGO_SCALE = 3.4;

  const updateHeroLogo = (heroProgress) => {
    if (!heroBrand || !heroBrandImg || !canScrubHero) return;

    if (prefersReducedMotion) {
      heroBrandImg.style.transform = "none";
      return;
    }

    const dockProgress = Math.min(1, heroProgress / LOGO_DOCK_RANGE);
    const t = 1 - dockProgress; // 1 = fully centered/large, 0 = docked at natural size

    if (t <= 0) {
      heroBrandImg.style.transform = "none";
      return;
    }

    const rect = heroBrand.getBoundingClientRect();
    const naturalCenterX = rect.left + rect.width / 2;
    const naturalCenterY = rect.top + rect.height / 2;
    const dx = window.innerWidth / 2 - naturalCenterX;
    const dy = window.innerHeight / 2 - naturalCenterY;
    const scale = 1 + (LOGO_SCALE - 1) * t;

    heroBrandImg.style.transform = `translate(${dx * t}px, ${dy * t}px) scale(${scale})`;
  };

  /* Scroll-linked "Leistungen im Detail" wheel: 4 icons on a ring rotate
     counter-clockwise as the section is scrolled through; the matching
     long-form text panel crossfades in alongside. */
  const wheelScroll = document.querySelector(".wheel-scroll");
  const wheelRing = document.getElementById("wheelRing");
  const wheelTitle = document.getElementById("wheelTitle");
  const wheelIcons = document.querySelectorAll(".wheel-icon");
  const wheelPanels = document.querySelectorAll(".wheel-text-panel");
  const canRotateWheel = !!(wheelScroll && wheelRing && wheelIcons.length && wheelPanels.length);
  let wheelStage = -1;

  const updateWheel = () => {
    if (!canRotateWheel) return;
    const total = wheelScroll.offsetHeight - window.innerHeight;
    const rect = wheelScroll.getBoundingClientRect();
    const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 0));
    const progress = total > 0 ? scrolled / total : 0;
    const steps = wheelIcons.length - 1;

    if (!prefersReducedMotion) {
      wheelRing.style.setProperty("--ring-rotation", `${-90 * steps * progress}deg`);
    }

    const stage = Math.min(steps, Math.round(progress * steps));
    if (stage !== wheelStage) {
      wheelStage = stage;
      wheelIcons.forEach((el, i) => el.classList.toggle("is-active", i === stage));
      wheelPanels.forEach((el, i) => el.classList.toggle("is-active", i === stage));
      if (wheelTitle) wheelTitle.textContent = wheelPanels[stage].dataset.title;
    }
  };

  /* Nav indicator: a small bar under whichever nav item's section is
     currently in view (not a whole-page scroll position). */
  const navLinksEl = document.getElementById("navLinks");
  const navIndicator = document.getElementById("navIndicator");
  const navLinkEls = navLinksEl ? Array.from(navLinksEl.querySelectorAll("a")) : [];
  const navSections = navLinkEls.map((a) => document.querySelector(a.getAttribute("href")));
  const canTrackNav = !!(navLinksEl && navIndicator && navLinkEls.length);
  const NAV_REFERENCE_Y = 140; // px from viewport top used to decide the "active" section

  const updateNavIndicator = () => {
    if (!canTrackNav) return;
    let activeIndex = -1;
    navSections.forEach((sec, i) => {
      if (sec && sec.getBoundingClientRect().top <= NAV_REFERENCE_Y) activeIndex = i;
    });

    if (activeIndex === -1) {
      navIndicator.classList.remove("is-visible");
      return;
    }

    const link = navLinkEls[activeIndex];
    const linkRect = link.getBoundingClientRect();
    const containerRect = navLinksEl.getBoundingClientRect();
    navIndicator.classList.add("is-visible");
    navIndicator.style.width = `${linkRect.width}px`;
    navIndicator.style.transform = `translateX(${linkRect.left - containerRect.left}px)`;
  };

  const updateScrollChrome = () => {
    backToTop.classList.toggle("is-visible", window.scrollY > 480);
    updateWheel();
    updateNavIndicator();

    if (!canScrubHero) return;

    const heroTotal = heroScroll.offsetHeight - window.innerHeight;
    const rect = heroScroll.getBoundingClientRect();
    const scrolledIntoHero = Math.min(Math.max(-rect.top, 0), Math.max(heroTotal, 0));
    const heroProgress = heroTotal > 0 ? scrolledIntoHero / heroTotal : 1;

    const frameIndex = prefersReducedMotion ? 0 : Math.min(FRAME_COUNT - 1, Math.round(heroProgress * (FRAME_COUNT - 1)));
    drawHeroFrame(heroFrames[frameIndex]);
    updateHeroLogo(heroProgress);

    siteChrome.classList.toggle("is-visible", heroProgress >= REVEAL_THRESHOLD);
  };

  let ticking = false;
  const requestScrollUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateScrollChrome();
      ticking = false;
    });
  };
  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate);
  updateScrollChrome();

  /* Autoplay: on load, scroll through the hero by itself so it looks like the
     video is simply playing. It scrolls a full viewport further than the
     video itself needs, so it only stops once the hero has scrolled fully
     out of view and the next section fills the whole screen (no trace of
     the video's last frame left). Any real scroll/touch/key/drag input from
     the visitor cancels it immediately and hands control back to normal
     scrolling. */
  if (canScrubHero && !prefersReducedMotion) {
    const heroTotalAtLoad = heroScroll.offsetHeight; // scroll past the hero entirely
    if (heroTotalAtLoad > 0) {
      const AUTOPLAY_DELAY = 500;
      const AUTOPLAY_DURATION = 8000;
      let autoplayActive = true;
      let autoplayRAF = null;
      let autoplayStart = null;

      const stopAutoplay = () => {
        if (!autoplayActive) return;
        autoplayActive = false;
        if (autoplayRAF) cancelAnimationFrame(autoplayRAF);
        window.removeEventListener("wheel", stopAutoplay);
        window.removeEventListener("touchstart", stopAutoplay);
        window.removeEventListener("pointerdown", stopAutoplay);
        window.removeEventListener("keydown", onKeydownStop);
      };

      const SCROLL_KEYS = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "];
      const onKeydownStop = (e) => {
        if (SCROLL_KEYS.includes(e.key)) stopAutoplay();
      };

      window.addEventListener("wheel", stopAutoplay, { passive: true });
      window.addEventListener("touchstart", stopAutoplay, { passive: true });
      window.addEventListener("pointerdown", stopAutoplay, { passive: true });
      window.addEventListener("keydown", onKeydownStop);

      const stepAutoplay = (ts) => {
        if (!autoplayActive) return;
        if (autoplayStart === null) autoplayStart = ts;
        const elapsed = ts - autoplayStart - AUTOPLAY_DELAY;
        if (elapsed < 0) {
          autoplayRAF = requestAnimationFrame(stepAutoplay);
          return;
        }
        const t = Math.min(1, elapsed / AUTOPLAY_DURATION);
        window.scrollTo({ top: t * heroTotalAtLoad, left: 0, behavior: "instant" });
        if (t < 1 && autoplayActive) {
          autoplayRAF = requestAnimationFrame(stepAutoplay);
        } else {
          stopAutoplay();
        }
      };
      autoplayRAF = requestAnimationFrame(stepAutoplay);
    }
  }

  /* Scroll reveal */
  const revealEls = document.querySelectorAll(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* Stagger index for grid children */
  document.querySelectorAll(".reveal-stagger").forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      child.style.setProperty("--i", i);
    });
  });

  /* FAQ accordion */
  document.querySelectorAll(".faq-item").forEach((item) => {
    const question = item.querySelector(".faq-question");
    question.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      item.parentElement.querySelectorAll(".faq-item").forEach((other) => {
        other.classList.remove("is-open");
        other.querySelector(".faq-question").setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("is-open");
        question.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* Multi-select "dropdown": update the summary text with what's ticked,
     and close the panel on an outside click (native <details> doesn't). */
  const interessenDropdown = document.getElementById("interessenDropdown");
  const interessenSummaryText = document.getElementById("interessenSummaryText");
  if (interessenDropdown && interessenSummaryText) {
    const interessenChecks = interessenDropdown.querySelectorAll('input[type="checkbox"]');
    const updateInteressenSummary = () => {
      const checked = Array.from(interessenChecks)
        .filter((c) => c.checked)
        .map((c) => c.value);
      interessenSummaryText.textContent = checked.length ? checked.join(", ") : "Bitte auswählen";
    };
    interessenChecks.forEach((cb) => cb.addEventListener("change", updateInteressenSummary));
    document.addEventListener("click", (e) => {
      if (interessenDropdown.open && !interessenDropdown.contains(e.target)) {
        interessenDropdown.open = false;
      }
    });
  }

  /* Contact form: client-side validation + mailto fallback (no backend yet) */
  const form = document.getElementById("contactForm");
  const successBox = document.getElementById("formSuccess");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const setError = (field, hasError) => {
    field.closest(".field")?.classList.toggle("has-error", hasError);
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    // form.elements.namedItem, not form.name: the form itself now carries a
    // name="kontakt" attribute for Netlify Forms, which would otherwise
    // shadow the "name" input via plain `form.name` property access.
    const name = form.elements.namedItem("name");
    const email = form.email;
    const message = form.message;
    const consent = form.consent;

    let valid = true;
    setError(name, !name.value.trim());
    if (!name.value.trim()) valid = false;

    const emailValid = emailPattern.test(email.value.trim());
    setError(email, !emailValid);
    if (!emailValid) valid = false;

    setError(message, !message.value.trim());
    if (!message.value.trim()) valid = false;

    if (!consent.checked) {
      valid = false;
      consent.closest(".consent").style.color = "#b3261e";
    } else {
      consent.closest(".consent").style.color = "";
    }

    if (!valid) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    // Netlify Forms: a plain POST of the form's own fields (incl. the hidden
    // form-name and honeypot) to "/" is all the static-hosting backend needs
    // — no server code required. This only resolves once deployed on
    // Netlify; elsewhere the request 404s and the catch below takes over.
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(new FormData(form)).toString(),
    })
      .then((response) => {
        // fetch() only rejects on network failure, not on HTTP error status
        // (e.g. 404 while Netlify Forms detection isn't enabled yet) — check
        // response.ok explicitly so a failed submission never shows success.
        if (!response.ok) throw new Error(`Form submission failed: ${response.status}`);
        successBox.classList.add("is-visible");
        form.reset();
        if (interessenSummaryText) interessenSummaryText.textContent = "Bitte auswählen";
        if (interessenDropdown) interessenDropdown.open = false;
      })
      .catch(() => {
        // Fallback (e.g. running locally, not yet deployed on Netlify):
        // hand off to the visitor's own email client instead.
        const subject = encodeURIComponent(`Kontaktanfrage von ${name.value.trim()}`);
        const interessenSelected = Array.from(form.querySelectorAll('input[name="interessen"]:checked')).map((c) => c.value);
        const bodyLines = [
          `Name: ${name.value.trim()}`,
          `E-Mail: ${email.value.trim()}`,
          form.company.value.trim() ? `Unternehmen: ${form.company.value.trim()}` : null,
          form.branche.value.trim() ? `Branche: ${form.branche.value.trim()}` : null,
          form.steuerberater.value.trim() ? `Aktuelle Steuerkanzlei: ${form.steuerberater.value.trim()}` : null,
          interessenSelected.length ? `Interesse an: ${interessenSelected.join(", ")}` : null,
          form.digitalisierungsgrad.value ? `Grad der Digitalisierung: ${form.digitalisierungsgrad.value}` : null,
          "",
          message.value.trim(),
        ].filter(Boolean);
        const body = encodeURIComponent(bodyLines.join("\n"));
        window.location.href = `mailto:mail@besserbuchhalten.de?subject=${subject}&body=${body}`;
      })
      .finally(() => {
        submitBtn.disabled = false;
      });
  });
})();
