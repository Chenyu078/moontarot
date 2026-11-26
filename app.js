(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var state = { spread: SPREADS[1], deck: [], picks: [], result: null, question: "" };

  /* ---------- 口令 ---------- */
  var CODES = ["taro"];              // 口令（不区分大小写），可加多个
  var AUTH_KEY = "moonTarot.auth";

  function authed() {
    try { return localStorage.getItem(AUTH_KEY) === "1"; } catch (e) { return false; }
  }

  function openGate() {
    var g = $("gate");
    g.classList.remove("hide");
    var q = /[?&]k=([^&]+)/.exec(location.search);
    if (q && CODES.indexOf(decodeURIComponent(q[1]).trim().toLowerCase()) > -1) {
      pass(); return;
    }
    var pw = $("pw");
    function trySubmit() {
      var v = (pw.value || "").trim().toLowerCase();
      if (CODES.indexOf(v) > -1) { pass(); }
      else {
        $("gerr").classList.add("on");
        pw.value = "";
      }
    }
    $("enter").addEventListener("click", trySubmit);
    pw.addEventListener("keydown", function (e) { if (e.key === "Enter") trySubmit(); });
    pw.addEventListener("input", function () { $("gerr").classList.remove("on"); });
  }

  function pass() {
    try { localStorage.setItem(AUTH_KEY, "1"); } catch (e) { }
    $("gate").classList.add("hide");
  }

  if (/[?&]reset=1/.test(location.search)) {
    try { localStorage.removeItem(AUTH_KEY); } catch (e) { }
  }

  if (authed()) { $("gate").classList.add("hide"); }
  else { openGate(); }


  var POS = {
    one: ["此刻｜你站在哪里"],
    three: ["根源｜事情从哪里开始", "现在｜你的处境", "未来｜照这样走下去"],
    rel: ["你｜在这段关系里", "对方｜TA 的位置", "之间｜真实的状态"],
    choice: ["现状｜真正的局面", "选择 A｜会走向", "选择 B｜会走向", "A 的隐患｜要小心", "B 的隐患｜要小心"]
  };
  /* ---------- 星空背景 ---------- */
  (function stars() {
    var box = $("stars"), h = "";
    for (var i = 0; i < 60; i++) {
      var s = (Math.random() * 1.6 + 0.6).toFixed(1);
      h += '<i style="left:' + (Math.random() * 100).toFixed(2) + '%;top:' + (Math.random() * 100).toFixed(2) +
        '%;width:' + s + 'px;height:' + s + 'px;opacity:' + (Math.random() * 0.6 + 0.2).toFixed(2) + '"></i>';
    }
    box.innerHTML = h;
  })();

  /* ---------- 牌阵列表 ---------- */
  (function renderSpreads() {
    var box = $("spreads"), h = "";
    SPREADS.forEach(function (sp, i) {
      h += '<button class="spread' + (i === 1 ? ' sel' : '') + '" data-id="' + sp.id + '">' +
        '<span class="no">' + (sp.cnt) + '</span>' +
        '<span class="tx"><span class="nm">' + sp.name + '</span>' +
        '<span class="ds">' + sp.desc + '</span></span></button>';
    });
    box.innerHTML = h;
    box.addEventListener("click", function (e) {
      var b = e.target.closest(".spread"); if (!b) return;
      [].forEach.call(box.children, function (c) { c.classList.remove("sel"); });
      b.classList.add("sel");
      state.spread = SPREADS.filter(function (s) { return s.id === b.dataset.id; })[0];
    });
  })();

  function show(id) {
    [].forEach.call(document.querySelectorAll(".screen"), function (s) { s.classList.remove("on"); });
    $(id).classList.add("on");
    window.scrollTo(0, 0);
  }

  /* ---------- 洗牌 ---------- */
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  $("go").addEventListener("click", function () {
    state.question = ($("q").value || "").trim();
    state.picks = [];
    state.deck = shuffle(CARDS.slice()).slice(0, 26);
    state.deck.forEach(function (c) { c.rev = Math.random() < 0.42; });

    var shuf = $("shuffle");
    shuf.classList.remove("hide");
    setTimeout(function () {
      shuf.classList.add("hide");
      buildDraw();
    }, 1550);
  });

  function buildDraw() {
    var need = state.spread.cnt;
    $("drawTitle").textContent = state.spread.name;
    $("counter").textContent = "0 / " + need;
    $("drawHint").innerHTML = "闭上眼睛，在心里把那个问题问一遍。<br>然后凭直觉点选 <b>" + need + "</b> 张牌。";
    $("reveal").disabled = true;

    var deck = $("deck"), h = "";
    state.deck.forEach(function (c, i) {
      h += '<div class="pcard pre" data-i="' + i + '"><span class="num">' + (i + 1) + '</span></div>';
    });
    deck.innerHTML = h;
    deck.scrollLeft = 0;
    show("s-draw");

    var nodes = [].slice.call(deck.children);
    nodes.forEach(function (el, i) {
      setTimeout(function () { el.classList.remove("pre"); }, 30 + i * 26);
    });
  }

  $("deck").addEventListener("click", function (e) {
    var el = e.target.closest(".pcard"); if (!el) return;
    var i = +el.dataset.i;
    var need = state.spread.cnt;
    var at = state.picks.indexOf(i);

    if (at > -1) {
      state.picks.splice(at, 1);
      el.classList.remove("pick");
    } else {
      if (state.picks.length >= need) return;
      state.picks.push(i);
      el.classList.add("pick");
    }
    $("counter").textContent = state.picks.length + " / " + need;
    $("reveal").disabled = state.picks.length !== need;
  });

  /* ---------- 翻开 ---------- */
  $("reveal").addEventListener("click", function () {
    var cards = state.picks.map(function (i) { return state.deck[i]; });
    if (!cards.length) return;
    state.result = {
      spread: state.spread,
      cards: cards,
      question: state.question,
      time: new Date()
    };
    renderResult();
    saveHistory();
    show("s-result");
    playReveal();
  });

  $("back1").addEventListener("click", function () { show("s-home"); });
  $("again").addEventListener("click", function () { show("s-home"); });

  /* ---------- 解读生成 ---------- */
  var THEME = {
    major: "这件事牵动的是人生阶段性的东西，不是一时的得失",
    cups: "它主要还是情感和关系的事，情绪的比重比你以为的大",
    swords: "它更多发生在你的念头里，是想法和沟通把局面卡住了",
    pentacles: "它落在很现实的地方：钱、身体、时间，以及踏实不踏实",
    wands: "它跟你的行动力和热情有关，缺的是点火的那一下"
  };

  function dominant(cards) {
    var cnt = { major: 0, cups: 0, pentacles: 0, swords: 0, wands: 0 };
    cards.forEach(function (c) { cnt[c.s] = (cnt[c.s] || 0) + 1; });
    var best = "major";
    Object.keys(cnt).forEach(function (k) { if (cnt[k] > cnt[best]) best = k; });
    return { key: best, n: cnt[best] };
  }

  function buildSummary(r) {
    var cards = r.cards, d = dominant(cards);
    var revN = cards.filter(function (c) { return c.rev; }).length;
    var parts = [];

    parts.push(THEME[d.key] + "。");

    if (d.key === "major" && d.n >= 2) {
      parts.push("大阿尔卡纳出现 <span class='e'>" + d.n + "</span> 张，说明你正走在一个绕不开的关口上，逃不掉，但走过去就是真的过去了。");
    }
    if (revN === 0) {
      parts.push("牌面全部正立，能量是通的，你现在缺的只是往前走一步的许可。");
    } else if (revN === cards.length) {
      parts.push("全逆位不是坏牌，是“还没到时候”：阻力都在内部，先把卡住自己的那句话说出口。");
    } else {
      parts.push("有 <span class='e'>" + revN + "</span> 张逆位，说明这件事有一半是外在的，另一半在你心里还没想通。");
    }

    var core = cards[Math.floor(cards.length / 2)];
    parts.push("核心落在 <span class='e'>" + core.t + "</span> 上——" + (core.rev ? core.rt : core.ut));

    return parts.join("");
  }

  function imgSrc(c) {
    var n = c.id < 10 ? "0" + c.id : "" + c.id;
    return "img/" + n + ".jpg";
  }

  function renderResult() {
    var r = state.result, labels = POS[r.spread.id] || [];
    var h = "";

    if (r.question) {
      h += '<div class="rcard" style="padding:16px 18px"><div class="pos">你想问的</div>' +
        '<div style="font-size:15px;line-height:1.7;color:#e4ddf0">' + esc(r.question) + '</div></div>';
    }

    r.cards.forEach(function (c, i) {
      var lab = labels[i] || "";
      h += '<div class="rcard pre">';
      if (lab) h += '<div class="pos">' + lab + '</div>';
      h += '<div class="rmain">' +
        '<div class="flip' + (c.rev ? " rev" : "") + '"><div class="inner">' +
        '<div class="face back"></div><div class="face front"><img src="' + imgSrc(c) + '" alt="' + c.t + '"></div>' +
        '</div></div>' +
        '<div class="rinfo">' +
        '<div class="rname">' + c.t + '</div>' +
        '<div class="ren">' + c.e + '</div>' +
        '<span class="tag' + (c.rev ? " rev" : "") + '">' + (c.rev ? "逆位" : "正位") + '</span>' +
        '<div class="kw">' + (c.rev ? c.r : c.u) + '</div>' +
        '</div></div>' +
        '<div class="read">' + (c.rev ? c.rt : c.ut) + '</div>' +
        '</div>';
    });

    h += '<div class="waiting" id="wait"><i></i><i></i><i></i></div>';
    h += '<div class="summary pre" id="sum"><h3>整 体</h3><p>' + buildSummary(r) + '</p></div>';
    $("result").innerHTML = h;

    var d = r.time;
    $("resDate").textContent = (d.getMonth() + 1) + "月" + d.getDate() + "日 " +
      ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
  }

  function playReveal() {
    var cards = [].slice.call(document.querySelectorAll("#result .rcard"));
    var flips = [].slice.call(document.querySelectorAll("#result .flip"));

    cards.forEach(function (el, i) {
      setTimeout(function () { el.classList.remove("pre"); }, 60 + i * 220);
    });
    flips.forEach(function (f, i) {
      setTimeout(function () { f.classList.add("on"); }, 520 + i * 320);
    });

    var end = 520 + flips.length * 320;
    setTimeout(function () {
      var w = $("wait"), sm = $("sum");
      if (w) w.style.display = "none";
      if (sm) sm.classList.remove("pre");
    }, end + 260);
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---------- 分享 ---------- */
  $("share").addEventListener("click", function () {
    var r = state.result; if (!r) return;
    var t = "【月见塔罗 · " + r.spread.name + "】\n";
    if (r.question) t += "我的问题：" + r.question + "\n";
    r.cards.forEach(function (c, i) {
      var lab = (POS[r.spread.id] || [])[i];
      t += "\n" + (lab ? lab + "：" : "") + c.t + (c.rev ? "（逆位）" : "（正位）") + "\n" + (c.rev ? c.rt : c.ut);
    });
    var d = dominant(r.cards);
    t += "\n\n—— " + THEME[d.key] + "。\n月见塔罗 · 抽一张牌，看看此刻";

    var done = function () { $("share").textContent = "已复制 ✓"; setTimeout(function () { $("share").textContent = "复制解读文字"; }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(done, fallback);
    } else fallback();

    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { alert(t); }
      document.body.removeChild(ta);
    }
  });

  /* ---------- 历史 ---------- */
  var KEY = "moonTarot.v1";
  function saveHistory() {
    try {
      var arr = JSON.parse(localStorage.getItem(KEY) || "[]");
      arr.unshift({
        t: state.result.time.getTime(),
        s: state.result.spread.name,
        c: state.result.cards.map(function (x) { return x.t; }).join("、"),
        q: state.result.question
      });
      localStorage.setItem(KEY, JSON.stringify(arr.slice(0, 30)));
    } catch (e) { }
  }
})();
