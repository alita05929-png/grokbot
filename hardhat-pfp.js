/* ============================================================
   Grok PFP — build a GrokBot portrait.

   The orb is fixed: same cutout, same size, same position in
   every export. Only the colours and the backdrop change.

   Runs entirely client-side; nothing is ever uploaded.
   ============================================================ */

(function () {
  "use strict";

  var root = document.getElementById("hc");
  var cv = document.getElementById("hcCanvas");
  if (!root || !cv) return;

  var ctx = cv.getContext("2d");

  /* ---------- the fixed frame ---------- */

  // X wants a square image, at least 400x400, under 2MB, and crops it to the
  // circle inscribed in that square. So: render square at 1000 for a crisp
  // downscale, keep every meaningful pixel inside the inscribed circle, and
  // leave no transparency anywhere — X flattens alpha when it re-encodes.
  var OUT = 1000;          // export size, square
  var INNER = 434;         // radius of the art disc; everything beyond is ring

  var PALETTE = [
    { name: "Launch Gold", hex: "#ffc107" },
    { name: "Sun Gold", hex: "#f0b90b" },
    { name: "Booster Orange", hex: "#ff8a1e" },
    { name: "Ion Cyan", hex: "#3ec8ff" },
    { name: "Deep Orbit", hex: "#102a62" },
    { name: "Night Navy", hex: "#070814" },
    { name: "Nebula Violet", hex: "#6d4bff" },
    { name: "Mars", hex: "#d0342c" },
    { name: "Planet Blue", hex: "#2f6dff" },
    { name: "Star White", hex: "#f3f6ff" },
    { name: "Void", hex: "#05060e" }
  ];

  var state = {
    style: "glow",
    bg: "#102a62",
    ring: "#070814",
    glow: "#ffc107",
    badge: false
  };

  var sue = new Image();
  var sueReady = false;
  sue.onload = function () { sueReady = true; draw(); };
  sue.src = "assets/mascot.png";

  /* ---------- colour helpers ---------- */

  function hexRgb(h) {
    h = h.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function mix(hex, target, t) {
    var c = hexRgb(hex), d = hexRgb(target);
    return "rgb(" + Math.round(c[0] + (d[0] - c[0]) * t) + "," +
                    Math.round(c[1] + (d[1] - c[1]) * t) + "," +
                    Math.round(c[2] + (d[2] - c[2]) * t) + ")";
  }
  function rgba(hex, a) {
    var c = hexRgb(hex);
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  }

  /* ---------- backdrops ---------- */

  function circlePath(r) {
    ctx.beginPath();
    ctx.arc(OUT / 2, OUT / 2, r, 0, Math.PI * 2);
  }

  function paintBackdrop() {
    var c = state.bg;

    if (state.style === "solid") {
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, OUT, OUT);

    } else if (state.style === "glow") {
      var g = ctx.createRadialGradient(OUT / 2, OUT * 0.44, 30, OUT / 2, OUT / 2, INNER);
      g.addColorStop(0, mix(c, "#ffffff", 0.22));
      g.addColorStop(0.55, c);
      g.addColorStop(1, mix(c, "#000000", 0.62));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, OUT, OUT);

    } else if (state.style === "stars") {
      ctx.fillStyle = mix(c, "#050814", 0.7);
      ctx.fillRect(0, 0, OUT, OUT);
      var seed = 0;
      for (var k = 0; k < c.length; k++) seed = (seed * 33 + c.charCodeAt(k)) >>> 0;
      function rnd() {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      }
      for (var n = 0; n < 110; n++) {
        ctx.fillStyle = rgba("#ffffff", 0.35 + rnd() * 0.65);
        ctx.beginPath();
        ctx.arc(rnd() * OUT, rnd() * OUT, rnd() * 2.1 + 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

    } else { // nebula
      ctx.fillStyle = mix(c, "#050814", 0.4);
      ctx.fillRect(0, 0, OUT, OUT);
      var n1 = ctx.createRadialGradient(OUT * 0.32, OUT * 0.38, 20, OUT * 0.32, OUT * 0.4, INNER);
      n1.addColorStop(0, rgba(state.glow, 0.55));
      n1.addColorStop(1, rgba(state.glow, 0));
      ctx.fillStyle = n1;
      ctx.fillRect(0, 0, OUT, OUT);
      var n2 = ctx.createRadialGradient(OUT * 0.7, OUT * 0.62, 10, OUT * 0.68, OUT * 0.6, INNER * 0.85);
      n2.addColorStop(0, rgba("#3ec8ff", 0.42));
      n2.addColorStop(1, rgba("#3ec8ff", 0));
      ctx.fillStyle = n2;
      ctx.fillRect(0, 0, OUT, OUT);
    }
  }

  /* ---------- render ---------- */

  function draw() {
    // The ring colour fills the whole square, so the export is fully opaque
    // and the ring runs right out to X's circular crop with no seam.
    ctx.fillStyle = state.ring;
    ctx.fillRect(0, 0, OUT, OUT);

    // everything inside the ring
    ctx.save();
    circlePath(INNER + 1);
    ctx.clip();

    paintBackdrop();

    // halo behind the orb, in the chosen glow colour
    var halo = ctx.createRadialGradient(OUT / 2, OUT * 0.52, 20, OUT / 2, OUT * 0.52, INNER);
    halo.addColorStop(0, rgba(state.glow, 0.5));
    halo.addColorStop(0.45, rgba(state.glow, 0.16));
    halo.addColorStop(1, rgba(state.glow, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, OUT, OUT);

    // GrokBot — identical placement every time
    if (sueReady) {
      var s = INNER * 2 * 0.9;
      ctx.drawImage(sue, OUT / 2 - s / 2, OUT / 2 - s / 2 + INNER * 0.02, s, s);
    }

    // vignette so the orb always sits into the frame the same way
    var vig = ctx.createRadialGradient(OUT / 2, OUT / 2, INNER * 0.62, OUT / 2, OUT / 2, INNER);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.34)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, OUT, OUT);

    ctx.restore();

    // a thin bright edge where the art meets the ring, so the two separate
    // cleanly whatever colours have been picked
    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = rgba("#ffffff", 0.16);
    circlePath(INNER + 1.5);
    ctx.stroke();
    ctx.restore();

    if (state.badge) drawBadge();
  }

  function drawBadge() {
    var text = "$GROKBOT";
    ctx.save();
    ctx.font = '400 30px "Titan One", "Arial Black", Impact, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var pw = ctx.measureText(text).width + 62, ph = 82;
    var cx = OUT / 2, cy = OUT * 0.845;

    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cx - pw / 2, cy - ph / 2, pw, ph, ph / 2);
    else {
      var r = ph / 2, x = cx - pw / 2, y = cy - ph / 2;
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + pw, y, x + pw, y + ph, r);
      ctx.arcTo(x + pw, y + ph, x, y + ph, r);
      ctx.arcTo(x, y + ph, x, y, r);
      ctx.arcTo(x, y, x + pw, y, r);
    }
    ctx.fillStyle = state.glow;
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 6;
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.fillStyle = "#0c0c0c";
    ctx.fillText(text, cx, cy + 3);
    ctx.restore();
  }

  /* ---------- controls ---------- */

  function markActive(host, hex) {
    host.querySelectorAll(".hc__swatch").forEach(function (el) {
      var on = el.dataset.hex === hex;
      el.classList.toggle("is-on", on);
      el.setAttribute("aria-pressed", String(on));
    });
  }
  function buildSwatches(hostId, key) {
    var host = document.getElementById(hostId);
    if (!host) return;
    PALETTE.forEach(function (p) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "hc__swatch";
      b.style.background = p.hex;
      b.title = p.name;
      b.setAttribute("aria-label", p.name);
      b.dataset.hex = p.hex;
      b.addEventListener("click", function () {
        state[key] = p.hex;
        markActive(host, p.hex);
        draw();
      });
      host.appendChild(b);
    });
    markActive(host, state[key]);
  }

  buildSwatches("hcBgColors", "bg");
  buildSwatches("hcRingColors", "ring");
  buildSwatches("hcGlowColors", "glow");

  var styleHost = document.getElementById("hcStyles");
  if (styleHost) {
    styleHost.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-style]");
      if (!b) return;
      state.style = b.dataset.style;
      styleHost.querySelectorAll("button").forEach(function (el) {
        el.classList.toggle("is-on", el === b);
      });
      draw();
    });
  }

  var badgeBtn = document.getElementById("hcBadgeToggle");
  badgeBtn.addEventListener("click", function () {
    state.badge = !state.badge;
    badgeBtn.classList.toggle("is-on", state.badge);
    badgeBtn.setAttribute("aria-pressed", String(state.badge));
    draw();
  });

  document.getElementById("hcRandom").addEventListener("click", function () {
    var styles = ["glow", "stars", "nebula", "solid"];
    var pick = function () { return PALETTE[(Math.random() * PALETTE.length) | 0].hex; };

    state.style = styles[(Math.random() * styles.length) | 0];
    state.bg = pick();
    state.ring = pick();
    state.glow = pick();
    // keep it readable: the ring must not vanish into the backdrop
    if (state.ring === state.bg) state.ring = "#070814";

    styleHost.querySelectorAll("button").forEach(function (el) {
      el.classList.toggle("is-on", el.dataset.style === state.style);
    });
    markActive(document.getElementById("hcBgColors"), state.bg);
    markActive(document.getElementById("hcRingColors"), state.ring);
    markActive(document.getElementById("hcGlowColors"), state.glow);
    draw();
  });

  /* ---------- export ---------- */

  var MAX_BYTES = 1900000;   // X rejects anything over 2MB

  function blobOut(cb) {
    cv.toBlob(function (png) {
      if (png && png.size <= MAX_BYTES) { cb(png, "png"); return; }
      // photographic PNG can run large; JPEG is safe here because the
      // canvas is fully opaque
      cv.toBlob(function (jpg) {
        if (jpg) cb(jpg, "jpg");
        else if (png) cb(png, "png");
      }, "image/jpeg", 0.92);
    }, "image/png");
  }
  document.getElementById("hcDownload").addEventListener("click", function () {
    blobOut(function (b, ext) {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = "grokbot-pfp-" + Date.now() + "." + ext;
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    });
  });
  var copyBtn = document.getElementById("hcCopy");
  copyBtn.addEventListener("click", function () {
    // the clipboard only reliably accepts PNG, so it always gets PNG
    cv.toBlob(function (png) {
      if (!png) { copyBtn.textContent = "Copy failed"; return; }
      try {
        navigator.clipboard.write([new ClipboardItem({ "image/png": png })]).then(function () {
          copyBtn.textContent = "✓ Copied";
          setTimeout(function () { copyBtn.textContent = "⧉ Copy"; }, 1500);
        }, function () { copyBtn.textContent = "Copy failed"; });
      } catch (err) { copyBtn.textContent = "Not supported"; }
    }, "image/png");
  });

  // The badge uses Titan One; redraw once the webfont is ready so the
  // first paint isn't stuck with the fallback.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(draw);
  }

  draw();
})();
