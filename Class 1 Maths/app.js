/* app.js — screens, the session loop, and the grown-up view. */

(function () {
  'use strict';

  var E = window.Engine, Gen = window.Gen;
  var app = document.getElementById('app');
  var QUESTIONS_PER_SESSION = 10;
  var STICKERS = ['🌟', '🌈', '🐣', '🦋', '🌻', '🐢', '🍀', '🐬', '🎈', '🌸', '🐝', '🦉'];

  var session = null;

  // ---------- helpers ----------
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function show(node) { app.innerHTML = ''; app.appendChild(node); window.scrollTo(0, 0); }
  function pct(x) { return Math.round(x * 100); }

  // ================= home =================
  function home() {
    var s = E.summary();
    var focus = E.nextFocus();
    var title = E.SKILL[focus].title;
    var shelf = E.state.awardsShown.slice(-12).map(function (a) { return '<span>' + a + '</span>'; }).join('');

    var node = el(
      '<div class="screen home">' +
      '<h1>Maths time</h1>' +
      '<p class="sub">Ten questions. Take your time.</p>' +
      '<div class="card today"><div class="eyebrow">Today we practise</div>' +
      '<div class="name">' + esc(title) + '</div></div>' +
      '<button class="big-btn" id="start">Start</button>' +
      (s.days ? '<div class="streak">You have practised on ' + s.days + ' day' + (s.days === 1 ? '' : 's') + '.</div>' : '') +
      (shelf ? '<div class="sticker-shelf">' + shelf + '</div>' : '') +
      '</div>');
    node.querySelector('#start').onclick = startSession;
    show(node);
  }

  // ================= session =================
  function buildPlan() {
    var focus = E.nextFocus();
    var review = E.reviewPool().slice(0, 2);
    var plan = [];
    review.forEach(function (r) { plan.push(r); });
    while (plan.length < QUESTIONS_PER_SESSION) plan.push(focus);
    return { focus: focus, plan: plan };
  }

  function startSession() {
    var p = buildPlan();
    session = {
      focus: p.focus, plan: p.plan, i: 0, results: [],
      tier: {}, runRight: {}, runWrong: {}, mastered: [], correct: 0
    };
    E.markPractised();
    askQuestion();
  }

  function currentSlug() {
    var slug = session.plan[session.i];
    // if the focus skill got mastered mid-session, move on to the next one
    if (slug === session.focus && E.isMastered(slug)) {
      var next = E.nextFocus();
      if (next !== slug) {
        session.focus = next;
        for (var j = session.i; j < session.plan.length; j++) if (session.plan[j] === slug) session.plan[j] = next;
        slug = next;
      }
    }
    return slug;
  }

  function askQuestion() {
    if (session.i >= QUESTIONS_PER_SESSION) return endSession();
    var slug = currentSlug();
    if (session.tier[slug] == null) session.tier[slug] = E.startTier(slug);
    var tier = Math.min(session.tier[slug], E.SKILL[slug].maxTier);
    var item = Gen.make(slug, tier);
    if (!item) { session.i++; return askQuestion(); }
    session.item = item;
    renderQuestion(item);
  }

  function stonesHTML() {
    var s = '', i;
    for (i = 0; i < QUESTIONS_PER_SESSION; i++) {
      var cls = 'stone';
      if (i < session.results.length) cls += session.results[i] ? ' hit' : ' miss';
      else if (i === session.results.length) cls += ' now';
      s += '<div class="' + cls + '"></div>';
    }
    return '<div class="stones">' + s + '</div>';
  }

  function renderQuestion(item) {
    var node = el(
      '<div class="screen">' +
      '<div class="qhead"><span>Question ' + (session.i + 1) + ' of ' + QUESTIONS_PER_SESSION + '</span>' +
      '<button class="quit" id="quit">Stop for now</button></div>' +
      stonesHTML() +
      '<div class="prompt">' + esc(item.prompt).replace(/\n/g, '<br>') + '</div>' +
      (item.figure ? '<div class="figure">' + item.figure + '</div>' : '') +
      '<div id="answerzone"></div>' +
      '<div class="feedback" id="feedback"></div>' +
      '</div>');
    node.querySelector('#quit').onclick = function () { finishAndSave(); home(); };
    show(node);

    var zone = node.querySelector('#answerzone');
    if (item.widget === 'number') renderKeypad(zone, item);
    else renderOptions(zone, item);
  }

  function renderOptions(zone, item) {
    var wrap = el('<div class="options"></div>');
    item.options.forEach(function (o) {
      var b = document.createElement('button');
      b.className = 'opt';
      b.innerHTML = o.html || esc(o.value);
      b.onclick = function () {
        if (zone.dataset.done) return;
        zone.dataset.done = '1';
        var right = String(o.value) === String(item.answer);
        b.classList.add(right ? 'right' : 'wrong');
        if (!right) {
          Array.prototype.forEach.call(wrap.children, function (c, idx) {
            if (String(item.options[idx].value) === String(item.answer)) c.classList.add('right');
          });
        }
        answered(right, o.tag);
      };
      wrap.appendChild(b);
    });
    zone.appendChild(wrap);
  }

  function renderKeypad(zone, item) {
    var box = el('<div class="answerbox" id="box"></div>');
    var pad = el('<div class="keypad"></div>');
    zone.appendChild(box); zone.appendChild(pad);
    var val = '';

    function paint() { box.textContent = val || ''; }

    function submit() {
      if (zone.dataset.done || val === '') return;
      zone.dataset.done = '1';
      var right = String(Number(val)) === String(Number(item.answer));
      box.classList.add(right ? 'right' : 'wrong');
      answered(right, null, val);
    }

    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].forEach(function (k) {
      var b = document.createElement('button');
      b.className = 'key' + (k === '✓' ? ' ok' : (k === '⌫' ? ' del' : ''));
      b.textContent = k;
      b.onclick = function () {
        if (zone.dataset.done) return;
        if (k === '⌫') val = val.slice(0, -1);
        else if (k === '✓') return submit();
        else if (val.length < 3) val += k;
        paint();
      };
      pad.appendChild(b);
    });

    zone._keys = function (e) {
      if (zone.dataset.done) return;
      if (/^[0-9]$/.test(e.key)) { if (val.length < 3) val += e.key; paint(); }
      else if (e.key === 'Backspace') { val = val.slice(0, -1); paint(); }
      else if (e.key === 'Enter') submit();
    };
    document.addEventListener('keydown', zone._keys);
    paint();
  }

  function answered(right, tag, typed) {
    var item = session.item, slug = item.slug;

    // a typed answer that matches a known wrong pattern still tells us why
    if (!right && typed != null && !tag) tag = diagnose(item, Number(typed));

    var status = E.grade(slug, right, item.tier, item.widget, tag);
    if (status === 'mastered' && session.mastered.indexOf(slug) === -1) session.mastered.push(slug);

    session.results.push(right);
    if (right) session.correct++;
    session.runRight[slug] = right ? (session.runRight[slug] || 0) + 1 : 0;
    session.runWrong[slug] = right ? 0 : (session.runWrong[slug] || 0) + 1;
    var newTier = E.moveTier(slug, item.tier, session.runRight[slug], session.runWrong[slug]);
    if (newTier !== item.tier) { session.runRight[slug] = 0; session.runWrong[slug] = 0; }
    session.tier[slug] = newTier;

    var fb = document.getElementById('feedback');
    var kindWord = right ? ['Yes!', 'That\'s it.', 'Well done.', 'Correct.'][Math.floor(Math.random() * 4)] : 'Not quite.';
    fb.innerHTML =
      '<div class="fb-word ' + (right ? 'good' : 'soft') + '">' + kindWord + '</div>' +
      (right ? '' : '<div class="fb-hint">The answer is ' + esc(item.answer) + '.</div>') +
      '<button class="next-btn" id="next">' + (session.i + 1 >= QUESTIONS_PER_SESSION ? 'Finish' : 'Next') + '</button>';
    var nb = document.getElementById('next');
    nb.onclick = nextQuestion;
    nb.focus();
    document.querySelectorAll('.stone').forEach(function (s, i) {
      s.className = 'stone' + (i < session.results.length ? (session.results[i] ? ' hit' : ' miss') : '');
    });
  }

  function nextQuestion() {
    var zone = document.getElementById('answerzone');
    if (zone && zone._keys) document.removeEventListener('keydown', zone._keys);
    session.i++;
    askQuestion();
  }

  /* Match a typed wrong answer against the distractors this item would have
     offered, so we learn the same thing we would from a tap. */
  function diagnose(item, typed) {
    var probe = Gen.make(item.slug, item.tier);
    if (probe && probe.options) {
      for (var i = 0; i < probe.options.length; i++) {
        if (Number(probe.options[i].value) === typed && probe.options[i].tag) return null;
      }
    }
    var a = Number(item.answer);
    if (Math.abs(typed - a) === 1) return 'off_by_one';
    if (Math.abs(typed - a) === 10) return 'off_by_ten';
    return null;
  }

  function finishAndSave() {
    E.save();
    var zone = document.getElementById('answerzone');
    if (zone && zone._keys) document.removeEventListener('keydown', zone._keys);
  }

  function endSession() {
    finishAndSave();
    var award = null;
    if (session.mastered.length) {
      award = STICKERS[Math.floor(Math.random() * STICKERS.length)];
      E.state.awardsShown.push(award);
      E.save();
    }
    var line;
    if (session.mastered.length) line = 'You finished ' + E.SKILL[session.mastered[0]].title.toLowerCase() + '.';
    else if (session.correct >= 8) line = 'You got ' + session.correct + ' out of ' + QUESTIONS_PER_SESSION + '.';
    else line = 'Good work. Practising is how it gets easier.';

    var node = el(
      '<div class="screen end">' +
      '<span class="award">' + (award || '🌤️') + '</span>' +
      '<h2>All done</h2>' +
      '<p>' + esc(line) + '</p>' +
      '<button class="big-btn apricot" id="again">Play again</button> ' +
      '<button class="big-btn sky" id="home">Finish</button>' +
      '</div>');
    node.querySelector('#again').onclick = startSession;
    node.querySelector('#home').onclick = home;
    show(node);
  }

  // ================= grown-up view =================
  var MIS = {
    off_by_one: 'counts one too many or too few',
    off_by_ten: 'slips by ten — a place-value wobble',
    off_by_two: 'slips by two',
    place_value_confusion: 'muddles tens with ones',
    reversed_digits: 'writes the digits the wrong way round',
    used_wrong_operation: 'adds when the question says take away, or the reverse',
    counted_addend_only: 'gives back one of the numbers instead of the total',
    counted_one_group: 'counts only one of the two groups',
    took_nothing_away: 'gives the starting number back',
    counted_the_crossed_ones: 'counts what was taken away, not what is left',
    forgot_to_regroup: 'does not carry or borrow across the ten',
    gave_the_total: 'gives the total when the missing part was wanted',
    gave_the_answer: 'repeats the answer already shown',
    left_out_a_number: 'adds only two of the three numbers',
    used_double_only: 'uses the double and forgets the extra one',
    counted_hops_only: 'counts the jumps but not where they start',
    counted_the_start_number: 'counts the starting number as a jump',
    confused_shape_names: 'mixes up shape names',
    miscounted_sides: 'miscounts sides, corners or edges',
    confused_coin_values: 'mixes up what the coins are worth',
    counted_coins_not_value: 'counts how many coins, not how much money',
    counted_notes_not_value: 'counts how many notes, not how much money',
    read_hour_hand_wrong: 'reads the wrong hand on the clock',
    read_half_hour_wrong: 'muddles o\'clock with half past',
    confused_more_fewer: 'mixes up which side is bigger',
    position_word_confusion: 'mixes up position words',
    pattern_unit_wrong: 'does not spot the repeating part',
    day_order_confusion: 'unsure of the order of the days',
    month_order_confusion: 'unsure of the order of the months',
    wrong_step: 'counts on by the wrong amount',
    wrong_direction: 'counts the wrong way',
    read_wrong_row: 'reads the wrong row of the chart',
    counted_groups_not_marks: 'counts groups of tallies as one',
    zero_makes_zero: 'thinks adding zero gives zero',
    confused_zero_and_all: 'muddles taking none with taking all',
    confused_the_parts: 'mixes up the two parts of the fact family',
    unmatched_wrong: 'wrong answer with no clear pattern'
  };

  function bar(v) {
    var cls = v >= 0.9 ? '' : (v >= 0.6 ? 'mid' : 'low');
    return '<div class="bar"><i class="' + cls + '" style="width:' + Math.round(v * 100) + '%"></i></div><div class="pct">' + pct(v) + '%</div>';
  }

  function mapState(slug, focus) {
    if (slug === focus) return 'now';
    if (E.isMastered(slug)) return E.needsReview(slug) ? 'm review' : 'm';
    if (E.rec(slug)) return 'd';
    return E.ready(slug) ? 'r' : 'l';
  }

  function detailHTML(slug, isFocus) {
    var sk = E.SKILL[slug], r = E.rec(slug);
    var sec = E.SECTION[sk.section];
    var state = r ? (r.status === 'mastered' ? (E.needsReview(slug) ? 'mastered — worth a refresh' : 'mastered') : 'started, still building')
      : (E.ready(slug) ? 'ready to try' : 'waiting on earlier skills');
    var pre = (sk.prerequisiteSkillIds || []).map(function (p) {
      return '<span class="prereq' + (E.isMastered(p) ? ' ok' : '') + '">' + esc(E.SKILL[p].title) + '</span>';
    }).join('');
    return '<div class="dsec">' + sk.section + ' · ' + esc(sec.title) + (isFocus ? ' <span class="pill">up next</span>' : '') + '</div>' +
      '<div class="dtitle">' + esc(sk.title) + '</div>' +
      '<div class="drow">' + (r ? bar(E.effective(slug)) : '<div class="bar"></div><div class="pct">—</div>') +
      '<span class="dstate">' + state + '</span>' +
      (r ? '<span class="pill">' + r.correct + '/' + r.attempts + ' right</span>' : '') + '</div>' +
      (pre ? '<div class="dpre"><b>Needs first:</b> ' + pre + '</div>' : '<div class="dpre"><b>Needs first:</b> nothing — this is a starting skill</div>');
  }

  function grownUp(tab) {
    tab = tab || 'overview';
    var s = E.summary();
    var body = '';

    if (tab === 'overview') {
      body += '<div class="grid2">' +
        '<div class="stat"><div class="n">' + s.mastered.length + '</div><div class="l">skills mastered</div></div>' +
        '<div class="stat"><div class="n">' + s.developing.length + '</div><div class="l">in progress</div></div>' +
        '<div class="stat"><div class="n">' + s.untouched + '</div><div class="l">not started yet</div></div>' +
        '<div class="stat"><div class="n">' + (s.attempts ? pct(s.correct / s.attempts) + '%' : '—') + '</div><div class="l">answered correctly</div></div>' +
        '</div>';

      if (s.developing.length) {
        body += '<div class="sec"><h3>Working on now</h3>';
        s.developing.slice(0, 8).forEach(function (slug) {
          var r = E.rec(slug);
          body += '<div class="row"><div class="t">' + esc(E.SKILL[slug].title) + '</div>' + bar(E.effective(slug)) +
            '<div class="pill">' + r.correct + '/' + r.attempts + '</div></div>';
        });
        body += '</div>';
      }
      if (s.review.length) {
        body += '<div class="sec"><h3>Worth going back to</h3>';
        s.review.forEach(function (slug) {
          body += '<div class="row"><div class="t">' + esc(E.SKILL[slug].title) + '</div>' + bar(E.effective(slug)) +
            '<div class="pill r">last done ' + (E.rec(slug).lastPractised || '—') + '</div></div>';
        });
        body += '</div>';
      }
      var mis = Object.keys(s.misconceptions).sort(function (a, b) { return s.misconceptions[b] - s.misconceptions[a]; }).slice(0, 5);
      if (mis.length) {
        body += '<div class="sec"><h3>Where the errors cluster</h3>';
        mis.forEach(function (k) {
          body += '<div class="row"><div class="t">' + esc(MIS[k] || k.replace(/_/g, ' ')) + '</div><div class="pill">' + s.misconceptions[k] + '×</div></div>';
        });
        body += '</div>';
      }
      body += '<div class="note">The percentage is how confident the model is that the skill is understood — not a test score. ' +
        'It rises faster for harder question types, and it fades slowly over months without practice, which is what puts a skill back on the review list. ' +
        'A skill counts as mastered at 90% confidence <em>and</em> four correct answers at the harder difficulty levels, so it cannot be reached by guessing.</div>';
    }

    if (tab === 'map') {
      var focus = E.nextFocus();
      body += '<div id="skilldetail" class="detail">' + detailHTML(focus, true) + '</div>';
      body += '<div class="legend">' +
        '<span><i class="dot m"></i>mastered</span>' +
        '<span><i class="dot d"></i>started</span>' +
        '<span><i class="dot r"></i>ready to try</span>' +
        '<span><i class="dot l"></i>needs earlier skills first</span>' +
        '<span><i class="dot now"></i>up next</span>' +
        '</div>';
      body += '<div class="btnrow" style="margin:0 0 16px"><button class="mini" id="jump">Show me where we are</button></div>';

      E.C.sections.forEach(function (sec) {
        var skills = E.ORDER.filter(function (slug) { return E.SKILL[slug].section === sec.letter; });
        var done = skills.filter(E.isMastered).length;
        body += '<div class="mapsec"><div class="maphead">' +
          '<span class="mapletter">' + sec.letter + '</span>' +
          '<span class="maptitle">' + esc(sec.title) + '</span>' +
          '<span class="mapcount">' + done + '/' + skills.length + '</span></div>' +
          '<div class="dots">';
        skills.forEach(function (slug) {
          var st = mapState(slug, focus);
          body += '<button class="dot ' + st + '" data-slug="' + slug + '"' +
            (slug === focus ? ' id="here"' : '') + ' title="' + esc(E.SKILL[slug].title) + '"></button>';
        });
        body += '</div></div>';
      });
      body += '<div class="note">Tap any dot to see that skill. The tree runs top to bottom in teaching order, ' +
        'and a skill only opens up once the skills it depends on are mastered — which is why some later dots are still faded.</div>';
    }

    if (tab === 'file') {
      body += '<div class="note">Progress saves by itself in this browser on this computer, every time a session ends. ' +
        (s.memoryOnly ? '<b>This browser is blocking that</b>, so use Save progress file below and load it back next time. ' : '') +
        'The file below is a copy you can keep, back up, or carry to another computer.</div>' +
        '<div class="btnrow">' +
        '<button class="mini" id="save">Save progress file</button>' +
        '<button class="mini" id="loadbtn">Load a progress file</button>' +
        '<input type="file" id="loadfile" accept="application/json,.json" class="hidden">' +
        '<button class="mini warn" id="reset">Erase everything</button>' +
        '</div><div id="filemsg" class="note hidden"></div>';
    }

    var node = el(
      '<div class="screen grown">' +
      '<h2>Progress</h2><p class="lede">For grown-ups. Build 2 · skill map. Last saved ' + (E.state.updated ? E.state.updated.slice(0, 10) : '—') + '.</p>' +
      '<div class="tabs">' +
      '<button class="tab' + (tab === 'overview' ? ' on' : '') + '" data-t="overview">Overview</button>' +
      '<button class="tab' + (tab === 'map' ? ' on' : '') + '" data-t="map">Skill map</button>' +
      '<button class="tab' + (tab === 'file' ? ' on' : '') + '" data-t="file">Progress file</button>' +
      '</div>' + body +
      '<div class="btnrow" style="margin-top:26px"><button class="mini" id="back">Back to the app</button></div>' +
      '</div>');

    node.querySelectorAll('.tab').forEach(function (b) { b.onclick = function () { grownUp(b.dataset.t); }; });
    node.querySelector('#back').onclick = home;

    if (tab === 'file') {
      var msg = node.querySelector('#filemsg');
      node.querySelector('#save').onclick = function () {
        var blob = new Blob([JSON.stringify(E.state, null, 1)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'progress.json';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        msg.classList.remove('hidden');
        msg.innerHTML = 'Saved as <b>progress.json</b> in your downloads. Move it into this folder to keep everything together.';
      };
      var input = node.querySelector('#loadfile');
      node.querySelector('#loadbtn').onclick = function () { input.click(); };
      input.onchange = function () {
        var f = input.files[0]; if (!f) return;
        var fr = new FileReader();
        fr.onload = function () {
          try {
            E.replaceState(JSON.parse(fr.result));
            msg.classList.remove('hidden');
            msg.innerHTML = 'Loaded. ' + E.summary().mastered.length + ' skills mastered.';
            setTimeout(function () { grownUp('overview'); }, 900);
          } catch (e) {
            msg.classList.remove('hidden');
            msg.innerHTML = 'That file could not be read. It needs to be a progress.json saved by this app.';
          }
        };
        fr.readAsText(f);
      };
      node.querySelector('#reset').onclick = function () {
        if (window.confirm('Erase all progress on this computer? This cannot be undone.')) { E.reset(); grownUp('overview'); }
      };
    }
    if (tab === 'map') {
      var det = node.querySelector('#skilldetail');
      node.querySelectorAll('.dots .dot').forEach(function (d) {
        d.onclick = function () {
          node.querySelectorAll('.dots .dot').forEach(function (x) { x.classList.remove('sel'); });
          d.classList.add('sel');
          det.innerHTML = detailHTML(d.dataset.slug, d.dataset.slug === E.nextFocus());
          det.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        };
      });
      node.querySelector('#jump').onclick = function () {
        var h = node.querySelector('#here');
        if (h) { h.scrollIntoView({ block: 'center', behavior: 'smooth' }); h.classList.add('flash'); setTimeout(function () { h.classList.remove('flash'); }, 1600); }
      };
    }
    show(node);
  }

  // ================= the corner gate =================
  function wireGate() {
    var gate = document.getElementById('gate'), timer = null;
    function down() {
      gate.classList.add('holding');
      timer = setTimeout(function () { gate.classList.remove('holding'); grownUp('overview'); }, 1400);
    }
    function up() { clearTimeout(timer); gate.classList.remove('holding'); }
    gate.addEventListener('mousedown', down);
    gate.addEventListener('touchstart', function (e) { e.preventDefault(); down(); }, { passive: false });
    ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(function (ev) { gate.addEventListener(ev, up); });
  }

  // ================= go =================
  E.load();
  wireGate();
  home();
})();
