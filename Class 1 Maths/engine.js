/* engine.js — what the child knows, and how we decide what to ask next.
   Bayesian Knowledge Tracing, per the mastery model spec. */

(function (global) {
  'use strict';

  var C = global.CURRICULUM;

  // ---- parameters ------------------------------------------------------
  var P_INIT = 0.15;          // no prerequisites met
  var P_INIT_READY = 0.35;    // all prerequisites mastered
  var P_SLIP = 0.10;          // wrong despite knowing (six-year-old fingers)
  var P_LEARN = 0.12;
  var MASTERY = 0.90;
  var TIER_GATE = 4;          // correct answers at tier 3+
  var FLOOR = 0.35;
  var REVIEW_BELOW = 0.75;
  var HALF_LIFE = 90;

  var GUESS = { choice2: 0.50, choice3: 0.34, choice4: 0.25, choice5: 0.20, number: 0.05, build: 0.05 };

  var SKILL = {}, ORDER = [];
  C.skills.forEach(function (s, i) { s._i = i; SKILL[s.slug] = s; ORDER.push(s.slug); });
  var SECTION = {};
  C.sections.forEach(function (s) { SECTION[s.letter] = s; });

  // ---- storage ---------------------------------------------------------
  var KEY = 'class1-maths-progress-v1';
  var memoryOnly = false;

  function blank() {
    return {
      schema: 2, curriculum: C.id, locale: C.locale,
      updated: new Date().toISOString(),
      practiceDays: [], awardsShown: [], skills: {}
    };
  }

  var state = blank();

  function load() {
    try {
      var raw = global.localStorage.getItem(KEY);
      if (raw) state = migrate(JSON.parse(raw));
    } catch (e) {
      memoryOnly = true;   // Safari on file:// and similar
    }
    return state;
  }

  function save() {
    state.updated = new Date().toISOString();
    try { global.localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { memoryOnly = true; }
  }

  function migrate(s) {
    if (!s || !s.skills) return blank();
    if (!s.practiceDays) s.practiceDays = [];
    if (!s.awardsShown) s.awardsShown = [];
    s.schema = 2;
    return s;
  }

  function replaceState(obj) {
    if (!obj || typeof obj !== 'object' || !obj.skills) throw new Error('not a progress file');
    state = migrate(obj); save(); return state;
  }

  function reset() { state = blank(); save(); }

  // ---- dates -----------------------------------------------------------
  function today() {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function daysBetween(a, b) { return Math.max(0, (new Date(b) - new Date(a)) / 86400000); }

  // ---- reading a skill -------------------------------------------------
  function rec(slug) { return state.skills[slug] || null; }

  function halfLife(slug) { return (SKILL[slug] && SKILL[slug].halfLifeDays) || HALF_LIFE; }

  /* Confidence as of now: stored p decayed by elapsed time, never below the floor
     once something has genuinely been learnt. */
  function effective(slug) {
    var r = rec(slug);
    if (!r) return 0;
    if (!r.lastPractised) return r.p;
    var d = daysBetween(r.lastPractised, today());
    if (d <= 0 || r.p <= FLOOR) return r.p;
    return FLOOR + (r.p - FLOOR) * Math.pow(0.5, d / halfLife(slug));
  }

  function isMastered(slug) { var r = rec(slug); return !!r && r.status === 'mastered'; }
  function needsReview(slug) { return isMastered(slug) && effective(slug) < REVIEW_BELOW; }

  function ready(slug) {
    var s = SKILL[slug];
    return (s.prerequisiteSkillIds || []).every(isMastered);
  }

  function seed(slug) { return ready(slug) ? P_INIT_READY : P_INIT; }

  function ensure(slug) {
    if (!state.skills[slug]) {
      state.skills[slug] = {
        p: seed(slug), status: 'developing', attempts: 0, correct: 0,
        topTier: 0, tierHits: 0, lastPractised: null, masteredOn: null, misconceptions: {}
      };
    }
    return state.skills[slug];
  }

  // ---- the update ------------------------------------------------------
  function grade(slug, correct, tier, widget, tag) {
    var r = ensure(slug);
    var g = GUESS[widget] != null ? GUESS[widget] : 0.25;
    var p = r.p, post;

    if (correct) post = (p * (1 - P_SLIP)) / (p * (1 - P_SLIP) + (1 - p) * g);
    else         post = (p * P_SLIP)       / (p * P_SLIP       + (1 - p) * (1 - g));

    r.p = post + (1 - post) * P_LEARN;
    r.attempts++;
    if (correct) r.correct++;
    if (tier > r.topTier) r.topTier = tier;
    if (correct && tier >= 3) r.tierHits++;
    if (!correct) {
      var k = tag || 'unmatched_wrong';
      r.misconceptions[k] = (r.misconceptions[k] || 0) + 1;
    }
    r.lastPractised = today();

    if (r.p >= MASTERY && r.tierHits >= TIER_GATE && r.status !== 'mastered') {
      r.status = 'mastered';
      r.masteredOn = today();
      return 'mastered';
    }
    return r.status;
  }

  function markPractised() {
    var t = today();
    if (state.practiceDays.indexOf(t) === -1) state.practiceDays.push(t);
    if (state.practiceDays.length > 400) state.practiceDays = state.practiceDays.slice(-400);
  }

  // ---- what to work on next -------------------------------------------
  function nextFocus() {
    var i, slug;
    // 1. something already started and unfinished
    for (i = 0; i < ORDER.length; i++) {
      slug = ORDER[i];
      if (rec(slug) && !isMastered(slug)) return slug;
    }
    // 2. the earliest untouched skill whose prerequisites are all mastered
    for (i = 0; i < ORDER.length; i++) {
      slug = ORDER[i];
      if (!rec(slug) && ready(slug)) return slug;
    }
    // 3. everything eligible is done — go back for the weakest
    var worst = null, wv = 2;
    ORDER.forEach(function (s) { var e = effective(s); if (rec(s) && e < wv) { wv = e; worst = s; } });
    return worst || ORDER[0];
  }

  function reviewPool() {
    return ORDER.filter(needsReview).sort(function (a, b) { return effective(a) - effective(b); });
  }

  /* Difficulty for the next question on a skill: start where they left off,
     climb on a run of two right, ease off on two wrong. */
  function startTier(slug) {
    var r = rec(slug), max = SKILL[slug].maxTier;
    if (!r || r.attempts === 0) return 1;
    return Math.min(Math.max(1, r.topTier), max);
  }
  function moveTier(slug, tier, runRight, runWrong) {
    var max = SKILL[slug].maxTier;
    if (runRight >= 2 && tier < max) return tier + 1;
    if (runWrong >= 2 && tier > 1) return tier - 1;
    return tier;
  }

  // ---- summary for the grown-up view ----------------------------------
  function summary() {
    var mastered = [], developing = [], review = [], untouched = 0;
    ORDER.forEach(function (slug) {
      var r = rec(slug);
      if (!r) { untouched++; return; }
      if (r.status === 'mastered') { mastered.push(slug); if (needsReview(slug)) review.push(slug); }
      else developing.push(slug);
    });
    var mis = {};
    ORDER.forEach(function (slug) {
      var r = rec(slug); if (!r) return;
      Object.keys(r.misconceptions).forEach(function (k) {
        if (k === 'unmatched_wrong') return;
        mis[k] = (mis[k] || 0) + r.misconceptions[k];
      });
    });
    var attempts = 0, correct = 0;
    ORDER.forEach(function (s) { var r = rec(s); if (r) { attempts += r.attempts; correct += r.correct; } });
    return {
      mastered: mastered, developing: developing, review: review,
      untouched: untouched, total: ORDER.length,
      misconceptions: mis, attempts: attempts, correct: correct,
      days: state.practiceDays.length, memoryOnly: memoryOnly
    };
  }

  global.Engine = {
    C: C, SKILL: SKILL, SECTION: SECTION, ORDER: ORDER,
    load: load, save: save, reset: reset, replaceState: replaceState,
    get state() { return state; },
    rec: rec, ensure: ensure, effective: effective, isMastered: isMastered,
    needsReview: needsReview, ready: ready, grade: grade, markPractised: markPractised,
    nextFocus: nextFocus, reviewPool: reviewPool, startTier: startTier, moveTier: moveTier,
    summary: summary, today: today, memoryOnly: function () { return memoryOnly; },
    MASTERY: MASTERY, REVIEW_BELOW: REVIEW_BELOW
  };
})(window);
