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

  /* ---------- World map: India to the countries I've worked with ---------- */
  (function worldMap() {
    // 1-degree grid from 81N to 57S (Natural Earth 110m via world-atlas), run-length encoded:
    // A = sea, B = land, C = worked with, D = home (India), E = open to; each letter is followed by a lowercase base-36 run length.
    var WORLD = { cols: 360, rows: 138, latTop: 81, rle: "A2cB7A6BdA3B1fAzB2A1B3AmB4A15B7A4mBlA8B1bAuB8A2B4A1wB7A43B3A5B5A1B3A3B4A1BdA2B1hAwB7A29B5A3sB3A4B1AgB1A6BaA9B1eAxB4A4B1A28B2A3pB4A8B2A7B3A2B5A2BaA9B1dA2eB4AwBbA3nB7A1B3A5B3A2B2A1B6A1B5AmB13A25B6ArBoAnB8A2tB2AmB5A2B1ApB11A24B3ArBoA3iB8A9B2A4B4A1B5A2B3A2B2A1B3AmBzA23B3AoBwA1B5A4B4AdB3A2kB6A1B9A1B3A3B5A1B2A4B9A3B1AmBxA22B4AdB4A8B1cAaB7AyB1A1jB4A1BeA5B3A1B3A3BgA1B1AhBxA22B4AcB4A1B2A1B1hA3B1A2B2A1BdA1cCaA12BaA7B4A3BkAeBtA2B1A1bE7A10B6A1B2eA11CmB2A4BfA3BeA3B4A1B4A5B4A5BaAdB2A1BrA16EdB2ArB4A3B6A1B2mA2B8A2B2AbCqBrA6B3A7B1A3B6A2B5A6B7AgBoA18EcBaAeB2A3BaA2B5A1B31AcCnB1hA1B6A4B2A2B9AaBlA1bEgBbA3B2A2BpA2B32A1B3A6C1A2ClB1mA9BcA9BiAjE1AsEhB3A3B5A3BsA1B2zA1B7A4CrB1iA1B1AbB6A3B2AaBdAhE9AqEaA3E5B5A5B3wA6B1A8C1A3CkB1hA2B4A4B3A1B8AeBbAjE7AqEaA3E6B5A2B3xAaC2A9CkB1eA5B2A2B1A9B7AeBaA1eEbA2E8B45AgCoB1dA8B2A4B1A8B2AhB7A1dEcA3EaB42A1B1AfCpB1bAgB6AnB6A1cEcA4E9B3jA2B3A2B9AmChA2C5B1bAgB8AoB3A1cEdA4E6B3jA7B9ArC8A2C2AaC2B2C1B14AhB9A3B2A1xEdA7E2A1B3dA2B4A5B3A14C3AgC4B15AfBaA1B4A1mC2A9E3A2E6A7E3B36AiB3A14C2A1C3AiC1B14AgBfA1kC4AcE1A1E5A5E1A1E3B35AhB6A11C2AqB18AbBfA1kC3AbE3A1E4A5E7B32AiB7AyC2AtC2B18A8BiA1iC4AaE2A1E3A7E6B31AjB7AxC1AxB1dA2BnA1cE2C1A2C3AaC1A6E3A1B3E3B33AjB5A1uB1A3B1bA3BnA1bE3A3C3A7C7EaB39A1B1AdB4A20B1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" };
    var fig = $("[data-map]");
    var canvas = fig && $("canvas", fig);
    var ctx = canvas && canvas.getContext && canvas.getContext("2d");
    if (!ctx) return;

    var cells = new Uint8Array(WORLD.cols * WORLD.rows);
    var re = /([A-E])([0-9a-z]+)/g, m, at = 0;
    while ((m = re.exec(WORLD.rle))) {
      var len = parseInt(m[2], 36), v = m[1].charCodeAt(0) - 65;
      cells.fill(v, at, at + len);
      at += len;
    }

    var css = getComputedStyle(root);
    function token(name, fallback) { return css.getPropertyValue(name).trim() || fallback; }
    var C = {
      land: token("--line-2", "#363c49"),
      amber: token("--amber", "#f5b342"),
      green: token("--green", "#4ade9c"),
      bg: token("--bg", "#0e1015")
    };
    // Drawing order and colour for each cell state.
    var RANK = [0, 1, 3, 4, 2];
    var STYLE = [null, { c: C.land, a: 1, s: 1 }, { c: C.green, a: 1, s: 1.25 }, { c: C.amber, a: 1, s: 1.25 }, { c: C.green, a: 0.38, s: 1.1 }];

    var pins = $$(".map-pin", fig).map(function (el) {
      return {
        el: el, lat: +el.getAttribute("data-lat"), lon: +el.getAttribute("data-lon"),
        home: el.classList.contains("is-home"), open: el.classList.contains("is-open")
      };
    });
    var home = pins.filter(function (p) { return p.home; })[0];
    var targets = pins.filter(function (p) { return !p.home && !p.open; });
    if (!home) return;

    var spanLat = WORLD.rows;
    pins.forEach(function (p) {
      p.el.style.left = ((p.lon + 180) / 360 * 100).toFixed(3) + "%";
      p.el.style.top = ((WORLD.latTop - p.lat) / spanLat * 100).toFixed(3) + "%";
    });

    var W = 0, H = 0, dots = null, active = -1;
    function project(lat, lon) { return { x: (lon + 180) / 360 * W, y: (WORLD.latTop - lat) / spanLat * H }; }

    function arcPoint(a, c, t, lift) {
      var dist = Math.hypot(c.x - a.x, c.y - a.y);
      var cx = (a.x + c.x) / 2, cy = (a.y + c.y) / 2 - dist * lift;
      var u = 1 - t;
      return { x: u * u * a.x + 2 * u * t * cx + t * t * c.x, y: u * u * a.y + 2 * u * t * cy + t * t * c.y };
    }

    function drawDots(dpr) {
      dots = document.createElement("canvas");
      dots.width = canvas.width; dots.height = canvas.height;
      var d = dots.getContext("2d");
      d.setTransform(dpr, 0, 0, dpr, 0, 0);
      // On narrow screens, merge 2x2 cells so the dots stay legible.
      var block = W / WORLD.cols < 2.4 ? 2 : 1;
      var cw = W / WORLD.cols * block, ch = H / WORLD.rows * block;
      var base = Math.max(0.55, Math.min(cw, ch) * 0.3);
      for (var r = 0; r < WORLD.rows; r += block) {
        for (var c = 0; c < WORLD.cols; c += block) {
          var best = 0;
          for (var dr = 0; dr < block; dr++) for (var dc = 0; dc < block; dc++) {
            var rr = r + dr, cc = c + dc;
            if (rr >= WORLD.rows || cc >= WORLD.cols) continue;
            var v = cells[rr * WORLD.cols + cc];
            if (RANK[v] > RANK[best]) best = v;
          }
          if (!best) continue;
          var st = STYLE[best];
          d.globalAlpha = st.a;
          d.fillStyle = st.c;
          d.beginPath();
          d.arc((c / block + 0.5) * cw, (r / block + 0.5) * ch, base * st.s, 0, Math.PI * 2);
          d.fill();
        }
      }
      d.globalAlpha = 1;
    }

    function resize() {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      if (!W || !H) return;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawDots(dpr);
      draw(performance.now());
    }

    var revealAt = null;
    var DRAW_MS = 1200, STAGGER = 260, PULSE_MS = 2800;

    function draw(now) {
      if (!dots) return;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(dots, 0, 0, W, H);
      var a = project(home.lat, home.lon);
      var small = W < 600;
      var lift = small ? 0.2 : 0.28;
      var lw = small ? 1.1 : 1.6;

      targets.forEach(function (p, i) {
        var c = project(p.lat, p.lon);
        var elapsed = revealAt === null ? 0 : now - revealAt - i * STAGGER;
        var prog = Math.max(0, Math.min(1, elapsed / DRAW_MS));
        prog = 1 - Math.pow(1 - prog, 3);
        var focus = active === i + 1, dim = active > 0 && !focus;
        if (prog > 0) {
          var grad = ctx.createLinearGradient(a.x, a.y, c.x, c.y);
          grad.addColorStop(0, C.amber);
          grad.addColorStop(1, C.green);
          ctx.beginPath();
          var steps = 56;
          for (var s = 0; s <= steps * prog; s++) {
            var pt = arcPoint(a, c, s / steps, lift);
            if (s === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
          }
          ctx.strokeStyle = grad;
          ctx.globalAlpha = dim ? 0.15 : (focus ? 1 : 0.7);
          ctx.lineWidth = focus ? lw + 0.9 : lw;
          ctx.lineCap = "round";
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        if (prog >= 1 && !reduce && !dim) {
          var t = ((now - revealAt - i * 470) % PULSE_MS) / PULSE_MS;
          var q = arcPoint(a, c, t, lift);
          ctx.beginPath();
          ctx.arc(q.x, q.y, lw + 1.1, 0, Math.PI * 2);
          ctx.fillStyle = C.green;
          ctx.globalAlpha = Math.sin(t * Math.PI);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        if (prog >= 1) {
          ctx.beginPath();
          ctx.arc(c.x, c.y, lw + 2.4, 0, Math.PI * 2);
          ctx.fillStyle = C.bg;
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = C.green;
          ctx.globalAlpha = dim ? 0.35 : 1;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(c.x, c.y, lw * 0.9, 0, Math.PI * 2);
          ctx.fillStyle = C.green;
          ctx.fill();
          ctx.globalAlpha = 1;
          p.el.classList.add("is-shown");
        }
      });

      var ring = reduce ? 0 : (now % 2400) / 2400;
      if (ring) {
        ctx.beginPath();
        ctx.arc(a.x, a.y, 4 + ring * (small ? 8 : 14), 0, Math.PI * 2);
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

    function reveal(at) {
      revealAt = at;
      pins.forEach(function (p) { if (p.home || p.open) p.el.classList.add("is-shown"); });
    }
    if (reduce || !hasIO) reveal(-1e9);
    if (hasIO) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && revealAt === null) reveal(performance.now() + 200);
        start();
        if (reduce) draw(performance.now());
      }, { threshold: [0, 0.3] }).observe(fig);
    }
    doc.addEventListener("visibilitychange", start);

    function setActive(i) { active = i; if (!running) draw(performance.now()); }
    $$(".region[data-region]").forEach(function (li) {
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
