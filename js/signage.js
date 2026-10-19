/* =====================================================================
   YLAC SIGNAGE ENGINE · v3
   ---------------------------------------------------------------------
   <body data-screen="give"> loads content/give.json.
   ?content=give-gala loads content/give-gala.json instead (new versions).

   Two states, nothing else:
   HOME     One topic, one action: headline, photo, stat, QR, options button.
   OPTIONS  The bottom half becomes a short list. Tapping an option opens it
            in place (sentence + its own QR); one open at a time. Back, or
            45 seconds with no touch, returns home.

   Touch: Pointer Events, first tap always counts, no hover, no press
   effects, no double-tap zoom, no long-press menus.
   ===================================================================== */
(function () {
	'use strict';

	const params = new URLSearchParams(location.search);
	const SCREEN = document.body.dataset.screen;
	const CONTENT = params.get('content') || SCREEN;
	const DEBUG = params.has('debug');
	const IDLE_MS = (+params.get('idle') || 45) * 1000;
	const REPLAY_MS = 60000;      // home entrance replays every minute
	const REFRESH_MS = 600000;    // check for content edits every 10 minutes
	const BASE = '../';
	const TAP_SLOP = 30, TAP_LOCK = 300;

	const stage = document.querySelector('.stage');
	if (DEBUG) document.body.classList.add('show-cursor');

	let data = null, dataText = '', state = 'home', idleTimer = null, replayTimer = null, lastTap = 0;

	/* ---------- Scale the 1080 × 1920 stage to any display ---------- */
	const fit = () => document.documentElement.style.setProperty('--scale', Math.min(innerWidth / 1080, innerHeight / 1920));
	addEventListener('resize', fit);
	fit();

	/* ---------- Helpers ---------- */
	const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
	const src = p => /^(https?:)?\/\//.test(p) ? p : BASE + p;
	// UVU image style: a different APFY shape composition per screen, so neighbors never match
	const SHAPES = { alumni: 'hatch', impact: 'stairs', give: 'dot', gratitude: 'half' };
	const white = () => data.theme === 'white';
	const icon = name => `${BASE}assets/icons/${name}-${white() ? 'green' : 'white'}.svg`;

	// Long links (giving forms) use low error correction so each square stays big enough to scan
	function qrSvg(url) {
		const q = qrcode(0, url.length > 80 ? 'L' : 'M');
		q.addData(url);
		q.make();
		const n = q.getModuleCount();
		let d = '';
		for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + 1} ${r + 1}h1v1h-1z`;
		return `<svg viewBox="0 0 ${n + 2} ${n + 2}" shape-rendering="crispEdges" aria-hidden="true"><path fill="#1A321C" d="${d}"/></svg>`;
	}

	const cta = c => `<div class="cta" role="group" aria-label="${esc(c.label)}: scan with your phone camera">
		<div class="qr-card">${qrSvg(c.url)}</div>
		<div><div class="cta-label">${esc(c.label)}</div><div class="cta-where"><b>${esc(c.short)}</b><br>Scan with your phone camera.</div></div>
	</div>`;

	const stat = (s, cls = '') => `<div class="stat ${cls}"><div class="stat-num" data-value="${esc(s.value)}">${esc(s.value)}</div><p class="stat-label">${esc(s.label)}</p></div>`;

	const words = text => String(text).split(' ').map((w, i) => `<span class="word"><span style="--d:${(.08 * i).toFixed(2)}s">${esc(w)}</span></span>`).join(' ');

	/* ---------- Render ---------- */
	function render() {
		document.body.className = `theme-${white() ? 'white' : 'green'}${DEBUG ? ' show-cursor' : ''}`;
		document.title = `${data.screen} · YLAC Signage`;
		const m = data.menu;
		stage.innerHTML = `
			<div class="backdrop" aria-hidden="true"><img src="${src(data.photo.src)}" alt=""></div>
			<img class="mono" src="${BASE}assets/img/uvu-mono-${white() ? 'green' : 'white'}.svg" alt="Utah Valley University">
			<h1 class="headline">${words(data.headline)}</h1>

			<section class="home" aria-label="${esc(data.screen)}">
				<figure class="photo" data-shape="${esc(data.photo.shape || SHAPES[SCREEN] || 'hatch')}">
					<div class="photo-frame"><img src="${src(data.photo.src)}" alt="${esc(data.photo.alt)}"></div>
				</figure>
				${stat(data.stat)}
				${cta(data.cta)}
				<button type="button" class="btn btn--solid" data-act="open">${esc(m.button)}<span class="arrow" aria-hidden="true"></span></button>
			</section>

			<section class="menu" aria-label="${esc(m.button)}" hidden>
				<ul class="options">${m.items.map((o, i) => `<li class="opt">
					<button type="button" class="opt-head" data-act="toggle" aria-expanded="false" aria-controls="opt-${i}" id="opt-h-${i}">
						<img class="ico" src="${icon(o.icon || 'info-1')}" alt=""><b>${esc(o.label)}</b><span class="chev" aria-hidden="true"></span>
					</button>
					<div class="opt-body" id="opt-${i}" role="region" aria-labelledby="opt-h-${i}" hidden>
						${o.stat ? stat(o.stat, 'opt-stat') : ''}
						<p class="opt-text">${esc(o.text)}</p>
						${cta(o.qr || data.cta)}
					</div>
				</li>`).join('')}</ul>
				<button type="button" class="btn btn--outline" data-act="back"><span class="arrow" aria-hidden="true"></span>Back</button>
			</section>`;
		playHome();
	}

	// Entrance: words rise, photo unveils, number counts up, action settles last
	function playHome(first = true) {
		const home = stage.querySelector('.home');
		stage.classList.remove('play');
		void stage.offsetWidth;                 // restart the CSS animations
		stage.classList.add('play');
		if (!first) home.querySelector('.photo-frame').style.animation = 'none';  // replays keep the photo still
		countUp(home.querySelector('.stat-num'), 600);
		clearTimeout(replayTimer);
		replayTimer = setTimeout(() => { if (state === 'home') playHome(false); }, REPLAY_MS);
	}

	function countUp(el, delay) {
		const raw = el.dataset.value, m = raw.match(/^(\D*)([\d,]+(?:\.\d+)?)(.*)$/);
		if (!m || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const [, pre, num, post] = m, target = +num.replace(/,/g, ''), dec = (num.split('.')[1] || '').length, comma = num.includes(',');
		const fmt = v => pre + (comma ? v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : v.toFixed(dec)) + post;
		el.textContent = fmt(0);
		setTimeout(() => {
			const t0 = performance.now();
			const step = now => {
				const p = Math.min(1, (now - t0) / 1600);
				el.textContent = p < 1 ? fmt(target * (1 - Math.pow(2, -10 * p))) : raw;
				if (p < 1 && el.isConnected) requestAnimationFrame(step);
			};
			requestAnimationFrame(step);
		}, delay);
	}

	/* ---------- States ---------- */
	function show(next) {
		state = next;
		const home = stage.querySelector('.home'), menu = stage.querySelector('.menu');
		home.hidden = next !== 'home';
		menu.hidden = next !== 'menu';
		(next === 'home' ? home : menu).classList.remove('swap');
		void stage.offsetWidth;
		(next === 'home' ? home : menu).classList.add('swap');
		if (next === 'home') { collapseAll(); playHome(false); clearTimeout(idleTimer); }
		else bumpIdle();
	}

	function collapseAll(except) {
		stage.querySelectorAll('.opt-head').forEach(h => {
			if (h === except) return;
			h.setAttribute('aria-expanded', 'false');
			document.getElementById(h.getAttribute('aria-controls')).hidden = true;
		});
	}

	function toggle(head) {
		const open = head.getAttribute('aria-expanded') === 'true';
		collapseAll(head);
		head.setAttribute('aria-expanded', String(!open));
		document.getElementById(head.getAttribute('aria-controls')).hidden = open;
	}

	function bumpIdle() {
		clearTimeout(idleTimer);
		if (state === 'menu') idleTimer = setTimeout(() => show('home'), IDLE_MS);
	}

	/* ---------- Touch ---------- */
	const ACTIONS = { open: () => show('menu'), back: () => show('home'), toggle };
	let down = null;
	stage.addEventListener('pointerdown', e => {
		if (e.isPrimary === false) return;
		down = { x: e.clientX, y: e.clientY, target: e.target.closest('[data-act]') };
		bumpIdle();
	});
	addEventListener('pointerup', e => {
		if (!down) return;
		const d = down; down = null;
		if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > TAP_SLOP) return;
		const now = Date.now();
		if (now - lastTap < TAP_LOCK) return;
		lastTap = now;
		if (DEBUG) {
			const r = stage.getBoundingClientRect(), k = r.width / 1080, dot = document.createElement('i');
			dot.className = 'tap-dot'; dot.style.left = (e.clientX - r.left) / k + 'px'; dot.style.top = (e.clientY - r.top) / k + 'px';
			stage.appendChild(dot); setTimeout(() => dot.remove(), 500);
		}
		if (state === 'home') return show('menu');            // anywhere on home opens the options
		if (d.target && ACTIONS[d.target.dataset.act]) ACTIONS[d.target.dataset.act](d.target);
	});
	addEventListener('pointercancel', () => { down = null; });
	stage.addEventListener('scroll', () => { stage.scrollTop = 0; stage.scrollLeft = 0; });
	stage.addEventListener('mousedown', e => e.preventDefault());
	['contextmenu', 'dragstart', 'gesturestart', 'selectstart', 'dblclick'].forEach(t => addEventListener(t, e => e.preventDefault(), { passive: false }));
	addEventListener('click', e => e.preventDefault(), true);

	// Laptop review: O opens options, Esc goes home, 1–9 opens that option
	addEventListener('keydown', e => {
		if (e.key === 'o') show('menu');
		if (e.key === 'Escape') show('home');
		const n = +e.key;
		if (n >= 1 && n <= 9) { if (state !== 'menu') show('menu'); const h = stage.querySelectorAll('.opt-head')[n - 1]; if (h) toggle(h); }
	});

	/* ---------- Content ---------- */
	const cacheKey = 'ylac3:' + CONTENT;
	async function load() {
		const res = await fetch(`${BASE}content/${CONTENT}.json`, { cache: 'no-store' });
		if (!res.ok) throw new Error(`content/${CONTENT}.json → ${res.status}`);
		const text = await res.text();
		let json;
		try { json = JSON.parse(text); } catch (err) { throw new Error(`content/${CONTENT}.json has a typo:\n${err.message}`); }
		try { localStorage.setItem(cacheKey, text); } catch (e) {}
		return { json, text };
	}

	// Pick up edits without anyone touching the player (only while home, so nobody is mid-tap)
	setInterval(async () => {
		if (state !== 'home') return;
		try { const r = await load(); if (r.text !== dataText) { data = r.json; dataText = r.text; render(); } } catch (e) {}
	}, REFRESH_MS);

	function fail(err) {
		stage.innerHTML = `<div class="notice"><div><b>This Screen Needs a Content Fix</b>The last change to its content file couldn't be read.<br><code>${esc(err.message)}</code></div></div>`;
		setTimeout(() => location.reload(), 60000);
	}

	(async function start() {
		try { const r = await load(); data = r.json; dataText = r.text; }
		catch (err) {
			let cached = null;
			try { cached = localStorage.getItem(cacheKey); } catch (e) {}
			if (!cached) return fail(err);
			data = JSON.parse(cached); dataText = cached;
		}
		await document.fonts.ready;
		render();
		if (params.has('menu')) show('menu');
		if (params.has('open')) { show('menu'); toggle(stage.querySelectorAll('.opt-head')[+params.get('open') || 0]); }
	}());
}());
