/* ============================================================
   GrokBot — $GROKBOT
   Site config + interactions
   ============================================================ */

/* ─────────────────────────────────────────────────────────────
   EDIT THIS BLOCK. Everything else on the site reads from it.
   Leave a value as "" and the site handles it gracefully:
     · empty contract  → shows "COMING SOON" instead of a fake CA
     · empty link      → button points at the X account instead
   ───────────────────────────────────────────────────────────── */
const CONFIG = {
  // Solana mint address.
  contract: "HXAMq5WF7sR8Dih6GDzUczsWJMU6VHPFaNKxfxqwpump",

  // Trading + chart links
  buy:      "https://pump.fun/coin/HXAMq5WF7sR8Dih6GDzUczsWJMU6VHPFaNKxfxqwpump",
  chart:    "https://dexscreener.com/solana/HXAMq5WF7sR8Dih6GDzUczsWJMU6VHPFaNKxfxqwpump",
  scan:     "https://solscan.io/token/HXAMq5WF7sR8Dih6GDzUczsWJMU6VHPFaNKxfxqwpump",

  // Socials
  twitter:  "https://x.com/grokbotonx",
  telegram: "",

  supply:   "",
};

/* ── auto-fill links ──────────────────────────────────────── */
(function applyConfig() {
  const fallback = CONFIG.twitter || "#";

  document.querySelectorAll("[data-link]").forEach((el) => {
    const key = el.dataset.link;
    if (key === "source") return;                 // hard-coded, leave alone

    const href = CONFIG[key];
    if (href) {
      el.href = href;
      el.target = "_blank";
      el.rel = "noopener";
      return;
    }

    // Not configured yet. The nav button keeps scrolling to the How-to-Buy
    // section; everything else points at the announcement account.
    if (el.classList.contains("nav__cta")) return;
    el.href = fallback;
    el.target = "_blank";
    el.rel = "noopener";
    el.title = "Link goes live at launch — follow for the announcement";
  });

  document.querySelectorAll("[data-cfg]").forEach((el) => {
    const val = CONFIG[el.dataset.cfg];
    if (val) el.textContent = val;
  });
})();

/* ── contract address + copy ──────────────────────────────── */
(function contractAddress() {
  const box = document.getElementById("ca");
  const text = document.getElementById("caText");
  const btn = document.getElementById("caCopy");
  const btnText = document.getElementById("caBtnText");
  if (!box || !text || !btn) return;

  const ca = (CONFIG.contract || "").trim();
  const isValid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(ca);

  if (!isValid) {
    box.classList.add("is-pending");
    text.textContent = "Coming soon";
    btnText.textContent = CONFIG.twitter ? "Follow" : "Soon";
    btn.addEventListener("click", () => {
      if (!CONFIG.twitter) return;
      window.open(CONFIG.twitter, "_blank", "noopener");
    });
    return;
  }

  text.textContent = ca;

  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(ca);
    } catch {
      // clipboard API blocked (http:// or old browser) — fall back
      const tmp = document.createElement("textarea");
      tmp.value = ca;
      tmp.style.position = "fixed";
      tmp.style.opacity = "0";
      document.body.appendChild(tmp);
      tmp.select();
      try { document.execCommand("copy"); } catch { /* nothing else to try */ }
      document.body.removeChild(tmp);
    }
    btn.classList.add("is-copied");
    btnText.textContent = "Copied ✓";
    setTimeout(() => {
      btn.classList.remove("is-copied");
      btnText.textContent = "Copy";
    }, 1800);
  });
})();

/* ── mobile nav ───────────────────────────────────────────── */
(function mobileNav() {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (!toggle || !links) return;

  const close = () => {
    links.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  links.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
  document.addEventListener("keydown", (e) => e.key === "Escape" && close());
})();

/* ── sticky nav shadow ────────────────────────────────────── */
(function stickyNav() {
  const nav = document.getElementById("nav");
  if (!nav) return;
  const onScroll = () => nav.classList.toggle("is-stuck", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

/* ── reveal on scroll ─────────────────────────────────────── */
(function reveal() {
  const items = document.querySelectorAll(".reveal");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        setTimeout(() => entry.target.classList.add("is-in"), i * 70);
        io.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
  );

  items.forEach((el) => io.observe(el));
})();

/* ── footer year ──────────────────────────────────────────── */
(function year() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
})();
