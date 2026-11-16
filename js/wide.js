/* YLAC SIGNAGE · ALUMNI 4K ENGINE
   <body data-screen="alumni-4k"> loads content/alumni-4k.json (?content=alumni-4k-homecoming loads a copy).

   The screen plays itself, chapter by chapter:
     welcome → alumni spotlights → our history (timeline) → our campuses → traditions → stay connected → again

   Every slide is built once on load and absolutely positioned; moving between slides only
   toggles classes, so nothing reflows. Each chapter with photos keeps one frame and
   cross-fades the photo inside it. Images and videos load just ahead of when they show.
   Plain ES2017 for older signage players (no ?. or ??). */
(function () {
	'use strict';

	var params = new URLSearchParams(location.search);
	var CONTENT = params.get('content') || (document.body.getAttribute('data-screen') || document.body.getAttribute('data-content'));
	var DEBUG = params.has('debug');
	var W = 3840, H = 2160, TRACK = 3456, FADE = 1100;

	var stage = document.querySelector('.stage');
	var data, dataText = '', scenes = [], cur = -1, timer, wasTimer, pending = null, paused = params.has('hold');

	function fit() { document.documentElement.style.setProperty('--scale', Math.min(innerWidth / W, innerHeight / H)); }
	window.addEventListener('resize', fit);
	fit();

	/* ---------- Helpers ---------- */
	function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
	function src(p) { return /^(https?:)?\/\//.test(p) ? p : '../' + p; }
	function $(sel, el) { return (el || stage).querySelector(sel); }
	function $$(sel, el) { return [].slice.call((el || stage).querySelectorAll(sel)); }
	function move(el, t) { el.style.webkitTransform = el.style.transform = t; }

	function qr(url) {
		var q = qrcode(0, url.length > 80 ? 'L' : 'M');
		q.addData(url); q.make();
		var n = q.getModuleCount(), d = '';
		for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + (c + 1) + ' ' + (r + 1) + 'h1v1h-1z';
		return '<svg viewBox="0 0 ' + (n + 2) + ' ' + (n + 2) + '" shape-rendering="crispEdges" aria-hidden="true"><path fill="#1A321C" d="' + d + '"/></svg>';
	}

	// A QR code, what it opens, and where. A link left empty in the content file shows nothing.
	function cta(c, cls) {
		if (!c || !c.url) return '';
		return '<div class="cta ' + (cls || '') + '" role="group" aria-label="' + esc(c.label) + ': scan with your phone camera">' +
			'<div class="qr">' + qr(c.url) + '</div>' +
			'<div class="cta-text"><div class="d cta-label">' + esc(c.label) + '</div>' +
			(c.short ? '<div class="cta-where">' + esc(c.short) + '</div>' : '') + '</div></div>';
	}

	// Images wait in data-src until their slide is next
	function img(p, alt, attrs) { return '<img ' + (attrs || '') + ' data-src="' + esc(src(p)) + '" alt="' + esc(alt || '') + '">'; }

	// One frame per chapter, one stacked photo per slide
	function pics(list) {
		return list.map(function (o, i) { return o ? img(o.src, o.alt, 'class="pic" data-i="' + i + '"') : ''; }).join('');
	}
	function circle(list, cls) {
		return '<div class="circle ' + cls + '"><i class="sh sh-hatch"></i><div class="frame">' + pics(list) + '</div>' +
			'<i class="sh sh-sq1"></i><i class="sh sh-sq2"></i></div>';
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

		function chapter(key, theme, inner) { html += '<section class="full chapter theme-' + theme + '" data-ch="' + key + '">' + inner + '</section>'; }
		function add(key, i, seconds, theme) { scenes.push({ ch: key, i: i, ms: (seconds || 10) * 1000, theme: theme }); }

		// Welcome
		if (w) {
			add('welcome', 0, w.seconds, 'green');
			chapter('welcome', 'green', '<div class="full slide" data-i="0">' +
				'<div class="col w-text"><h1 class="d display rise">' + esc(w.headline) + '</h1>' +
					(w.stat ? '<div class="d w-num rise r3" data-value="' + esc(w.stat.value) + '">' + esc(w.stat.value) + '</div>' +
					'<p class="body w-label rise r4">' + esc(w.stat.label) + '</p>' : '') + '</div>' +
				'<div class="abs w-photo rise r2"><i class="sh sh-a"></i><div class="frame">' + img(w.photo.src, w.photo.alt, 'class="settle"') + '</div><i class="sh sh-b"></i></div>' +
				'</div>');
		}

		// Alumni spotlights: the circle stays, the person changes
		if (sp && sp.items.length) {
			nav.push(['spotlights', sp.nav]);
			chapter('spotlights', 'white', circle(sp.items.map(function (o) { return o.photo; }), 'sp-photo') +
				sp.items.map(function (o, i) {
					add('spotlights', i, o.seconds || sp.seconds, 'white');
					return '<article class="full slide" data-i="' + i + '" aria-label="Alumni Spotlight: ' + esc(o.name) + '">' +
						'<div class="col sp-text">' +
							'<h2 class="d display rise">' + nameYear(o.name, o.year) + '</h2>' +
							(o.major ? '<p class="body sp-major rise r2">' + esc(o.major) + '</p>' : '') +
							(o.honor ? '<p class="d sp-honor rise r2">' + esc(o.honor) + '</p>' : '') +
							(o.text ? '<p class="body sp-body rise r3">' + esc(o.text) + '</p>' : '') +
							cta(o.qr, 'rise r5') +
						'</div></article>';
				}).join(''));
		}

		// Our history: one track, one moment at a time
		if (tl && tl.items.length) {
			var n = tl.items.length, end = tl.end && tl.end.qr && tl.end.qr.url ? tl.end : null;
			nav.push(['timeline', tl.nav]);
			var items = tl.items.map(function (o, i) {
				add('timeline', i, o.seconds || tl.seconds, 'green');
				return '<div class="full slide" data-i="' + i + '">' +
					'<div class="abs d tl-year rise">' + esc(o.year) + '</div>' +
					'<p class="abs body tl-text rise r2">' + esc(o.text) + '</p></div>';
			}).join('');
			if (end) {
				add('timeline', n, end.seconds || 12, 'green');
				items += '<div class="full slide" data-i="' + n + '">' +
					'<div class="col tl-end-text"><h2 class="d display rise">' + esc(end.headline) + '</h2>' +
					(end.text ? '<p class="body rise r2" style="margin-top:56px">' + esc(end.text) + '</p>' : '') + cta(end.qr, 'rise r4') + '</div></div>';
			}
			var photos = tl.items.map(function (o) { return { src: o.photo, alt: o.year }; });
			if (end && end.photo) photos.push({ src: end.photo, alt: end.headline });
			var track = '<div class="abs track" aria-hidden="true"><i class="line"></i><i class="fill"></i>' +
				'<div class="era"><span class="era-name"></span></div>' +
				tl.items.map(function (o, i) {
					var same = i > 0 && tl.items[i - 1].year === o.year;   // one label per year
					return '<div class="node" data-i="' + i + '" style="left:' + nodeX(i, n) + 'px"><i></i><span class="d">' + (same ? '' : esc(o.year)) + '</span></div>';
				}).join('') +
				'<div class="head"><em></em><b></b></div></div>';
			chapter('timeline', 'green', '<div class="frame tl-photo">' + pics(photos) + '</div>' + items + track);
		}

		// Our campuses: drone footage and photos
		if (cp && cp.items.length) {
			nav.push(['campuses', cp.nav]);
			chapter('campuses', 'green',
				'<div class="frame cp-video">' + cp.items.map(function (o, i) {
					// A campus shows its drone clip, or a photo that settles like the others
					if (!o.video && o.photo) return img(o.photo.src, o.photo.alt, 'class="pic" data-i="' + i + '"');
					return '<video muted playsinline preload="none" data-i="' + i + '" data-src="' + esc(src(o.video)) + '"></video>';
				}).join('') + '</div>' +
				cp.items.map(function (o, i) {
					add('campuses', i, o.seconds || cp.seconds || 10, 'green');
					return '<div class="full slide" data-i="' + i + '"><h2 class="abs d cp-name rise">' + esc(o.name) + '</h2></div>';
				}).join(''));
		}

		// Traditions: the circle stays, the photo changes
		if (tr && tr.items.length) {
			nav.push(['traditions', tr.nav]);
			chapter('traditions', 'green', circle(tr.items.map(function (o) { return o.photo; }), 'tr-photo') +
				tr.items.map(function (o, i) {
					add('traditions', i, o.seconds || tr.seconds, 'green');
					return '<article class="full slide" data-i="' + i + '">' +
						'<div class="col tr-text"><h2 class="d display rise">' + esc(o.headline) + '</h2>' +
						'<p class="body tr-body rise r2">' + esc(o.text) + '</p>' + cta(o.qr, 'rise r4') + '</div></article>';
				}).join(''));
		}

		// Stay connected: every action side by side
		if (cn && cn.items.length) {
			nav.push(['connect', cn.nav]);
			var gap = 120, colW = (TRACK - gap * (cn.items.length - 1)) / cn.items.length;
			add('connect', 0, cn.seconds, 'white');
			chapter('connect', 'white', '<div class="full slide" data-i="0">' +
				'<h2 class="abs d display cn-head rise">' + esc(cn.headline) + '</h2>' +
				cn.items.map(function (o, i) {
					return '<div class="abs cn-col rise r' + (i + 2) + '" style="left:' + Math.round(192 + i * (colW + gap)) + 'px;width:' + Math.round(colW) + 'px">' +
						'<img class="cn-ico" src="../assets/icons/' + esc(o.icon || 'info-1') + '-green.svg" alt="">' +
						'<div class="d cn-label">' + esc(o.label) + '</div><p class="cn-text">' + esc(o.text) + '</p>' +
						(o.url ? '<div class="qr">' + qr(o.url) + '</div><div class="cta-where">' + esc(o.short) + '</div>' : '') + '</div>';
				}).join('') + '</div>');
		}

		stage.innerHTML =
			'<div class="chrome"><img class="logo logo-white" src="../assets/img/uvu-alumni-white.png" alt="UVU Alumni">' +
			'<img class="logo logo-green" src="../assets/img/uvu-alumni-green.png" alt="">' +
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
		show(start);
	}

	/* ---------- Loading just ahead ---------- */
	function chapterEl(key) { return $('.chapter[data-ch="' + key + '"]'); }

	function prime(k) {
		var s = scenes[k]; if (!s) return;
		var ch = chapterEl(s.ch), slide = $('.slide[data-i="' + s.i + '"]', ch);
		var imgs = (slide ? $$('img[data-src]', slide) : []).concat($$('.pic[data-i="' + s.i + '"][data-src]', ch));
		imgs.forEach(function (el) { el.src = el.getAttribute('data-src'); el.removeAttribute('data-src'); });
		var v = $('video[data-i="' + s.i + '"]', ch);
		if (v && !v.getAttribute('src')) { v.src = v.getAttribute('data-src'); v.preload = 'auto'; v.load(); }
	}

	/* ---------- Moving between scenes ---------- */
	function go(k) {
		k = (k + scenes.length) % scenes.length;
		// A content update swaps in only at the top of the loop, so nothing cuts off mid-story
		if (pending && k === 0 && cur > 0) { var r = pending; pending = null; data = r.json; dataText = r.text; return render(); }
		show(k);
	}

	function show(k) {
		clearTimeout(timer);
		var s = scenes[k], prev = scenes[cur];
		cur = k;
		prime(k); prime((k + 1) % scenes.length);

		stage.classList.toggle('t-white', s.theme === 'white');
		var ch = chapterEl(s.ch);
		if (!prev || prev.ch !== s.ch) {
			// The new chapter fades in over the old one; the old one lets go once it's covered
			var old = prev ? chapterEl(prev.ch) : null;
			$$('.chapter').forEach(function (c) { c.classList.remove('on', 'was'); });
			if (old) old.classList.add('was');
			ch.classList.add('on');
			clearTimeout(wasTimer);
			wasTimer = setTimeout(function () {
				$$('.chapter:not(.on)').forEach(function (c) {
					c.classList.remove('was');
					$$('.slide.on, .pic.on', c).forEach(function (el) { el.classList.remove('on'); });
				});
			}, FADE);
		}
		$$('.slide', ch).forEach(function (el) { el.classList.toggle('on', +el.getAttribute('data-i') === s.i); });
		$$('.pic', ch).forEach(function (el) { el.classList.toggle('on', +el.getAttribute('data-i') === s.i); });

		if (s.ch === 'welcome') countUp(1200);
		if (s.ch === 'timeline') timeline(s.i, prev && prev.ch === 'timeline');
		videos(s);
		progress(k);
		if (!paused) timer = setTimeout(function () { go(cur + 1); }, s.ms);
	}

	function timeline(i, within) {
		var ch = chapterEl('timeline'), items = data.timeline.items, n = items.length, eras = data.timeline.eras || [];
		var at = Math.min(i, n - 1);
		ch.classList.toggle('is-end', i >= n);
		var head = $('.head', ch), fill = $('.track .fill', ch), eraEl = $('.era', ch), name = $('.era-name', ch);
		var glide = [head, fill, eraEl, name];
		// Entering the chapter: place everything at once, with no glide from wherever it was last loop
		if (!within) glide.forEach(function (el) { el.style.transition = 'none'; });

		var x = nodeX(at, n);
		move(head, 'translateX(' + x + 'px)');
		move(fill, 'scaleX(' + (x / TRACK) + ')');
		$$('.node', ch).forEach(function (el) {
			var j = +el.getAttribute('data-i');
			el.classList.toggle('past', j <= at); el.classList.toggle('now', j === at);
		});

		var e = items[at].era, first = at, last = at;
		while (first > 0 && items[first - 1].era === e) first--;
		while (last < n - 1 && items[last + 1].era === e) last++;
		var era = eras[e] || {}, label = (era.name || '') + (era.years ? ' · ' + era.years : '');
		var x0 = nodeX(first, n);
		move(eraEl, 'translateX(' + x0 + 'px)');
		function place() { move(name, 'translateX(' + Math.min(0, TRACK - x0 - name.offsetWidth) + 'px)'); }   // keep the name on the stage
		if (name.textContent !== label && within) {
			// A new era: the name fades out while it glides, then fades back in
			name.classList.add('swap');
			setTimeout(function () { name.textContent = label; place(); name.classList.remove('swap'); }, 500);
		} else { name.textContent = label; place(); }

		if (!within) { void head.offsetWidth; glide.forEach(function (el) { el.style.transition = ''; }); }
	}

	// Only the playing clip and the next one keep a decoder; the rest let go once faded
	function videos(s) {
		var next = scenes[(cur + 1) % scenes.length];
		$$('.cp-video video').forEach(function (v) {
			var i = +v.getAttribute('data-i');
			var on = s.ch === 'campuses' && i === s.i;
			var wasOn = v.classList.contains('on');
			v.classList.toggle('on', on);
			if (on) { try { v.currentTime = 0; } catch (e) {} var p = v.play(); if (p && p.catch) p.catch(function () {}); return; }
			var soon = next.ch === 'campuses' && i === next.i;
			if (!soon && v.getAttribute('src')) {
				setTimeout(function () { if (!v.classList.contains('on')) { v.pause(); v.removeAttribute('src'); v.load(); } }, wasOn ? FADE + 200 : 0);
			}
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
			move(f, 'scaleX(' + (on ? before / total : 0) + ')');
			if (on && !paused) {
				void f.offsetWidth;
				f.style.transition = '-webkit-transform ' + s.ms + 'ms linear, transform ' + s.ms + 'ms linear, opacity .8s ease';
				move(f, 'scaleX(' + ((before + s.ms) / total) + ')');
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
				var p = Math.min(1, (now - t0) / 2200);
				el.textContent = p < 1 ? fmt(target * (1 - Math.pow(1 - p, 4))) : raw;
				if (p < 1) requestAnimationFrame(step);
			})(t0);
		}, delay);
	}

	/* ---------- Review controls (laptop or touch) ----------
	   → or tap: next   ← : back   Space: pause   1–6: jump to a chapter
	   Tap a chapter name to jump there, or a year on the timeline to jump to it. */
	function chapterStart(key) { for (var k = 0; k < scenes.length; k++) if (scenes[k].ch === key) return k; return 0; }
	window.addEventListener('keydown', function (e) {
		if (e.key === 'ArrowRight') go(cur + 1);
		if (e.key === 'ArrowLeft') go(cur - 1);
		if (e.key === ' ') { e.preventDefault(); paused = !paused; stage.classList.toggle('paused', paused); show(cur); }
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

	/* ---------- Content (checks for edits every 10 minutes) ---------- */
	var KEY = 'ylac4k:' + CONTENT;
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
