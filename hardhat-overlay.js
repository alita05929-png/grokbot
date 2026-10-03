/* ============================================================
   Sticker overlay — drop a picture, put GrokBot on it.

   The companion to the space PFP builder. Everything here is
   namespaced `hh` so the two tools can share a page.

   Runs entirely client-side; nothing is ever uploaded.
   ============================================================ */

(function () {
  "use strict";

  var root = document.getElementById("hh");
  if (!root) return;

  var HAT_RATIO = 1;
  var CORNER = Math.hypot(0.5, 0.5);

  var cv = document.getElementById("hhCanvas");
  var ctx = cv.getContext("2d");
  var fileI = document.getElementById("hhFile");
  var drop = document.getElementById("hhDrop");

  var img = null, hats = [], sel = -1, drag = null, hatReady = false;

  var hatImg = new Image();
  hatImg.onload = function () {
    HAT_RATIO = hatImg.naturalHeight / hatImg.naturalWidth || 1;
    CORNER = Math.hypot(0.5, HAT_RATIO / 2);
    hatReady = true;
    draw();
  };
  hatImg.src = "assets/mascot.png";

  /* ---------- image loading ---------- */

  function loadFile(f) {
    if (!f || !/^image\//.test(f.type)) return;
    var r = new FileReader();
    r.onload = function () { loadSrc(r.result); };
    r.readAsDataURL(f);
  }
  function loadSrc(src) {
    var i = new Image();
    i.onload = function () { setImage(i); };
    i.src = src;
  }
  function setImage(i) {
    var MAX = 2000;
    var w = i.naturalWidth, h = i.naturalHeight;
    var s = Math.min(1, MAX / Math.max(w, h));
    cv.width = Math.max(1, Math.round(w * s));
    cv.height = Math.max(1, Math.round(h * s));
    img = i; hats = []; addHat();
    root.classList.add("has-img");
    draw();
  }

  /* ---------- hats ---------- */

  function addHat() {
    hats.push({ x: cv.width / 2, y: cv.height * 0.24, w: cv.width * 0.5, rot: 0, flip: 1 });
    sel = hats.length - 1;
  }
  function hatH(ht) { return ht.w * HAT_RATIO; }

  // world position of the bottom-right corner handle
  function handlePos(ht) {
    var hw = ht.w / 2, hh = hatH(ht) / 2, c = Math.cos(ht.rot), s = Math.sin(ht.rot);
    return { x: ht.x + hw * c - hh * s, y: ht.y + hw * s + hh * c };
  }
  // is world point p inside the hat's box?
  function inside(ht, p) {
    var c = Math.cos(-ht.rot), s = Math.sin(-ht.rot);
    var dx = p.x - ht.x, dy = p.y - ht.y;
    return Math.abs(dx * c - dy * s) <= ht.w / 2 && Math.abs(dx * s + dy * c) <= hatH(ht) / 2;
  }

  /* ---------- rendering ---------- */

  function scaleFactor() {                       // canvas px per CSS px
    var r = cv.getBoundingClientRect();
    return r.width ? cv.width / r.width : 1;
  }
  function draw(withUI) {
    if (withUI === undefined) withUI = true;
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (img) ctx.drawImage(img, 0, 0, cv.width, cv.height);
    if (hatReady) hats.forEach(function (ht) {
      ctx.save();
      ctx.translate(ht.x, ht.y); ctx.rotate(ht.rot); ctx.scale(ht.flip, 1);
      ctx.drawImage(hatImg, -ht.w / 2, -hatH(ht) / 2, ht.w, hatH(ht));
      ctx.restore();
    });
    if (withUI && sel >= 0 && hats[sel]) outline(hats[sel]);
  }
  function outline(ht) {
    var k = scaleFactor();
    ctx.save();
    ctx.translate(ht.x, ht.y); ctx.rotate(ht.rot);
    ctx.strokeStyle = "#ffc700"; ctx.lineWidth = 1.5 * k; ctx.setLineDash([6 * k, 5 * k]);
    ctx.strokeRect(-ht.w / 2, -hatH(ht) / 2, ht.w, hatH(ht));
    ctx.restore();

    var h = handlePos(ht);
    ctx.beginPath(); ctx.arc(h.x, h.y, 9 * k, 0, Math.PI * 2);
    ctx.fillStyle = "#ffc700"; ctx.fill();
    ctx.lineWidth = 2 * k; ctx.setLineDash([]); ctx.strokeStyle = "#0c0c0c"; ctx.stroke();
  }

  /* ---------- pointer interaction ---------- */

  function pt(e) {
    var r = cv.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * cv.width / r.width,
      y: (e.clientY - r.top) * cv.height / r.height
    };
  }

  cv.addEventListener("pointerdown", function (e) {
    var p = pt(e), k = scaleFactor();

    if (sel >= 0 && hats[sel]) {                       // corner handle of the selected hat
      var h = handlePos(hats[sel]);
      if (Math.hypot(p.x - h.x, p.y - h.y) <= 16 * k) {
        drag = { mode: "size" };
        cv.setPointerCapture(e.pointerId); cv.classList.add("dragging");
        return;
      }
    }
    for (var i = hats.length - 1; i >= 0; i--) {       // topmost hat under the cursor
      if (inside(hats[i], p)) {
        sel = i;
        drag = { mode: "move", dx: p.x - hats[i].x, dy: p.y - hats[i].y };
        cv.setPointerCapture(e.pointerId); cv.classList.add("dragging");
        draw(); return;
      }
    }
    sel = -1; draw();                                   // clicked the background
  });

  cv.addEventListener("pointermove", function (e) {
    if (!drag || sel < 0) return;
    var p = pt(e), ht = hats[sel];
    if (drag.mode === "move") {
      ht.x = p.x - drag.dx; ht.y = p.y - drag.dy;
    } else {
      var dx = p.x - ht.x, dy = p.y - ht.y;
      ht.w = Math.max(24, Math.hypot(dx, dy) / CORNER);
      ht.rot = Math.atan2(dy, dx) - Math.atan2(HAT_RATIO / 2, 0.5);
    }
    draw();
  });

  function endDrag() { drag = null; cv.classList.remove("dragging"); }
  cv.addEventListener("pointerup", endDrag);
  cv.addEventListener("pointercancel", endDrag);

  // Scroll-to-scale only takes over the wheel once a hat is selected, so the
  // page still scrolls normally for anyone passing through the section.
  cv.addEventListener("wheel", function (e) {
    if (sel < 0) return;
    e.preventDefault();
    hats[sel].w = Math.max(24, Math.min(cv.width * 4, hats[sel].w * (e.deltaY > 0 ? 0.94 : 1.06)));
    draw();
  }, { passive: false });

  /* ---------- controls ---------- */

  document.getElementById("hhAdd").onclick = function () { addHat(); draw(); };
  document.getElementById("hhFlip").onclick = function () { if (sel >= 0) { hats[sel].flip *= -1; draw(); } };
  document.getElementById("hhDel").onclick = function () {
    if (sel >= 0) { hats.splice(sel, 1); sel = hats.length - 1; draw(); }
  };
  document.getElementById("hhNew").onclick = function () { fileI.value = ""; fileI.click(); };

  document.addEventListener("keydown", function (e) {
    if ((e.key === "Backspace" || e.key === "Delete") && sel >= 0 && root.classList.contains("has-img")) {
      var t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      e.preventDefault(); hats.splice(sel, 1); sel = hats.length - 1; draw();
    }
  });

  /* ---------- export ---------- */

  var MAX_BYTES = 1900000;   // X rejects a profile picture over 2MB

  // Render clean (no selection UI), hand the bitmap over, then restore the UI.
  // A 2000px photo can encode well past 2MB as PNG, so fall back to JPEG —
  // safe here because the source image fills the whole canvas, leaving no alpha.
  function clean(cb) {
    draw(false);
    cv.toBlob(function (png) {
      if (png && png.size <= MAX_BYTES) {
        try { cb(png, "png"); } finally { draw(); }
        return;
      }
      cv.toBlob(function (jpg) {
        try {
          if (jpg) cb(jpg, "jpg");
          else if (png) cb(png, "png");
        } finally { draw(); }
      }, "image/jpeg", 0.92);
    }, "image/png");
  }

  document.getElementById("hhDownload").onclick = function () {
    clean(function (b, ext) {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = "grokbot-" + Date.now() + "." + ext;
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    });
  };
  var copyBtn = document.getElementById("hhCopy");
  copyBtn.onclick = function () {
    // the clipboard only reliably accepts PNG, so it always gets PNG
    draw(false);
    cv.toBlob(function (b) {
      draw();
      if (!b) { copyBtn.textContent = "Copy failed"; return; }
      try {
        navigator.clipboard.write([new ClipboardItem({ "image/png": b })]).then(function () {
          copyBtn.textContent = "✓ Copied";
          setTimeout(function () { copyBtn.textContent = "⧉ Copy"; }, 1500);
        }, function () { copyBtn.textContent = "Copy failed"; });
      } catch (err) { copyBtn.textContent = "Not supported"; }
    }, "image/png");
  };

  /* ---------- input: click, drop, paste ---------- */

  drop.onclick = function () { fileI.click(); };
  drop.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileI.click(); }
  });
  fileI.onchange = function () { loadFile(fileI.files[0]); };

  ["dragenter", "dragover"].forEach(function (ev) {
    window.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); });
  });
  ["dragleave", "drop"].forEach(function (ev) {
    window.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); });
  });
  window.addEventListener("drop", function (e) {
    if (e.dataTransfer && e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
  });
  window.addEventListener("paste", function (e) {
    var items = (e.clipboardData || {}).items || [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") === 0) { loadFile(items[i].getAsFile()); break; }
    }
  });
})();
