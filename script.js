/* ==========================================================================
   Personal Portfolio Website — script.js
   --------------------------------------------------------------------------
   Vanilla JavaScript (no libraries). Everything is wrapped in an IIFE so no
   global variables leak into the page.

   CONTENTS
   01  Helpers
   02  Page loader
   03  Dark / light theme
   04  Mobile navigation (hamburger menu)
   05  Smooth scrolling
   06  Active navigation link while scrolling
   07  Scroll reveal animations
   08  Skill progress bars + percentage counters
   09  Project filtering
   10  Contact form validation
   11  Resume download handling (placeholder-safe)
   12  Scroll-to-top button
   13  Footer year
   ========================================================================== */
(function () {
  "use strict";

  /* ======================================================================
     01. HELPERS
     ====================================================================== */
  var $ = function (selector, context) {
    return (context || document).querySelector(selector);
  };
  var $$ = function (selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  };

  /* ----------------------------------------------------------------------
     Toast notification (replaces alert())
     ---------------------------------------------------------------------- */
  var toastEl = $("#toast");
  var toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    $(".toast__text", toastEl).textContent = message;
    toastEl.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, 4200);
  }

  /* ======================================================================
     02. PAGE LOADER
     Hides the loading overlay once the page (and its assets) is ready.
     A safety timeout guarantees it always disappears.
     ====================================================================== */
  (function initLoader() {
    var loader = $("#loader");
    if (!loader) return;

    function hideLoader() {
      loader.classList.add("is-hidden");
      window.setTimeout(function () {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, 600);
    }

    if (document.readyState === "complete") {
      hideLoader();
    } else {
      window.addEventListener("load", hideLoader);
    }
    window.setTimeout(hideLoader, 2500); /* safety net */
  })();

  /* ======================================================================
     03. DARK / LIGHT THEME
     Stores the choice in localStorage and restores it on the next visit.
     ====================================================================== */
  (function initTheme() {
    var root = document.documentElement;
    var toggle = $("#themeToggle");
    var meta = $("#themeColorMeta");
    var STORAGE_KEY = "portfolio-theme";

    function applyTheme(theme) {
      root.setAttribute("data-theme", theme);
      if (toggle) {
        toggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
        toggle.setAttribute("title", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
      }
      if (meta) meta.setAttribute("content", theme === "dark" ? "#0a0f1f" : "#4f46e5");
    }

    /* 1. Restore saved theme, 2. otherwise follow the OS preference */
    var saved = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      /* localStorage can be blocked (private mode) — ignore */
    }
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved || (prefersDark ? "dark" : "light"));

    if (toggle) {
      toggle.addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(next);
        try {
          window.localStorage.setItem(STORAGE_KEY, next);
        } catch (error) { /* ignore */ }
      });
    }
  })();

  /* ======================================================================
     04. MOBILE NAVIGATION
     ====================================================================== */
  (function initMobileNav() {
    var toggle = $("#navToggle");
    var menu = $("#navMenu");
    var overlay = $("#navOverlay");
    if (!toggle || !menu) return;

    function isOpen() {
      return menu.classList.contains("is-open");
    }

    function openMenu() {
      menu.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close navigation menu");
      document.body.classList.add("no-scroll");
      if (overlay) {
        overlay.hidden = false;
        window.requestAnimationFrame(function () { overlay.classList.add("is-visible"); });
      }
    }

    function closeMenu() {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation menu");
      document.body.classList.remove("no-scroll");
      if (overlay) {
        overlay.classList.remove("is-visible");
        window.setTimeout(function () { overlay.hidden = true; }, 300);
      }
    }

    toggle.addEventListener("click", function () {
      isOpen() ? closeMenu() : openMenu();
    });

    /* Close when a link is clicked (smooth scroll is handled in section 05) */
    $$(".nav__link", menu).forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    /* Close on overlay click, Escape key or when resizing to desktop */
    if (overlay) overlay.addEventListener("click", closeMenu);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen()) closeMenu();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 900 && isOpen()) closeMenu();
    });
  })();

  /* ======================================================================
     05. SMOOTH SCROLLING
     All internal hash links scroll smoothly to their section.
     (CSS scroll-padding-top already offsets the fixed navbar.)
     ====================================================================== */
  (function initSmoothScroll() {
    $$('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (event) {
        var id = link.getAttribute("href");
        if (!id || id === "#") return;

        var target = document.getElementById(id.slice(1));
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });

        /* Keep the URL hash in sync without the browser's instant jump */
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, "", id);
        }
      });
    });
  })();

  /* ======================================================================
     06. ACTIVE NAVIGATION LINK WHILE SCROLLING
     ====================================================================== */
  (function initActiveLink() {
    var sections = $$("main section[id]");
    var links = $$(".nav__link");
    var navbar = $("#navbar");
    if (!sections.length || !links.length) return;

    var ticking = false;

    function update() {
      /* Navbar shadow */
      if (navbar) navbar.classList.toggle("is-scrolled", window.scrollY > 12);

      var scrollPos = window.scrollY + (navbar ? navbar.offsetHeight : 72) + 24;
      var currentId = sections[0].id;

      sections.forEach(function (section) {
        if (section.offsetTop <= scrollPos) currentId = section.id;
      });

      /* Always highlight the last section when the page bottom is reached */
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        currentId = sections[sections.length - 1].id;
      }

      links.forEach(function (link) {
        link.classList.toggle("is-active", link.getAttribute("href") === "#" + currentId);
      });
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    update();
  })();

  /* ======================================================================
     07. SCROLL REVEAL ANIMATIONS
     Elements with .reveal fade/slide in the first time they enter the
     viewport. data-delay="120" staggers the effect (in milliseconds).
     ====================================================================== */
  (function initReveal() {
    var items = $$(".reveal");
    if (!items.length) return;

    /* Fallback: no IntersectionObserver -> show everything */
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute("data-delay"), 10);
        if (delay) el.style.transitionDelay = delay + "ms";
        el.classList.add("is-visible");
        observer.unobserve(el); /* animate once */
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    items.forEach(function (el) { observer.observe(el); });
  })();

  /* ======================================================================
     08. SKILL PROGRESS BARS + PERCENTAGE COUNTERS
     ====================================================================== */
  (function initSkills() {
    var bars = $$(".skill__bar-fill");
    if (!bars.length) return;

    function animatePercent(el, target) {
      var output = el.closest(".skill") ? $(".skill__percent", el.closest(".skill")) : null;
      if (!output) return;
      var start = null;
      var duration = 1300;

      function step(timestamp) {
        if (!start) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        output.textContent = Math.round(progress * target) + "%";
        if (progress < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }

    function fill(bar) {
      if (bar.dataset.done === "true") return;
      bar.dataset.done = "true";
      var level = parseInt(bar.getAttribute("data-level"), 10) || 0;
      var track = bar.parentElement;
      if (track) track.setAttribute("aria-valuenow", String(level));
      bar.style.width = level + "%";
      animatePercent(bar, level);
    }

    if (!("IntersectionObserver" in window)) {
      bars.forEach(fill);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          fill(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    bars.forEach(function (bar) { observer.observe(bar); });
  })();

  /* ======================================================================
     09. PROJECT FILTERING
     Filter buttons carry data-filter, project cards carry data-category.
     ====================================================================== */
  (function initProjectFilter() {
    var buttons = $$(".filter-btn");
    var cards = $$("#projectsGrid .project");
    var emptyMsg = $("#projectsEmpty");
    if (!buttons.length || !cards.length) return;

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var filter = button.getAttribute("data-filter");

        /* Update active button state */
        buttons.forEach(function (btn) { btn.classList.remove("is-active"); });
        button.classList.add("is-active");

        var visible = 0;

        cards.forEach(function (card) {
          var category = card.getAttribute("data-category") || "";
          var match = filter === "all" || category === filter;

          if (match) {
            visible++;
            card.classList.remove("is-hidden");
            /* Restart the fade-up animation */
            card.classList.remove("is-animating");
            void card.offsetWidth; /* force reflow */
            card.classList.add("is-animating");
          } else {
            card.classList.add("is-hidden");
          }
        });

        if (emptyMsg) emptyMsg.hidden = visible !== 0;
      });
    });
  })();

  /* ======================================================================
     10. CONTACT FORM VALIDATION
     No backend in this version: the form is validated in the browser and
     the collected data is returned by submitMessage(). To connect a real
     backend later, replace the body of submitMessage() with a fetch() call.
     ====================================================================== */
  (function initContactForm() {
    var form = $("#contactForm");
    if (!form) return;

    var statusBox = $("#formStatus");
    var submitBtn = $("#submitBtn");
    var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    var rules = {
      name: function (value) {
        if (!value.trim()) return "Please enter your full name.";
        if (value.trim().length < 2) return "Your name must be at least 2 characters.";
        return "";
      },
      email: function (value) {
        if (!value.trim()) return "Please enter your email address.";
        if (!EMAIL_PATTERN.test(value.trim())) return "Please enter a valid email address.";
        return "";
      },
      subject: function (value) {
        if (!value.trim()) return "Please enter a subject.";
        return "";
      },
      message: function (value) {
        if (!value.trim()) return "Please write your message.";
        if (value.trim().length < 10) return "Your message should be at least 10 characters.";
        return "";
      }
    };

    function showError(field, message) {
      var errorEl = document.getElementById(field.id + "Error");
      if (errorEl) errorEl.textContent = message;
      field.classList.add("is-invalid");
      field.setAttribute("aria-invalid", "true");
    }

    function clearError(field) {
      var errorEl = document.getElementById(field.id + "Error");
      if (errorEl) errorEl.textContent = "";
      field.classList.remove("is-invalid");
      field.removeAttribute("aria-invalid");
    }

    function validateField(field) {
      var rule = rules[field.name];
      if (!rule) return true;
      var message = rule(field.value);
      message ? showError(field, message) : clearError(field);
      return !message;
    }

    /* Validate on blur, clear the error as soon as the user fixes it */
    Object.keys(rules).forEach(function (name) {
      var field = form.elements[name];
      if (!field) return;
      field.addEventListener("blur", function () { validateField(field); });
      field.addEventListener("input", function () {
        if (field.classList.contains("is-invalid")) validateField(field);
      });
    });

    /**
     * Collects and returns the form data.
     * -> Connect your backend / email service here (fetch, EmailJS, Formspree...)
     */
    function submitMessage(data) {
      /* Example for later:
         return fetch("https://your-api.com/contact", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(data)
         });
      */
      return Promise.resolve(data);
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var fields = Object.keys(rules).map(function (name) { return form.elements[name]; });
      var firstInvalid = null;

      fields.forEach(function (field) {
        if (!validateField(field) && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        setStatus("Please correct the highlighted fields and try again.", "error");
        firstInvalid.focus();
        return;
      }

      var data = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        subject: form.elements.subject.value.trim(),
        message: form.elements.message.value.trim(),
        sentAt: new Date().toISOString()
      };

      /* Button loading state (visual only, no request is made yet) */
      if (submitBtn) {
        submitBtn.classList.add("is-loading");
        $(".form__submit-text", submitBtn).textContent = "Preparing...";
      }

      submitMessage(data).then(function () {
        setStatus("Thank you! Your message has been prepared successfully.", "success");
        form.reset();
        fields.forEach(clearError);
        showToast("Message prepared — connect a backend service to send it for real.");
      }).catch(function () {
        setStatus("Something went wrong. Please try again.", "error");
      }).then(function () {
        if (submitBtn) {
          submitBtn.classList.remove("is-loading");
          $(".form__submit-text", submitBtn).textContent = "Send Message";
        }
      });
    });

    function setStatus(message, type) {
      if (!statusBox) return;
      statusBox.hidden = false;
      statusBox.className = "form__status is-" + type;
      $("span", statusBox).textContent = message;
    }
  })();

  /* ======================================================================
     11. RESUME DOWNLOAD HANDLING
     The buttons point to "resume.pdf". If that file is not in the project
     yet, we generate a clearly-labelled plain-text resume instead so the
     button never appears to be broken.
     ====================================================================== */
  (function initResume() {
    var links = $$('a[href="resume.pdf"]');
    if (!links.length) return;

    var checked = null;

    /* Checks once whether the real resume.pdf is present in the project. */
    function resumeAvailable() {
      if (checked !== null) return Promise.resolve(checked);
      return fetch("resume.pdf", { method: "HEAD" })
        .then(function (response) {
          checked = response.ok;
          return checked;
        })
        .catch(function () {
          checked = false; /* e.g. blocked request or file:// protocol */
          return checked;
        });
    }

    function placeholderResume() {
      return [
        "ALEX MORGAN — WEB DEVELOPER",
        "======================================================",
        "PLACEHOLDER RESUME — generated by the portfolio website.",
        "Replace this content with your own and save the real file",
        "as 'resume.pdf' in the project root folder.",
        "",
        "PROFILE",
        "Front-end web developer focused on responsive, accessible",
        "interfaces built with HTML, CSS and JavaScript.",
        "",
        "SKILLS",
        "- HTML5, CSS3 (Flexbox, Grid, animations)",
        "- JavaScript (ES6+, DOM manipulation, APIs)",
        "- React (components, hooks, props/state)",
        "- Git & GitHub, Bootstrap, Tailwind CSS",
        "",
        "PROJECTS",
        "1. Weather App — HTML, CSS, JavaScript, REST API",
        "2. E-Commerce Website — HTML, CSS, JavaScript",
        "3. Portfolio Website — HTML, CSS, JavaScript",
        "4. Task Management App — HTML, CSS, JavaScript",
        "5. React Dashboard — React, JavaScript, CSS",
        "",
        "EDUCATION",
        "Bachelor's degree / self-directed learning program",
        "",
        "CONTACT",
        "Email: hello@alexmorgan.dev",
        "Phone: +1 (555) 123-4567",
        "Location: San Francisco, CA (open to remote)",
        "GitHub: https://github.com/your-username",
        "LinkedIn: https://linkedin.com/in/your-username"
      ].join("\n");
    }

    function downloadPlaceholder() {
      var blob = new Blob([placeholderResume()], { type: "text/plain;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "Alex-Morgan-Resume-PLACEHOLDER.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    links.forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();

        resumeAvailable().then(function (exists) {
          if (exists) {
            /* The real file is there -> let the browser download / open it. */
            var url = link.getAttribute("href");
            if (link.getAttribute("target") === "_blank") {
              window.open(url, "_blank", "noopener");
            } else {
              window.location.href = url;
            }
            return;
          }

          /* No resume.pdf yet -> offer a clearly labelled placeholder instead */
          downloadPlaceholder();
          showToast("resume.pdf not found yet — a placeholder text resume was downloaded. Add your own resume.pdf to the project root.");
        });
      });
    });
  })();

  /* ======================================================================
     12. SCROLL-TO-TOP BUTTON
     ====================================================================== */
  (function initScrollTop() {
    var button = $("#scrollTop");
    if (!button) return;

    function update() {
      button.classList.toggle("is-visible", window.scrollY > 400);
    }

    window.addEventListener("scroll", update, { passive: true });
    update();

    button.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
      /* Move keyboard focus to the top of the page for accessibility */
      var logo = $(".nav__logo");
      if (logo) logo.focus();
    });
  })();

  /* ======================================================================
     13. FOOTER YEAR
     ====================================================================== */
  (function initYear() {
    var yearEl = $("#year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  })();

})();
