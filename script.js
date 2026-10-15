// Interactions for aishwary03.dev. The page is fully readable without this file.
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasIO = "IntersectionObserver" in window;

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function onVisible(el, cb) {
    if (!hasIO) { cb(true); return; }
    new IntersectionObserver(function (entries) { cb(entries[0].isIntersecting); }).observe(el);
  }

  /* ---------- Footer year ---------- */
  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Live clock (India time) ---------- */
  (function clock() {
    var hm, hms;
    try {
      hm = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
      hms = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
    } catch (e) { return; }
    var short = $$("[data-clock]");
    var long = $$("[data-clock-s]");
    var zoned = $$("[data-tz]").map(function (el) {
      try {
        return { el: el, fmt: new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: el.getAttribute("data-tz") }) };
      } catch (e) { return null; }
    }).filter(Boolean);
    function tick() {
      var now = new Date();
      short.forEach(function (el) { el.textContent = hm.format(now); });
      long.forEach(function (el) { el.textContent = hms.format(now); });
      zoned.forEach(function (z) { z.el.textContent = z.fmt.format(now); });
    }
    tick();
    setInterval(tick, 1000);
  })();

  /* ---------- Header name types itself out on the first load ---------- */
  (function typeName() {
    var logo = $(".logo");
    var text = logo && $(".logo-text", logo);
    if (!text) return;
    var full = text.textContent;
    var seen = false;
    try {
      seen = sessionStorage.getItem("name-typed") === "1";
      sessionStorage.setItem("name-typed", "1");
    } catch (e) { /* storage blocked: type every time */ }
    if (reduce || seen) return;

    logo.setAttribute("aria-label", full);
    text.setAttribute("aria-hidden", "true");
    text.textContent = "";
    logo.classList.add("is-typing");
    var i = 0;
    function next() {
      i++;
      text.textContent = full.slice(0, i);
      if (i < full.length) {
        setTimeout(next, full.charAt(i) === " " ? 170 : 55 + Math.random() * 75);
      } else {
        logo.classList.remove("is-typing");
        logo.classList.add("is-idle");
        setTimeout(function () {
          logo.classList.remove("is-idle");
          text.removeAttribute("aria-hidden");
          logo.removeAttribute("aria-label");
        }, 3000);
      }
    }
    setTimeout(next, 500);
  })();

  /* ---------- Active nav link ---------- */
  (function nav() {
    if (!hasIO) return;
    var links = $$(".site-header nav a");
    var byId = {};
    links.forEach(function (a) { byId[a.hash.slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute("aria-current"); });
        var a = byId[e.target.id];
        if (a) a.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    $$("main section[id]").forEach(function (s) { io.observe(s); });
  })();

  /* ---------- Kinetic type: letters thicken and widen near the cursor ---------- */
  var KINETIC = {
    name:  { base: [300, 87.5], max: [800, 112.5], rest: [600, 100], radius: 220, wave: 0.55, intro: true, keepWords: true },
    email: { base: [400, 100],  max: [760, 112.5], rest: [400, 100], radius: 190, wave: 0,    intro: false, keepWords: true }
  };

  function splitLetters(el, keepWords) {
    var label = el.textContent.replace(/\s+/g, " ").trim();
    var visual = doc.createElement("span");
    visual.setAttribute("aria-hidden", "true");
    var letters = [];
    var word = null;
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        Array.from(node.textContent).forEach(function (ch) {
          if (ch === "\n" || ch === "\r") return;
          // Letters are grouped per word so lines only wrap at spaces.
          if (ch === " ") { visual.appendChild(doc.createTextNode(" ")); word = null; return; }
          // In an email address, allow a line break only before the @.
          if (keepWords && ch === "@" && word) { visual.appendChild(doc.createElement("wbr")); word = null; }
          if (!keepWords) { word = visual; }
          else if (!word) {
            word = doc.createElement("span");
            word.className = "k-word";
            visual.appendChild(word);
          }
          var s = doc.createElement("span");
          s.className = "k";
          s.textContent = ch;
          word.appendChild(s);
          letters.push(s);
        });
      } else if (node.nodeName === "BR") {
        visual.appendChild(doc.createElement("br"));
      }
    });
    var sr = doc.createElement("span");
    sr.className = "sr-only";
    sr.textContent = label;
    el.dataset.text = label;
    el.textContent = "";
    el.appendChild(sr);
    el.appendChild(visual);
    return letters;
  }

  function kinetic(el, cfg) {
    var letters = splitLetters(el, cfg.keepWords);
    function fvs(w, d) { return '"wght" ' + w.toFixed(1) + ', "wdth" ' + d.toFixed(2); }

    if (reduce) {
      letters.forEach(function (l) { l.style.fontVariationSettings = fvs(cfg.rest[0], cfg.rest[1]); });
      return;
    }
    if (cfg.intro) {
      letters.forEach(function (l, i) {
        l.style.setProperty("--d", 150 + i * 45);
        l.classList.add("k-in");
      });
    }

    var state = letters.map(function () { return { w: cfg.base[0], d: cfg.base[1] }; });
    var px = -1e4, py = -1e4, lastMove = -1e4, visible = true, running = false;

    window.addEventListener("pointermove", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      px = e.clientX; py = e.clientY; lastMove = performance.now();
      start();
    }, { passive: true });
    onVisible(el, function (v) { visible = v; if (v) start(); });
    doc.addEventListener("visibilitychange", start);

    function start() {
      if (running || !visible || doc.hidden) return;
      running = true;
      requestAnimationFrame(frame);
    }

    function frame(t) {
      if (!visible || doc.hidden) { running = false; return; }
      var idle = t - lastMove > 2500;
      var rects = idle ? null : letters.map(function (l) { return l.getBoundingClientRect(); });
      var settling = false;

      for (var i = 0; i < letters.length; i++) {
        var f;
        if (idle) {
          f = cfg.wave ? ((Math.sin(t * 0.0018 - i * 0.55) + 1) / 2) * cfg.wave : 0;
        } else {
          var r = rects[i];
          var dx = px - (r.left + r.width / 2);
          var dy = (py - (r.top + r.height / 2)) * 1.25;
          f = clamp(1 - Math.sqrt(dx * dx + dy * dy) / cfg.radius, 0, 1);
          f = f * f * (3 - 2 * f);
        }
        var tw = cfg.base[0] + (cfg.max[0] - cfg.base[0]) * f;
        var td = cfg.base[1] + (cfg.max[1] - cfg.base[1]) * f;
        var s = state[i];
        s.w += (tw - s.w) * 0.14;
        s.d += (td - s.d) * 0.14;
        if (Math.abs(tw - s.w) > 0.5 || Math.abs(td - s.d) > 0.05) settling = true;
        letters[i].style.fontVariationSettings = fvs(s.w, s.d);
      }

      if (idle && !cfg.wave && !settling) { running = false; return; }
      requestAnimationFrame(frame);
    }

    start();
  }

  $$("[data-kinetic]").forEach(function (el) {
    var cfg = KINETIC[el.getAttribute("data-kinetic")];
    if (cfg) kinetic(el, cfg);
  });

  /* ---------- Cycling words in the hero, with a scramble ---------- */
  $$(".cycle[data-words]").forEach(function (el) {
    var words = el.getAttribute("data-words").split("|").map(function (w) { return w.trim(); }).filter(Boolean);
    if (words.length < 2) return;
    var sr = doc.createElement("span");
    sr.className = "sr-only";
    sr.textContent = words.join(", ");
    el.parentNode.insertBefore(sr, el);
    el.setAttribute("aria-hidden", "true");
    if (reduce) return;

    var glyphs = "abcdefghijklmnopqrstuvwxyz#%&*+=/<>{}";
    var index = 0, visible = true;
    onVisible(el, function (v) { visible = v; });

    function scramble(next) {
      var from = el.textContent;
      var len = Math.max(from.length, next.length);
      var frames = 28, f = 0;
      var order = [];
      for (var k = 0; k < len; k++) order.push((k / len) * 0.6 + Math.random() * 0.4);
      (function step() {
        f++;
        var p = f / frames, out = "";
        for (var k = 0; k < len; k++) {
          if (p >= order[k]) out += next.charAt(k);
          else if (p < order[k] - 0.35) out += from.charAt(k);
          else out += glyphs.charAt(Math.floor(Math.random() * glyphs.length));
        }
        el.textContent = out;
        if (f < frames) requestAnimationFrame(step);
        else el.textContent = next;
      })();
    }

    setInterval(function () {
      if (!visible || doc.hidden) return;
      index = (index + 1) % words.length;
      scramble(words[index]);
    }, 3200);
  });

  /* ---------- Oscilloscope band ---------- */
  (function scope() {
    var band = $(".scope");
    var canvas = band && $("canvas", band);
    var ctx = canvas && canvas.getContext && canvas.getContext("2d");
    if (!ctx) return;
    var hero = $(".hero") || band;
    var css = getComputedStyle(root);
    var amber = css.getPropertyValue("--amber").trim() || "#f5b342";
    var ice = css.getPropertyValue("--ice").trim() || "#9ccff0";
    var w = 0, h = 0;
    var px = -1e4, amp = 0, target = 0;
    var t0 = performance.now(), visible = true, running = false;

    function resize() {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      w = band.clientWidth; h = band.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce) drawStatic();
    }

    function ch1(x, t) {
      return h * 0.5 + Math.sin(x * 0.011 + t * 0.0015) * h * 0.1 + Math.sin(x * 0.027 - t * 0.0021) * h * 0.05;
    }
    function ch2(x, t) {
      return h * 0.5 + Math.sin(x * 0.006 - t * 0.0009 + 1.7) * h * 0.2;
    }
    function bump(x, t) {
      if (amp < 0.002) return 0;
      var g = Math.exp(-((x - px) * (x - px)) / (2 * 110 * 110));
      return Math.sin(x * 0.085 - t * 0.011) * h * 0.32 * g * amp;
    }
    function trace(fn, t, limit, color, width, alpha) {
      ctx.beginPath();
      for (var x = 0; x <= limit; x += 3) {
        var y = fn(x, t);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    function drawStatic() {
      ctx.clearRect(0, 0, w, h);
      trace(ch2, 0, w, ice, 1, 0.45);
      trace(ch1, 0, w, amber, 1.75, 1);
    }

    function frame(now) {
      if (!visible || doc.hidden) { running = false; return; }
      var t = now - t0;
      amp += (target - amp) * 0.06;

      // Fade the previous frame instead of clearing it, for a phosphor trail.
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";

      var p = clamp(t / 1700, 0, 1);
      var limit = w * (1 - Math.pow(1 - p, 3));
      trace(ch2, t, limit, ice, 1, 0.45);
      trace(function (x, tt) { return ch1(x, tt) + bump(x, tt); }, t, limit, amber, 1.75, 1);

      if (p < 1) {
        ctx.beginPath();
        ctx.arc(limit, ch1(limit, t), 3, 0, Math.PI * 2);
        ctx.fillStyle = amber;
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }

    function start() {
      if (reduce || running || !visible || doc.hidden) return;
      running = true;
      requestAnimationFrame(frame);
    }

    hero.addEventListener("pointermove", function (e) {
      var r = band.getBoundingClientRect();
      px = e.clientX - r.left;
      target = 1;
    }, { passive: true });
    hero.addEventListener("pointerleave", function () { target = 0; });

    var pending = false;
    window.addEventListener("resize", function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; resize(); });
    });
    onVisible(band, function (v) { visible = v; start(); });
    doc.addEventListener("visibilitychange", start);
    resize();
    if (reduce) drawStatic(); else start();
  })();

  /* ---------- World map: India to client regions ---------- */
  (function worldMap() {
    // Land dots on a 2-degree grid (Natural Earth 110m via world-atlas), one bit per cell, row by row from 81N.
    var WORLD = { cols: 180, rows: 69, step: 2, latTop: 81, bits: "AAAAAAA9/v///4AAPwAAAADwAAAAAAAAAAACFB5////wAAZAAAAAAAAAAAAAAAAABNmYAA///wAAAAAA4ABf4AGAAAAAAADwAQAAP//wAAAAAGAAf/gAAAAAAAAAHfzH+AP//AAAAAAMDd///8D4AAAH/gof8x3wH//gAAD4AADf//////wQwf///w59h4H/wAAAP/yf//////////e//////+B2H/AuAA/+P///////////AD/////5Q4D8AcAB9/f//////////+Af/////gHAB4AAAH5///////////78AP8f///gHkAAAAAH5H/////////+GAABgB///wH+AAAAEAw/////////8AYAACAA///8D/AAAAECh/////////4A4AAAABf///v/gAAAZD//////////8AwAAAAAP///n/wAAAXv///////////AgAAAAAL////4QAAAA///////////9AAAAAAAB////48AAAD///////////8AAAAAAAD////9AAAAB//4fH//////4AAAAAAAD////kAAAAB9PwPf//////xgAAAAAAD////gAAAAfyzxHP/////+CAAAAAAAD///+AAAAAfCCf/n/////cCAAAAAAAB///8AAAAAPAxf/n////+MAAAAAAAAB///8AAAAAA+AA///////GMAAAAAAAAf//4AAAAAP+AA///////BgAAAAAAAAP//wAAAAAf/zB///////hAAAAAAAAAL/5gAAAAAf////f/////gAAAAAAAAAH/AQAAAAA///+/P/////gAAAAAAAAAB+AQAAAAB///+/h/////AAAAAAAAAAA+AAAAAAD////f+D///+gAAAAAAAAAAeAIAAAAD////P/B/7/4AAAAAAAAAAAfEGAAAAD////v+A/j+AAAAAAAAAAAAH8EIAAAD////n8AfB+AgAAAAAAAAAABcAAAAAD////3wAcBfAgAAAAAAAAAAAPAAAAAD////7AAcAfgwAAAAAAAAAAABAAAAAD////8QAMAXgIAAAAAAAAAAABD+AAAB/////gAMASBQAAAAAAAAAAAAX/AAAB/////gACAQAYAAAAAAAAAAAAH/oAAAfv///AAAAICIAAAAAAAAAAAAH/8AAAAD///AAAAsGAAAAAAAAAAAAAH/+AAAAB//+AAAAcOAAAAAAAAAAAAAP/+AAAAB//4AAAAMeAAAAAAAAAAAAAP//wAAAB//4AAAAMcgsAAAAAAAAAAAf//+AAAA//wAAAAGEA/CAAAAAAAAAAf///AAAA//gAAAABAAH5AAAAAAAAAAP///gAAAf/wAAAAAYAHQQAAAAAAAAAH///AAAAf/wAAAAAAAAIAAAAAAAAAAH//+AAAAf/wAAAAAAAhAAAAAAAAAAAD//+AAAA//wgAAAAAFxAAAAAAAAAAAB//+AAAA//xgAAAAAP5gAAAAAAAAAAAf/8AAAA//DgAAAAAf/gAAAAAAAAAAAf/8AAAA/+DAAAAAA//wAAAAAAAAAAAf/4AAAAf/DAAAAAH//4AAAAAAAAAAAf/gAAAAf/DAAAAAH//8AAAAAAAAAAAf/AAAAAf8AAAAAAH//+AAAAAAAAAAA//AAAAAP8AAAAAAH//+AAAAAAAAAAA/+AAAAAH4AAAAAAD//+AAAAAAAAAAA/8AAAAAH4AAAAAAD8/8AAAAAAAAAAA/4AAAAAGAAAAAAADAH8AAAAAAAAAAA/gAAAAAAAAAAAAAAAD4AAAAAAAAAAB/gAAAAAAAAAAAAAAADQAGAAAAAAAAB+AAAAAAAAAAAAAAAAAAAEAAAAAAAAB8AAAAAAAAAAAAAAAAAQAIAAAAAAAAB4AAAAAAAAAAAAAAAAAAAwAAAAAAAABwAAAAAAAAAAAAAAAAAABgAAAAAAAAD4AAAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAAAAAAAAAADxgAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" };
    var fig = $("[data-map]");
    var canvas = fig && $("canvas", fig);
    var ctx = canvas && canvas.getContext && canvas.getContext("2d");
    if (!ctx || !window.atob) return;

    var raw = atob(WORLD.bits);
    var bytes = new Uint8Array(raw.length);
    for (var b = 0; b < raw.length; b++) bytes[b] = raw.charCodeAt(b);
    function isLand(c, r) { var i = r * WORLD.cols + c; return (bytes[i >> 3] >> (7 - (i & 7))) & 1; }

    var css = getComputedStyle(root);
    function token(name, fallback) { return css.getPropertyValue(name).trim() || fallback; }
    var C = {
      dot: token("--line-2", "#363c49"),
      amber: token("--amber", "#f5b342"),
      ice: token("--ice", "#9ccff0"),
      text: token("--text", "#eef0f3"),
      bg: token("--bg", "#0e1015")
    };

    var pins = $$(".map-pin", fig).map(function (el) {
      return { el: el, lat: +el.getAttribute("data-lat"), lon: +el.getAttribute("data-lon"), home: el.classList.contains("is-home") };
    });
    var home = pins.filter(function (p) { return p.home; })[0];
    var clients = pins.filter(function (p) { return !p.home; });
    if (!home) return;

    var W = 0, H = 0, dots = null, active = -1;
    var spanLat = WORLD.rows * WORLD.step;
    function project(lat, lon) {
      return { x: (lon + 180) / 360 * W, y: (WORLD.latTop - lat) / spanLat * H };
    }

    // Place the HTML labels as percentages so they track the canvas at any width.
    pins.forEach(function (p) {
      p.el.style.left = ((p.lon + 180) / 360 * 100).toFixed(3) + "%";
      p.el.style.top = ((WORLD.latTop - p.lat) / spanLat * 100).toFixed(3) + "%";
    });

    function arcPoint(a, c, t, lift) {
      var mx = (a.x + c.x) / 2, my = (a.y + c.y) / 2;
      var dist = Math.hypot(c.x - a.x, c.y - a.y);
      var cx = mx, cy = my - dist * lift;
      var u = 1 - t;
      return { x: u * u * a.x + 2 * u * t * cx + t * t * c.x, y: u * u * a.y + 2 * u * t * cy + t * t * c.y };
    }

    function drawDots() {
      dots = document.createElement("canvas");
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      dots.width = canvas.width; dots.height = canvas.height;
      var d = dots.getContext("2d");
      d.setTransform(dpr, 0, 0, dpr, 0, 0);
      var cw = W / WORLD.cols, ch = H / WORLD.rows;
      var r = Math.max(0.6, Math.min(cw, ch) * 0.26);
      d.fillStyle = C.dot;
      for (var row = 0; row < WORLD.rows; row++) {
        for (var col = 0; col < WORLD.cols; col++) {
          if (!isLand(col, row)) continue;
          d.beginPath();
          d.arc((col + 0.5) * cw, (row + 0.5) * ch, r, 0, Math.PI * 2);
          d.fill();
        }
      }
    }

    function resize() {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      if (!W || !H) return;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawDots();
      draw(performance.now());
    }

    var revealAt = reduce ? -1e9 : null; // set when the map scrolls into view
    var DRAW_MS = 1300, STAGGER = 350, PULSE_MS = 2600;

    function draw(now) {
      if (!dots) return;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(dots, 0, 0, W, H);
      var a = project(home.lat, home.lon);
      var lift = W < 500 ? 0.22 : 0.3;
      var lw = W < 500 ? 1.2 : 1.8;

      clients.forEach(function (p, i) {
        var c = project(p.lat, p.lon);
        var elapsed = revealAt === null ? 0 : now - revealAt - i * STAGGER;
        var prog = Math.max(0, Math.min(1, elapsed / DRAW_MS));
        prog = 1 - Math.pow(1 - prog, 3);
        var dim = active >= 0 && active !== i + 1;
        if (prog > 0) {
          ctx.beginPath();
          var steps = 48;
          for (var s = 0; s <= steps * prog; s++) {
            var pt = arcPoint(a, c, s / steps, lift);
            if (s === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
          }
          ctx.strokeStyle = C.amber;
          ctx.globalAlpha = dim ? 0.2 : (active === i + 1 ? 1 : 0.75);
          ctx.lineWidth = active === i + 1 ? lw + 0.8 : lw;
          ctx.lineCap = "round";
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        // A pulse runs along each finished line.
        if (prog >= 1 && !reduce && !dim) {
          var t = ((now - revealAt - i * 700) % PULSE_MS) / PULSE_MS;
          var q = arcPoint(a, c, t, lift);
          ctx.beginPath();
          ctx.arc(q.x, q.y, lw + 1.2, 0, Math.PI * 2);
          ctx.fillStyle = C.amber;
          ctx.globalAlpha = Math.sin(t * Math.PI);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        // Client marker appears when its line arrives.
        if (prog >= 1) {
          ctx.beginPath();
          ctx.arc(c.x, c.y, lw + 2.2, 0, Math.PI * 2);
          ctx.fillStyle = C.bg;
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = dim ? C.dot : C.ice;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(c.x, c.y, lw * 0.9, 0, Math.PI * 2);
          ctx.fillStyle = dim ? C.dot : C.ice;
          ctx.fill();
          p.el.classList.add("is-shown");
        }
      });

      // Home marker with a slow ring.
      var ring = reduce ? 0 : ((now % 2400) / 2400);
      if (ring) {
        ctx.beginPath();
        ctx.arc(a.x, a.y, 4 + ring * (W < 500 ? 8 : 14), 0, Math.PI * 2);
        ctx.strokeStyle = C.amber;
        ctx.globalAlpha = 1 - ring;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.beginPath();
      ctx.arc(a.x, a.y, lw + 3, 0, Math.PI * 2);
      ctx.fillStyle = C.amber;
      ctx.fill();
    }

    var visible = false, running = false;
    function frame(now) {
      if (!visible || doc.hidden) { running = false; return; }
      draw(now);
      requestAnimationFrame(frame);
    }
    function start() {
      if (reduce || running || !visible || doc.hidden) return;
      running = true;
      requestAnimationFrame(frame);
    }

    home.el.classList.add("is-shown");
    if (reduce || !hasIO) {
      revealAt = -1e9;
      clients.forEach(function (p) { p.el.classList.add("is-shown"); });
    }
    if (hasIO) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && revealAt === null && entries[0].intersectionRatio > 0.3) revealAt = performance.now();
        if (visible && revealAt === null) revealAt = performance.now() + 250;
        start();
        if (reduce) draw(performance.now());
      }, { threshold: [0, 0.3] }).observe(fig);
    }
    doc.addEventListener("visibilitychange", start);

    // Hovering or focusing a region highlights its line.
    function setActive(i) { active = i; if (reduce || !running) draw(performance.now()); }
    $$(".region").forEach(function (li) {
      var i = +li.getAttribute("data-region");
      li.addEventListener("pointerenter", function () { setActive(i); });
      li.addEventListener("pointerleave", function () { setActive(-1); });
    });

    var pending = false;
    window.addEventListener("resize", function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; resize(); });
    });
    resize();
  })();

  /* ---------- Section headings stretch open as they scroll in ---------- */
  (function headings() {
    var heads = $$(".stretch");
    if (reduce || !hasIO) { heads.forEach(function (h) { h.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    heads.forEach(function (h) { io.observe(h); });
  })();

  /* ---------- Reveal: before/after bars, timeline bars ---------- */
  (function reveal() {
    var items = $$("[data-animate]");
    if (reduce || !hasIO) { items.forEach(function (el) { el.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.35 });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Count-up numbers ---------- */
  (function counters() {
    var items = $$("[data-count]");
    if (reduce || !hasIO) return;
    function format(el, value) {
      var target = el.getAttribute("data-count");
      var decimals = (target.split(".")[1] || "").length;
      return (el.getAttribute("data-prefix") || "") + value.toFixed(decimals) + (el.getAttribute("data-suffix") || "");
    }
    function run(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var start = performance.now(), duration = 1400;
      (function step(now) {
        var p = clamp((now - start) / duration, 0, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = format(el, target * eased);
        if (p < 1) requestAnimationFrame(step);
      })(start);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var el = e.target;
        if (el.dataset.counted) return;
        if (e.isIntersecting) {
          el.dataset.counted = "1";
          io.unobserve(el);
          run(el);
        } else {
          el.textContent = format(el, 0);
        }
      });
    }, { threshold: 0.6 });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Scroll: progress bar and stacking cards ---------- */
  (function scrolling() {
    var bar = $(".progress span");
    var cards = $$(".stack .card");
    var wide = window.matchMedia("(min-width: 64.01rem) and (min-height: 700px)");
    var ticking = false;

    function update() {
      ticking = false;
      var max = root.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = "scaleX(" + (max > 0 ? clamp(window.scrollY / max, 0, 1) : 0) + ")";

      if (reduce || !wide.matches) {
        cards.forEach(function (c) { c.style.setProperty("--p", 0); });
        return;
      }
      for (var i = 0; i < cards.length - 1; i++) {
        var cur = cards[i].getBoundingClientRect();
        var next = cards[i + 1].getBoundingClientRect();
        var p = clamp(1 - (next.top - cur.top) / cur.height, 0, 1);
        cards[i].style.setProperty("--p", p.toFixed(3));
      }
    }
    function request() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    update();
  })();

  /* ---------- Pointer effects: card spotlight, magnetic buttons, photo tilt ---------- */
  if (finePointer) {
    $$(".card").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left) + "px");
        el.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }
  if (finePointer && !reduce) {
    $$(".magnetic").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        var dx = clamp((e.clientX - (r.left + r.width / 2)) * 0.22, -8, 8);
        var dy = clamp((e.clientY - (r.top + r.height / 2)) * 0.3, -6, 6);
        b.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
    $$(".tilt").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--ry", (x * 10).toFixed(2) + "deg");
        el.style.setProperty("--rx", (-y * 10).toFixed(2) + "deg");
      });
      el.addEventListener("pointerleave", function () {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ---------- Tabs: writing, Shorts, Reels ---------- */
  (function tabs() {
    var list = $("[role=tablist]");
    if (!list) return;
    var tabs = $$("[role=tab]", list);
    var ink = $(".tab-ink", list);
    function panelOf(t) { return doc.getElementById(t.getAttribute("aria-controls")); }
    function current() {
      return tabs.filter(function (t) { return t.getAttribute("aria-selected") === "true"; })[0] || tabs[0];
    }
    function moveInk(t) {
      if (!ink || !t) return;
      ink.style.width = t.offsetWidth + "px";
      ink.style.transform = "translateX(" + t.offsetLeft + "px)";
    }
    function select(t, focus) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute("aria-selected", on ? "true" : "false");
        x.tabIndex = on ? 0 : -1;
        var p = panelOf(x);
        if (p) p.hidden = !on;
      });
      moveInk(t);
      if (focus) t.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t); });
      t.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
        else if (e.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === "Home") n = tabs[0];
        else if (e.key === "End") n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
    select(current());
    window.addEventListener("resize", function () { moveInk(current()); });
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { moveInk(current()); });
  })();

  /* ---------- Testimonials: crossfade with a timer bar ---------- */
  (function quotes() {
    var box = $("[data-quotes]");
    if (!box) return;
    var items = $$(".quote", box);
    var wrapper = box.parentElement;
    var controls = $(".quote-controls", wrapper);
    var count = $(".quote-count", wrapper);
    var fill = $(".quote-bar span", wrapper);
    if (items.length < 2) { if (controls) controls.hidden = true; return; }

    var DURATION = 10000;
    var index = 0;
    var stopped = reduce;

    function runBar() {
      if (!fill) return;
      fill.style.animation = "none";
      void fill.offsetWidth;
      fill.style.animation = stopped ? "none" : "quote-timer " + DURATION + "ms linear forwards";
    }
    function show(i) {
      index = (i + items.length) % items.length;
      items.forEach(function (q, k) {
        q.classList.toggle("is-active", k === index);
        q.setAttribute("aria-hidden", k === index ? "false" : "true");
      });
      if (count) count.textContent = (index + 1) + " / " + items.length;
      runBar();
    }
    function pause(on) { if (fill) fill.style.animationPlayState = on ? "paused" : "running"; }

    if (fill) fill.addEventListener("animationend", function () { if (!stopped) show(index + 1); });
    $$("[data-quote]", wrapper).forEach(function (b) {
      b.addEventListener("click", function () {
        stopped = true;
        show(index + (b.getAttribute("data-quote") === "next" ? 1 : -1));
      });
    });
    wrapper.addEventListener("pointerenter", function () { pause(true); });
    wrapper.addEventListener("pointerleave", function () { pause(false); });
    wrapper.addEventListener("focusin", function () { pause(true); });
    wrapper.addEventListener("focusout", function () { pause(false); });
    show(0);
  })();

  /* ---------- Copy email ---------- */
  (function copyEmail() {
    var button = $("#copy-email");
    var email = $("#email");
    if (!button || !email) return;
    var label = button.textContent;
    var timer;
    function done(text) {
      button.textContent = text;
      clearTimeout(timer);
      timer = setTimeout(function () { button.textContent = label; }, 2000);
    }
    function selectEmail() {
      var range = doc.createRange();
      range.selectNodeContents(email);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    button.addEventListener("click", function () {
      var text = (email.dataset.text || email.textContent).trim();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () { done("Copied"); },
          function () { selectEmail(); done("Press Ctrl+C to copy"); }
        );
      } else {
        selectEmail();
        done("Press Ctrl+C to copy");
      }
    });
  })();
})();
