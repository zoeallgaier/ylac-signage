/* =====================================================================
   YLAC SIGNAGE ENGINE
   ---------------------------------------------------------------------
   One engine for all four screens. Each screen's page sets
   <body data-screen="give"> and the engine loads content/give.json.
   ?content=give-gala loads content/give-gala.json instead, which is how
   you make a new version without touching the original.

   Two modes:
   1. DEMO: a store-demo loop of branded motion scenes, with one QR code
      and one "Explore" button always on screen.
   2. EXPLORE: any tap opens a short topic list → a topic page with its
      own QR code. After IDLE_MS with no touch it slides back to the demo.

   Touch: one tap handler on Pointer Events. No hover, no click/dblclick,
   no mouse-only events, so the first tap always counts (the XD problem).
   ===================================================================== */
(function () {
	'use strict';

	const params = new URLSearchParams(location.search);
	const SCREEN = document.body.dataset.screen;
	const CONTENT = params.get('content') || SCREEN;
	const DEBUG = params.has('debug');
	const IDLE_MS = (+params.get('idle') || 45) * 1000;
	const BASE = '../';
	const SCENE_MS = 7000;
	const TAP_SLOP = 30;   // px a finger can drift and still count as a tap
	const TAP_LOCK = 350;  // ms between taps (no ghost double-taps)

	const stage = document.querySelector('.stage');
	const scenesEl = stage.querySelector('.scenes');
	const dockEl = stage.querySelector('.dock');
	const exploreEl = stage.querySelector('.explore');
	if (DEBUG) document.body.classList.add('show-cursor');

	let data = null, dataText = '';
	let sceneIdx = -1, sceneTimer = null, idleTimer = null, mode = 'demo', lastTap = 0;

	/* ---------- Stage scaling ---------- */
	function fit() { document.documentElement.style.setProperty('--scale', Math.min(innerWidth / 1080, innerHeight / 1920)); }
	addEventListener('resize', fit);
	fit();

	/* ---------- Helpers ---------- */
	const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
	const src = p => p ? (/^(https?:)?\/\//.test(p) ? p : BASE + p) : '';
	const onWhite = () => data.theme === 'white';
	const icon = (name, color) => `${BASE}assets/icons/${name}-${color || (onWhite() ? 'green' : 'white')}.svg`;
	const shortUrl = u => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

	// Letter-by-letter blur-in, same as zoeallgaier.com's reveal.js
	function chars(text, base = 0.25, gap = 0.032) {
		let i = 0;
		return String(text).split(' ').map(w =>
			`<span class="word">${[...w].map(ch => `<span class="char-mask"><span class="char" style="--d:${(base + i++ * gap).toFixed(3)}s">${esc(ch)}</span></span>`).join('')}</span>`
		).join(' ');
	}

	// Long links (Blackbaud forms) use low error correction so the squares stay big enough to scan
	function qrSvg(url) {
		const q = qrcode(0, url.length > 80 ? 'L' : 'M');
		q.addData(url);
		q.make();
		const n = q.getModuleCount(), m = 1;
		let d = '';
		for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
		return `<svg viewBox="0 0 ${n + m * 2} ${n + m * 2}" shape-rendering="crispEdges" role="img" aria-label="QR code"><path fill="#1A321C" d="${d}"/></svg>`;
	}

	function qrBlock(qr) {
		if (!qr || !qr.url) return '';
		return `<div class="qr">
			<div class="qr-card">${qrSvg(qr.url)}</div>
			<div class="qr-text"><b>${esc(qr.label)}</b><span class="short">${esc(qr.short || shortUrl(qr.url))}</span><span>Scan with your phone camera.</span></div>
		</div>`;
	}

	/* APFY shapes: only around framed photos (uvu.edu image style), rotated so neighbors never match */
	const FRAMES = [
		{ a: ['hatch-circle-rise', 'left:0;top:0;width:30%'], b: ['ring-lake', 'right:8px;bottom:8px;width:10%'] },
		{ a: ['stairs-green', 'left:0;bottom:0;width:26%'], b: ['square-outline-brick', 'right:6px;top:6px;width:9%'] },
		{ a: ['circle-rise', 'right:8%;top:0;width:22%'], b: ['x-rise', 'left:6px;bottom:10%;width:7%'] },
		{ a: ['steps-meadow', 'right:0;bottom:0;width:24%'], b: ['half-wolverine', 'left:0;top:22%;width:6%'] },
	];
	let frameTurn = 0;
	function frame(photo, alt) {
		const f = FRAMES[frameTurn++ % FRAMES.length];
		return `<figure class="frame">
			<img class="shape-a" src="${BASE}assets/shapes/${f.a[0]}.svg" alt="" style="${f.a[1]}">
			<img src="${src(photo)}" alt="${esc(alt)}">
			<img class="shape-b" src="${BASE}assets/shapes/${f.b[0]}.svg" alt="" style="${f.b[1]}">
		</figure>`;
	}

	const lead = (s, d) => s.lead ? `<p class="lead rise" style="--d:${d}s">${esc(s.lead)}</p>` : '';

	/* ---------- Scenes ---------- */
	const SCENES = {
		title: s => `<h1 class="display">${chars(s.headline)}</h1>${lead(s, 1.1)}`,

		stat: s => `<div class="stat-value">${esc(s.prefix || '')}<span class="num">${esc(s.value)}</span>${s.unit ? `<span class="unit">${esc(s.unit)}</span>` : ''}</div>
			<div class="stat-rule"></div>
			<h2 class="h2 rise" style="--d:.5s">${esc(s.label)}</h2>${lead(s, .9)}`,

		photo: s => `<div class="bleed"><img src="${src(s.photo)}" alt="${esc(s.alt)}"></div>
			<div class="copy"><h1 class="display">${chars(s.headline, .6)}</h1>${lead(s, 1.4)}</div>`,

		framed: s => `${frame(s.photo, s.alt)}<h2 class="h2">${chars(s.headline, .7, .026)}</h2>${lead(s, 1.4)}`,

		quote: s => `<blockquote class="pull rise" style="--d:.2s"><p>“${esc(s.quote)}”</p></blockquote>
			<div class="cite rise" style="--d:.9s">${s.photo ? `<img src="${src(s.photo)}" alt="">` : ''}<div><b>${esc(s.name)}</b><span>${esc(s.detail)}</span></div></div>`,

		timeline: s => `<h2 class="h2">${chars(s.headline, .25, .026)}</h2>
			<ol class="eras">${s.items.map((e, i) => `<li class="era rise" style="--d:${(.9 + i * .1).toFixed(2)}s"><b>${esc(e.year)}</b><span>${esc(e.name)}</span></li>`).join('')}</ol>`,

		list: s => `<h2 class="h2">${chars(s.headline, .25, .026)}</h2>
			<ul class="rows">${s.items.map((r, i) => `<li class="row rise" style="--d:${(.9 + i * .3).toFixed(2)}s">
				<img class="ico" src="${icon(r.icon || 'donation')}" alt=""><div><b>${esc(r.title)}</b>${r.text ? `<small>${esc(r.text)}</small>` : ''}</div>
			</li>`).join('')}</ul>`,

		names: s => `<h2 class="h2">${chars(s.headline, .25, .026)}</h2>${lead(s, .9)}
			<div class="names-window rise" style="--d:1s"><ul class="names">${(s.names || []).map(n => `<li>${esc(n)}</li>`).join('')}</ul></div>`,

		cta: s => {
			const qr = s.qr || data.qr;
			return `<h1 class="display">${chars(s.headline)}</h1>${lead(s, 1)}
				<div class="qr-big">${qrSvg(qr.url)}</div>
				<div class="qr-short rise" style="--d:1.2s">${esc(qr.short || shortUrl(qr.url))}</div>`;
		},
	};

	// After a scene mounts: count-ups, timeline sweep, name scroll
	function afterRender(el, s, ms) {
		const num = el.querySelector('.num');
		if (num) {
			const raw = String(s.value).replace(/,/g, '');
			if (/^\d+(\.\d+)?$/.test(raw)) {
				const target = +raw, dec = (raw.split('.')[1] || '').length, t0 = performance.now();
				const step = now => {
					const p = Math.min(1, (now - t0) / 1800), e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
					num.textContent = (target * e).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
					if (p < 1 && el.isConnected) requestAnimationFrame(step);
				};
				num.textContent = '0';
				requestAnimationFrame(step);
			}
		}
		const eras = [...el.querySelectorAll('.era')];
		if (eras.length) {
			const per = (ms - 2600) / eras.length;
			eras.forEach((e, i) => setTimeout(() => eras.forEach((x, j) => {
				x.classList.toggle('is-on', j === i);
				x.classList.toggle('is-past', j < i);
			}), 1800 + i * per));
		}
		const names = el.querySelector('.names');
		if (names) requestAnimationFrame(() => {
			names.style.setProperty('--travel', Math.min(0, names.parentElement.clientHeight - names.scrollHeight) + 'px');
			names.style.setProperty('--dur', (ms - 1800) / 1000 + 's');
		});
	}

	/* ---------- Demo loop ---------- */
	function showScene(i) {
		const list = data.demo;
		sceneIdx = (i + list.length) % list.length;
		const s = list[sceneIdx];
		const ms = s.seconds ? s.seconds * 1000 : SCENE_MS;

		const old = scenesEl.querySelector('.scene:not(.is-leaving)');
		if (old) { old.classList.add('is-leaving'); setTimeout(() => old.remove(), 800); }

		const el = document.createElement('section');
		el.className = `scene scene--${s.type}`;
		el.innerHTML = (SCENES[s.type] || SCENES.title)(s);
		setTimeout(() => { scenesEl.appendChild(el); afterRender(el, s, ms); }, old ? 350 : 0);
		stage.classList.toggle('is-cta', s.type === 'cta');

		const next = list[(sceneIdx + 1) % list.length];
		if (next.photo) new Image().src = src(next.photo);

		clearTimeout(sceneTimer);
		sceneTimer = setTimeout(() => {
			if (sceneIdx === list.length - 1) refresh().then(() => showScene(0));
			else showScene(sceneIdx + 1);
		}, ms);
	}

	function renderDock() {
		dockEl.innerHTML = `${qrBlock(data.qr)}
			<button class="btn ${onWhite() ? 'btn--primary' : 'btn--light'} explore-btn" type="button" data-act="open">${esc(data.explore.button)}<img src="${icon('ui-arrow-right', onWhite() ? 'white' : 'green')}" alt=""></button>`;
	}

	/* ---------- Explore ---------- */
	function openExplore() {
		if (mode === 'explore') return;
		mode = 'explore';
		clearTimeout(sceneTimer);
		renderTopics(false);
		exploreEl.classList.add('is-open');
		bumpIdle();
	}

	function closeExplore() {
		if (mode !== 'explore') return;
		mode = 'demo';
		clearTimeout(idleTimer);
		exploreEl.classList.remove('is-open');
		setTimeout(() => showScene(sceneIdx + 1), 400);
	}

	function bumpIdle() {
		clearTimeout(idleTimer);
		if (mode === 'explore') idleTimer = setTimeout(closeExplore, IDLE_MS);
	}

	function view(html, back) {
		exploreEl.querySelector('.view')?.remove();
		const v = document.createElement('div');
		v.className = 'view ' + (back ? 'is-entering-back' : 'is-entering');
		v.innerHTML = html;
		exploreEl.appendChild(v);
	}

	function renderTopics(back) {
		const x = data.explore;
		view(`<h2 class="h2">${esc(x.title)}</h2>${x.lead ? `<p class="lead">${esc(x.lead)}</p>` : ''}
			<ul class="rows">${x.items.map((t, i) => `<li><button type="button" class="row" data-act="topic" data-i="${i}" style="--d:${(.1 + i * .06).toFixed(2)}s">
				<img class="ico" src="${icon(t.icon || 'info-1')}" alt=""><span><b>${esc(t.label)}</b></span><img class="go" src="${icon('ui-arrow-right')}" alt="">
			</button></li>`).join('')}</ul>
			<button type="button" class="btn btn--secondary" data-act="close">Close</button>`, back);
	}

	function renderTopic(i) {
		const t = data.explore.items[i];
		const body = [].concat(t.body || []).map(p => `<p>${esc(p)}</p>`).join('');
		const people = t.people ? `<ul class="people">${t.people.map((p, j) => `<li style="--d:${(.1 + j * .06).toFixed(2)}s"><img src="${src(p.photo)}" alt=""><b>${esc(p.name)}</b><span>${esc(p.role)}</span></li>`).join('')}</ul>` : '';
		view(`<div class="detail view">
				${t.photo && !t.people ? frame(t.photo, t.alt) : ''}
				<h2 class="h2">${esc(t.title || t.label)}</h2>
				${body}${people}
				${qrBlock(t.qr || data.qr)}
				<div class="foot">
					<button type="button" class="btn btn--secondary back" data-act="back"><img src="${icon('ui-arrow-right')}" alt="">Back</button>
					<button type="button" class="btn btn--secondary" data-act="close">Close</button>
				</div>
			</div>`);
	}

	/* ---------- Touch ---------- */
	const ACTIONS = {
		open: openExplore,
		close: closeExplore,
		back: () => renderTopics(true),
		topic: el => renderTopic(+el.dataset.i),
	};

	let down = null;
	function onDown(e) {
		if (e.isPrimary === false) return;
		const target = e.target.closest('[data-act]');
		down = { x: e.clientX, y: e.clientY, target };
		if (target) target.classList.add('is-pressed');
		bumpIdle();
	}
	function onUp(e) {
		if (!down) return;
		const d = down; down = null;
		if (d.target) d.target.classList.remove('is-pressed');
		if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > TAP_SLOP) return;
		const now = Date.now();
		if (now - lastTap < TAP_LOCK) return;
		lastTap = now;
		if (DEBUG) {
			const r = stage.getBoundingClientRect(), s = r.width / 1080, dot = document.createElement('i');
			dot.className = 'tap-dot';
			dot.style.left = (e.clientX - r.left) / s + 'px';
			dot.style.top = (e.clientY - r.top) / s + 'px';
			stage.appendChild(dot);
			setTimeout(() => dot.remove(), 800);
		}
		if (mode === 'demo') return openExplore(); // a tap anywhere on the demo opens Explore
		if (d.target && ACTIONS[d.target.dataset.act]) ACTIONS[d.target.dataset.act](d.target);
	}
	function onCancel() { if (down && down.target) down.target.classList.remove('is-pressed'); down = null; }

	if (window.PointerEvent) {
		stage.addEventListener('pointerdown', onDown);
		addEventListener('pointerup', onUp);
		addEventListener('pointercancel', onCancel);
	} else { // very old webviews
		const pt = (e, f) => { const t = e.changedTouches ? e.changedTouches[0] : e; f({ clientX: t.clientX, clientY: t.clientY, target: e.target }); };
		stage.addEventListener('touchstart', e => pt(e, onDown), { passive: true });
		addEventListener('touchend', e => { pt(e, onUp); e.preventDefault(); }, { passive: false });
	}
	// Nothing may scroll the stage sideways (focus, scrollIntoView)
	[stage, exploreEl, scenesEl].forEach(el => el.addEventListener('scroll', () => { el.scrollTop = 0; el.scrollLeft = 0; }));
	stage.addEventListener('mousedown', e => e.preventDefault());
	// No long-press menus, drags, pinch zoom, double-tap zoom, or link clicks
	['contextmenu', 'dragstart', 'gesturestart', 'selectstart', 'dblclick'].forEach(t => addEventListener(t, e => e.preventDefault(), { passive: false }));
	addEventListener('click', e => e.preventDefault(), true);

	// Laptop review: → / ← scenes, E explore, Esc close
	addEventListener('keydown', e => {
		if (e.key === 'ArrowRight' && mode === 'demo') showScene(sceneIdx + 1);
		if (e.key === 'ArrowLeft' && mode === 'demo') showScene(sceneIdx - 1);
		if (e.key === 'e') openExplore();
		if (e.key === 'Escape') closeExplore();
	});

	/* ---------- Content ---------- */
	const cacheKey = 'ylac:' + CONTENT;
	async function load() {
		const res = await fetch(`${BASE}content/${CONTENT}.json`, { cache: 'no-store' });
		if (!res.ok) throw new Error(`content/${CONTENT}.json → ${res.status}`);
		const text = await res.text();
		let json;
		try { json = JSON.parse(text); }
		catch (err) { throw new Error(`content/${CONTENT}.json has a typo:\n${err.message}`); }
		try { localStorage.setItem(cacheKey, text); } catch (e) {}
		return { json, text };
	}

	// End of every loop: pick up edits without anyone touching the player
	async function refresh() {
		try {
			const { json, text } = await load();
			if (text !== dataText) { data = json; dataText = text; apply(); }
		} catch (e) { /* keep showing the last good version */ }
	}

	function apply() {
		document.body.classList.toggle('theme-white', onWhite());
		document.body.classList.toggle('theme-green', !onWhite());
		document.title = `${data.screen || SCREEN} · YLAC Signage`;
		renderDock();
	}

	function fail(err) {
		const n = document.createElement('div');
		n.className = 'notice';
		n.innerHTML = `<div><b>This Screen Needs a Content Fix</b><p>The last change to its content file couldn't be read.</p><code>${esc(err.message)}</code></div>`;
		stage.appendChild(n);
		setTimeout(() => location.reload(), 60000);
	}

	async function start() {
		try {
			const r = await load();
			data = r.json; dataText = r.text;
		} catch (err) {
			let cached = null;
			try { cached = localStorage.getItem(cacheKey); } catch (e) {}
			if (!cached) return fail(err);
			data = JSON.parse(cached); dataText = cached;
		}
		apply();
		await document.fonts.ready;
		showScene(+params.get('scene') || 0);
		if (params.has('explore')) openExplore();
		if (params.has('topic')) renderTopic(+params.get('topic'));
	}

	start();
}());
