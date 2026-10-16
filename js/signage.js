/* =====================================================================
   YLAC SIGNAGE ENGINE
   ---------------------------------------------------------------------
   One engine for all four screens. Each screen's page sets
   <body data-screen="give"> and the engine loads content/give.json.
   A different file can be loaded with ?content=give-spring-2027
   (that's how you make a new version: copy the JSON, point PlaySignage
   at the new URL).

   Two modes:
   1. DEMO: an Apple-store-style loop of branded motion scenes, with a
      QR code always on screen. Works with nobody touching it.
   2. EXPLORE: any tap opens topic cards → detail + QR. After IDLE_MS
      with no touch it slides away and the demo picks up again.

   Touch: one handler (tap()) built on Pointer Events. No hover, no
   click/dblclick, no reliance on mouse events, so the first tap always
   counts. That's what broke in the XD prototype.
   ===================================================================== */
(function () {
	'use strict';

	const params = new URLSearchParams(location.search);
	const SCREEN = document.body.dataset.screen;
	const CONTENT = params.get('content') || SCREEN;
	const DEBUG = params.has('debug');
	const IDLE_MS = (+params.get('idle') || 45) * 1000;
	const BASE = document.body.dataset.base || '../';
	const SCENE_MS = 7000;
	const TAP_SLOP = 30;      // px the finger may drift and still be a tap
	const TAP_LOCK = 350;     // ms to ignore taps after one lands (no ghost double-taps)

	const stage = document.querySelector('.stage');
	const scenesEl = stage.querySelector('.scenes');
	const ticksEl = stage.querySelector('.ticks');
	const dockEl = stage.querySelector('.dock');
	const exploreEl = stage.querySelector('.explore');

	if (DEBUG) document.body.classList.add('show-cursor');

	let data = null, dataText = '';
	let sceneIdx = -1, sceneTimer = null, idleTimer = null, mode = 'demo';
	let lastTap = 0;

	/* ---------- Stage scaling ---------- */
	function fit() {
		const s = Math.min(innerWidth / 1080, innerHeight / 1920);
		document.documentElement.style.setProperty('--scale', s);
	}
	addEventListener('resize', fit);
	fit();

	/* ---------- Helpers ---------- */
	const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
	const img = p => p ? (/^(https?:)?\/\//.test(p) ? p : BASE + p) : '';
	const icon = (name, color) => `${BASE}assets/icons/${name}-${color}.svg`;
	const onWarm = () => document.body.classList.contains('theme-warm');

	// Letter-by-letter blur-in, same as zoeallgaier.com's reveal.js
	function chars(text, base = 0.25, gap = 0.035) {
		let i = 0;
		return esc(text).split(' ').map(w =>
			`<span class="word">${[...w.replace(/&amp;/g, '&')].map(ch =>
				`<span class="char-mask"><span class="char" style="--d:${(base + i++ * gap).toFixed(3)}s">${esc(ch)}</span></span>`).join('')}</span>`
		).join(' ');
	}

	function qrSvg(url) {
		const q = qrcode(0, 'M');
		q.addData(url);
		q.make();
		const n = q.getModuleCount(), m = 2; // quiet zone handled by the white card
		let d = '';
		for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
		return `<svg viewBox="0 0 ${n + m * 2} ${n + m * 2}" shape-rendering="crispEdges" role="img" aria-label="QR code for ${esc(url)}"><path fill="#1A321C" d="${d}"/></svg>`;
	}

	function qrBlock(qr) {
		if (!qr || !qr.url) return '';
		return `<div class="dock-qr">
			<div class="qr-card">${qrSvg(qr.url)}</div>
			<div class="qr-text"><b>${esc(qr.label)}</b><span class="short">${esc(qr.short || qr.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</span><span class="how">Point your phone camera here. Opens on your phone.</span></div>
		</div>`;
	}

	/* APFY shapes: each scene gets a composition, rotated so neighbors never match */
	const SHAPES_GREEN = [
		[['hatch-circle-rise', 'right:-120px;top:150px;width:520px', .2], ['ring-meadow', 'left:60px;bottom:620px;width:120px', .6]],
		[['stairs-rise', 'right:-40px;top:220px;width:300px', .3], ['x-meadow', 'left:70px;bottom:660px;width:90px', .7]],
		[['circle-fern', 'right:-200px;top:260px;width:460px', .2], ['hatch-half-meadow', 'right:120px;bottom:620px;width:240px', .5]],
		[['half-rise', 'right:-60px;top:330px;width:200px', .3], ['steps-meadow', 'left:-30px;bottom:600px;width:260px', .6]],
	];
	const SHAPES_WARM = [
		[['hatch-circle-meadow', 'right:-120px;top:150px;width:520px', .2], ['ring-lake', 'left:60px;bottom:620px;width:120px', .6]],
		[['stairs-green', 'right:-40px;top:220px;width:300px', .3], ['x-rise', 'left:70px;bottom:660px;width:90px', .7]],
		[['circle-meadow', 'right:-200px;top:260px;width:460px', .2], ['hatch-half-lake', 'right:120px;bottom:620px;width:240px', .5]],
		[['half-wolverine', 'right:-60px;top:330px;width:200px', .3], ['steps-fern', 'left:-30px;bottom:600px;width:260px', .6]],
	];
	const FRAMES = [
		{ a: ['hatch-circle-rise', 'left:0;top:0;width:34%'], b: ['ring-lake', 'right:6px;bottom:6px;width:11%'] },
		{ a: ['stairs-green', 'left:0;bottom:0;width:28%'], b: ['square-outline-brick', 'right:4px;top:4px;width:10%'] },
		{ a: ['circle-rise', 'right:8%;top:0;width:24%'], b: ['x-rise', 'left:4px;bottom:10%;width:8%'] },
		{ a: ['steps-meadow', 'right:0;bottom:0;width:26%'], b: ['half-wolverine', 'left:0;top:22%;width:7%'] },
	];
	let shapeTurn = 0, frameTurn = 0;
	function shapes() {
		const set = (onWarm() ? SHAPES_WARM : SHAPES_GREEN)[shapeTurn++ % 4];
		return set.map(([f, pos, d]) => `<img class="shape" src="${BASE}assets/shapes/${f}.svg" alt="" style="${pos};--d:${d}s">`).join('');
	}
	// Explore topics: shapes sit in the open band between the heading and the cards
	function exploreShapes() {
		const [big, small] = onWarm() ? ['hatch-circle-meadow', 'ring-lake'] : ['hatch-circle-rise', 'ring-meadow'];
		return `<img class="shape" src="${BASE}assets/shapes/${big}.svg" alt="" style="right:-150px;top:330px;width:380px;--d:.3s">
			<img class="shape" src="${BASE}assets/shapes/${small}.svg" alt="" style="left:0;top:420px;width:110px;--d:.5s">`;
	}
	function frame(src, portrait, alt) {
		const f = FRAMES[frameTurn++ % FRAMES.length];
		return `<figure class="frame${portrait ? ' frame--portrait' : ''}">
			<img class="shape-a" src="${BASE}assets/shapes/${f.a[0]}.svg" alt="" style="${f.a[1]}">
			<img src="${img(src)}" alt="${esc(alt)}">
			<img class="shape-b" src="${BASE}assets/shapes/${f.b[0]}.svg" alt="" style="${f.b[1]}">
		</figure>`;
	}

	/* ---------- Scene renderers ---------- */
	const SCENES = {
		title: s => `${shapes()}
			${s.eyebrow ? `<span class="eyebrow rise" style="--d:.1s">${esc(s.eyebrow)}</span>` : ''}
			<h1 class="display">${chars(s.headline, .3)}</h1>
			${s.lead ? `<p class="lead rise" style="--d:1.1s">${esc(s.lead)}</p>` : ''}`,

		stat: s => `${shapes()}
			${s.eyebrow ? `<span class="eyebrow rise" style="--d:.1s">${esc(s.eyebrow)}</span>` : ''}
			<div class="stat-value" data-count="${esc(s.value)}">${esc(s.prefix || '')}<span class="num">${esc(s.value)}</span>${s.unit ? `<span class="unit">${esc(s.unit)}</span>` : ''}</div>
			<div class="stat-rule"></div>
			<p class="stat-label rise" style="--d:.5s">${esc(s.label)}</p>
			${s.note ? `<p class="meta rise" style="--d:.9s">${esc(s.note)}</p>` : ''}`,

		photo: s => `<div class="bleed"><img src="${img(s.photo)}" alt="${esc(s.alt)}"></div>
			<div class="copy">
				${s.eyebrow ? `<span class="eyebrow rise" style="--d:.4s">${esc(s.eyebrow)}</span>` : ''}
				<h1 class="display">${chars(s.headline, .6)}</h1>
				${s.lead ? `<p class="lead rise" style="--d:1.4s">${esc(s.lead)}</p>` : ''}
			</div>`,

		framed: s => `${frame(s.photo, s.portrait, s.alt)}
			${s.eyebrow ? `<span class="eyebrow rise" style="--d:.5s">${esc(s.eyebrow)}</span>` : ''}
			<h2 class="h2">${chars(s.headline, .7, .028)}</h2>
			${s.lead ? `<p class="lead rise" style="--d:1.4s">${esc(s.lead)}</p>` : ''}`,

		timeline: s => `${s.eyebrow ? `<span class="eyebrow rise" style="--d:.1s">${esc(s.eyebrow)}</span>` : ''}
			<h2 class="h2">${chars(s.headline, .25, .028)}</h2>
			<ol class="eras">${s.items.map((e, i) => `<li class="era rise" style="--d:${(.9 + i * .12).toFixed(2)}s"><b>${esc(e.year)}</b><span>${esc(e.name)}</span></li>`).join('')}</ol>`,

		list: s => `${s.eyebrow ? `<span class="eyebrow rise" style="--d:.1s">${esc(s.eyebrow)}</span>` : ''}
			<h2 class="h2">${chars(s.headline, .25, .028)}</h2>
			<ul class="rows">${s.items.map((r, i) => `<li class="row rise" style="--d:${(1 + i * .35).toFixed(2)}s">
				<span class="ico"><img src="${icon(r.icon || 'donation', onWarm() ? 'green' : 'white')}" alt=""></span>
				<div><h3>${r.amount ? `<span class="amt">${esc(r.amount)}</span>` : ''}${esc(r.title)}</h3><p>${esc(r.text)}</p></div>
			</li>`).join('')}</ul>`,

		quote: s => `${shapes()}
			<div class="quote-mark rise" style="--d:.1s">“</div>
			<blockquote class="quote rise" style="--d:.35s">${esc(s.quote)}</blockquote>
			<div class="cite rise" style="--d:1s">
				${s.photo ? `<img src="${img(s.photo)}" alt="">` : ''}
				<div><b>${esc(s.name)}</b><span>${esc(s.detail)}</span></div>
			</div>`,

		names: s => `${s.eyebrow ? `<span class="eyebrow rise" style="--d:.1s">${esc(s.eyebrow)}</span>` : ''}
			<h2 class="h2">${chars(s.headline, .25, .028)}</h2>
			${s.lead ? `<p class="lead rise" style="--d:.9s">${esc(s.lead)}</p>` : ''}
			<div class="names-window rise" style="--d:1s"><ul class="names">${(s.names || []).map(n => `<li>${esc(n)}</li>`).join('')}</ul></div>`,

		cta: s => `${s.eyebrow ? `<span class="eyebrow rise" style="--d:.1s">${esc(s.eyebrow)}</span>` : ''}
			<h1 class="display">${chars(s.headline, .25)}</h1>
			${s.lead ? `<p class="lead rise" style="--d:1s">${esc(s.lead)}</p>` : ''}
			<div class="qr-big">${qrSvg((s.qr || data.qr).url)}</div>
			<div class="qr-short rise" style="--d:1.2s">${esc((s.qr || data.qr).short)}</div>`,
	};

	// After a scene is in the DOM: count-ups, timeline sweep, name scroll
	function afterRender(el, s, ms) {
		const num = el.querySelector('.stat-value .num');
		if (num) {
			const raw = String(s.value).replace(/,/g, '');
			const target = parseFloat(raw);
			if (!isNaN(target) && /^[\d.]+$/.test(raw)) {
				const dec = (raw.split('.')[1] || '').length, t0 = performance.now(), dur = 1800;
				const step = now => {
					const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(2, -10 * p);
					num.textContent = (target * (p === 1 ? 1 : e)).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
					if (p < 1 && el.isConnected) requestAnimationFrame(step);
				};
				num.textContent = '0';
				requestAnimationFrame(step);
			}
		}
		const eras = [...el.querySelectorAll('.era')];
		if (eras.length) {
			const per = (ms - 2600) / eras.length;
			eras.forEach((e, i) => setTimeout(() => {
				eras.forEach((x, j) => { x.classList.toggle('is-on', j === i); x.classList.toggle('is-past', j < i); });
			}, 1800 + i * per));
		}
		const names = el.querySelector('.names');
		if (names) {
			requestAnimationFrame(() => {
				const travel = Math.min(0, names.parentElement.clientHeight - names.scrollHeight);
				names.style.setProperty('--travel', travel + 'px');
				names.style.setProperty('--dur', (ms - 1800) / 1000 + 's');
			});
		}
	}

	/* ---------- Demo loop ---------- */
	function preload(s) { if (s && s.photo) { const i = new Image(); i.src = img(s.photo); } }

	function showScene(i) {
		const list = data.demo;
		sceneIdx = (i + list.length) % list.length;
		const s = list[sceneIdx];
		const ms = (s.seconds ? s.seconds * 1000 : SCENE_MS);

		const old = scenesEl.querySelector('.scene:not(.is-leaving)');
		if (old) { old.classList.add('is-leaving'); setTimeout(() => old.remove(), 800); }

		const el = document.createElement('section');
		el.className = `scene scene--${s.type}`;
		el.innerHTML = (SCENES[s.type] || SCENES.title)(s);
		setTimeout(() => { scenesEl.appendChild(el); afterRender(el, s, ms); }, old ? 350 : 0);

		stage.classList.toggle('is-cta', s.type === 'cta');
		ticksEl.innerHTML = list.map((_, j) => `<i class="${j < sceneIdx ? 'is-done' : j === sceneIdx ? 'is-on' : ''}"></i>`).join('');
		ticksEl.style.setProperty('--dur', ms / 1000 + 's');
		preload(list[(sceneIdx + 1) % list.length]);

		clearTimeout(sceneTimer);
		sceneTimer = setTimeout(() => {
			if (sceneIdx === list.length - 1) refresh().then(() => showScene(0));
			else showScene(sceneIdx + 1);
		}, ms);
	}

	function renderDock() {
		dockEl.innerHTML = `${qrBlock(data.qr)}
			<button class="btn btn--light explore-btn" type="button" data-act="open">${esc(data.explore.button || 'Touch to Explore')}<img src="${icon('ui-arrow-right', onWarm() ? 'white' : 'green')}" alt=""></button>`;
	}

	/* ---------- Explore layer ---------- */
	function openExplore() {
		if (mode === 'explore') return;
		mode = 'explore';
		clearTimeout(sceneTimer);
		renderTopics(false);
		stage.classList.add('is-exploring');
		exploreEl.classList.add('is-open');
		bumpIdle();
	}

	function closeExplore() {
		if (mode !== 'explore') return;
		mode = 'demo';
		clearTimeout(idleTimer);
		exploreEl.classList.remove('is-open');
		stage.classList.remove('is-exploring');
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
		const n = x.items.length;
		view(`<div class="view-head-shapes">${exploreShapes()}</div><div class="view-head">
				${x.eyebrow ? `<span class="eyebrow">${esc(x.eyebrow)}</span>` : ''}
				<h2 class="h2">${esc(x.title)}</h2>
				${x.lead ? `<p class="lead">${esc(x.lead)}</p>` : ''}
			</div>
			<div class="cards">${x.items.map((t, i) => `<button type="button" class="card${n % 2 && i === n - 1 ? ' card--wide' : ''}" data-act="topic" data-i="${i}" style="--d:${(.15 + i * .06).toFixed(2)}s">
				<img class="ico" src="${icon(t.icon || 'info-1', 'green')}" alt="">
				<span class="card-text"><b>${esc(t.label)}</b>${t.teaser ? `<span>${esc(t.teaser)}</span>` : ''}</span>
			</button>`).join('')}</div>
			<div class="view-foot"><button type="button" class="btn btn--secondary" data-act="close">Close</button></div>`, back);
	}

	function renderTopic(i) {
		const t = data.explore.items[i];
		const body = [].concat(t.body || []).map(p => `<p>${esc(p)}</p>`).join('');
		const chips = t.stats ? `<div class="chips">${t.stats.map(c => `<div class="chip"><b>${esc(c.value)}</b><span>${esc(c.label)}</span></div>`).join('')}</div>` : '';
		const eras = t.eras ? `<div class="era-slot">${eraPanel(t.eras[0])}</div><div class="era-picker">${t.eras.map((e, j) => `<button type="button" class="era-chip${j === 0 ? ' is-on' : ''}" data-act="era" data-i="${j}">${esc(e.label)}</button>`).join('')}</div>` : '';
		view(`<div class="detail${t.eras ? ' detail--eras' : ''}" data-topic="${i}">
				${t.photo ? frame(t.photo, false, t.alt) : ''}
				${t.eyebrow ? `<span class="eyebrow">${esc(t.eyebrow)}</span>` : ''}
				<h2 class="h2">${esc(t.title || t.label)}</h2>
				${body}${chips}${eras}
				${qrBlock(t.qr || data.qr)}
				<div class="view-foot">
					<button type="button" class="btn btn--secondary" data-act="back">All Topics</button>
					<button type="button" class="btn btn--secondary" data-act="close">Close</button>
				</div>
			</div>`);
	}

	function eraPanel(e) {
		return `<div class="era-panel"><div class="era-years">${esc(e.years)}</div><div class="era-name">${esc(e.name)}</div><p>${esc(e.text)}</p></div>`;
	}

	/* ---------- Touch ---------- */
	const ACTIONS = {
		open: openExplore,
		close: closeExplore,
		back: () => renderTopics(true),
		topic: el => renderTopic(+el.dataset.i),
		era: el => {
			const detail = el.closest('.detail');
			const t = data.explore.items[+detail.dataset.topic];
			detail.querySelectorAll('.era-chip').forEach(c => c.classList.toggle('is-on', c === el));
			detail.querySelector('.era-slot').innerHTML = eraPanel(t.eras[+el.dataset.i]);
		},
	};

	let down = null;
	function onDown(e) {
		if (e.isPrimary === false) return;
		const target = e.target.closest('[data-act]');
		down = { x: e.clientX, y: e.clientY, t: Date.now(), target };
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
			dot.style.left = (e.clientX - r.left) / s + 'px'; dot.style.top = (e.clientY - r.top) / s + 'px';
			stage.appendChild(dot); setTimeout(() => dot.remove(), 800);
		}
		if (mode === 'demo') { openExplore(); return; } // a tap anywhere on the demo opens Explore
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
		stage.addEventListener('mousedown', e => onDown(e));
		addEventListener('mouseup', e => onUp(e));
	}
	// Belt and braces: if anything ever scrolls the stage, snap it back
	[stage, exploreEl, scenesEl].forEach(el => el.addEventListener('scroll', () => { el.scrollTop = 0; el.scrollLeft = 0; }));
	stage.addEventListener('mousedown', e => e.preventDefault()); // no focus → no focus-scroll
	// Nothing else should ever react: no long-press menus, drags, pinch, or keyboard focus rings
	['contextmenu', 'dragstart', 'gesturestart', 'selectstart', 'dblclick'].forEach(t => addEventListener(t, e => e.preventDefault(), { passive: false }));
	addEventListener('click', e => e.preventDefault(), true);

	// Review shortcuts on a laptop: → next scene, ← previous, E explore, Esc close
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

	// Called at the end of each loop so edits show up without anyone touching the player
	async function refresh() {
		try {
			const { json, text } = await load();
			if (text !== dataText) { data = json; dataText = text; apply(); }
		} catch (e) { /* keep showing what we have */ }
	}

	function apply() {
		document.body.classList.toggle('theme-warm', data.theme === 'warm');
		stage.querySelector('.topbar img').src = `${BASE}assets/img/uvu-mono-${data.theme === 'warm' ? 'green' : 'white'}.svg`;
		stage.querySelector('.topbar .place').textContent = data.place || 'Young Living Alumni Center';
		document.title = `${data.screen || SCREEN} · YLAC Signage`;
		renderDock();
	}

	function fail(err) {
		const n = document.createElement('div');
		n.className = 'notice';
		n.innerHTML = `<div><b>This screen needs a content fix</b><p>The last change to the content file couldn't be read.</p><code>${esc(err.message)}</code></div>`;
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
			if (cached) { data = JSON.parse(cached); dataText = cached; console.warn(err); }
			else return fail(err);
		}
		apply();
		await document.fonts.ready;
		showScene(+params.get('scene') || 0);
		if (params.has('explore')) openExplore();
	}

	start();
}());
