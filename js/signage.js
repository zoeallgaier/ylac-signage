/* YLAC SIGNAGE ENGINE · v3.1
   <body data-screen="give"> loads content/give.json (?content=give-gala loads a copy).

   States (classes on .stage):
     home              one topic, one action
     home + is-spot    idle loop: the QR takes over the middle of the screen
     is-menu           options: rows fixed at the bottom, details in a fixed panel above

   Written for finicky signage players: plain ES2017 (no ?. or ??), one tap handler,
   no layout changes after load (everything is absolutely positioned in CSS). */
(function () {
	'use strict';

	var params = new URLSearchParams(location.search);
	var SCREEN = document.body.getAttribute('data-screen');
	var CONTENT = params.get('content') || SCREEN;
	var DEBUG = params.has('debug');
	var IDLE = (+params.get('idle') || 45) * 1000;   // options return home after this
	var SPOT_EVERY = 25000, SPOT_FOR = 7000;         // idle loop: QR spotlight timing
	var SHAPES = { alumni: 'hatch', impact: 'stairs', give: 'dot', gratitude: 'half' };

	var stage = document.querySelector('.stage');
	var data, dataText = '', idleTimer, spotTimer, lastTap = 0;

	function fit() { document.documentElement.style.setProperty('--scale', Math.min(innerWidth / 1080, innerHeight / 1920)); }
	window.addEventListener('resize', fit);
	fit();

	/* ---------- Markup ---------- */
	function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
	function src(p) { return /^(https?:)?\/\//.test(p) ? p : '../' + p; }
	function white() { return data.theme === 'white'; }

	// Long links (giving forms) use low error correction so each square stays big enough to scan
	function qr(url) {
		var q = qrcode(0, url.length > 80 ? 'L' : 'M');
		q.addData(url); q.make();
		var n = q.getModuleCount(), d = '';
		for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + (c + 1) + ' ' + (r + 1) + 'h1v1h-1z';
		return '<svg viewBox="0 0 ' + (n + 2) + ' ' + (n + 2) + '" shape-rendering="crispEdges" aria-hidden="true"><path fill="#1A321C" d="' + d + '"/></svg>';
	}

	function cta(c, cls) {
		return '<div class="abs cta ' + (cls || '') + '" role="group" aria-label="' + esc(c.label) + ': scan with your phone camera">' +
			'<div class="qr">' + qr(c.url) + '</div>' +
			'<div class="cta-text"><div class="d cta-label">' + esc(c.label) + '</div>' +
			'<div class="cta-where"><b>' + esc(c.short) + '</b><br>Scan with your phone camera.</div></div></div>';
	}

	function stat(s) { return '<div class="d num" data-value="' + esc(s.value) + '">' + esc(s.value) + '</div><p class="label">' + esc(s.label) + '</p>'; }

	function render() {
		var m = data.menu, n = m.items.length;
		document.body.className = 'theme-' + (white() ? 'white' : 'green') + (DEBUG ? ' show-cursor' : '');
		document.title = data.screen + ' · YLAC Signage';

		stage.innerHTML =
			'<img class="mono" src="../assets/img/uvu-mono-' + (white() ? 'green' : 'white') + '.svg" alt="Utah Valley University">' +
			'<h1 class="abs d headline enter">' + esc(data.headline) + '</h1>' +

			'<section class="full home" aria-label="' + esc(data.screen) + '">' +
				'<figure class="abs photo shape-' + esc(data.photo.shape || SHAPES[SCREEN] || 'hatch') + ' enter e2" style="margin:0">' +
					'<div class="frame"><img src="' + src(data.photo.src) + '" alt="' + esc(data.photo.alt) + '"></div></figure>' +
				'<div class="abs stat enter e3">' + stat(data.stat) + '</div>' +
				cta(data.cta, 'enter e4') +
				'<div class="spot" aria-hidden="true">' +
					'<div class="spot-qr">' + qr(data.cta.url) + '<i class="spot-scan"></i><i class="corner c1"></i><i class="corner c2"></i><i class="corner c3"></i><i class="corner c4"></i></div>' +
					'<div class="d spot-label">' + esc(data.cta.label) + '</div>' +
					'<div class="spot-where"><b>' + esc(data.cta.short) + '</b> · Scan with your phone camera.</div>' +
				'</div>' +
				'<button type="button" class="d btn btn-solid" data-act="open">' + esc(m.button) + '<i class="arrow"></i></button>' +
			'</section>' +

			'<section class="full menu" aria-label="' + esc(m.button) + '">' +
				'<div class="abs detail" style="bottom:' + (208 + n * 116 + 2 + 40) + 'px">' +
					m.items.map(function (o, i) {
						return '<div class="pane" id="pane-' + i + '" role="region" aria-labelledby="row-' + i + '">' +
							(o.stat ? stat(o.stat) : '') + '<p class="pane-text">' + esc(o.text) + '</p>' + cta(o.qr || data.cta) + '</div>';
					}).join('') +
				'</div>' +
				'<ul class="abs rows">' + m.items.map(function (o, i) {
					return '<li><button type="button" class="row" id="row-' + i + '" data-act="pick" data-i="' + i + '" aria-controls="pane-' + i + '" aria-expanded="false">' +
						'<img class="ico" src="../assets/icons/' + esc(o.icon || 'info-1') + '-' + (white() ? 'green' : 'white') + '.svg" alt="">' +
						'<span class="d name">' + esc(o.label) + '</span><i class="chev"></i></button></li>';
				}).join('') + '</ul>' +
				'<button type="button" class="d btn btn-outline" data-act="back"><i class="arrow"></i>Back</button>' +
			'</section>';

		pick(0);
		// Entrance: one frame later so the transitions run, then drop the entrance classes
		// so the spotlight's own transitions take over cleanly.
		requestAnimationFrame(function () { requestAnimationFrame(function () { stage.classList.add('ready'); }); });
		setTimeout(function () {
			[].forEach.call(stage.querySelectorAll('.enter'), function (el) { el.classList.remove('enter', 'e2', 'e3', 'e4'); });
		}, 2400);
		countUp(600);
		loop(10000);
	}

	/* ---------- Motion ---------- */
	function countUp(delay) {
		var el = stage.querySelector('.home .num'), raw = el.getAttribute('data-value');
		var m = raw.match(/^(\D*)([\d,]+(?:\.\d+)?)(.*)$/);
		if (!m || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		var target = +m[2].replace(/,/g, ''), dec = (m[2].split('.')[1] || '').length, comma = m[2].indexOf(',') > -1;
		function fmt(v) { return m[1] + (comma ? v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : v.toFixed(dec)) + m[3]; }
		el.textContent = fmt(0);
		setTimeout(function () {
			var t0 = performance.now();
			(function step(now) {
				var p = Math.min(1, (now - t0) / 1600);
				el.textContent = p < 1 ? fmt(target * (1 - Math.pow(2, -10 * p))) : raw;
				if (p < 1) requestAnimationFrame(step);
			})(t0);
		}, delay);
	}

	// Idle loop: every 25 s the QR takes the stage for 7 s, then the stat counts up again
	function loop(wait) {
		clearTimeout(spotTimer);
		spotTimer = setTimeout(function () {
			stage.classList.add('is-spot');
			spotTimer = setTimeout(function () {
				stage.classList.remove('is-spot');
				countUp(700);
				loop(SPOT_EVERY - SPOT_FOR);
			}, SPOT_FOR);
		}, wait);
	}

	/* ---------- States ---------- */
	function openMenu() {
		clearTimeout(spotTimer);
		stage.classList.remove('is-spot');
		stage.classList.add('is-menu');
		pick(0);
		bump();
	}

	function goHome() {
		clearTimeout(idleTimer);
		stage.classList.remove('is-menu');
		loop(8000);
	}

	function pick(i) {
		[].forEach.call(stage.querySelectorAll('.row'), function (r, j) { r.classList.toggle('on', j === i); r.setAttribute('aria-expanded', String(j === i)); });
		[].forEach.call(stage.querySelectorAll('.pane'), function (p, j) { p.classList.toggle('on', j === i); });
	}

	function bump() {
		clearTimeout(idleTimer);
		if (stage.classList.contains('is-menu')) idleTimer = setTimeout(goHome, IDLE);
	}

	/* ---------- Touch: one handler, first tap always counts ---------- */
	var down = null;
	stage.addEventListener('pointerdown', function (e) {
		if (e.isPrimary === false) return;
		down = { x: e.clientX, y: e.clientY, el: e.target.closest('[data-act]') };
		bump();
	});
	window.addEventListener('pointerup', function (e) {
		if (!down) return;
		var d = down; down = null;
		if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 40 || Date.now() - lastTap < 300) return;
		lastTap = Date.now();
		if (DEBUG) {
			var r = stage.getBoundingClientRect(), k = r.width / 1080, dot = document.createElement('i');
			dot.className = 'tap-dot'; dot.style.left = (e.clientX - r.left) / k + 'px'; dot.style.top = (e.clientY - r.top) / k + 'px';
			stage.appendChild(dot); setTimeout(function () { dot.remove(); }, 500);
		}
		if (!stage.classList.contains('is-menu')) return openMenu();          // any tap on home opens the options
		var act = d.el && d.el.getAttribute('data-act');
		if (act === 'pick') pick(+d.el.getAttribute('data-i'));
		if (act === 'back') goHome();
	});
	window.addEventListener('pointercancel', function () { down = null; });
	['contextmenu', 'dragstart', 'selectstart', 'dblclick', 'gesturestart'].forEach(function (t) { window.addEventListener(t, function (e) { e.preventDefault(); }); });
	stage.addEventListener('mousedown', function (e) { e.preventDefault(); });

	// Laptop review: O = options, 1–9 = pick, Esc = home, S = spotlight now
	window.addEventListener('keydown', function (e) {
		if (e.key === 'o') openMenu();
		if (e.key === 'Escape') goHome();
		if (e.key === 's') loop(0);
		if (+e.key >= 1 && +e.key <= 9) { if (!stage.classList.contains('is-menu')) openMenu(); pick(+e.key - 1); }
	});

	/* ---------- Content (checks for edits every 10 minutes while home) ---------- */
	var KEY = 'ylac31:' + CONTENT;
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
		if (stage.classList.contains('is-menu')) return;
		load().then(function (r) { if (r.text !== dataText) { data = r.json; dataText = r.text; render(); } }).catch(function () {});
	}, 600000);

	function start(r) {
		data = r.json; dataText = r.text;
		var go = function () {
			render();
			if (params.has('menu') || params.has('open')) { openMenu(); pick(+params.get('open') || 0); }
			if (params.has('spot')) loop(0);
		};
		if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
	}

	load().then(start).catch(function (err) {
		var cached = null;
		try { cached = localStorage.getItem(KEY); } catch (e) {}
		if (cached) return start({ json: JSON.parse(cached), text: cached });
		stage.innerHTML = '<div class="full notice"><b class="d">This Screen Needs a Content Fix</b>The last change to its content file couldn\'t be read.<code>' + esc(err.message) + '</code></div>';
		setTimeout(function () { location.reload(); }, 60000);
	});
}());
