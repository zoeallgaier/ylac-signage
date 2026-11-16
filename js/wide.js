/* YLAC SIGNAGE · ALUMNI 4K ENGINE
   <body data-content="alumni-4k"> loads content/alumni-4k.json (?content=alumni-4k-homecoming loads a copy).

   The screen plays itself, chapter by chapter:
     welcome → alumni spotlights → our history (timeline) → our campuses → traditions → stay connected → again

   Every slide is built once on load and absolutely positioned; moving between slides only
   toggles classes, so nothing reflows. Images and videos load just ahead of when they show.
   Plain ES2017 for older signage players (no ?. or ??). */
(function () {
	'use strict';

	var params = new URLSearchParams(location.search);
	var CONTENT = params.get('content') || document.body.getAttribute('data-content');
	var DEBUG = params.has('debug');
	var W = 3840, H = 2160, TRACK = 3456;

	var stage = document.querySelector('.stage');
	var data, dataText = '', scenes = [], cur = -1, timer, paused = params.has('hold');

	function fit() { document.documentElement.style.setProperty('--scale', Math.min(innerWidth / W, innerHeight / H)); }
	window.addEventListener('resize', fit);
	fit();

	/* ---------- Helpers ---------- */
	function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
	function src(p) { return /^(https?:)?\/\//.test(p) ? p : '../' + p; }
	function $(sel, el) { return (el || stage).querySelector(sel); }
	function $$(sel, el) { return [].slice.call((el || stage).querySelectorAll(sel)); }

	function qr(url) {
		var q = qrcode(0, url.length > 80 ? 'L' : 'M');
		q.addData(url); q.make();
		var n = q.getModuleCount(), d = '';
		for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + (c + 1) + ' ' + (r + 1) + 'h1v1h-1z';
		return '<svg viewBox="0 0 ' + (n + 2) + ' ' + (n + 2) + '" shape-rendering="crispEdges" aria-hidden="true"><path fill="#1A321C" d="' + d + '"/></svg>';
	}

	// A QR code with its label. A link left empty in the content file shows nothing.
	function cta(c, cls) {
		if (!c || !c.url) return '';
		return '<div class="cta ' + (cls || '') + '" role="group" aria-label="' + esc(c.label) + ': scan with your phone camera">' +
			'<div class="qr">' + qr(c.url) + '</div>' +
			'<div class="cta-text"><div class="d cta-label">' + esc(c.label) + '</div>' +
			'<div class="cta-where">' + (c.short ? '<b>' + esc(c.short) + '</b><br>' : '') + 'Scan with your phone camera.</div></div></div>';
	}

	// Images wait in data-src until their slide is next
	function img(p, alt, cls) { return '<img ' + (cls ? 'class="' + cls + '" ' : '') + 'data-src="' + esc(src(p)) + '" alt="' + esc(alt || '') + '">'; }

	function circle(photo, cls) {
		return '<div class="circle ' + cls + '">' +
			'<i class="sh sh-hatch"></i><div class="frame">' + img(photo.src, photo.alt, 'drift') + '</div>' +
			'<i class="sh sh-sq1"></i><i class="sh sh-sq2"></i><i class="sh sh-x"></i></div>';
	}

	// The last name and class year stay together on one line
	function nameYear(name, year) {
		var w = String(name || '').split(' '), last = w.pop();
		return esc(w.join(' ')) + (w.length ? ' ' : '') + '<span class="sp-year">' + esc(last) + (year ? ' ' + esc(year) : '') + '</span>';
	}

	function nodeX(i, n) { return n < 2 ? 0 : Math.round(i * TRACK / (n - 1)); }

	/* ---------- Build every chapter once ---------- */
	function render() {
		var w = data.welcome, sp = data.spotlights, tl = data.timeline, cp = data.campuses, tr = data.traditions, cn = data.connect;
		var html = '', nav = [];
		scenes = [];
		document.body.className = DEBUG ? 'show-cursor' : '';
		document.title = data.screen + ' · YLAC Signage';

		function chapter(key, theme, inner) {
			html += '<section class="full chapter ' + theme + '" data-ch="' + key + '">' + inner + '</section>';
		}
		function add(key, i, seconds, theme) {
			scenes.push({ ch: key, i: i, ms: (seconds || 10) * 1000, theme: theme });
		}

		// Welcome
		if (w) {
			chapter('welcome', 'green', '<div class="full slide" data-i="0">' +
				'<div class="col w-text"><h1 class="d w-head rise r1">' + esc(w.headline) + '</h1>' +
					(w.stat ? '<div class="d w-num rise r3" data-value="' + esc(w.stat.value) + '">' + esc(w.stat.value) + '</div>' +
					'<div class="w-rule rise r4"></div><p class="w-label rise r4">' + esc(w.stat.label) + '</p>' : '') + '</div>' +
				'<div class="abs w-photo rise r2"><i class="sh sh-a"></i><div class="frame">' + img(w.photo.src, w.photo.alt, 'drift') + '</div><i class="sh sh-b"></i></div>' +
				'</div>');
			add('welcome', 0, w.seconds, 'green');
		}

		// Alumni spotlights
		if (sp && sp.items.length) {
			nav.push(['spotlights', sp.nav]);
			chapter('spotlights', 'white', sp.items.map(function (o, i) {
				add('spotlights', i, o.seconds || sp.seconds, 'white');
				return '<article class="full slide" data-i="' + i + '" aria-label="Alumni Spotlight: ' + esc(o.name) + '">' +
					circle(o.photo, 'sp-photo') +
					'<div class="col sp-text">' +
						'<h2 class="d sp-name rise r1">' + nameYear(o.name, o.year) + '</h2>' +
						(o.major ? '<p class="sp-major rise r2">' + esc(o.major) + '</p>' : '') +
						(o.honor ? '<p class="d sp-honor rise r3">' + esc(o.honor) + '</p>' : '') +
						(o.text ? '<div class="sp-rule rise r4"></div><p class="sp-body rise r4">' + esc(o.text) + '</p>' : '') +
						cta(o.qr, 'rise r6') +
					'</div></article>';
			}).join(''));
		}

		// Our history: one track, one moment at a time
		if (tl && tl.items.length) {
			var n = tl.items.length, eras = tl.eras || [];
			nav.push(['timeline', tl.nav]);
			var items = tl.items.map(function (o, i) {
				var era = eras[o.era] || {};
				add('timeline', i, o.seconds || tl.seconds, 'green');
				return '<div class="full slide tl-item" data-i="' + i + '">' +
					'<p class="abs tl-era rise r1">' + esc(era.name) + (era.years ? ' · ' + esc(era.years) : '') + '</p>' +
					'<div class="abs d tl-year rise r2">' + esc(o.year) + '</div>' +
					'<p class="abs tl-text rise r3">' + esc(o.text) + '</p></div>';
			}).join('');
			var end = tl.end;
			if (end) {
				add('timeline', n, end.seconds || 12, 'green');
				items += '<div class="full slide tl-item" data-i="' + n + '">' +
					'<div class="col tl-end-text"><h2 class="d tl-end-head rise r1">' + esc(end.headline) + '</h2>' +
					(end.text ? '<p class="tl-end-body rise r2">' + esc(end.text) + '</p>' : '') + cta(end.qr, 'rise r4') + '</div></div>';
			}
			var photos = tl.items.map(function (o, i) { return img(o.photo, o.year, 'drift" data-i="' + i); }).join('') +
				(end && end.photo ? img(end.photo, end.headline, 'drift" data-i="' + n) : '');
			var track = '<div class="abs track" aria-hidden="true"><i class="line"></i><i class="fill"></i>' +
				'<div class="era"><span class="era-name"></span><i class="era-span"></i></div>' +
				tl.items.map(function (o, i) {
					var same = i > 0 && tl.items[i - 1].year === o.year;   // one label per year
					return '<div class="node" data-i="' + i + '" style="left:' + nodeX(i, n) + 'px"><i></i><span class="d">' + (same ? '' : esc(o.year)) + '</span></div>';
				}).join('') +
				'<div class="head"><em></em><b></b></div></div>';
			chapter('timeline', 'green', '<div class="frame tl-photo">' + photos + '</div>' + items + track);
		}

		// Our campuses: drone footage
		if (cp && cp.items.length) {
			nav.push(['campuses', cp.nav]);
			chapter('campuses', 'green',
				'<div class="frame cp-video">' + cp.items.map(function (o, i) {
					return '<video muted playsinline preload="none" data-i="' + i + '" data-src="' + esc(src(o.video)) + '"></video>';
				}).join('') + '</div>' +
				cp.items.map(function (o, i) {
					add('campuses', i, o.seconds || cp.seconds || 10, 'green');
					return '<div class="full slide" data-i="' + i + '"><h2 class="abs d cp-name rise r1">' + esc(o.name) + '</h2></div>';
				}).join(''));
		}

		// Traditions
		if (tr && tr.items.length) {
			nav.push(['traditions', tr.nav]);
			chapter('traditions', 'green', tr.items.map(function (o, i) {
				add('traditions', i, o.seconds || tr.seconds, 'green');
				return '<article class="full slide" data-i="' + i + '">' +
					'<div class="col tr-text"><h2 class="d tr-head rise r1">' + esc(o.headline) + '</h2>' +
					'<p class="tr-body rise r2">' + esc(o.text) + '</p>' + cta(o.qr, 'rise r4') + '</div>' +
					circle(o.photo, 'tr-photo') + '</article>';
			}).join(''));
		}

		// Stay connected: every action side by side
		if (cn && cn.items.length) {
			nav.push(['connect', cn.nav]);
			var gap = 120, colW = (TRACK - gap * (cn.items.length - 1)) / cn.items.length;
			chapter('connect', 'white', '<div class="full slide" data-i="0">' +
				'<h2 class="abs d cn-head rise r1">' + esc(cn.headline) + '</h2>' +
				cn.items.map(function (o, i) {
					return '<div class="abs cn-col rise r' + (i + 2) + '" style="left:' + Math.round(192 + i * (colW + gap)) + 'px;width:' + Math.round(colW) + 'px">' +
						'<img class="cn-ico" src="../assets/icons/' + esc(o.icon || 'info-1') + '-green.svg" alt="">' +
						'<div class="d cn-label">' + esc(o.label) + '</div><p class="cn-text">' + esc(o.text) + '</p>' +
						(o.url ? '<div class="qr">' + qr(o.url) + '</div><div class="cn-short">' + esc(o.short) + '</div>' : '') + '</div>';
				}).join('') + '</div>');
			add('connect', 0, cn.seconds, 'white');
		}

		stage.innerHTML =
			'<div class="chrome"><img class="mono mono-white" src="../assets/img/uvu-mono-white.svg" alt="Utah Valley University">' +
			'<img class="mono mono-green" src="../assets/img/uvu-mono-green.svg" alt="">' +
			'<ul class="nav d">' + nav.map(function (c) {
				return '<li data-ch="' + c[0] + '">' + esc(c[1]) + '<i class="bar"></i><i class="fill"></i></li>';
			}).join('') + '</ul></div>' + html;

		cur = -1;
		var start = 0, at = params.get('scene');
		if (at) {   // ?scene=timeline or ?scene=timeline:5 (or a number)
			var p = at.split(':');
			for (var k = 0; k < scenes.length; k++) if (scenes[k].ch === p[0] && scenes[k].i === (+p[1] || 0)) { start = k; break; }
			if (/^\d+$/.test(at)) start = Math.min(+at, scenes.length - 1);
		}
		go(start);
	}

	/* ---------- Loading just ahead ---------- */
	function prime(k) {
		var s = scenes[k]; if (!s) return;
		var ch = $('.chapter[data-ch="' + s.ch + '"]');
		var slide = $('.slide[data-i="' + s.i + '"]', ch);
		var imgs = slide ? $$('img[data-src]', slide) : [];
		if (s.ch === 'timeline') imgs = imgs.concat($$('.tl-photo img[data-i="' + s.i + '"]', ch));
		imgs.forEach(function (el) { if (el.getAttribute('data-src')) { el.src = el.getAttribute('data-src'); el.removeAttribute('data-src'); } });
		if (s.ch === 'campuses') {
			var v = $('.cp-video video[data-i="' + s.i + '"]', ch);
			if (v && !v.getAttribute('src')) { v.src = v.getAttribute('data-src'); v.preload = 'auto'; v.load(); }
		}
	}

	// Only the playing clip and the next one keep a decoder; the rest let go
	function releaseVideos(keep) {
		$$('.cp-video video').forEach(function (v) {
			var i = +v.getAttribute('data-i');
			if (keep.indexOf(i) < 0 && v.getAttribute('src')) { v.pause(); v.removeAttribute('src'); v.load(); }
		});
	}

	/* ---------- Moving between scenes ---------- */
	function go(k) {
		clearTimeout(timer);
		k = (k + scenes.length) % scenes.length;
		var s = scenes[k], prev = scenes[cur];
		cur = k;
		prime(k); prime(k + 1 < scenes.length ? k + 1 : 0);

		stage.classList.toggle('t-white', s.theme === 'white');
		$$('.chapter').forEach(function (c) { c.classList.toggle('on', c.getAttribute('data-ch') === s.ch); });
		var ch = $('.chapter[data-ch="' + s.ch + '"]');
		$$('.slide', ch).forEach(function (el) { el.classList.toggle('on', +el.getAttribute('data-i') === s.i); });
		// Leaving a chapter resets its slides so they enter fresh next time
		if (prev && prev.ch !== s.ch) {
			var old = $('.chapter[data-ch="' + prev.ch + '"]');
			setTimeout(function () { if (scenes[cur].ch !== prev.ch) $$('.slide', old).forEach(function (el) { el.classList.remove('on'); }); }, 1000);
		}

		if (s.ch === 'welcome') countUp(1300);
		if (s.ch === 'timeline') timeline(s.i, prev && prev.ch === 'timeline');
		campus(s);
		progress(k);
		if (!paused) timer = setTimeout(function () { go(cur + 1); }, s.ms);
	}

	function timeline(i, within) {
		var ch = $('.chapter[data-ch="timeline"]'), items = data.timeline.items, n = items.length, eras = data.timeline.eras || [];
		var end = i >= n, at = Math.min(i, n - 1);
		ch.classList.toggle('is-end', end);
		$$('.tl-photo img', ch).forEach(function (el) {
			var on = +el.getAttribute('data-i') === i;
			if (on && !el.classList.contains('on')) { el.classList.remove('drift'); void el.offsetWidth; el.classList.add('drift'); }
			el.classList.toggle('on', on);
		});
		var x = nodeX(at, n);
		var head = $('.head', ch), fill = $('.track .fill', ch);
		// Entering the chapter fresh: start the line from the first node with no glide
		if (!within) { head.style.transition = fill.style.transition = 'none'; void head.offsetWidth; }
		head.style.transform = head.style.webkitTransform = 'translateX(' + x + 'px)';
		fill.style.transform = fill.style.webkitTransform = 'scaleX(' + (x / TRACK) + ')';
		if (!within) { void head.offsetWidth; head.style.transition = fill.style.transition = ''; }
		$$('.node', ch).forEach(function (el) {
			var j = +el.getAttribute('data-i');
			el.classList.toggle('past', j <= at); el.classList.toggle('now', j === at);
		});
		var e = items[at].era, first = at, last = at;
		while (first > 0 && items[first - 1].era === e) first--;
		while (last < n - 1 && items[last + 1].era === e) last++;
		var x0 = nodeX(first, n), x1 = nodeX(last, n), eraEl = $('.era', ch);
		var name = $('.era-name', ch), label = (eras[e] || {}).name || '';
		if (name.textContent !== label) name.textContent = label;
		// Keep the era name on the stage near the right edge
		var shift = Math.min(0, TRACK - x0 - name.offsetWidth);
		eraEl.style.transform = eraEl.style.webkitTransform = 'translateX(' + x0 + 'px)';
		name.style.transform = name.style.webkitTransform = 'translateX(' + shift + 'px)';
		var span = $('.era-span', ch);
		span.style.transform = span.style.webkitTransform = 'scaleX(' + (x1 - x0 + 32) + ')';
	}

	function campus(s) {
		var vids = $$('.cp-video video');
		if (s.ch !== 'campuses') { vids.forEach(function (v) { v.pause(); }); releaseVideos(scenes[(cur + 1) % scenes.length].ch === 'campuses' ? [0] : []); return; }
		releaseVideos([s.i, (s.i + 1) % vids.length]);
		vids.forEach(function (v) {
			var on = +v.getAttribute('data-i') === s.i;
			v.classList.toggle('on', on);
			if (on) { try { v.currentTime = 0; } catch (e) {} var p = v.play(); if (p && p.catch) p.catch(function () {}); }
			else setTimeout(function () { if (!v.classList.contains('on')) v.pause(); }, 1100);
		});
	}

	// The current chapter's underline fills across its slides
	function progress(k) {
		var s = scenes[k], total = 0, before = 0;
		scenes.forEach(function (x, j) { if (x.ch === s.ch) { if (j < k) before += x.ms; total += x.ms; } });
		$$('.nav li').forEach(function (li) {
			var on = li.getAttribute('data-ch') === s.ch, f = $('.fill', li);
			li.classList.toggle('on', on);
			f.style.transition = 'none';
			f.style.transform = f.style.webkitTransform = 'scaleX(' + (on ? before / total : 0) + ')';
			if (on && !paused) {
				void f.offsetWidth;
				f.style.transition = 'transform ' + s.ms + 'ms linear, -webkit-transform ' + s.ms + 'ms linear';
				f.style.transform = f.style.webkitTransform = 'scaleX(' + ((before + s.ms) / total) + ')';
			}
		});
	}

	function countUp(delay) {
		var el = $('.w-num'); if (!el) return;
		var raw = el.getAttribute('data-value'), m = raw.match(/^(\D*)([\d,]+(?:\.\d+)?)(.*)$/);
		if (!m || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		var target = +m[2].replace(/,/g, ''), comma = m[2].indexOf(',') > -1;
		function fmt(v) { v = Math.round(v); return m[1] + (comma ? v.toLocaleString('en-US') : String(v)) + m[3]; }
		el.textContent = fmt(0);
		setTimeout(function () {
			var t0 = performance.now();
			(function step(now) {
				var p = Math.min(1, (now - t0) / 1800);
				el.textContent = p < 1 ? fmt(target * (1 - Math.pow(2, -10 * p))) : raw;
				if (p < 1) requestAnimationFrame(step);
			})(t0);
		}, delay);
	}

	/* ---------- Review controls (laptop or touch) ----------
	   → or tap: next   ← : back   Space: pause   1–6: jump to a chapter
	   Tap a chapter name to jump there, or a year on the timeline to jump to it. */
	function chapterStart(key) { for (var k = 0; k < scenes.length; k++) if (scenes[k].ch === key) return k; return 0; }
	function togglePause() {
		paused = !paused;
		stage.classList.toggle('paused', paused);
		go(cur);
	}
	window.addEventListener('keydown', function (e) {
		if (e.key === 'ArrowRight') go(cur + 1);
		if (e.key === 'ArrowLeft') go(cur - 1);
		if (e.key === ' ') { e.preventDefault(); togglePause(); }
		var keys = ['welcome'].concat($$('.nav li').map(function (li) { return li.getAttribute('data-ch'); }));
		if (+e.key >= 1 && +e.key <= keys.length) go(chapterStart(keys[+e.key - 1]));
	});
	stage.addEventListener('click', function (e) {
		var li = e.target.closest('.nav li'), node = e.target.closest('.node');
		if (li) return go(chapterStart(li.getAttribute('data-ch')));
		if (node) return go(chapterStart('timeline') + +node.getAttribute('data-i'));
		go(cur + 1);
	});
	['contextmenu', 'dragstart', 'selectstart'].forEach(function (t) { window.addEventListener(t, function (e) { e.preventDefault(); }); });

	/* ---------- Content (checks for edits every 10 minutes, applied at the welcome) ---------- */
	var KEY = 'ylac4k:' + CONTENT, pending = null;
	function load() {
		return fetch('../content/' + CONTENT + '.json', { cache: 'no-store' }).then(function (res) {
			if (!res.ok) throw new Error('content/' + CONTENT + '.json → ' + res.status);
			return res.text();
		}).then(function (text) {
			var json;
			try { json = JSON.parse(text); } catch (err) { throw new Error('content/' + CONTENT + '.json has a typo:\n' + err.message); }
			try { localStorage.setItem(KEY, text); } catch (e) {}
			return { json: json, text: text };
		});
	}
	setInterval(function () {
		load().then(function (r) { if (r.text !== dataText) pending = r; }).catch(function () {});
	}, 600000);
	// A new version swaps in only when the loop comes back around, so nothing cuts off mid-story
	var goInner = go;
	go = function (k) {
		if (pending && scenes.length && ((k % scenes.length) + scenes.length) % scenes.length === 0 && cur > 0) {
			var r = pending; pending = null; data = r.json; dataText = r.text; return render();
		}
		goInner(k);
	};

	function start(r) {
		data = r.json; dataText = r.text;
		if (document.fonts && document.fonts.ready) document.fonts.ready.then(render); else render();
	}

	load().then(start).catch(function (err) {
		var cached = null;
		try { cached = localStorage.getItem(KEY); } catch (e) {}
		if (cached) return start({ json: JSON.parse(cached), text: cached });
		stage.innerHTML = '<div class="full notice"><b class="d">This Screen Needs a Content Fix</b>The last change to its content file couldn\'t be read.<code>' + esc(err.message) + '</code></div>';
		setTimeout(function () { location.reload(); }, 60000);
	});
}());
