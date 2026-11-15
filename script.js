// ========================================
// MOBILE NAVIGATION TOGGLE
// ========================================
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");

hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  navLinks.classList.toggle("active");
});

// Close mobile menu when clicking on a link
document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    hamburger.classList.remove("active");
    navLinks.classList.remove("active");
  });
});

// ========================================
// VIEW CV
// ========================================
// The "View CV" button is now a plain <a target="_blank"> link straight to the
// PDF (see index.html) — the browser's own PDF viewer opens it in a new tab,
// and every modern browser's built-in PDF viewer already has a download
// button, so no custom viewer/JS is needed here.

// ========================================
// SMOOTH SCROLLING for nav links
// ========================================
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      const offsetTop = target.offsetTop - 70;
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
  });
});

// ========================================
// NAVBAR BACKGROUND ON SCROLL
// ========================================
window.addEventListener("scroll", () => {
  const navbar = document.querySelector(".navbar");
  if (window.scrollY > 50) {
    navbar.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.35)";
  } else {
    navbar.style.boxShadow = "none";
  }
});

// ========================================
// PROJECT FILTERING
// ========================================
function initProjectFilter() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const projectCards = document.querySelectorAll(".project-card");

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.getAttribute("data-filter");

      projectCards.forEach((card) => {
        const category = card.getAttribute("data-category");
        if (filter === "all" || category === filter) {
          card.classList.remove("hidden");
        } else {
          card.classList.add("hidden");
        }
      });
    });
  });
}

// ========================================
// BUG SWARM (Easter Egg)
// ========================================
function initBugSwarm() {
  const swarm = document.querySelector(".bug-swarm");
  if (!swarm) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReducedMotion) return;

  const MAX_BUGS = 5;
  let activeBugs = 0;

  function spawnBug() {
    if (activeBugs >= MAX_BUGS) return;
    activeBugs++;

    const wrap = document.createElement("div");
    wrap.className = "crawl-bug-wrap";

    const bug = document.createElement("i");
    bug.className = "fas fa-bug crawl-bug";

    const size = 10 + Math.random() * 12;
    bug.style.fontSize = size + "px";

    const left = Math.random() * 88 + "%";
    wrap.style.left = left;

    const duration = 16 + Math.random() * 16;
    wrap.style.animationDuration = duration + "s";

    const swayDuration = 0.4 + Math.random() * 0.4;
    bug.style.animationDuration = swayDuration + "s";

    function cleanup() {
      wrap.remove();
      activeBugs--;
    }

    wrap.addEventListener("animationend", (e) => {
      if (e.target === wrap) cleanup();
    });

    bug.addEventListener("click", (e) => {
      e.stopPropagation();
      if (bug.classList.contains("squished")) return;
      bug.classList.add("squished");
      wrap.style.animationPlayState = "paused";
      setTimeout(cleanup, 400);
    });

    wrap.appendChild(bug);
    swarm.appendChild(wrap);
  }

  setTimeout(spawnBug, 3000);
  setTimeout(spawnBug, 9000);

  setInterval(() => {
    spawnBug();
  }, 7000 + Math.random() * 6000);
}

// ========================================
// CONTACT FORM SUBMISSION
// ========================================
const contactForm = document.getElementById("contactForm");
const formMessage = document.getElementById("formMessage");

if (contactForm) {
  let hideTimer = null;

  function showFormMessage(type, text) {
    clearTimeout(hideTimer);
    formMessage.className = `form-message ${type}`;
    formMessage.textContent = text;
    hideTimer = setTimeout(() => {
      formMessage.className = "form-message";
      formMessage.textContent = "";
    }, 7000);
  }

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!contactForm.reportValidity()) return;

    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Sending...';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch(contactForm.getAttribute("action") || "send_email_smtp.php", {
        method: "POST",
        body: new FormData(contactForm),
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      let result = null;
      try { result = await response.json(); } catch (_) { /* non-JSON response */ }

      if (result && result.success) {
        showFormMessage("success", result.message || "Message sent successfully! I will get back to you soon.");
        contactForm.reset();
      } else {
        showFormMessage(
          "error",
          (result && result.message) ||
            (response.ok
              ? "Failed to send message. Please try again."
              : `Server error (${response.status}). Please try again later.`)
        );
      }
    } catch (error) {
      showFormMessage(
        "error",
        error && error.name === "AbortError"
          ? "The request timed out. Please try again."
          : "Network error. Please check your connection and try again."
      );
    } finally {
      clearTimeout(timeout);
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
    }
  });
}

// ========================================
// SCROLL REVEAL ANIMATIONS
// ========================================
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

document
  .querySelectorAll(".skill-category, .education-item, .project-card")
  .forEach((el, index) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    el.style.transition = `opacity 0.6s ease ${(index % 6) * 0.08}s, transform 0.6s ease ${(index % 6) * 0.08}s`;
    observer.observe(el);
  });

// ========================================
// ACTIVE NAV LINK HIGHLIGHTING
// ========================================
window.addEventListener("scroll", () => {
  const sections = document.querySelectorAll("section[id]");
  const scrollY = window.pageYOffset;

  sections.forEach((section) => {
    const sectionHeight = section.offsetHeight;
    const sectionTop = section.offsetTop - 100;
    const sectionId = section.getAttribute("id");
    const navLink = document.querySelector(
      `.nav-links a[href="#${sectionId}"]`
    );

    if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
      document.querySelectorAll(".nav-links a").forEach((link) => {
        link.style.color = "";
      });
      if (navLink) {
        navLink.style.color = "var(--nav-active)";
      }
    }
  });
});

// ========================================
// DOWNLOAD CV
// ========================================
// The Download CV button is now a plain <a download> link (assets/Resume of Md Abu Bakar Siddique.pdf),
// so the browser handles the download natively — no JS needed, and no fetch/blob
// step that can fail on some hosts or when opened via a local file:// path.
// A brief "Preparing..." flash is kept purely for visual feedback.
document.addEventListener('DOMContentLoaded', function () {
  const downloadBtn = document.getElementById('downloadCVBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function () {
      const original = this.innerHTML;
      this.innerHTML = '<i class="fa-solid fa-check"></i> Downloading...';
      setTimeout(() => { this.innerHTML = original; }, 1500);
    });
  }
});

// ========================================
// ACHIEVEMENTS LIGHTBOX
// ========================================
function initAchievementGalleries() {
  const lightbox = document.getElementById("achievementLightbox");
  if (!lightbox) return;

  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxTitle = document.getElementById("lightboxTitle");
  const lightboxCounter = document.getElementById("lightboxCounter");
  const closeBtn = document.getElementById("lightboxClose");
  const prevBtn = document.getElementById("lightboxPrev");
  const nextBtn = document.getElementById("lightboxNext");

  let currentImages = [];
  let currentIndex = 0;
  let currentTitle = "";

  function renderImage() {
    lightboxImage.src = currentImages[currentIndex];
    lightboxImage.alt = `${currentTitle} — photo ${currentIndex + 1}`;
    lightboxCounter.textContent = `${currentIndex + 1} / ${currentImages.length}`;
    lightboxTitle.textContent = currentTitle;
  }

  function openLightbox(images, startIndex, title) {
    currentImages = images;
    currentIndex = startIndex;
    currentTitle = title;
    renderImage();
    lightbox.classList.add("active");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("active");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % currentImages.length;
    renderImage();
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
    renderImage();
  }

  document.querySelectorAll(".achievement-gallery").forEach((gallery) => {
    let images = [];
    try {
      images = JSON.parse(gallery.getAttribute("data-images") || "[]");
    } catch (e) {
      images = [];
    }
    const title = gallery.getAttribute("data-title") || "";

    gallery.querySelectorAll(".achievement-photo").forEach((photoBtn) => {
      photoBtn.addEventListener("click", () => {
        const index = parseInt(photoBtn.getAttribute("data-index"), 10) || 0;
        openLightbox(images, index, title);
      });
    });

    // "Show All Photos" opens the lightbox starting at the first photo
    const toggleBtn = document.querySelector(
      `.achievement-toggle[data-target="${gallery.getAttribute("data-achievement")}"]`
    );
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        openLightbox(images, 0, title);
      });
    }
  });

  closeBtn.addEventListener("click", closeLightbox);
  nextBtn.addEventListener("click", showNext);
  prevBtn.addEventListener("click", showPrev);

  // Click outside the photo (on the backdrop itself) closes the lightbox
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") showNext();
    if (e.key === "ArrowLeft") showPrev();
  });
}

// ========================================
// INITIALIZE ON DOM READY
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  initProjectFilter();
  initBugSwarm();
  initAchievementGalleries();
});
// ========================================
// THEME (light / dark / system)
// ========================================
(function initTheme() {
  const root = document.documentElement;
  const toggles = document.querySelectorAll(".theme-switch");
  const options = document.querySelectorAll("[data-theme-option]");
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  let pref = "dark"; // default theme
  try { pref = localStorage.getItem("theme") || "dark"; } catch (e) {}

  function apply(newPref, save) {
    pref = newPref;
    const dark = pref === "dark" || (pref === "system" && mq.matches);
    root.setAttribute("data-theme", dark ? "dark" : "light");
    toggles.forEach((t) => t.setAttribute("aria-checked", String(dark)));
    options.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.themeOption === pref)));
    if (save) { try { localStorage.setItem("theme", pref); } catch (e) {} }
  }
  toggles.forEach((t) => t.addEventListener("click", () => apply(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true)));
  options.forEach((b) => b.addEventListener("click", () => apply(b.dataset.themeOption, true)));
  mq.addEventListener("change", () => { if (pref === "system") apply("system", false); });
  apply(pref, false);
})();

// ========================================
// EXTRA-CURRICULAR: tabs + sliders that auto-chain
// Volunteering -> Achievements -> Robotics -> (repeat), 2.5s per slide
// ========================================
function initActivities() {
  const section = document.getElementById("activities");
  if (!section) return;
  const INTERVAL = 2500;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tabs = [...section.querySelectorAll(".tab")];
  const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));
  section.style.setProperty("--interval", INTERVAL + "ms");
  let current = 0, timer = null, visible = false;

  const sliders = panels.map((panel) => {
    const root = panel.querySelector(".slider");
    const slides = [...root.querySelectorAll(".slide")];
    const dotsBox = root.querySelector(".slider-dots");
    const count = root.querySelector(".slider-count");
    const bar = root.querySelector(".slider-progress");
    const s = { slides, bar, index: 0 };
    s.show = (n) => {
      s.index = (n + slides.length) % slides.length;
      slides.forEach((el, k) => el.classList.toggle("is-active", k === s.index));
      s.dots.forEach((d, k) => d.setAttribute("aria-current", String(k === s.index)));
      count.textContent = `${s.index + 1} / ${slides.length}`;
    };
    s.dots = slides.map((_, n) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", `Go to slide ${n + 1}`);
      b.addEventListener("click", () => { s.show(n); schedule(); });
      dotsBox.appendChild(b);
      return b;
    });
    root.querySelector(".slider-prev").addEventListener("click", () => { s.show(s.index - 1); schedule(); });
    root.querySelector(".slider-next").addEventListener("click", () => { s.show(s.index + 1); schedule(); });
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { s.show(s.index + 1); schedule(); }
      if (e.key === "ArrowLeft") { s.show(s.index - 1); schedule(); }
    });
    return s;
  });

  const playing = () => !reduce && visible && !document.hidden;

  function schedule() {
    clearTimeout(timer);
    sliders.forEach((s) => s.bar.classList.remove("run"));
    if (!playing()) return;
    const bar = sliders[current].bar;
    void bar.offsetWidth; // restart progress animation
    bar.classList.add("run");
    timer = setTimeout(advance, INTERVAL);
  }
  function advance() {
    const s = sliders[current];
    if (s.index < s.slides.length - 1) s.show(s.index + 1);
    else selectTab((current + 1) % tabs.length);
    schedule();
  }
  function selectTab(n) {
    current = n;
    tabs.forEach((t, k) => {
      t.setAttribute("aria-selected", String(k === n));
      t.tabIndex = k === n ? 0 : -1;
      panels[k].hidden = k !== n;
    });
    sliders[n].show(0);
  }

  tabs.forEach((t, i) => {
    t.addEventListener("click", () => { selectTab(i); schedule(); });
    t.addEventListener("keydown", (e) => {
      const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!k) return;
      const next = (i + k + tabs.length) % tabs.length;
      selectTab(next); tabs[next].focus(); schedule();
    });
  });
  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; schedule(); }, { threshold: 0.25 }).observe(section);
  document.addEventListener("visibilitychange", schedule);
  selectTab(0);
}

document.addEventListener("DOMContentLoaded", initActivities);

// ========================================
// CURSOR: subtle trailing ring + dot (mouse only, respects reduced motion)
// ========================================
(function initCursor() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const ring = document.createElement("div");
  const dot = document.createElement("div");
  ring.className = "cursor-ring"; dot.className = "cursor-dot";
  ring.setAttribute("aria-hidden", "true"); dot.setAttribute("aria-hidden", "true");
  document.body.append(ring, dot);

  let x = 0, y = 0, rx = 0, ry = 0, raf = null;
  const interactive = "a, button, [role='tab'], input, textarea, .achievement-photo";

  function loop() {
    rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.2 ? requestAnimationFrame(loop) : null;
  }
  document.addEventListener("mousemove", (e) => {
    x = e.clientX; y = e.clientY;
    if (!document.body.classList.contains("cursor-on")) { rx = x; ry = y; document.body.classList.add("cursor-on"); }
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    ring.classList.toggle("is-link", !!e.target.closest(interactive));
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  document.addEventListener("mousedown", () => ring.classList.add("is-down"));
  document.addEventListener("mouseup", () => ring.classList.remove("is-down"));
  document.documentElement.addEventListener("mouseleave", () => document.body.classList.remove("cursor-on"));
})();

// ========================================
// SCROLL PROGRESS (bottom edge of the header)
// ========================================
(function initScrollProgress() {
  const bar = document.getElementById("scrollProgress");
  if (!bar) return;
  let ticking = false;
  function update() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
    ticking = false;
  }
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
