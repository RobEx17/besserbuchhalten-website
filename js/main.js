(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Before/after comparison slider: a native range input drives a CSS
     custom property, which both clips the "before" image and positions
     the divider handle. */
  const baSlider = document.getElementById("baSlider");
  const baRange = document.getElementById("baRange");
  if (baSlider && baRange) {
    const updateBaSlider = () => {
      baSlider.style.setProperty("--pos", `${baRange.value}%`);
    };
    baRange.addEventListener("input", updateBaSlider);
    updateBaSlider();
  }

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

  /* Scroll-linked "Leistungen im Detail" wheel: 4 icons on a ring rotate
     counter-clockwise as the section is scrolled through; the matching
     long-form text panel crossfades in alongside. */
  const wheelScroll = document.querySelector(".wheel-scroll");
  const wheelRing = document.getElementById("wheelRing");
  const wheelTitle = document.getElementById("wheelTitle");
  const wheelIcons = document.querySelectorAll(".wheel-icon");
  const wheelPanels = document.querySelectorAll(".wheel-text-panel");
  const canRotateWheel = !!(wheelScroll && wheelRing && wheelIcons.length && wheelPanels.length);
  if (canRotateWheel) {
    document.body.classList.add("has-scroll-wheel");
  }
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

    // The pill's ends are rounded (border-radius: 999px), so a flat-edged
    // bar sitting near the bottom of the pill would poke past the curve for
    // the first/last nav item. Clamp it to the safe inset at that height
    // (circle geometry: inset = r - sqrt(r² - (r-d)²), d = bar's "bottom" offset).
    const radius = containerRect.height / 2;
    const barBottomOffset = 4; // matches .nav-indicator's CSS `bottom`
    const inset = radius - Math.sqrt(Math.max(radius * radius - Math.pow(radius - barBottomOffset, 2), 0));
    const minLeft = inset;
    const maxRight = containerRect.width - inset;

    let left = linkRect.left - containerRect.left;
    let right = left + linkRect.width;
    left = Math.max(left, minLeft);
    right = Math.min(right, maxRight);

    navIndicator.classList.add("is-visible");
    navIndicator.style.width = `${Math.max(right - left, 0)}px`;
    navIndicator.style.transform = `translateX(${left}px)`;
  };

  const updateScrollChrome = () => {
    backToTop.classList.toggle("is-visible", window.scrollY > 480);
    updateWheel();
    updateNavIndicator();
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

  /* Single-select "dropdown" (same custom look as the multiselect above,
     so both fields behave identically instead of one opening the native
     OS picker): picking an option updates the summary and closes the panel. */
  const digitalisierungsgradDropdown = document.getElementById("digitalisierungsgradDropdown");
  const digitalisierungsgradSummaryText = document.getElementById("digitalisierungsgradSummaryText");
  if (digitalisierungsgradDropdown && digitalisierungsgradSummaryText) {
    const digitalisierungsgradRadios = digitalisierungsgradDropdown.querySelectorAll('input[type="radio"]');
    digitalisierungsgradRadios.forEach((radio) => {
      radio.addEventListener("change", () => {
        digitalisierungsgradSummaryText.textContent = radio.value;
        digitalisierungsgradDropdown.open = false;
      });
    });
    document.addEventListener("click", (e) => {
      if (digitalisierungsgradDropdown.open && !digitalisierungsgradDropdown.contains(e.target)) {
        digitalisierungsgradDropdown.open = false;
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
        if (digitalisierungsgradSummaryText) digitalisierungsgradSummaryText.textContent = "Bitte auswählen";
        if (digitalisierungsgradDropdown) digitalisierungsgradDropdown.open = false;
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
