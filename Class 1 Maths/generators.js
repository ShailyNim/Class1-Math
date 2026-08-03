/* generators.js — every question in the app is built here, fresh, each time.
   One generator per skill. Tier controls the number range AND the way the
   question is asked, so tier 1 is "point at the picture" and tier 4-5 is
   "write the missing number in the sentence". */

(function (global) {
  'use strict';

  // ---------- tiny helpers ----------
  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function range(a, b) { var o = []; for (var i = a; i <= b; i++) o.push(i); return o; }

  var THINGS = ['🍎', '🍌', '🍓', '🥕', '🐟', '⭐', '🌸', '🐞', '🦋', '🚗', '⚽', '🌼', '🐢', '🍇', '🐝', '🎈'];
  var CREATURES = ['🐟', '🐞', '🦋', '🐝', '🐢', '🐤', '🐛', '🐧'];
  var WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  var TENS = { 20: 'twenty', 30: 'thirty', 40: 'forty', 50: 'fifty', 60: 'sixty', 70: 'seventy', 80: 'eighty', 90: 'ninety' };
  function words(n) {
    if (n <= 20) return WORDS[n];
    var t = Math.floor(n / 10) * 10, o = n % 10;
    return o === 0 ? TENS[t] : TENS[t] + '-' + WORDS[o];
  }
  function ord(n) {
    if (n % 100 >= 11 && n % 100 <= 13) return n + 'th';
    return n + ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
  }
  var NAMES = ['Ira', 'Vivaan', 'Meera', 'Kabir', 'Anya', 'Rohan', 'Diya', 'Arjun', 'Sara', 'Nikhil'];

  // ---------- item constructors ----------
  function opt(v, tag, html) { return { value: String(v), tag: tag || null, html: html || null }; }

  function choice(prompt, figure, options, answer) {
    return { prompt: prompt, figure: figure || null, widget: 'choice' + options.length,
      options: shuffle(options), answer: String(answer) };
  }
  function number(prompt, figure, answer) {
    return { prompt: prompt, figure: figure || null, widget: 'number', answer: String(answer) };
  }

  /* Numeric multiple choice with meaningful wrong answers. `cands` is a list of
     [value, tag] pairs tried in order; anything else is filled with near misses. */
  function numChoice(prompt, figure, answer, cands, n, min, max) {
    min = min == null ? 0 : min; max = max == null ? 999 : max;
    var used = { }, out = [opt(answer)];
    used[answer] = 1;
    (cands || []).forEach(function (c) {
      var v = c[0];
      if (out.length < n && v >= min && v <= max && !used[v] && v === Math.round(v)) { used[v] = 1; out.push(opt(v, c[1])); }
    });
    var guard = 0;
    while (out.length < n && guard++ < 200) {
      var d = answer + ri(-3, 3);
      if (d >= min && d <= max && !used[d]) { used[d] = 1; out.push(opt(d, 'off_by_one')); }
    }
    return choice(prompt, figure, out, answer);
  }

  function rupeeChoice(prompt, figure, answer, cands, n) {
    var it = numChoice(prompt, figure, answer, cands, n, 0);
    it.options = it.options.map(function (o) { return { value: o.value, tag: o.tag, html: '₹' + o.value }; });
    return it;
  }

  // ---------- picture helpers (plain HTML + emoji, nothing to download) ----------
  function things(n, emoji, perRow) {
    perRow = perRow || 5;
    var s = '<div class="things">', i;
    for (i = 0; i < n; i++) {
      s += '<span>' + emoji + '</span>';
      if ((i + 1) % perRow === 0 && i !== n - 1) s += '<br>';
    }
    return s + '</div>';
  }
  function twoGroups(a, b, ea, eb, sign) {
    return '<div class="groups"><div class="grp">' + things(a, ea) + '</div>' +
      '<div class="sign">' + (sign || '+') + '</div>' +
      '<div class="grp">' + things(b, eb) + '</div></div>';
  }
  function crossedGroup(n, k, emoji) {
    var s = '<div class="things">', i;
    for (i = 0; i < n; i++) s += '<span class="' + (i >= n - k ? 'gone' : '') + '">' + emoji + '</span>' + ((i + 1) % 5 === 0 && i !== n - 1 ? '<br>' : '');
    return s + '</div>';
  }

  // ---------- SVG helpers ----------
  var C_SAGE = '#A9C4A0', C_SKY = '#A8C0D6', C_APR = '#F3C39A', C_LINE = '#C9BCA9', C_INK = '#4A4038', C_PAPER = '#FFFDF8';

  function svg(w, h, inner) {
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + Math.min(w, 640) + '" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>';
  }

  function tenFrame(n, x, y, cell) {
    cell = cell || 34; x = x || 0; y = y || 0;
    var s = '', i, c, r;
    for (i = 0; i < 10; i++) {
      c = i % 5; r = Math.floor(i / 5);
      s += '<rect x="' + (x + c * cell) + '" y="' + (y + r * cell) + '" width="' + cell + '" height="' + cell +
        '" fill="' + C_PAPER + '" stroke="' + C_LINE + '" stroke-width="1.5"/>';
      if (i < n) s += '<circle cx="' + (x + c * cell + cell / 2) + '" cy="' + (y + r * cell + cell / 2) + '" r="' + (cell * 0.32) + '" fill="' + C_SAGE + '"/>';
    }
    return s;
  }
  function tenFrames(n) {
    var full = Math.floor(n / 10), rest = n % 10, frames = full + (rest ? 1 : 0), i, s = '';
    var perRow = Math.min(frames, 2), rows = Math.ceil(frames / 2);
    for (i = 0; i < frames; i++) {
      var cx = (i % 2) * 200, cy = Math.floor(i / 2) * 90;
      s += tenFrame(i < full ? 10 : rest, cx, cy, 34);
    }
    return svg(perRow * 200, rows * 90, s);
  }

  function pvBlocks(tens, ones) {
    var s = '', i, j, x = 0;
    for (i = 0; i < tens; i++) {
      for (j = 0; j < 10; j++) s += '<rect x="' + (i * 30) + '" y="' + (j * 13) + '" width="22" height="11" fill="' + C_SKY + '" stroke="' + C_LINE + '"/>';
    }
    x = tens * 30 + 16;
    for (i = 0; i < ones; i++) s += '<rect x="' + (x + (i % 5) * 16) + '" y="' + (Math.floor(i / 5) * 16) + '" width="13" height="13" fill="' + C_APR + '" stroke="' + C_LINE + '"/>';
    return svg(Math.max(tens * 30 + 100, 200), 140, s);
  }

  function numberLine(min, max, marks, hop) {
    var W = 620, pad = 30, step = (W - pad * 2) / (max - min), s = '', i;
    s += '<line x1="' + pad + '" y1="70" x2="' + (W - pad) + '" y2="70" stroke="' + C_LINE + '" stroke-width="3"/>';
    var every = (max - min) > 20 ? 5 : 1;
    for (i = min; i <= max; i++) {
      var x = pad + (i - min) * step, big = (i % every === 0);
      s += '<line x1="' + x + '" y1="' + (big ? 60 : 65) + '" x2="' + x + '" y2="80" stroke="' + C_LINE + '" stroke-width="2"/>';
      if (big) s += '<text x="' + x + '" y="100" font-size="14" text-anchor="middle" fill="' + C_INK + '">' + i + '</text>';
    }
    (marks || []).forEach(function (m) {
      var x = pad + (m - min) * step;
      s += '<circle cx="' + x + '" cy="70" r="9" fill="' + C_APR + '" stroke="#D9945C" stroke-width="2"/>';
    });
    if (hop) {
      var a = pad + (hop[0] - min) * step, b = pad + (hop[1] - min) * step;
      var dir = b > a ? 1 : -1, n = Math.abs(hop[1] - hop[0]), k;
      for (k = 0; k < n; k++) {
        var x1 = a + dir * k * step, x2 = a + dir * (k + 1) * step, mid = (x1 + x2) / 2;
        s += '<path d="M' + x1 + ' 66 Q' + mid + ' 30 ' + x2 + ' 66" fill="none" stroke="' + C_SAGE + '" stroke-width="3"/>';
      }
      s += '<circle cx="' + a + '" cy="70" r="7" fill="' + C_SAGE + '"/>';
    }
    return svg(W, 112, s);
  }

  var SHAPES = {
    circle:    '<circle cx="60" cy="60" r="46" />',
    square:    '<rect x="16" y="16" width="88" height="88" rx="4"/>',
    rectangle: '<rect x="6" y="30" width="108" height="60" rx="4"/>',
    triangle:  '<polygon points="60,14 110,104 10,104"/>',
    pentagon:  '<polygon points="60,12 110,50 91,108 29,108 10,50"/>',
    hexagon:   '<polygon points="60,10 105,35 105,85 60,110 15,85 15,35"/>',
    oval:      '<ellipse cx="60" cy="60" rx="52" ry="34"/>',
    rhombus:   '<polygon points="60,10 110,60 60,110 10,60"/>',
    trapezium: '<polygon points="30,25 90,25 112,95 8,95"/>',
    star:      '<polygon points="60,8 73,45 112,45 80,68 92,106 60,82 28,106 40,68 8,45 47,45"/>'
  };
  var SHAPE_SIDES = { circle: [0, 0], square: [4, 4], rectangle: [4, 4], triangle: [3, 3], pentagon: [5, 5], hexagon: [6, 6], oval: [0, 0], rhombus: [4, 4], trapezium: [4, 4], star: [10, 10] };
  var SHAPE_NAMES = ['circle', 'square', 'rectangle', 'triangle', 'pentagon', 'hexagon', 'oval', 'rhombus', 'trapezium'];

  function shape2d(name, fill, size) {
    size = size || 120;
    return svg(120, 120, '<g fill="' + (fill || C_SAGE) + '" stroke="#8A7F73" stroke-width="2">' + SHAPES[name] + '</g>');
  }

  var SOLIDS = {
    cube: '<g fill="#A8C0D6" stroke="#6E8FAA" stroke-width="2"><polygon points="20,45 65,20 110,45 110,95 65,120 20,95"/><polyline points="20,45 65,70 110,45" fill="none"/><line x1="65" y1="70" x2="65" y2="120"/></g>',
    cuboid: '<g fill="#A9C4A0" stroke="#6F9268" stroke-width="2"><polygon points="10,55 45,30 115,30 115,90 80,115 10,115"/><polyline points="10,55 80,55 115,30" fill="none"/><line x1="80" y1="55" x2="80" y2="115"/></g>',
    sphere: '<g fill="#F3C39A" stroke="#D9945C" stroke-width="2"><circle cx="60" cy="65" r="45"/><ellipse cx="60" cy="65" rx="45" ry="14" fill="none"/></g>',
    cylinder: '<g fill="#E9B3AA" stroke="#C07D72" stroke-width="2"><path d="M22 35 h76 v60 a38 14 0 0 1 -76 0 z"/><ellipse cx="60" cy="35" rx="38" ry="14"/></g>',
    cone: '<g fill="#F3C39A" stroke="#D9945C" stroke-width="2"><path d="M60 12 L102 95 a42 14 0 0 1 -84 0 z"/><ellipse cx="60" cy="95" rx="42" ry="14" fill="none"/></g>',
    pyramid: '<g fill="#A9C4A0" stroke="#6F9268" stroke-width="2"><polygon points="60,12 112,100 8,100"/><polyline points="8,100 60,78 112,100" fill="none"/><line x1="60" y1="12" x2="60" y2="78"/></g>'
  };
  var SOLID_NAMES = ['cube', 'cuboid', 'sphere', 'cylinder', 'cone', 'pyramid'];
  var SOLID_FACTS = { // [vertices, edges, faces]
    cube: [8, 12, 6], cuboid: [8, 12, 6], sphere: [0, 0, 1], cylinder: [0, 2, 3], cone: [1, 1, 2], pyramid: [5, 8, 5]
  };
  var SOLID_TRACE = { cube: 'square', cuboid: 'rectangle', cylinder: 'circle', cone: 'circle', pyramid: 'square' };
  function solid(name) { return svg(120, 130, SOLIDS[name]); }

  function clock(h, m) {
    var s = '<circle cx="110" cy="110" r="96" fill="' + C_PAPER + '" stroke="' + C_LINE + '" stroke-width="4"/>', i;
    for (i = 1; i <= 12; i++) {
      var a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      s += '<text x="' + (110 + Math.cos(a) * 76) + '" y="' + (110 + Math.sin(a) * 76 + 6) + '" font-size="18" text-anchor="middle" fill="' + C_INK + '">' + i + '</text>';
    }
    var ma = (m / 60) * Math.PI * 2 - Math.PI / 2;
    var ha = ((h % 12) / 12 + m / 720) * Math.PI * 2 - Math.PI / 2;
    s += '<line x1="110" y1="110" x2="' + (110 + Math.cos(ha) * 46) + '" y2="' + (110 + Math.sin(ha) * 46) + '" stroke="#6F9268" stroke-width="9" stroke-linecap="round"/>';
    s += '<line x1="110" y1="110" x2="' + (110 + Math.cos(ma) * 70) + '" y2="' + (110 + Math.sin(ma) * 70) + '" stroke="#D9945C" stroke-width="5" stroke-linecap="round"/>';
    s += '<circle cx="110" cy="110" r="6" fill="' + C_INK + '"/>';
    return svg(220, 220, s);
  }
  function timeText(h, m) { return h + ':' + (m === 0 ? '00' : '30'); }

  // Indian coins and notes
  var COINS = [1, 2, 5, 10];
  var NOTES = [10, 20, 50, 100];
  function coin(v, x, y) {
    return '<g><circle cx="' + (x + 26) + '" cy="' + (y + 26) + '" r="24" fill="#E4DDCB" stroke="#B9AC94" stroke-width="2"/>' +
      '<text x="' + (x + 26) + '" y="' + (y + 33) + '" font-size="19" text-anchor="middle" fill="#4A4038">₹' + v + '</text></g>';
  }
  function note(v, x, y) {
    return '<g><rect x="' + x + '" y="' + y + '" width="92" height="48" rx="5" fill="#DCE7DA" stroke="#8FA98C" stroke-width="2"/>' +
      '<text x="' + (x + 46) + '" y="' + (y + 31) + '" font-size="20" text-anchor="middle" fill="#3E4A3B">₹' + v + '</text></g>';
  }
  function moneyPile(coins, notes) {
    var s = '', x = 0, y = 0, i;
    (notes || []).forEach(function (v) { s += note(v, x, y); x += 100; if (x > 400) { x = 0; y += 58; } });
    if (x > 0 && (notes || []).length) { x = 0; y += 58; }
    (coins || []).forEach(function (v) { s += coin(v, x, y); x += 58; if (x > 460) { x = 0; y += 58; } });
    return svg(520, y + 62, s);
  }

  function tallyMarks(n) {
    var s = '', g, x = 0;
    for (g = 0; g < Math.ceil(n / 5); g++) {
      var inGroup = Math.min(5, n - g * 5), i;
      for (i = 0; i < Math.min(inGroup, 4); i++) s += '<line x1="' + (x + i * 11) + '" y1="4" x2="' + (x + i * 11) + '" y2="38" stroke="' + C_INK + '" stroke-width="3"/>';
      if (inGroup === 5) s += '<line x1="' + (x - 4) + '" y1="36" x2="' + (x + 38) + '" y2="6" stroke="' + C_INK + '" stroke-width="3"/>';
      x += 66;
    }
    return s;
  }
  function tallyChart(rows) {
    var s = '', y = 0;
    rows.forEach(function (r) {
      s += '<text x="0" y="' + (y + 28) + '" font-size="18" fill="' + C_INK + '">' + r[0] + '</text>';
      s += '<g transform="translate(130,' + y + ')">' + tallyMarks(r[1]) + '</g>';
      y += 48;
    });
    return svg(520, y, s);
  }
  function pictograph(rows, emoji) {
    var s = '<div class="picgraph">';
    rows.forEach(function (r) {
      s += '<div class="pgrow"><b>' + r[0] + '</b><span>' + new Array(r[1] + 1).join(emoji) + '</span></div>';
    });
    return s + '</div><div class="pgkey">1 ' + emoji + ' = 1</div>';
  }
  function table(head, rows) {
    var s = '<table class="dtable"><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr>';
    rows.forEach(function (r) { s += '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; });
    return s + '</table>';
  }

  function hundredChart(hi) {
    var s = '<table class="hchart">', r, c, n;
    for (r = 0; r < 10; r++) {
      s += '<tr>';
      for (c = 1; c <= 10; c++) { n = r * 10 + c; s += '<td class="' + (n === hi ? 'hi' : '') + '">' + (n === hi ? '?' : n) + '</td>'; }
      s += '</tr>';
    }
    return s + '</table>';
  }

  function strip(items) {
    return '<div class="strip">' + items.map(function (i) { return '<span>' + i + '</span>'; }).join('') + '</div>';
  }
  function grid3(cells) {
    return '<div class="g3">' + cells.map(function (c) { return '<span>' + (c || '') + '</span>'; }).join('') + '</div>';
  }
  function venn(labelA, labelB, aItems, bItems, bothItems) {
    return '<div class="venn"><div class="vcircle a"><b>' + labelA + '</b>' + aItems.join('') + '</div>' +
      '<div class="vmid">' + bothItems.join('') + '</div>' +
      '<div class="vcircle b"><b>' + labelB + '</b>' + bItems.join('') + '</div></div>';
  }
  function cubesRuler(n, emoji) {
    return '<div class="ruler"><div class="obj">' + (emoji || '✏️') + '</div><div class="cubes">' + new Array(n + 1).join('<i></i>') + '</div></div>';
  }

  // ================================================================
  //  G — one entry per skill slug
  // ================================================================
  var G = {};

  // ---------- helper factories ----------
  function addFactGen(k) {           // "add 3" family
    return function (t) {
      var maxA = t === 1 ? 6 : (t === 2 ? 10 : 12);
      var a = ri(1, maxA), ans = a + k;
      var p = a + ' + ' + k + ' = ?';
      if (t >= 3) return number(p, null, ans);
      return numChoice(p, t === 1 ? twoGroups(a, k, pick(THINGS), pick(THINGS)) : null, ans,
        [[a, 'counted_addend_only'], [ans + 1, 'off_by_one'], [ans - 1, 'off_by_one'], [a - k, 'used_wrong_operation']],
        t === 1 ? 3 : 4, 0);
    };
  }
  function subFactGen(k) {
    return function (t) {
      var maxA = t === 1 ? 10 : (t === 2 ? 14 : 20);
      var a = ri(k, maxA), ans = a - k;
      var p = a + ' − ' + k + ' = ?';
      if (t >= 3) return number(p, null, ans);
      return numChoice(p, t === 1 ? crossedGroup(a, k, pick(THINGS)) : null, ans,
        [[a, 'took_nothing_away'], [ans + 1, 'off_by_one'], [ans - 1, 'off_by_one'], [a + k, 'used_wrong_operation']],
        t === 1 ? 3 : 4, 0);
    };
  }
  function addFactsGen(max) {        // "addition facts to N"
    return function (t) {
      var s = ri(Math.min(4, max), max), a = ri(0, s), b = s - a;
      if (t <= 2) return numChoice(a + ' + ' + b + ' = ?', t === 1 ? twoGroups(a, b, pick(THINGS), pick(THINGS)) : null, s,
        [[s + 1, 'off_by_one'], [s - 1, 'off_by_one'], [Math.abs(a - b), 'used_wrong_operation'], [a, 'counted_addend_only']], t === 1 ? 3 : 4, 0);
      if (t === 3) return number(a + ' + ' + b + ' = ?', null, s);
      if (t === 4) return number(a + ' + ☐ = ' + s + '\nWhat goes in the box?', null, b);
      return number('☐ + ' + b + ' = ' + s + '\nWhat goes in the box?', null, a);
    };
  }
  function subFactsGen(max) {
    return function (t) {
      var a = ri(Math.min(4, max), max), b = ri(0, a), ans = a - b;
      if (t <= 2) return numChoice(a + ' − ' + b + ' = ?', t === 1 ? crossedGroup(a, b, pick(THINGS)) : null, ans,
        [[ans + 1, 'off_by_one'], [ans - 1, 'off_by_one'], [a + b, 'used_wrong_operation'], [b, 'counted_addend_only']], t === 1 ? 3 : 4, 0);
      if (t === 3) return number(a + ' − ' + b + ' = ?', null, ans);
      if (t === 4) return number(a + ' − ☐ = ' + ans + '\nWhat goes in the box?', null, b);
      return number('☐ − ' + b + ' = ' + ans + '\nWhat goes in the box?', null, a);
    };
  }
  function wordProblemAdd(max) {
    return function (t) {
      var s = ri(4, max), a = ri(1, s - 1), b = s - a;
      var n = pick(NAMES), thing = pick(['stickers', 'marbles', 'mangoes', 'pencils', 'shells', 'laddoos', 'balloons']);
      var story = n + ' has ' + a + ' ' + thing + '. ' + pick(['A friend gives', 'She finds', 'He finds', 'Amma gives']).replace('She', ri(0, 1) ? 'She' : 'He') +
        ' ' + b + ' more. How many ' + thing + ' now?';
      if (t <= 2) return numChoice(story, null, s, [[a, 'counted_addend_only'], [Math.abs(a - b), 'used_wrong_operation'], [s + 1, 'off_by_one'], [s - 1, 'off_by_one']], t === 1 ? 3 : 4, 0);
      return number(story, null, s);
    };
  }
  function wordProblemSub(max) {
    return function (t) {
      var a = ri(4, max), b = ri(1, a - 1), ans = a - b;
      var n = pick(NAMES), thing = pick(['grapes', 'crayons', 'biscuits', 'toy cars', 'flowers', 'sweets']);
      var story = n + ' has ' + a + ' ' + thing + '. ' + b + ' ' + pick(['are given away', 'are eaten', 'are lost', 'go to a friend']) + '. How many are left?';
      if (t <= 2) return numChoice(story, null, ans, [[a + b, 'used_wrong_operation'], [a, 'took_nothing_away'], [ans + 1, 'off_by_one'], [ans - 1, 'off_by_one']], t === 1 ? 3 : 4, 0);
      return number(story, null, ans);
    };
  }
  function sentenceForWord(max, op) {
    return function (t) {
      var a, b, ans, story, n = pick(NAMES), thing = pick(['kites', 'buttons', 'stones', 'leaves', 'coins']);
      if (op === '+') { ans = ri(4, max); a = ri(1, ans - 1); b = ans - a; story = n + ' has ' + a + ' ' + thing + ' and gets ' + b + ' more.'; }
      else { a = ri(4, max); b = ri(1, a - 1); ans = a - b; story = n + ' has ' + a + ' ' + thing + ' and gives away ' + b + '.'; }
      var right = op === '+' ? (a + ' + ' + b + ' = ' + ans) : (a + ' − ' + b + ' = ' + ans);
      var big = Math.max(a, b), small = Math.min(a, b);
      var wrongs = op === '+'
        ? [[big + ' − ' + small + ' = ' + (big - small), 'used_wrong_operation'], [a + ' + ' + b + ' = ' + (ans + 1), 'off_by_one'], [b + ' + ' + ans + ' = ' + (b + ans), 'wrong_numbers']]
        : [[a + ' + ' + b + ' = ' + (a + b), 'used_wrong_operation'], [a + ' − ' + b + ' = ' + (ans - 1), 'off_by_one'], [Math.max(b, ans) + ' − ' + Math.min(b, ans) + ' = ' + Math.abs(b - ans), 'wrong_numbers']];
      var os = [opt(right)];
      shuffle(wrongs).slice(0, t <= 2 ? 2 : 3).forEach(function (w) { os.push(opt(w[0], w[1])); });
      return choice('Which sentence goes with the story?\n' + story, null, os, right);
    };
  }
  function trueFalseGen(op) {
    return function (t) {
      var max = t <= 2 ? 10 : 20;
      var a = ri(1, max), b = ri(1, op === '+' ? max - a : a);
      var real = op === '+' ? a + b : a - b;
      var shown = Math.random() < 0.5 ? real : real + pick([-2, -1, 1, 2]);
      var text = a + ' ' + (op === '+' ? '+' : '−') + ' ' + b + ' = ' + shown;
      return choice('Is this right?\n' + text, null,
        [opt('yes'), opt('no', 'accepted_wrong_sentence')], shown === real ? 'yes' : 'no');
    };
  }
  function multipleOfTenAdd(t) {
    var a = ri(1, 7) * 10, b = ri(1, 9 - a / 10) * 10, ans = a + b;
    if (t <= 2) return numChoice(a + ' + ' + b + ' = ?', null, ans,
      [[ans / 10, 'place_value_confusion'], [a + b / 10, 'place_value_confusion'], [ans + 10, 'off_by_one'], [ans - 10, 'off_by_one']], t === 1 ? 3 : 4, 0);
    return number(a + ' + ' + b + ' = ?', null, ans);
  }

  // ================= Section A — counting and number patterns =================
  G['count-to-10'] = function (t) {
    var n = ri(t === 1 ? 1 : 4, 10), e = pick(THINGS);
    if (t >= 3) return number('How many?', things(n, e), n);
    return numChoice('How many?', things(n, e), n, [[n + 1, 'off_by_one'], [n - 1, 'off_by_one'], [n + 2, 'miscounted']], t === 1 ? 3 : 4, 1, 12);
  };
  G['fill-a-ten-frame'] = function (t) {
    var n = ri(1, 9);
    if (t === 1) return numChoice('How many counters?', tenFrames(n), n, [[n + 1, 'off_by_one'], [10 - n, 'counted_empty_boxes'], [n - 1, 'off_by_one']], 3, 0, 10);
    if (t === 2) return numChoice('How many empty boxes?', tenFrames(n), 10 - n, [[n, 'counted_full_boxes'], [10 - n + 1, 'off_by_one'], [10 - n - 1, 'off_by_one']], 4, 0, 10);
    return number('How many more counters to fill the frame?', tenFrames(n), 10 - n);
  };
  G['count-to-20'] = function (t) {
    var n = ri(11, 20), e = pick(THINGS);
    if (t >= 3) return number('How many?', things(n, e), n);
    return numChoice('How many?', things(n, e), n, [[n + 1, 'off_by_one'], [n - 1, 'off_by_one'], [n - 10, 'place_value_confusion']], t === 1 ? 3 : 4, 1, 25);
  };
  G['count-tens-ones-to-30'] = function (t) {
    var tens = ri(1, 2), ones = ri(0, 9), n = tens * 10 + ones;
    if (t >= 3) return number('How many altogether?', tenFrames(n), n);
    return numChoice('How many altogether?', tenFrames(n), n, [[tens + ones, 'place_value_confusion'], [n + 1, 'off_by_one'], [ones * 10 + tens, 'reversed_digits']], t === 1 ? 3 : 4, 0, 40);
  };
  G['count-ten-frames-to-40'] = function (t) {
    var n = ri(20, 40);
    if (t >= 4) return number('How many altogether?', tenFrames(n), n);
    return numChoice('How many altogether?', tenFrames(n), n, [[n + 1, 'off_by_one'], [n - 10, 'miscounted_frames'], [n + 10, 'miscounted_frames']], t === 1 ? 3 : 4, 0, 60);
  };
  G['count-to-100'] = function (t) {
    var tens = ri(3, 9), ones = ri(0, 9), n = tens * 10 + ones;
    if (t >= 3) return number('How many altogether?', pvBlocks(tens, ones), n);
    return numChoice('How many altogether?', pvBlocks(tens, ones), n, [[tens + ones, 'place_value_confusion'], [ones * 10 + tens, 'reversed_digits'], [n + 1, 'off_by_one']], t === 1 ? 3 : 4, 0, 100);
  };
  G['count-tens-ones-to-99'] = function (t) {
    var tens = ri(2, 9), ones = ri(0, 9), n = tens * 10 + ones;
    if (t <= 2) return numChoice(tens + ' tens and ' + ones + ' ones make what number?', null, n,
      [[tens + ones, 'place_value_confusion'], [ones * 10 + tens, 'reversed_digits'], [n + 10, 'off_by_ten']], t === 1 ? 3 : 4, 0, 99);
    if (t === 3) return number(tens + ' tens and ' + ones + ' ones = ?', null, n);
    if (t === 4) return number('In ' + n + ', how many tens?', null, tens);
    return number('In ' + n + ', how many ones?', null, ones);
  };
  G['skip-count-with-pictures'] = function (t) {
    var by = pick(t === 1 ? [2, 5] : [2, 5, 10]), groups = ri(2, t <= 2 ? 4 : 6), e = pick(CREATURES);
    var fig = '<div class="groups2">' + new Array(groups + 1).join('<div class="grp">' + things(by, e, 5) + '</div>') + '</div>';
    var n = by * groups;
    if (t >= 3) return number('Count by ' + by + '. How many altogether?', fig, n);
    return numChoice('Count by ' + by + '. How many altogether?', fig, n, [[groups, 'counted_groups_not_things'], [n + by, 'off_by_one_group'], [n - by, 'off_by_one_group']], t === 1 ? 3 : 4, 0);
  };
  G['skip-count-by-2-5-10'] = function (t) {
    var by = pick([2, 5, 10]), start = by * ri(1, 4), seq = [], i;
    for (i = 0; i < 4; i++) seq.push(start + i * by);
    var missing = t <= 2 ? 3 : ri(1, 3), ans = seq[missing];
    var shown = seq.map(function (v, i) { return i === missing ? '?' : v; }).join('  ,  ');
    if (t >= 4) return number('What is missing?\n' + shown, null, ans);
    return numChoice('What is missing?\n' + shown, null, ans, [[ans + 1, 'off_by_one'], [ans - by, 'wrong_step'], [ans + by, 'wrong_step']], t === 1 ? 3 : 4, 0);
  };
  G['count-forward-backward'] = function (t) {
    var max = t <= 2 ? 30 : 100, n = ri(2, max - 2), fwd = Math.random() < 0.5;
    var ans = fwd ? n + 1 : n - 1;
    var p = fwd ? 'What number comes just after ' + n + '?' : 'What number comes just before ' + n + '?';
    if (t >= 3) return number(p, null, ans);
    return numChoice(p, null, ans, [[fwd ? n - 1 : n + 1, 'wrong_direction'], [n, 'repeated_number'], [ans + 1, 'off_by_one']], t === 1 ? 3 : 4, 0);
  };
  G['number-line-to-100'] = function (t) {
    var lo = t <= 2 ? 0 : ri(0, 8) * 10, hi = lo + (t <= 2 ? 10 : 20), n = ri(lo + 1, hi - 1);
    if (t >= 3) return number('What number is the dot on?', numberLine(lo, hi, [n]), n);
    return numChoice('What number is the dot on?', numberLine(lo, hi, [n]), n, [[n + 1, 'off_by_one'], [n - 1, 'off_by_one'], [n - lo, 'counted_from_zero']], t === 1 ? 3 : 4, lo, hi);
  };
  G['hundred-chart'] = function (t) {
    var n = ri(12, 89);
    if (t === 1) return numChoice('What number is hidden?', hundredChart(n), n, [[n + 1, 'off_by_one'], [n - 1, 'off_by_one'], [n + 10, 'wrong_row']], 3, 1, 100);
    if (t === 2) return numChoice('What number is hidden?', hundredChart(n), n, [[n + 1, 'off_by_one'], [n - 1, 'off_by_one'], [n + 10, 'wrong_row'], [n - 10, 'wrong_row']], 4, 1, 100);
    if (t === 3) return number('What number is hidden?', hundredChart(n), n);
    var dir = pick([['just below', 10], ['just above', -10], ['just to the right of', 1], ['just to the left of', -1]]);
    var base = ri(12, 88);
    return number('On a hundred chart, what number is ' + dir[0] + ' ' + base + '?', null, base + dir[1]);
  };
  G['even-or-odd-groups'] = function (t) {
    var n = ri(2, t === 1 ? 8 : 12), e = pick(THINGS);
    var fig = '<div class="pairs">' + range(1, Math.ceil(n / 2)).map(function (i) {
      var two = (i * 2 <= n) ? 2 : 1;
      return '<div class="pair">' + new Array(two + 1).join('<span>' + e + '</span>') + '</div>';
    }).join('') + '</div>';
    return choice('Can they all make pairs?', fig,
      [opt('even', null), opt('odd', null)], n % 2 === 0 ? 'even' : 'odd');
  };
  G['identify-even-odd'] = function (t) {
    var n = ri(1, t <= 2 ? 20 : 99);
    return choice('Is ' + n + ' even or odd?', null, [opt('even'), opt('odd')], n % 2 === 0 ? 'even' : 'odd');
  };
  G['even-odd-on-number-line'] = function (t) {
    var lo = ri(0, 8) * 10, hi = lo + 10, n = ri(lo, hi);
    return choice('Is the number the dot is on even or odd?', numberLine(lo, hi, [n]), [opt('even'), opt('odd')], n % 2 === 0 ? 'even' : 'odd');
  };
  G['even-odd-before-after'] = function (t) {
    var n = ri(3, t <= 2 ? 20 : 60), want = pick(['even', 'odd']), dir = pick(['after', 'before']);
    var ans = null, i;
    if (dir === 'after') { for (i = n + 1; i < n + 4; i++) if ((i % 2 === 0) === (want === 'even')) { ans = i; break; } }
    else { for (i = n - 1; i > n - 4; i--) if ((i % 2 === 0) === (want === 'even')) { ans = i; break; } }
    var p = 'What is the ' + want + ' number just ' + dir + ' ' + n + '?';
    if (t >= 3) return number(p, null, ans);
    return numChoice(p, null, ans, [[dir === 'after' ? n + 1 : n - 1, 'ignored_even_odd'], [ans + 2, 'off_by_two'], [n, 'repeated_number']], t === 1 ? 3 : 4, 0);
  };
  G['skip-count-patterns-table'] = function (t) {
    var by = pick([2, 5, 10]), start = by, rows = [], i;
    for (i = 1; i <= 5; i++) rows.push([i, i === 4 ? '?' : String(i * by)]);
    var ans = 4 * by;
    var fig = table([pick(['bags', 'boxes', 'plates']), 'things'], rows);
    if (t >= 4) return number('Each one holds ' + by + '. What goes in the empty box?', fig, ans);
    return numChoice('Each one holds ' + by + '. What goes in the empty box?', fig, ans,
      [[ans + 1, 'off_by_one'], [ans - by, 'wrong_step'], [ans + by, 'wrong_step']], t === 1 ? 3 : 4, 0);
  };
  G['sequences-count-up-down'] = function (t) {
    var by = pick(t <= 2 ? [1, 2] : [2, 3, 5, 10]), up = Math.random() < 0.5;
    var start = ri(by * 2, 60), seq = [], i;
    for (i = 0; i < 5; i++) seq.push(start + (up ? 1 : -1) * i * by);
    if (seq.some(function (v) { return v < 0; })) return G['sequences-count-up-down'](t);
    var miss = t <= 2 ? 4 : ri(1, 4), ans = seq[miss];
    var shown = seq.map(function (v, i) { return i === miss ? '?' : v; }).join('  ,  ');
    if (t >= 4) return number('What is missing?\n' + shown, null, ans);
    return numChoice('What is missing?\n' + shown, null, ans, [[ans + by, 'wrong_direction'], [ans - by, 'wrong_direction'], [ans + 1, 'off_by_one']], t === 1 ? 3 : 4, 0);
  };
  G['sequences-by-100'] = function (t) {
    var start = ri(1, 4) * 100, seq = [], i;
    for (i = 0; i < 4; i++) seq.push(start + i * 100);
    var miss = t <= 2 ? 3 : ri(1, 3), ans = seq[miss];
    var shown = seq.map(function (v, i) { return i === miss ? '?' : v; }).join('  ,  ');
    if (t >= 4) return number('What is missing?\n' + shown, null, ans);
    return numChoice('What is missing?\n' + shown, null, ans, [[ans + 10, 'place_value_confusion'], [ans - 100, 'wrong_step'], [ans + 100, 'wrong_step']], t === 1 ? 3 : 4, 0);
  };
  G['ordinal-numbers'] = function (t) {
    var n = t === 1 ? 5 : ri(6, 8), e = shuffle(THINGS).slice(0, n);
    var ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];
    var k = ri(0, n - 1);
    var fig = '<div class="strip ordinal">' + e.map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div>';
    var os = [opt(e[k])];
    shuffle(e.filter(function (x) { return x !== e[k]; })).slice(0, t === 1 ? 2 : 3).forEach(function (x) { os.push(opt(x, 'ordinal_miscount')); });
    return choice('Which one is ' + ORD[k] + '? (count from the left)', fig,
      os.map(function (o) { return { value: o.value, tag: o.tag, html: '<span style="font-size:40px">' + o.value + '</span>' }; }), e[k]);
  };
  G['write-numbers-in-words'] = function (t) {
    var n = t <= 2 ? ri(0, 20) : ri(21, 99);
    if (t >= 4) return number('Write this number using digits:\n' + words(n), null, n);
    var os = [opt(words(n))], used = { }; used[words(n)] = 1;
    var cands = [n + 1, n - 1, n + 10, Math.floor(n / 10) + (n % 10) * 10];
    shuffle(cands).forEach(function (c) {
      if (os.length < (t === 1 ? 3 : 4) && c >= 0 && c <= 99 && !used[words(c)]) { used[words(c)] = 1; os.push(opt(words(c), 'number_word_confusion')); }
    });
    return choice('How do you write ' + n + ' in words?', null, os, words(n));
  };

  // ================= Section B — place value =================
  G['place-value-blocks-tens-ones'] = function (t) {
    var tens = ri(1, 3), ones = ri(0, 9), n = tens * 10 + ones;
    if (t >= 3) return number('What number do the blocks show?', pvBlocks(tens, ones), n);
    return numChoice('What number do the blocks show?', pvBlocks(tens, ones), n,
      [[tens + ones, 'place_value_confusion'], [ones * 10 + tens, 'reversed_digits'], [n + 1, 'off_by_one']], t === 1 ? 3 : 4, 0, 99);
  };
  G['place-value-blocks-to-hundred'] = function (t) {
    var tens = ri(4, 9), ones = ri(0, 9), n = tens * 10 + ones;
    if (t >= 3) return number('What number do the blocks show?', pvBlocks(tens, ones), n);
    return numChoice('What number do the blocks show?', pvBlocks(tens, ones), n,
      [[tens + ones, 'place_value_confusion'], [ones * 10 + tens, 'reversed_digits'], [n + 10, 'off_by_ten']], t === 1 ? 3 : 4, 0, 100);
  };
  G['write-tens-ones-to-30'] = function (t) {
    var n = ri(11, 30), tens = Math.floor(n / 10), ones = n % 10, askTens = Math.random() < 0.5;
    if (t >= 3) return number(n + ' = ☐ tens and ' + (askTens ? ones + ' ones' : '☐ ones') + '\nHow many ' + (askTens ? 'tens' : 'ones') + '?',
      null, askTens ? tens : ones);
    var ans = askTens ? tens : ones;
    return numChoice('In ' + n + ', how many ' + (askTens ? 'tens' : 'ones') + '?', pvBlocks(tens, ones), ans,
      [[askTens ? ones : tens, 'place_value_confusion'], [n, 'gave_whole_number'], [ans + 1, 'off_by_one']], t === 1 ? 3 : 4, 0, 30);
  };
  G['write-tens-ones-to-100'] = function (t) {
    var n = ri(31, 99), tens = Math.floor(n / 10), ones = n % 10;
    if (t >= 4) return number(n + ' has ☐ tens and ' + ones + ' ones.\nHow many tens?', null, tens);
    if (t === 3) return number('In ' + n + ', how many ones?', null, ones);
    var askTens = Math.random() < 0.5, ans = askTens ? tens : ones;
    return numChoice('In ' + n + ', how many ' + (askTens ? 'tens' : 'ones') + '?', null, ans,
      [[askTens ? ones : tens, 'place_value_confusion'], [n, 'gave_whole_number'], [ans + 1, 'off_by_one']], t === 1 ? 3 : 4, 0, 99);
  };

  // ================= Section C — understand addition =================
  G['add-with-pictures-to-10'] = function (t) {
    var s = ri(3, 10), a = ri(1, s - 1), b = s - a, e1 = pick(THINGS), e2 = pick(THINGS);
    var fig = twoGroups(a, b, e1, e2);
    if (t >= 3) return number('How many altogether?', fig, s);
    return numChoice('How many altogether?', fig, s, [[a, 'counted_one_group'], [b, 'counted_one_group'], [s + 1, 'off_by_one'], [s - 1, 'off_by_one']], t === 1 ? 3 : 4, 0, 12);
  };
  G['addition-sentences-to-10'] = function (t) {
    var s = ri(3, 10), a = ri(1, s - 1), b = s - a, e = pick(THINGS);
    var fig = twoGroups(a, b, e, e);
    if (t >= 4) return number('Finish the sentence: ' + a + ' + ' + b + ' = ☐', fig, s);
    var right = a + ' + ' + b + ' = ' + s;
    var os = [opt(right), opt(a + ' + ' + b + ' = ' + (s + 1), 'off_by_one'),
      opt(Math.max(a, b) + ' − ' + Math.min(a, b) + ' = ' + Math.abs(a - b), 'used_wrong_operation')];
    if (t >= 2) os.push(opt(b + ' + ' + s + ' = ' + (b + s), 'wrong_numbers'));
    return choice('Which sentence shows the picture?', fig, os, right);
  };
  G['add-on-number-line-to-10'] = function (t) {
    var a = ri(0, 7), b = ri(1, 10 - a), s = a + b;
    var fig = numberLine(0, 10, [], [a, s]);
    if (t >= 3) return number('The hops start at ' + a + '. Where do they land?', fig, s);
    return numChoice('The hops start at ' + a + '. Where do they land?', fig, s,
      [[b, 'counted_hops_only'], [s + 1, 'off_by_one'], [s - 1, 'counted_the_start_number']], t === 1 ? 3 : 4, 0, 10);
  };
  G['add-zero'] = function (t) {
    var a = ri(0, t === 1 ? 10 : 20), first = Math.random() < 0.5;
    var p = (first ? a + ' + 0' : '0 + ' + a) + ' = ?';
    if (t >= 3) return number(p, null, a);
    return numChoice(p, null, a, [[0, 'zero_makes_zero'], [a + 1, 'off_by_one'], [a - 1, 'off_by_one']], t === 1 ? 3 : 4, 0);
  };

  // ================= Section D — addition facts =================
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(function (k) { G['add-' + k] = addFactGen(k); });

  // ================= Section E — addition strategies and sentences =================
  G['addition-facts-to-10'] = addFactsGen(10);
  G['addition-facts-to-18'] = addFactsGen(18);
  G['addition-facts-to-20'] = addFactsGen(20);
  G['ways-to-make-a-number-addition'] = function (t) {
    var s = ri(5, t <= 2 ? 10 : 20), a = ri(1, s - 1);
    var right = a + ' + ' + (s - a);
    var os = [opt(right)], used = {}, guard = 0; used[right] = 1;
    while (os.length < (t === 1 ? 3 : 4) && guard++ < 60) {
      var x = ri(1, s), y = ri(1, s);
      if (x + y === s) continue;
      var key = x + ' + ' + y;
      if (!used[key]) { used[key] = 1; os.push(opt(key, Math.abs(x + y - s) === 1 ? 'off_by_one' : 'wrong_total')); }
    }
    return choice('Which one makes ' + s + '?', null, os, right);
  };
  G['make-a-number-with-addition-to-10'] = function (t) {
    var s = ri(4, 10), a = ri(0, s), b = s - a;
    if (t >= 3) return number(a + ' + ☐ = ' + s, null, b);
    return numChoice(a + ' + ☐ = ' + s + '\nWhat goes in the box?', t === 1 ? tenFrames(a) : null, b,
      [[s, 'gave_the_total'], [s + a, 'used_wrong_operation'], [b + 1, 'off_by_one']], t === 1 ? 3 : 4, 0, 10);
  };
  G['complete-addition-sentence-to-10'] = function (t) {
    var s = ri(4, 10), a = ri(0, s), b = s - a, hideFirst = Math.random() < 0.5;
    var p = hideFirst ? ('☐ + ' + b + ' = ' + s) : (a + ' + ☐ = ' + s);
    var ans = hideFirst ? a : b;
    if (t >= 3) return number(p, null, ans);
    return numChoice(p + '\nWhat goes in the box?', null, ans, [[s, 'gave_the_total'], [ans + 1, 'off_by_one'], [s + ans, 'used_wrong_operation']], t === 1 ? 3 : 4, 0, 10);
  };
  G['addition-word-problems-to-10'] = wordProblemAdd(10);
  G['addition-word-problems-to-18'] = wordProblemAdd(18);
  G['addition-sentences-for-word-problems-to-10'] = sentenceForWord(10, '+');
  G['addition-sentences-for-word-problems-to-18'] = sentenceForWord(18, '+');
  G['addition-sentences-for-word-problems-to-20'] = sentenceForWord(20, '+');
  G['add-on-number-line-to-18'] = function (t) {
    var a = ri(0, 12), b = ri(1, 18 - a), s = a + b;
    var fig = numberLine(0, 18, [], [a, s]);
    if (t >= 3) return number('The hops start at ' + a + '. Where do they land?', fig, s);
    return numChoice('The hops start at ' + a + '. Where do they land?', fig, s,
      [[b, 'counted_hops_only'], [s + 1, 'off_by_one'], [s - 1, 'counted_the_start_number']], t === 1 ? 3 : 4, 0, 18);
  };
  G['make-a-number-with-addition-to-20'] = function (t) {
    var s = ri(11, 20), a = ri(0, s), b = s - a;
    if (t >= 3) return number(a + ' + ☐ = ' + s, null, b);
    return numChoice(a + ' + ☐ = ' + s + '\nWhat goes in the box?', null, b,
      [[s, 'gave_the_total'], [s + a, 'used_wrong_operation'], [b + 1, 'off_by_one']], t === 1 ? 3 : 4, 0, 20);
  };
  G['related-addition-facts'] = function (t) {
    var a = ri(1, 9), b = ri(1, 9), s = a + b;
    if (t >= 3) return number('If ' + a + ' + ' + b + ' = ' + s + ', then ' + b + ' + ' + a + ' = ?', null, s);
    return numChoice('If ' + a + ' + ' + b + ' = ' + s + ', then ' + b + ' + ' + a + ' = ?', null, s,
      [[Math.abs(a - b), 'used_wrong_operation'], [s + 1, 'off_by_one'], [s - 1, 'off_by_one']], t === 1 ? 3 : 4, 0);
  };
  G['addition-true-or-false'] = trueFalseGen('+');
  G['add-1-digit-to-2-digit-no-regroup'] = function (t) {
    var tens = ri(1, t <= 2 ? 4 : 9), ones = ri(0, 5), b = ri(1, 9 - ones), a = tens * 10 + ones, s = a + b;
    if (t >= 3) return number(a + ' + ' + b + ' = ?', null, s);
    return numChoice(a + ' + ' + b + ' = ?', null, s, [[a + b * 10, 'place_value_confusion'], [s + 10, 'off_by_ten'], [s - 1, 'off_by_one']], t === 1 ? 3 : 4, 0);
  };
  G['add-1-digit-to-2-digit-regroup'] = function (t) {
    var tens = ri(1, t <= 2 ? 4 : 8), ones = ri(5, 9), b = ri(10 - ones, 9), a = tens * 10 + ones, s = a + b;
    if (t >= 3) return number(a + ' + ' + b + ' = ?', null, s);
    return numChoice(a + ' + ' + b + ' = ?', null, s, [[s - 10, 'forgot_to_regroup'], [tens * 10 + ((ones + b) % 10), 'forgot_to_regroup'], [s + 1, 'off_by_one']], t === 1 ? 3 : 4, 0);
  };

  // ================= Section F — doubles, making ten, three numbers =================
  G['add-doubles'] = function (t) {
    var a = ri(1, t <= 2 ? 5 : 10), s = a * 2;
    if (t >= 3) return number(a + ' + ' + a + ' = ?', null, s);
    return numChoice(a + ' + ' + a + ' = ?', t === 1 ? twoGroups(a, a, '🐞', '🐞') : null, s,
      [[a, 'counted_one_group'], [s + 1, 'off_by_one'], [s - 1, 'off_by_one']], t === 1 ? 3 : 4, 0);
  };
  G['add-doubles-plus-one'] = function (t) {
    var a = ri(1, 9), s = a + a + 1;
    var p = a + ' + ' + (a + 1) + ' = ?';
    if (t >= 3) return number('Use doubles to help.\n' + p, null, s);
    return numChoice('Use doubles to help.\n' + p, null, s, [[a * 2, 'used_double_only'], [s + 1, 'off_by_one'], [a * 2 + 2, 'used_double_plus_two']], t === 1 ? 3 : 4, 0);
  };
  G['add-doubles-minus-one'] = function (t) {
    var a = ri(2, 10), s = a + a - 1;
    var p = a + ' + ' + (a - 1) + ' = ?';
    if (t >= 3) return number('Use doubles to help.\n' + p, null, s);
    return numChoice('Use doubles to help.\n' + p, null, s, [[a * 2, 'used_double_only'], [s - 1, 'off_by_one'], [a * 2 - 2, 'used_double_minus_two']], t === 1 ? 3 : 4, 0);
  };
  G['add-three-using-doubles'] = function (t) {
    var a = ri(1, 7), c = ri(1, 5), s = a + a + c;
    if (t >= 3) return number(a + ' + ' + a + ' + ' + c + ' = ?', null, s);
    return numChoice(a + ' + ' + a + ' + ' + c + ' = ?', null, s, [[a * 2, 'left_out_a_number'], [a + c, 'left_out_a_number'], [s + 1, 'off_by_one']], t === 1 ? 3 : 4, 0);
  };
  G['complete-sentence-make-ten'] = function (t) {
    var a = ri(1, 9), b = 10 - a;
    if (t >= 3) return number(a + ' + ☐ = 10', null, b);
    return numChoice(a + ' + ☐ = 10\nWhat goes in the box?', t === 1 ? tenFrames(a) : null, b,
      [[10, 'gave_the_total'], [a, 'repeated_first_number'], [b + 1, 'off_by_one']], t === 1 ? 3 : 4, 0, 10);
  };
  G['add-three-numbers'] = function (t) {
    var max = t <= 2 ? 5 : 8, a = ri(1, max), b = ri(1, max), c = ri(1, max), s = a + b + c;
    if (t >= 3) return number(a + ' + ' + b + ' + ' + c + ' = ?', null, s);
    return numChoice(a + ' + ' + b + ' + ' + c + ' = ?', null, s, [[a + b, 'left_out_a_number'], [b + c, 'left_out_a_number'], [s + 1, 'off_by_one']], t === 1 ? 3 : 4, 0);
  };
  G['add-three-make-ten'] = function (t) {
    var a = ri(1, 9), b = 10 - a, c = ri(1, 9), s = 10 + c;
    var arr = shuffle([a, b, c]);
    if (t >= 3) return number('Look for two that make 10.\n' + arr.join(' + ') + ' = ?', null, s);
    return numChoice('Look for two that make 10.\n' + arr.join(' + ') + ' = ?', null, s,
      [[10, 'stopped_at_ten'], [s + 1, 'off_by_one'], [a + b, 'left_out_a_number']], t === 1 ? 3 : 4, 0);
  };
  G['add-two-multiples-of-ten'] = multipleOfTenAdd;
  G['add-a-multiple-of-ten'] = function (t) {
    var a = ri(11, 59), b = ri(1, 4) * 10, s = a + b;
    if (t >= 3) return number(a + ' + ' + b + ' = ?', null, s);
    return numChoice(a + ' + ' + b + ' = ?', null, s, [[a + b / 10, 'place_value_confusion'], [s + 10, 'off_by_ten'], [s - 10, 'off_by_ten']], t === 1 ? 3 : 4, 0);
  };
  G['add-three-numbers-word-problems'] = function (t) {
    var a = ri(1, 6), b = ri(1, 6), c = ri(1, 6), s = a + b + c, n = pick(NAMES);
    var thing = pick(['shells', 'beads', 'stickers', 'jamuns', 'pebbles']);
    var story = n + ' picks ' + a + ' ' + thing + ', then ' + b + ' more, then ' + c + ' more. How many altogether?';
    if (t >= 3) return number(story, null, s);
    return numChoice(story, null, s, [[a + b, 'left_out_a_number'], [b + c, 'left_out_a_number'], [s + 1, 'off_by_one']], t === 1 ? 3 : 4, 0);
  };

  // ================= Section G — understand subtraction =================
  G['subtract-with-pictures-to-10'] = function (t) {
    var a = ri(3, 10), b = ri(1, a - 1), e = pick(THINGS);
    var fig = crossedGroup(a, b, e);
    if (t >= 3) return number('The crossed ones are taken away. How many are left?', fig, a - b);
    return numChoice('The crossed ones are taken away. How many are left?', fig, a - b,
      [[a, 'took_nothing_away'], [b, 'counted_the_crossed_ones'], [a - b + 1, 'off_by_one']], t === 1 ? 3 : 4, 0, 10);
  };
  G['subtraction-sentences-to-10'] = function (t) {
    var a = ri(3, 10), b = ri(1, a - 1), ans = a - b, e = pick(THINGS);
    var fig = crossedGroup(a, b, e);
    if (t >= 4) return number('Finish the sentence: ' + a + ' − ' + b + ' = ☐', fig, ans);
    var right = a + ' − ' + b + ' = ' + ans;
    var os = [opt(right), opt(a + ' + ' + b + ' = ' + (a + b), 'used_wrong_operation'), opt(a + ' − ' + b + ' = ' + (ans + 1), 'off_by_one')];
    if (t >= 2) os.push(b === ans ? opt(a + ' − ' + b + ' = ' + (ans - 1 >= 0 ? ans - 1 : ans + 2), 'off_by_one')
      : opt(a + ' − ' + ans + ' = ' + b, 'confused_the_parts'));
    return choice('Which sentence shows the picture?', fig, os, right);
  };
  G['subtract-on-number-line-to-10'] = function (t) {
    var a = ri(3, 10), b = ri(1, a), ans = a - b;
    var fig = numberLine(0, 10, [], [a, ans]);
    if (t >= 3) return number('The hops start at ' + a + '. Where do they land?', fig, ans);
    return numChoice('The hops start at ' + a + '. Where do they land?', fig, ans,
      [[b, 'counted_hops_only'], [a + b, 'wrong_direction'], [ans + 1, 'counted_the_start_number']], t === 1 ? 3 : 4, 0, 10);
  };
  G['subtract-zero-and-all'] = function (t) {
    var a = ri(1, t === 1 ? 10 : 20), all = Math.random() < 0.5;
    var b = all ? a : 0, ans = a - b;
    var p = a + ' − ' + b + ' = ?';
    if (t >= 3) return number(p, null, ans);
    return numChoice(p, null, ans, [[all ? a : 0, 'confused_zero_and_all'], [ans + 1, 'off_by_one'], [a + b, 'used_wrong_operation']], t === 1 ? 3 : 4, 0);
  };

  // ================= Section H — subtraction facts =================
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(function (k) { G['subtract-' + k] = subFactGen(k); });

  // ================= Section I — subtraction strategies and sentences =================
  G['subtraction-facts-to-10'] = subFactsGen(10);
  G['subtraction-facts-to-18'] = subFactsGen(18);
  G['ways-to-make-a-number-subtraction'] = function (t) {
    var ans = ri(1, t <= 2 ? 6 : 10), a = ri(ans + 1, ans + 9);
    var right = a + ' − ' + (a - ans);
    var os = [opt(right)], used = {}, guard = 0; used[right] = 1;
    while (os.length < (t === 1 ? 3 : 4) && guard++ < 60) {
      var x = ri(ans, 18), y = ri(1, x);
      if (x - y === ans) continue;
      var key = x + ' − ' + y;
      if (!used[key]) { used[key] = 1; os.push(opt(key, Math.abs(x - y - ans) === 1 ? 'off_by_one' : 'wrong_total')); }
    }
    return choice('Which one makes ' + ans + '?', null, os, right);
  };
  G['ways-to-subtract-from-a-number'] = function (t) {
    var a = ri(6, t <= 2 ? 10 : 18), b = ri(1, a - 1), ans = a - b;
    if (t >= 3) return number('Start with ' + a + '. Take away ' + b + '. What is left?', null, ans);
    return numChoice('Start with ' + a + '. Take away ' + b + '. What is left?', null, ans,
      [[a + b, 'used_wrong_operation'], [b, 'counted_the_crossed_ones'], [ans + 1, 'off_by_one']], t === 1 ? 3 : 4, 0);
  };
  G['make-a-number-with-subtraction-to-10'] = function (t) {
    var a = ri(4, 10), ans = ri(0, a - 1), b = a - ans;
    if (t >= 3) return number(a + ' − ☐ = ' + ans, null, b);
    return numChoice(a + ' − ☐ = ' + ans + '\nWhat goes in the box?', null, b,
      [[ans, 'gave_the_answer'], [a, 'gave_the_total'], [b + 1, 'off_by_one']], t === 1 ? 3 : 4, 0, 10);
  };
  G['make-a-number-with-subtraction-to-20'] = function (t) {
    var a = ri(11, 20), ans = ri(0, a - 1), b = a - ans;
    if (t >= 3) return number(a + ' − ☐ = ' + ans, null, b);
    return numChoice(a + ' − ☐ = ' + ans + '\nWhat goes in the box?', null, b,
      [[ans, 'gave_the_answer'], [a, 'gave_the_total'], [b + 1, 'off_by_one']], t === 1 ? 3 : 4, 0, 20);
  };
  G['complete-subtraction-sentence'] = function (t) {
    var a = ri(5, t <= 2 ? 10 : 18), b = ri(1, a - 1), ans = a - b, hideFirst = Math.random() < 0.5;
    var p = hideFirst ? ('☐ − ' + b + ' = ' + ans) : (a + ' − ☐ = ' + ans);
    var want = hideFirst ? a : b;
    if (t >= 3) return number(p, null, want);
    return numChoice(p + '\nWhat goes in the box?', null, want, [[ans, 'gave_the_answer'], [want + 1, 'off_by_one'], [hideFirst ? b : a, 'copied_a_number']], t === 1 ? 3 : 4, 0);
  };
  G['subtraction-word-problems-to-10'] = wordProblemSub(10);
  G['subtraction-word-problems-to-18'] = wordProblemSub(18);
  G['subtraction-sentences-for-word-problems-to-10'] = sentenceForWord(10, '−');
  G['subtraction-sentences-for-word-problems-to-18'] = sentenceForWord(18, '−');
  G['subtract-on-number-line-to-18'] = function (t) {
    var a = ri(6, 18), b = ri(1, a), ans = a - b;
    var fig = numberLine(0, 18, [], [a, ans]);
    if (t >= 3) return number('The hops start at ' + a + '. Where do they land?', fig, ans);
    return numChoice('The hops start at ' + a + '. Where do they land?', fig, ans,
      [[b, 'counted_hops_only'], [a + b, 'wrong_direction'], [ans + 1, 'counted_the_start_number']], t === 1 ? 3 : 4, 0, 18);
  };
  G['related-subtraction-facts'] = function (t) {
    var b = ri(1, 9), ans = ri(1, 9), a = b + ans;
    if (t >= 3) return number('If ' + a + ' − ' + b + ' = ' + ans + ', then ' + a + ' − ' + ans + ' = ?', null, b);
    return numChoice('If ' + a + ' − ' + b + ' = ' + ans + ', then ' + a + ' − ' + ans + ' = ?', null, b,
      [[a, 'gave_the_total'], [ans, 'repeated_the_answer'], [b + 1, 'off_by_one']], t === 1 ? 3 : 4, 0);
  };
  G['subtraction-true-or-false'] = trueFalseGen('−');
  G['subtract-1-digit-from-2-digit-no-regroup'] = function (t) {
    var tens = ri(1, t <= 2 ? 4 : 9), ones = ri(5, 9), b = ri(1, ones), a = tens * 10 + ones, ans = a - b;
    if (t >= 3) return number(a + ' − ' + b + ' = ?', null, ans);
    return numChoice(a + ' − ' + b + ' = ?', null, ans, [[a - b * 10, 'place_value_confusion'], [ans - 10, 'off_by_ten'], [ans + 1, 'off_by_one']], t === 1 ? 3 : 4, 0);
  };
  G['subtract-1-digit-from-2-digit-regroup'] = function (t) {
    var tens = ri(2, t <= 2 ? 4 : 9), ones = ri(0, 4), b = ri(ones + 1, 9), a = tens * 10 + ones, ans = a - b;
    if (t >= 3) return number(a + ' − ' + b + ' = ?', null, ans);
    return numChoice(a + ' − ' + b + ' = ?', null, ans, [[tens * 10 + (b - ones), 'forgot_to_regroup'], [ans + 10, 'forgot_to_regroup'], [ans - 1, 'off_by_one']], t === 1 ? 3 : 4, 0);
  };

  // ================= Section J — mixed operation strategies =================
  G['relate-addition-subtraction'] = function (t) {
    var a = ri(1, 9), b = ri(1, 9), s;
    while (b === a) b = ri(1, 9);
    s = a + b;
    if (t >= 4) return number('If ' + a + ' + ' + b + ' = ' + s + ', then ' + s + ' − ' + b + ' = ?', null, a);
    if (t === 3) return number('If ' + a + ' + ' + b + ' = ' + s + ', then ' + s + ' − ' + a + ' = ?', null, b);
    var right = s + ' − ' + b + ' = ' + a;
    var os = [opt(right), opt(s + ' − ' + b + ' = ' + b, 'confused_the_parts'), opt(s + ' + ' + b + ' = ' + (s + b), 'used_wrong_operation')];
    if (t === 2) os.push(opt(Math.max(a, b) + ' − ' + Math.min(a, b) + ' = ' + Math.abs(a - b), 'wrong_numbers'));
    return choice(a + ' + ' + b + ' = ' + s + '\nWhich subtraction goes with it?', null, os, right);
  };
  G['subtract-doubles'] = function (t) {
    var a = ri(1, 10), d = a * 2;
    if (t >= 3) return number(d + ' − ' + a + ' = ?', null, a);
    return numChoice(d + ' − ' + a + ' = ?', null, a, [[d, 'took_nothing_away'], [0, 'took_everything'], [a + 1, 'off_by_one']], t === 1 ? 3 : 4, 0);
  };
  G['subtract-multiples-of-ten'] = function (t) {
    var a = ri(3, 9) * 10, b = ri(1, a / 10 - 1) * 10, ans = a - b;
    if (t >= 3) return number(a + ' − ' + b + ' = ?', null, ans);
    return numChoice(a + ' − ' + b + ' = ?', null, ans, [[ans / 10, 'place_value_confusion'], [a + b, 'used_wrong_operation'], [ans + 10, 'off_by_ten']], t === 1 ? 3 : 4, 0);
  };
  G['subtract-a-multiple-of-ten'] = function (t) {
    var a = ri(31, 99), b = ri(1, Math.floor(a / 10) - 1) * 10, ans = a - b;
    if (t >= 3) return number(a + ' − ' + b + ' = ?', null, ans);
    return numChoice(a + ' − ' + b + ' = ?', null, ans, [[a - b / 10, 'place_value_confusion'], [ans - 10, 'off_by_ten'], [ans + 10, 'off_by_ten']], t === 1 ? 3 : 4, 0);
  };

  // ================= Section K — comparing =================
  G['compare-more-fewer'] = function (t) {
    var a = ri(2, 9), b = ri(2, 9), e1 = pick(THINGS), e2 = pick(THINGS.filter(function (x) { return x !== e1; }));
    var fig = '<div class="groups"><div class="grp"><b>A</b>' + things(a, e1) + '</div><div class="grp"><b>B</b>' + things(b, e2) + '</div></div>';
    var ans = a > b ? 'A has more' : (a < b ? 'B has more' : 'the same');
    return choice('Which is true?', fig, [opt('A has more'), opt('B has more'), opt('the same')], ans);
  };
  G['compare-numbers-to-10'] = function (t) {
    var a = ri(0, 10), b = ri(0, 10);
    var ans = a > b ? '>' : (a < b ? '<' : '=');
    var os = [opt('>', a > b ? null : 'confused_more_fewer'), opt('<', a < b ? null : 'confused_more_fewer'), opt('=', 'confused_more_fewer')];
    return choice('Which sign belongs?\n' + a + '  ☐  ' + b, null, os, ans);
  };
  G['compare-numbers-to-100'] = function (t) {
    var a = ri(10, 99), b = t >= 4 ? (Math.random() < 0.5 ? a % 10 * 10 + Math.floor(a / 10) : ri(10, 99)) : ri(10, 99);
    if (a === b) b = b + 1;
    var ans = a > b ? '>' : (a < b ? '<' : '=');
    var os = [opt('>', a > b ? null : 'confused_more_fewer'), opt('<', a < b ? null : 'confused_more_fewer'), opt('=', 'confused_more_fewer')];
    return choice('Which sign belongs?\n' + a + '  ☐  ' + b, null, os, ans);
  };
  G['comparison-word-problems'] = function (t) {
    var a = ri(4, t <= 2 ? 12 : 20), b = ri(1, a - 1), n1 = pick(NAMES), n2 = pick(NAMES.filter(function (x) { return x !== n1; }));
    var thing = pick(['stickers', 'marbles', 'books', 'mangoes']);
    var story = n1 + ' has ' + a + ' ' + thing + '. ' + n2 + ' has ' + b + '. How many more does ' + n1 + ' have?';
    if (t >= 3) return number(story, null, a - b);
    return numChoice(story, null, a - b, [[a + b, 'used_wrong_operation'], [a, 'gave_the_total'], [a - b + 1, 'off_by_one']], t === 1 ? 3 : 4, 0);
  };

  // ================= Section L — estimation =================
  G['estimate-to-nearest-ten'] = function (t) {
    var n = ri(11, 89);
    while (n % 10 === 5 || n % 10 === 0) n = ri(11, 89);
    var ans = Math.round(n / 10) * 10;
    if (t >= 4) return number('Round ' + n + ' to the nearest ten.', null, ans);
    var lo = Math.floor(n / 10) * 10, other = ans === lo ? lo + 10 : lo;
    var os = [opt(ans), opt(other, 'rounded_wrong_way')];
    if (t >= 2) os.push(opt(ans === lo ? lo + 20 : lo - 10, 'rounded_wrong_way'));
    if (t >= 3) os.push(opt(n, 'gave_the_number'));
    return choice('Which ten is ' + n + ' closest to?', numberLine(lo, lo + 10, [n]), os, ans);
  };

  // ================= Section M — flat shapes =================
  G['name-2d-shapes'] = function (t) {
    var n = pick(SHAPE_NAMES);
    var os = [opt(n)].concat(shuffle(SHAPE_NAMES.filter(function (x) { return x !== n; })).slice(0, t === 1 ? 2 : 3).map(function (x) { return opt(x, 'confused_shape_names'); }));
    return choice('What is this shape called?', shape2d(n), os, n);
  };
  G['select-2d-shapes'] = function (t) {
    var n = pick(SHAPE_NAMES), others = shuffle(SHAPE_NAMES.filter(function (x) { return x !== n; })).slice(0, t === 1 ? 2 : 3);
    var os = [{ value: n, tag: null, html: shape2d(n, C_SKY) }].concat(others.map(function (x) { return { value: x, tag: 'confused_shape_names', html: shape2d(x, C_SKY) }; }));
    return choice('Which one is the ' + n + '?', null, os, n);
  };
  G['count-sides-vertices'] = function (t) {
    var n = pick(SHAPE_NAMES.filter(function (s) { return SHAPE_SIDES[s][0] > 0; }));
    var sides = SHAPE_SIDES[n][0], askSides = t % 2 === 1;
    var ans = askSides ? sides : SHAPE_SIDES[n][1];
    var word = askSides ? 'sides' : 'corners';
    if (t >= 3) return number('How many ' + word + '?', shape2d(n), ans);
    return numChoice('How many ' + word + '?', shape2d(n), ans, [[ans + 1, 'miscounted_sides'], [ans - 1, 'miscounted_sides'], [ans + 2, 'miscounted_sides']], t === 1 ? 3 : 4, 0, 12);
  };
  G['compare-sides-vertices'] = function (t) {
    var a = pick(SHAPE_NAMES), b = pick(SHAPE_NAMES.filter(function (x) { return SHAPE_SIDES[x][0] !== SHAPE_SIDES[a][0]; }));
    var fig = '<div class="sidebyside"><div>' + shape2d(a, C_SAGE) + '<b>A</b></div><div>' + shape2d(b, C_APR) + '<b>B</b></div></div>';
    var ans = SHAPE_SIDES[a][0] > SHAPE_SIDES[b][0] ? 'A' : 'B';
    if (t >= 4) return number('How many more sides does the shape with more sides have?', fig, Math.abs(SHAPE_SIDES[a][0] - SHAPE_SIDES[b][0]));
    return choice('Which shape has more sides?', fig, [opt('A', ans === 'A' ? null : 'miscounted_sides'), opt('B', ans === 'B' ? null : 'miscounted_sides')], ans);
  };
  G['open-closed-shapes'] = function (t) {
    var closed = Math.random() < 0.5;
    var fig = closed ? svg(160, 130, '<polyline points="20,110 40,25 120,20 140,105 20,110" fill="none" stroke="#6E8FAA" stroke-width="5"/>')
      : svg(160, 130, '<polyline points="20,110 40,25 120,20 140,105" fill="none" stroke="#6E8FAA" stroke-width="5"/>');
    return choice('Is this shape open or closed?', fig, [opt('open'), opt('closed')], closed ? 'closed' : 'open');
  };
  G['flip-turn-slide'] = function (t) {
    var kind = pick(['slide', 'flip', 'turn']);
    var base = '<polygon points="10,70 60,10 60,70" fill="#A9C4A0" stroke="#6F9268" stroke-width="2"/>';
    var tf = { slide: 'translate(90,0)', flip: 'translate(230,0) scale(-1,1)', turn: 'rotate(180 105 40)' };
    var fig = svg(240, 90, base + '<g transform="' + tf[kind] + '">' + base + '</g>');
    var os = [opt('slide'), opt('flip'), opt('turn')];
    return choice('What was done to the shape?', fig, os, kind);
  };
  G['symmetry'] = function (t) {
    var sym = Math.random() < 0.5;
    var fig = sym
      ? svg(180, 140, '<polygon points="90,10 160,120 20,120" fill="#F3C39A" stroke="#D9945C" stroke-width="2"/><line x1="90" y1="4" x2="90" y2="130" stroke="#6E8FAA" stroke-width="3" stroke-dasharray="7 5"/>')
      : svg(180, 140, '<polygon points="60,10 160,120 20,120" fill="#F3C39A" stroke="#D9945C" stroke-width="2"/><line x1="90" y1="4" x2="90" y2="130" stroke="#6E8FAA" stroke-width="3" stroke-dasharray="7 5"/>');
    return choice('Are the two halves the same on both sides of the line?', fig, [opt('yes'), opt('no')], sym ? 'yes' : 'no');
  };

  // ================= Section N — solid shapes =================
  G['flat-vs-solid-shapes'] = function (t) {
    var isFlat = Math.random() < 0.5;
    var name = isFlat ? pick(SHAPE_NAMES) : pick(SOLID_NAMES);
    return choice('Is this a flat shape or a solid shape?', isFlat ? shape2d(name) : solid(name),
      [opt('flat'), opt('solid')], isFlat ? 'flat' : 'solid');
  };
  G['name-3d-shapes'] = function (t) {
    var n = pick(SOLID_NAMES);
    var os = [opt(n)].concat(shuffle(SOLID_NAMES.filter(function (x) { return x !== n; })).slice(0, t === 1 ? 2 : 3).map(function (x) { return opt(x, 'confused_shape_names'); }));
    return choice('What is this solid shape called?', solid(n), os, n);
  };
  G['cubes-and-cuboids'] = function (t) {
    var isCube = Math.random() < 0.5;
    return choice('Is this a cube or a cuboid?', solid(isCube ? 'cube' : 'cuboid'),
      [opt('cube'), opt('cuboid')], isCube ? 'cube' : 'cuboid');
  };
  G['select-3d-shapes'] = function (t) {
    var n = pick(SOLID_NAMES), others = shuffle(SOLID_NAMES.filter(function (x) { return x !== n; })).slice(0, t === 1 ? 2 : 3);
    var os = [{ value: n, tag: null, html: solid(n) }].concat(others.map(function (x) { return { value: x, tag: 'confused_shape_names', html: solid(x) }; }));
    return choice('Which one is the ' + n + '?', null, os, n);
  };
  G['count-vertices-edges-faces'] = function (t) {
    var n = pick(['cube', 'cuboid', 'cone', 'cylinder', 'pyramid']);
    var which = ri(0, 2), word = ['corners', 'edges', 'faces'][which], ans = SOLID_FACTS[n][which];
    if (t >= 4) return number('How many ' + word + ' does a ' + n + ' have?', solid(n), ans);
    return numChoice('How many ' + word + ' does a ' + n + ' have?', solid(n), ans,
      [[ans + 1, 'miscounted_sides'], [ans - 1, 'miscounted_sides'], [ans + 2, 'miscounted_sides']], t === 1 ? 3 : 4, 0, 14);
  };
  G['compare-vertices-edges-faces'] = function (t) {
    var which = ri(0, 2), word = ['corners', 'edges', 'faces'][which];
    var a = pick(SOLID_NAMES), b = pick(SOLID_NAMES.filter(function (x) { return SOLID_FACTS[x][which] !== SOLID_FACTS[a][which]; }));
    var fig = '<div class="sidebyside"><div>' + solid(a) + '<b>A</b></div><div>' + solid(b) + '<b>B</b></div></div>';
    var ans = SOLID_FACTS[a][which] > SOLID_FACTS[b][which] ? 'A' : 'B';
    return choice('Which solid has more ' + word + '?', fig, [opt('A'), opt('B')], ans);
  };
  G['shapes-traced-from-solids'] = function (t) {
    var n = pick(Object.keys(SOLID_TRACE)), flat = SOLID_TRACE[n];
    var others = shuffle(SHAPE_NAMES.filter(function (x) { return x !== flat; })).slice(0, t === 1 ? 2 : 3);
    var os = [{ value: flat, tag: null, html: shape2d(flat, C_SKY) }].concat(others.map(function (x) { return { value: x, tag: 'confused_shape_names', html: shape2d(x, C_SKY) }; }));
    return choice('If you trace round the flat face of this ' + n + ', which shape do you get?', solid(n), os, flat);
  };
  G['faces-of-3d-shapes'] = function (t) {
    var n = pick(['cube', 'cuboid', 'cylinder', 'cone', 'pyramid']);
    var ans = SOLID_FACTS[n][2];
    if (t >= 4) return number('How many flat faces does a ' + n + ' have?', solid(n), ans);
    return numChoice('How many flat faces does a ' + n + ' have?', solid(n), ans,
      [[ans + 1, 'miscounted_sides'], [ans - 1, 'miscounted_sides'], [SOLID_FACTS[n][0], 'counted_corners_instead']], t === 1 ? 3 : 4, 0, 10);
  };
  var EVERYDAY_1 = [['⚽', 'sphere'], ['🎩', 'cylinder'], ['🎂', 'cylinder'], ['📦', 'cuboid'], ['🎲', 'cube'], ['🍦', 'cone']];
  var EVERYDAY_2 = [['🥫', 'cylinder'], ['📕', 'cuboid'], ['🏀', 'sphere'], ['🧊', 'cube'], ['🎉', 'cone'], ['🥁', 'cylinder']];
  function everyday(list) {
    return function (t) {
      var p = pick(list), name = p[1];
      var os = [opt(name)].concat(shuffle(SOLID_NAMES.filter(function (x) { return x !== name; })).slice(0, t === 1 ? 2 : 3).map(function (x) { return opt(x, 'confused_shape_names'); }));
      return choice('What shape is this like?', '<div class="bigemoji">' + p[0] + '</div>', os, name);
    };
  }
  G['everyday-objects-shapes-1'] = everyday(EVERYDAY_1);
  G['everyday-objects-shapes-2'] = everyday(EVERYDAY_2);

  // ================= Section O — position =================
  function positionGrid(t, mode) {
    return function () {
      var e = shuffle(THINGS).slice(0, 9);
      var cells = grid3(e);
      var idx, q, ans;
      if (mode === 'ab') { idx = ri(0, 2); q = Math.random() < 0.5 ? ['above', idx] : ['below', idx + 6]; }
      return null;
    };
  }
  G['above-and-below'] = function (t) {
    var e = shuffle(THINGS).slice(0, 6);
    var fig = '<div class="g3two">' + e.map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div>';
    var col = ri(0, 2), above = Math.random() < 0.5;
    var target = above ? e[col] : e[col + 3], other = above ? e[col + 3] : e[col];
    var os = shuffle([e[0], e[1], e[2], e[3], e[4], e[5]]).filter(function (x) { return x !== target; }).slice(0, t === 1 ? 2 : 3)
      .map(function (x) { return { value: x, tag: 'position_word_confusion', html: '<span style="font-size:38px">' + x + '</span>' }; });
    os.unshift({ value: target, tag: null, html: '<span style="font-size:38px">' + target + '</span>' });
    return choice('Which one is ' + (above ? 'above' : 'below') + ' the ' + other + '?', fig, os, target);
  };
  G['beside-and-next-to'] = function (t) {
    var e = shuffle(THINGS).slice(0, 5);
    var fig = strip(e);
    var k = ri(1, 3), target = pick([e[k - 1], e[k + 1]]);
    var os = [{ value: target, tag: null, html: '<span style="font-size:38px">' + target + '</span>' }];
    shuffle(e.filter(function (x) { return x !== target && x !== e[k]; })).slice(0, t === 1 ? 2 : 3).forEach(function (x) {
      os.push({ value: x, tag: 'position_word_confusion', html: '<span style="font-size:38px">' + x + '</span>' });
    });
    return choice('Which one is next to the ' + e[k] + '?', fig, os, target);
  };
  G['left-middle-right'] = function (t) {
    var e = shuffle(THINGS).slice(0, 3), where = pick(['left', 'middle', 'right']);
    var target = { left: e[0], middle: e[1], right: e[2] }[where];
    var os = e.map(function (x) { return { value: x, tag: x === target ? null : 'position_word_confusion', html: '<span style="font-size:40px">' + x + '</span>' }; });
    return choice('Which one is on the ' + where + '?', strip(e), os, target);
  };
  G['top-middle-bottom'] = function (t) {
    var e = shuffle(THINGS).slice(0, 3), where = pick(['top', 'middle', 'bottom']);
    var target = { top: e[0], middle: e[1], bottom: e[2] }[where];
    var fig = '<div class="stack">' + e.map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div>';
    var os = e.map(function (x) { return { value: x, tag: x === target ? null : 'position_word_confusion', html: '<span style="font-size:40px">' + x + '</span>' }; });
    return choice('Which one is at the ' + where + '?', fig, os, target);
  };
  G['location-in-a-grid'] = function (t) {
    var e = shuffle(THINGS).slice(0, 9), r = ri(0, 2), c = ri(0, 2);
    var rows = ['top', 'middle', 'bottom'], cols = ['left', 'middle', 'right'];
    var target = e[r * 3 + c];
    var os = [{ value: target, tag: null, html: '<span style="font-size:38px">' + target + '</span>' }];
    shuffle(e.filter(function (x) { return x !== target; })).slice(0, t <= 2 ? 2 : 3).forEach(function (x) {
      os.push({ value: x, tag: 'position_word_confusion', html: '<span style="font-size:38px">' + x + '</span>' });
    });
    return choice('Which one is in the ' + rows[r] + ' row, ' + cols[c] + ' column?', grid3(e), os, target);
  };

  // ================= Section P — data =================
  function dataRows(n, max) {
    var labels = shuffle(['Cats', 'Dogs', 'Birds', 'Fish', 'Rabbits', 'Cows']).slice(0, n);
    return labels.map(function (l) { return [l, ri(1, max)]; });
  }
  G['which-pictograph-is-correct'] = function (t) {
    var rows = dataRows(2, 6), e = '⭐';
    var wrongRows = rows.map(function (r, i) { return [r[0], i === 0 ? r[1] + 1 : r[1]]; });
    var say = rows.map(function (r) { return r[0] + ': ' + r[1]; }).join(', ');
    var os = [{ value: 'A', tag: null, html: pictograph(rows, e) }, { value: 'B', tag: 'misread_graph', html: pictograph(wrongRows, e) }];
    return choice('Which picture graph shows this?\n' + say, null, shuffle(os), 'A');
  };
  G['read-pictographs'] = function (t) {
    var rows = dataRows(3, 8), e = '🍎', k = ri(0, 2);
    var fig = pictograph(rows, e);
    if (t >= 4) {
      var most = rows.slice().sort(function (a, b) { return b[1] - a[1]; });
      return number('How many more ' + most[0][0].toLowerCase() + ' than ' + most[2][0].toLowerCase() + '?', fig, most[0][1] - most[2][1]);
    }
    if (t === 3) return number('How many ' + rows[k][0].toLowerCase() + '?', fig, rows[k][1]);
    return numChoice('How many ' + rows[k][0].toLowerCase() + '?', fig, rows[k][1],
      [[rows[k][1] + 1, 'off_by_one'], [rows[(k + 1) % 3][1], 'read_wrong_row'], [rows[k][1] - 1, 'off_by_one']], t === 1 ? 3 : 4, 0, 12);
  };
  G['which-tally-chart-is-correct'] = function (t) {
    var rows = dataRows(2, 9);
    var wrong = rows.map(function (r, i) { return [r[0], i === 0 ? r[1] + 1 : r[1]]; });
    var say = rows.map(function (r) { return r[0] + ': ' + r[1]; }).join(', ');
    var os = [{ value: 'A', tag: null, html: tallyChart(rows) }, { value: 'B', tag: 'misread_tally', html: tallyChart(wrong) }];
    return choice('Which tally chart shows this?\n' + say, null, shuffle(os), 'A');
  };
  G['read-tally-charts'] = function (t) {
    var rows = dataRows(3, 12), k = ri(0, 2), fig = tallyChart(rows);
    if (t >= 3) return number('How many ' + rows[k][0].toLowerCase() + '?', fig, rows[k][1]);
    return numChoice('How many ' + rows[k][0].toLowerCase() + '?', fig, rows[k][1],
      [[rows[k][1] + 1, 'off_by_one'], [Math.ceil(rows[k][1] / 5), 'counted_groups_not_marks'], [rows[k][1] - 1, 'off_by_one']], t === 1 ? 3 : 4, 0, 20);
  };
  G['record-data-in-tables'] = function (t) {
    var e = pick(CREATURES), e2 = pick(CREATURES.filter(function (x) { return x !== e; }));
    var a = ri(2, 8), b = ri(2, 8);
    var fig = '<div class="things">' + new Array(a + 1).join('<span>' + e + '</span>') + new Array(b + 1).join('<span>' + e2 + '</span>') + '</div>';
    var askFirst = Math.random() < 0.5, ans = askFirst ? a : b;
    if (t >= 3) return number('The table needs the number of ' + (askFirst ? e : e2) + '. What number goes in?', fig, ans);
    return numChoice('How many ' + (askFirst ? e : e2) + ' would go in the table?', fig, ans,
      [[a + b, 'counted_everything'], [ans + 1, 'off_by_one'], [askFirst ? b : a, 'read_wrong_row']], t === 1 ? 3 : 4, 0, 20);
  };
  G['read-data-in-tables'] = function (t) {
    var rows = dataRows(4, 15), k = ri(0, 3);
    var fig = table(['Animal', 'How many'], rows.map(function (r) { return [r[0], r[1]]; }));
    if (t >= 4) {
      var sorted = rows.slice().sort(function (a, b) { return b[1] - a[1]; });
      return number('How many more ' + sorted[0][0].toLowerCase() + ' than ' + sorted[3][0].toLowerCase() + '?', fig, sorted[0][1] - sorted[3][1]);
    }
    if (t === 3) return number('How many ' + rows[k][0].toLowerCase() + '?', fig, rows[k][1]);
    return numChoice('How many ' + rows[k][0].toLowerCase() + '?', fig, rows[k][1],
      [[rows[(k + 1) % 4][1], 'read_wrong_row'], [rows[k][1] + 1, 'off_by_one'], [rows[k][1] - 1, 'off_by_one']], t === 1 ? 3 : 4, 0, 20);
  };

  // ================= Section Q — measurement =================
  function twoBars(len1, len2, vertical) {
    var w = 460, s = '';
    if (vertical) {
      s += '<rect x="90" y="' + (170 - len1) + '" width="60" height="' + len1 + '" fill="#A9C4A0" stroke="#6F9268" stroke-width="2"/>';
      s += '<rect x="250" y="' + (170 - len2) + '" width="60" height="' + len2 + '" fill="#F3C39A" stroke="#D9945C" stroke-width="2"/>';
      s += '<text x="120" y="190" font-size="16" text-anchor="middle">A</text><text x="280" y="190" font-size="16" text-anchor="middle">B</text>';
      return svg(w, 200, s);
    }
    s += '<rect x="20" y="30" width="' + len1 + '" height="34" fill="#A9C4A0" stroke="#6F9268" stroke-width="2"/><text x="8" y="54" font-size="16">A</text>';
    s += '<rect x="20" y="100" width="' + len2 + '" height="34" fill="#F3C39A" stroke="#D9945C" stroke-width="2"/><text x="8" y="124" font-size="16">B</text>';
    return svg(w, 150, s);
  }
  G['long-and-short'] = function (t) {
    var a = ri(80, 380), b = ri(80, 380); while (Math.abs(a - b) < 50) b = ri(80, 380);
    var want = pick(['longer', 'shorter']);
    var ans = (want === 'longer') === (a > b) ? 'A' : 'B';
    return choice('Which one is ' + want + '?', twoBars(a, b, false), [opt('A'), opt('B')], ans);
  };
  G['tall-and-short'] = function (t) {
    var a = ri(40, 150), b = ri(40, 150); while (Math.abs(a - b) < 30) b = ri(40, 150);
    var want = pick(['taller', 'shorter']);
    var ans = (want === 'taller') === (a > b) ? 'A' : 'B';
    return choice('Which one is ' + want + '?', twoBars(a, b, true), [opt('A'), opt('B')], ans);
  };
  var HEAVY = [['🪶', 1], ['🍂', 1], ['🎈', 1], ['🐘', 9], ['🚗', 8], ['🪑', 6], ['📚', 5], ['🍎', 2], ['🥄', 1], ['🧱', 7]];
  G['light-and-heavy'] = function (t) {
    var a = pick(HEAVY), b = pick(HEAVY.filter(function (x) { return Math.abs(x[1] - a[1]) >= 3; }));
    var want = pick(['heavier', 'lighter']);
    var ans = (want === 'heavier') === (a[1] > b[1]) ? 'A' : 'B';
    var fig = '<div class="sidebyside"><div class="bigemoji">' + a[0] + '</div><div class="bigemoji">' + b[0] + '</div></div><div class="sidebyside"><b>A</b><b>B</b></div>';
    return choice('Which one is ' + want + '?', fig, [opt('A'), opt('B')], ans);
  };
  G['compare-size-and-weight'] = function (t) {
    var a = pick(HEAVY), b = pick(HEAVY.filter(function (x) { return Math.abs(x[1] - a[1]) >= 3; }));
    var want = pick(['heavier', 'lighter', 'bigger', 'smaller']);
    var heavier = a[1] > b[1];
    var ans = (want === 'heavier' || want === 'bigger') === heavier ? 'A' : 'B';
    var fig = '<div class="sidebyside"><div class="bigemoji">' + a[0] + '</div><div class="bigemoji">' + b[0] + '</div></div><div class="sidebyside"><b>A</b><b>B</b></div>';
    return choice('Which one is ' + want + '?', fig, [opt('A'), opt('B')], ans);
  };
  G['measure-with-cubes'] = function (t) {
    var n = ri(3, t <= 2 ? 8 : 14);
    var fig = cubesRuler(n, pick(['✏️', '🥕', '🖍️', '🔧']));
    if (t >= 3) return number('How many cubes long is it?', fig, n);
    return numChoice('How many cubes long is it?', fig, n, [[n + 1, 'off_by_one'], [n - 1, 'off_by_one'], [n + 2, 'miscounted']], t === 1 ? 3 : 4, 1, 20);
  };
  G['measure-length-cm'] = function (t) {
    var n = ri(2, t <= 2 ? 8 : 15), px = n * 26;
    var s = '<rect x="30" y="20" width="' + px + '" height="26" fill="#A9C4A0" stroke="#6F9268" stroke-width="2"/>';
    s += '<line x1="30" y1="70" x2="' + (30 + 26 * 15) + '" y2="70" stroke="#C9BCA9" stroke-width="3"/>';
    for (var i = 0; i <= 15; i++) {
      s += '<line x1="' + (30 + i * 26) + '" y1="62" x2="' + (30 + i * 26) + '" y2="78" stroke="#C9BCA9" stroke-width="2"/>';
      s += '<text x="' + (30 + i * 26) + '" y="96" font-size="12" text-anchor="middle">' + i + '</text>';
    }
    var fig = svg(30 + 26 * 15 + 20, 110, s);
    if (t >= 3) return number('How many centimetres long is it?', fig, n);
    return numChoice('How many centimetres long is it?', fig, n, [[n + 1, 'off_by_one'], [n - 1, 'started_at_one'], [n + 2, 'miscounted']], t === 1 ? 3 : 4, 1, 16);
  };

  // ================= Section R — money =================
  G['coin-and-note-values'] = function (t) {
    var isNote = Math.random() < 0.5, v = isNote ? pick(NOTES) : pick(COINS);
    var fig = isNote ? moneyPile([], [v]) : moneyPile([v], []);
    var os = [opt(v)], pool = (isNote ? NOTES : COINS).filter(function (x) { return x !== v; });
    shuffle(pool).slice(0, t === 1 ? 2 : 3).forEach(function (x) { os.push(opt(x, 'confused_coin_values')); });
    return choice('How much is this worth?', fig, os.map(function (o) { return { value: o.value, tag: o.tag, html: '₹' + o.value }; }), v);
  };
  G['count-coins'] = function (t) {
    var n = ri(2, t <= 2 ? 4 : 6), coins = [], total = 0, i;
    for (i = 0; i < n; i++) { var c = pick(t <= 2 ? [1, 2, 5] : COINS); coins.push(c); total += c; }
    var fig = moneyPile(coins, []);
    if (t >= 3) return number('How many rupees altogether?', fig, total);
    return rupeeChoice('How much money altogether?', fig, total, [[n, 'counted_coins_not_value'], [total + 1, 'off_by_one'], [total - 1, 'off_by_one']], t === 1 ? 3 : 4);
  };
  G['count-notes'] = function (t) {
    var n = ri(2, t <= 2 ? 3 : 4), notes = [], total = 0, i;
    for (i = 0; i < n; i++) { var c = pick(t <= 2 ? [10, 20] : NOTES); notes.push(c); total += c; }
    var fig = moneyPile([], notes);
    if (t >= 3) return number('How many rupees altogether?', fig, total);
    return rupeeChoice('How much money altogether?', fig, total, [[n, 'counted_notes_not_value'], [total + 10, 'off_by_ten'], [total - 10, 'off_by_ten']], t === 1 ? 3 : 4);
  };
  G['count-coins-and-notes'] = function (t) {
    var notes = [pick([10, 20])], coins = [], total = notes[0], i, n = ri(1, t <= 2 ? 2 : 4);
    for (i = 0; i < n; i++) { var c = pick(COINS); coins.push(c); total += c; }
    if (t >= 4) { notes.push(pick(NOTES)); total += notes[1]; }
    var fig = moneyPile(coins, notes);
    if (t >= 3) return number('How many rupees altogether?', fig, total);
    return rupeeChoice('How much money altogether?', fig, total,
      [[coins.length + notes.length, 'counted_coins_not_value'], [total - notes[0], 'left_out_the_note'], [total + 1, 'off_by_one']], t === 1 ? 3 : 4);
  };
  G['compare-money-amounts'] = function (t) {
    var a = ri(3, 60), b = ri(3, 60); while (a === b) b = ri(3, 60);
    var item1 = pick(['a pencil', 'a rubber', 'a kite', 'a ball', 'a book']), item2 = pick(['a toy car', 'a laddoo', 'a balloon', 'a cap']);
    var want = pick(['more', 'less']);
    var ans = (want === 'more') === (a > b) ? item1 : item2;
    var os = [opt(item1, ans === item1 ? null : 'compared_wrongly'), opt(item2, ans === item2 ? null : 'compared_wrongly')];
    return choice(item1 + ' costs ₹' + a + '. ' + item2 + ' costs ₹' + b + '.\nWhich costs ' + want + '?', null, os, ans);
  };

  // ================= Section S — patterns =================
  var TOK = {
    greenCircle: '<i class="pc circle" style="--pc:#A9C4A0"></i>',
    greenSquare: '<i class="pc square" style="--pc:#A9C4A0"></i>',
    blueCircle:  '<i class="pc circle" style="--pc:#A8C0D6"></i>',
    blueSquare:  '<i class="pc square" style="--pc:#A8C0D6"></i>',
    apricotTri:  '<i class="pc tri" style="--pc:#F3C39A"></i>'
  };
  var PAT = [
    { k: 'a', h: '<i class="pc circle" style="--pc:#A9C4A0"></i>' },
    { k: 'b', h: '<i class="pc square" style="--pc:#A8C0D6"></i>' },
    { k: 'c', h: '<i class="pc tri" style="--pc:#F3C39A"></i>' },
    { k: 'd', h: '<i class="pc circle" style="--pc:#E9B3AA"></i>' },
    { k: 'e', h: '<i class="pc square" style="--pc:#CFC3A9"></i>' },
    { k: 'f', h: '<i class="pc tri" style="--pc:#B7C9A8"></i>' }
  ];
  function patSeq(unit, reps) { var o = [], i, j; for (i = 0; i < reps; i++) for (j = 0; j < unit.length; j++) o.push(unit[j]); return o; }
  function patStrip(items) {
    return '<div class="strip pat">' + items.map(function (i) { return i === '?' ? '<span class="q">?</span>' : '<span>' + i.h + '</span>'; }).join('') + '</div>';
  }
  function patOpts(answer, pool, n) {
    var os = [{ value: answer.k, tag: null, html: answer.h }];
    shuffle(pool.filter(function (x) { return x.k !== answer.k; })).slice(0, n - 1).forEach(function (x) {
      os.push({ value: x.k, tag: 'pattern_unit_wrong', html: x.h });
    });
    return os;
  }
  function rowOf(item, n) { return new Array(n + 1).join(item.h); }

  G['intro-to-patterns'] = function (t) {
    var e = shuffle(PAT).slice(0, 2), isPattern = Math.random() < 0.5;
    var seq = isPattern ? patSeq(e, 3) : [e[0], e[1], e[0], e[0], e[1], e[1]];
    return choice('Does this repeat in the same way again and again?', patStrip(seq), [opt('yes'), opt('no')], isPattern ? 'yes' : 'no');
  };
  G['next-shape-in-pattern'] = function (t) {
    var len = t <= 2 ? 2 : 3, e = shuffle(PAT).slice(0, len);
    var seq = patSeq(e, 3), ans = e[seq.length % len];
    return choice('What comes next?', patStrip(seq.concat(['?'])), patOpts(ans, PAT, t === 1 ? 3 : 4), ans.k);
  };
  G['complete-a-pattern'] = function (t) {
    var len = t <= 2 ? 2 : 3, e = shuffle(PAT).slice(0, len);
    var seq = patSeq(e, 3), hole = ri(2, seq.length - 2), ans = seq[hole];
    var shown = seq.slice(); shown[hole] = '?';
    return choice('What is missing?', patStrip(shown), patOpts(ans, PAT, t === 1 ? 3 : 4), ans.k);
  };
  G['make-a-pattern'] = function (t) {
    var e = shuffle(PAT).slice(0, 2), seq = patSeq(e, 2);
    var os = [
      { value: 'right', tag: null, html: e[0].h + e[1].h },
      { value: 'swapped', tag: 'pattern_unit_wrong', html: e[1].h + e[0].h },
      { value: 'doubled', tag: 'pattern_unit_wrong', html: e[0].h + e[0].h }
    ];
    return choice('Which two would carry this pattern on?', patStrip(seq.concat(['?', '?'])), os, 'right');
  };
  G['growing-patterns'] = function (t) {
    var step = pick([1, 2]), start = ri(1, 3), item = pick(PAT), rows = [], i;
    for (i = 0; i < 4; i++) rows.push(start + i * step);
    var fig = '<div class="grow">' + rows.map(function (n) { return '<div>' + rowOf(item, n) + '</div>'; }).join('') + '</div>';
    return choice('Is this pattern growing or repeating?', fig, [opt('growing'), opt('repeating')], 'growing');
  };
  G['next-shape-growing-pattern'] = function (t) {
    var step = pick([1, 2, 3]), start = ri(1, 3), item = pick(PAT), rows = [], i;
    for (i = 0; i < 4; i++) rows.push(start + i * step);
    var ans = start + 4 * step;
    var fig = '<div class="grow">' + rows.map(function (n) { return '<div>' + rowOf(item, n) + '</div>'; }).join('') + '<div class="q">?</div></div>';
    if (t >= 4) return number('How many in the next row?', fig, ans);
    return numChoice('How many in the next row?', fig, ans, [[ans - step, 'stayed_the_same'], [ans + step, 'wrong_step'], [ans + 1, 'off_by_one']], t === 1 ? 3 : 4, 0);
  };
  G['next-row-growing-pattern'] = function (t) {
    var step = pick([2, 3]), start = ri(1, 3), item = pick(PAT), rows = [], i;
    for (i = 0; i < 3; i++) rows.push(start + i * step);
    var ans = start + 3 * step;
    var fig = '<div class="grow">' + rows.map(function (n) { return '<div>' + rowOf(item, n) + '</div>'; }).join('') + '<div class="q">?</div></div>';
    if (t >= 4) return number('How many would be in the next row?', fig, ans);
    var os = [{ value: String(ans), tag: null, html: rowOf(item, ans) },
      { value: String(ans - step), tag: 'stayed_the_same', html: rowOf(item, ans - step) },
      { value: String(ans + step), tag: 'wrong_step', html: rowOf(item, ans + step) }];
    return choice('Which row comes next?', fig, os, String(ans));
  };

  // ================= Section T — likelihood =================
  G['more-less-equally-likely'] = function (t) {
    var a = ri(1, 9), b = ri(1, 9);
    var fig = '<div class="bag">' + new Array(a + 1).join(TOK.greenCircle) + new Array(b + 1).join(TOK.blueCircle) + '</div>';
    var green = Math.random() < 0.5;
    var mine = green ? a : b, other = green ? b : a;
    var ans = mine > other ? 'more likely' : (mine < other ? 'less likely' : 'just as likely');
    return choice('You take one without looking. Getting a ' + (green ? 'green' : 'blue') + ' one is…', fig,
      [opt('more likely'), opt('less likely'), opt('just as likely')], ans);
  };
  G['certain-or-impossible'] = function (t) {
    var a = ri(0, 8), b = 8 - a;
    var fig = '<div class="bag">' + new Array(a + 1).join(TOK.greenCircle) + new Array(b + 1).join(TOK.blueCircle) + '</div>';
    var green = Math.random() < 0.5;
    var mine = green ? a : b;
    var ans = mine === 0 ? 'impossible' : (mine === 8 ? 'certain' : (mine > 4 ? 'likely' : 'unlikely'));
    return choice('You take one without looking. Getting a ' + (green ? 'green' : 'blue') + ' one is…', fig,
      [opt('certain'), opt('likely'), opt('unlikely'), opt('impossible')], ans);
  };

  // ================= Section U — sorting and ordering =================
  G['sort-shapes-venn'] = function (t) {
    var thing = pick([[TOK.greenCircle, 1, 1], [TOK.greenSquare, 1, 0], [TOK.blueCircle, 0, 1], [TOK.blueSquare, 0, 0]]);
    var item = thing[0], isGreen = thing[1] === 1, isRound = thing[2] === 1;
    var fig = venn('green', 'round', [TOK.greenSquare], [TOK.blueCircle], [TOK.greenCircle]);
    var ans = isGreen && isRound ? 'the middle' : (isGreen ? 'green only' : (isRound ? 'round only' : 'outside both'));
    return choice('Where does ' + item + ' belong?', fig,
      [opt('green only'), opt('the middle'), opt('round only'), opt('outside both')], ans);
  };
  G['count-shapes-venn'] = function (t) {
    var a = ri(1, 4), b = ri(1, 4), both = ri(1, 3);
    var fig = venn('blue', 'round', [new Array(a + 1).join(TOK.blueSquare)], [new Array(b + 1).join(TOK.greenCircle)], [new Array(both + 1).join(TOK.blueCircle)]);
    var which = pick([['in the middle', both], ['in the blue circle altogether', a + both], ['in the round circle altogether', b + both]]);
    if (t >= 4) return number('How many are ' + which[0] + '?', fig, which[1]);
    return numChoice('How many are ' + which[0] + '?', fig, which[1],
      [[which[1] + 1, 'off_by_one'], [which[1] - both, 'forgot_the_middle'], [a + b + both, 'counted_everything']], t === 1 ? 3 : 4, 0, 20);
  };
  G['put-numbers-in-order'] = function (t) {
    var max = t <= 2 ? 20 : 99, ns = [], i;
    while (ns.length < 3) { var v = ri(1, max); if (ns.indexOf(v) === -1) ns.push(v); }
    var up = Math.random() < 0.5;
    var sorted = ns.slice().sort(function (a, b) { return up ? a - b : b - a; });
    var wrong1 = ns.slice().sort(function (a, b) { return up ? b - a : a - b; });
    var wrong2 = shuffle(ns);
    while (wrong2.join() === sorted.join() || wrong2.join() === wrong1.join()) wrong2 = shuffle(ns);
    var os = [opt(sorted.join(', ')), opt(wrong1.join(', '), 'wrong_direction'), opt(wrong2.join(', '), 'not_ordered')];
    return choice('Put these in order from ' + (up ? 'smallest to biggest' : 'biggest to smallest') + ':\n' + ns.join(', '), null, os, sorted.join(', '));
  };

  // ================= Section V — time and calendar =================
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  G['days-of-the-week'] = function (t) {
    var i = ri(0, 6), after = Math.random() < 0.5;
    var ans = DAYS[(i + (after ? 1 : 6)) % 7];
    var os = [opt(ans)];
    shuffle(DAYS.filter(function (d) { return d !== ans; })).slice(0, t === 1 ? 2 : 3).forEach(function (d) { os.push(opt(d, 'day_order_confusion')); });
    return choice('Which day comes ' + (after ? 'after' : 'before') + ' ' + DAYS[i] + '?', null, os, ans);
  };
  G['months-of-the-year'] = function (t) {
    var i = ri(0, 11), after = Math.random() < 0.5;
    var ans = MONTHS[(i + (after ? 1 : 11)) % 12];
    var os = [opt(ans)];
    shuffle(MONTHS.filter(function (m) { return m !== ans; })).slice(0, t === 1 ? 2 : 3).forEach(function (m) { os.push(opt(m, 'month_order_confusion')); });
    return choice('Which month comes ' + (after ? 'after' : 'before') + ' ' + MONTHS[i] + '?', null, os, ans);
  };
  G['seasons-of-the-year'] = function (t) {
    var SEASONS = [['summer', '☀️', 'hot and dry'], ['monsoon', '🌧️', 'rainy'], ['winter', '❄️', 'cold'], ['spring', '🌸', 'flowers come out']];
    var s = pick(SEASONS);
    var os = [opt(s[0])];
    shuffle(SEASONS.filter(function (x) { return x[0] !== s[0]; })).slice(0, t === 1 ? 2 : 3).forEach(function (x) { os.push(opt(x[0], 'season_confusion')); });
    return choice('Which season is ' + s[2] + '?', '<div class="bigemoji">' + s[1] + '</div>', os, s[0]);
  };
  G['read-a-calendar'] = function (t) {
    var startDow = ri(0, 6), days = 30, cells = [], i;
    for (i = 0; i < startDow; i++) cells.push('');
    for (i = 1; i <= days; i++) cells.push(i);
    var s = '<table class="cal"><tr>' + ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(function (d) { return '<th>' + d + '</th>'; }).join('') + '</tr><tr>';
    cells.forEach(function (c, idx) { s += '<td>' + c + '</td>'; if ((idx + 1) % 7 === 0) s += '</tr><tr>'; });
    s += '</tr></table>';
    var date = ri(1, days), dow = DAYS[(startDow + date - 1) % 7];
    if (t >= 4) return number('How many ' + dow + 's are in this month?', s, cells.filter(function (c) { return c !== ''; }).filter(function (c, idx) { return (startDow + c - 1) % 7 === (startDow + date - 1) % 7; }).length);
    var os = [opt(dow)];
    shuffle(DAYS.filter(function (d) { return d !== dow; })).slice(0, t === 1 ? 2 : 3).forEach(function (d) { os.push(opt(d, 'calendar_row_confusion')); });
    return choice('What day of the week is the ' + ord(date) + '?', s, os, dow);
  };
  G['read-clock-to-hour'] = function (t) {
    var h = ri(1, 12);
    if (t >= 4) return number('What time is it? Write only the hour.', clock(h, 0), h);
    var os = [opt(timeText(h, 0))];
    [h === 12 ? 1 : h + 1, h === 1 ? 12 : h - 1, (h + 5) % 12 + 1].forEach(function (x) {
      if (os.length < (t === 1 ? 3 : 4)) os.push(opt(timeText(x, 0), 'read_hour_hand_wrong'));
    });
    return choice('What time is it?', clock(h, 0), os, timeText(h, 0));
  };
  G['read-clock-to-half-hour'] = function (t) {
    var h = ri(1, 12), m = pick([0, 30]);
    if (t >= 5) return number('What time is it? Write the minutes only (00 or 30).', clock(h, m), m === 0 ? 0 : 30);
    var os = [opt(timeText(h, m))];
    var cands = [timeText(h, m === 0 ? 30 : 0), timeText(h === 12 ? 1 : h + 1, m), timeText(h === 1 ? 12 : h - 1, m === 0 ? 30 : 0)];
    cands.forEach(function (c) { if (os.length < (t === 1 ? 3 : 4) && c !== timeText(h, m)) os.push(opt(c, 'read_half_hour_wrong')); });
    return choice('What time is it?', clock(h, m), os, timeText(h, m));
  };
  G['match-clock-to-time'] = function (t) {
    var h = ri(1, 12), m = pick([0, 30]);
    var wrongs = [[h, m === 0 ? 30 : 0], [h === 12 ? 1 : h + 1, m], [h === 1 ? 12 : h - 1, m]];
    var os = [{ value: 'A', tag: null, html: clock(h, m) }];
    shuffle(wrongs).slice(0, t === 1 ? 1 : 2).forEach(function (w, i) {
      os.push({ value: 'W' + i, tag: 'read_hour_hand_wrong', html: clock(w[0], w[1]) });
    });
    return choice('Which clock shows ' + timeText(h, m) + '?', null, os, 'A');
  };
  G['am-or-pm'] = function (t) {
    var EV = [['eating breakfast', 'morning'], ['going to bed', 'evening'], ['the sun coming up', 'morning'],
      ['dinner with the family', 'evening'], ['school assembly', 'morning'], ['stars in the sky', 'evening']];
    var e = pick(EV);
    return choice('When does this happen?', null, [opt('morning'), opt('evening')], e[1] === 'morning' ? 'morning' : 'evening');
  };

  // ================= Section W — mixed operations =================
  G['ways-to-make-a-number-mixed'] = function (t) {
    var target = ri(4, t <= 2 ? 10 : 18);
    var useAdd = Math.random() < 0.5;
    var right = useAdd ? (ri(1, target - 1) + ' + ' + 0) : '';
    var a = ri(1, target - 1);
    right = useAdd ? (a + ' + ' + (target - a)) : ((target + a) + ' − ' + a);
    var os = [opt(right)], used = {}, guard = 0; used[right] = 1;
    while (os.length < (t === 1 ? 3 : 4) && guard++ < 80) {
      var x = ri(1, 18), y = ri(1, 18), plus = Math.random() < 0.5;
      var v = plus ? x + y : x - y, key = x + (plus ? ' + ' : ' − ') + y;
      if (v === target || used[key] || v < 0) continue;
      used[key] = 1; os.push(opt(key, Math.abs(v - target) === 1 ? 'off_by_one' : 'wrong_total'));
    }
    return choice('Which one makes ' + target + '?', null, os, right);
  };
  G['which-sign-makes-it-true'] = function (t) {
    var max = t <= 2 ? 10 : 20, a = ri(2, max), b = ri(1, a - 1);
    var plus = Math.random() < 0.5, res = plus ? a + b : a - b;
    return choice('Which sign makes it true?\n' + a + '  ☐  ' + b + ' = ' + res, null,
      [opt('+', plus ? null : 'used_wrong_operation'), opt('−', plus ? 'used_wrong_operation' : null)], plus ? '+' : '−');
  };
  G['fact-families'] = function (t) {
    var a = ri(1, 9), b = ri(1, 9), s = a + b;
    if (t >= 4) return number('The family is ' + a + ', ' + b + ' and ' + s + '.\n' + s + ' − ' + a + ' = ?', null, b);
    if (t === 3) return number('The family is ' + a + ', ' + b + ' and ' + s + '.\n' + b + ' + ' + a + ' = ?', null, s);
    var right = s + ' − ' + b + ' = ' + a;
    var os = [opt(right), opt(s + ' − ' + a + ' = ' + s, 'confused_the_parts'), opt(a + ' + ' + s + ' = ' + b, 'wrong_numbers')];
    if (t === 2) os.push(opt(s + ' + ' + a + ' = ' + b, 'used_wrong_operation'));
    return choice('These belong to one fact family: ' + a + ', ' + b + ', ' + s + '.\nWhich sentence is true?', null, os, right);
  };
  G['add-subtract-facts-to-10'] = function (t) {
    return Math.random() < 0.5 ? addFactsGen(10)(t) : subFactsGen(10)(t);
  };
  G['add-subtract-facts-to-18'] = function (t) {
    return Math.random() < 0.5 ? addFactsGen(18)(t) : subFactsGen(18)(t);
  };
  G['add-subtract-word-problems'] = function (t) {
    return Math.random() < 0.5 ? wordProblemAdd(t <= 2 ? 10 : 18)(t) : wordProblemSub(t <= 2 ? 10 : 18)(t);
  };
  G['addition-subtraction-terms'] = function (t) {
    var TERMS = [['add', '+'], ['plus', '+'], ['altogether', '+'], ['in all', '+'], ['more', '+'],
      ['take away', '−'], ['minus', '−'], ['left', '−'], ['fewer', '−'], ['gave away', '−']];
    var term = pick(TERMS);
    return choice('Does the word "' + term[0] + '" tell you to add or take away?', null,
      [opt('add', term[1] === '+' ? null : 'used_wrong_operation'), opt('take away', term[1] === '−' ? null : 'used_wrong_operation')],
      term[1] === '+' ? 'add' : 'take away');
  };

  // ---------- public API ----------
  function make(slug, tier) {
    var fn = G[slug];
    if (!fn) return null;
    var item, guard = 0;
    do { item = fn(Math.max(1, tier)); guard++; } while (!item && guard < 5);
    if (!item) return null;
    item.slug = slug; item.tier = tier;
    return item;
  }

  global.Gen = { make: make, has: function (s) { return !!G[s]; }, slugs: Object.keys(G) };
})(window);
