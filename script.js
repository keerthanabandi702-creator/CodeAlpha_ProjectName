// ---------- Data ----------
const cats = {
  Mountains: { p: ['#f7c9a0', '#6c7fa8', '#3f4e78', '#2c3858', '#1a2238'] },
  Ocean:     { p: ['#ffe3b0', '#f08f6e', '#2a8aa8', '#1b6585', '#0e3f5c'] },
  Forest:    { p: ['#d9e8c0', '#9ac28f', '#4d8a5e', '#2f6347', '#173d2f'] },
  Desert:    { p: ['#ffd9a0', '#f0a066', '#d8794a', '#b25a3a', '#7e3a2a'] }
};
const names = {
  Mountains: ['Alpine Dusk', 'Blue Ridge', 'Last Light Peaks'],
  Ocean:     ['Quiet Tide', 'Amber Shoreline', 'Deep Water'],
  Forest:    ['Pine Hollow', 'Misty Canopy', 'Evergreen Path'],
  Desert:    ['Dune Sea', 'Red Mesa', 'Sundown Sands']
};

// ---------- Generated landscape images (no image files needed) ----------
function rng(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }

function scene(cat, seed) {
  const r = rng(seed * 977 + 13), p = cats[cat].p;
  let o = '';
  o += `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[1]}"/><stop offset="1" stop-color="${p[0]}"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/>`;
  o += `<circle cx="${150 + r() * 500}" cy="${120 + r() * 100}" r="${40 + r() * 30}" fill="#fff" opacity=".75"/>`;

  const layer = (base, fn, col) => {
    let d = `M0 600 L0 ${base}`;
    for (let x = 0; x <= 800; x += 10) d += ` L${x} ${(base + fn(x)).toFixed(1)}`;
    return `<path d="${d} L800 600Z" fill="${col}"/>`;
  };

  for (let i = 0; i < 3; i++) {
    const ph = r() * 9, f = .006 + r() * .01, a = 40 + r() * 50, b = 300 + i * 85;
    if (cat === 'Mountains') {
      o += layer(b - 40, x => -a * 2 * Math.abs(Math.sin(x * f + ph)) - a * .3 * Math.sin(x * .05), p[2 + i]);
    } else if (cat === 'Ocean') {
      o += layer(i ? b + 20 : 330, x => (i ? 6 : 0) * Math.sin(x * (.02 + i * .01) + ph), p[2 + i]);
    } else if (cat === 'Desert') {
      o += layer(b, x => a * Math.sin(x * f * .8 + ph) + a * .4 * Math.sin(x * f * 2.2), p[2 + i]);
    } else {
      o += layer(b + 10, x => a * .6 * Math.sin(x * f + ph), p[2 + i]);
      for (let x = -20; x < 820; x += 34 - i * 6) {
        const h = 60 + i * 45 + r() * 40, y = b + 30 + r() * 60 + i * 30;
        o += `<path d="M${x} ${y}l${24 + i * 8} 0l-${12 + i * 4} -${h}z" fill="${p[2 + i]}" opacity=".95"/>`;
      }
    }
  }
  return 'data:image/svg+xml;utf8,' +
    encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">${o}</svg>`);
}

const photos = [];
let n = 1;
for (let k = 0; k < 3; k++)
  for (const c in cats) photos.push({ cat: c, title: names[c][k], src: scene(c, n++) });

// To use your own images instead, replace the block above with e.g.:
// const photos = [
//   { cat: 'Ocean', title: 'Quiet Tide', src: 'images/tide.jpg' },
//   { cat: 'Forest', title: 'Pine Hollow', src: 'images/pine.jpg' }
// ];
// and add each category name to the `cats` object.

// ---------- Elements & state ----------
const grid = document.getElementById('grid');
const filters = document.getElementById('filters');
const lb = document.getElementById('lb');
const lbImg = document.getElementById('lbImg');
const lbCap = document.getElementById('lbCap');

let current = 'All', visible = [], idx = 0, lastFocus = null;

// ---------- Build grid ----------
photos.forEach((ph, i) => {
  const b = document.createElement('button');
  b.className = 'item';
  b.dataset.cat = ph.cat;
  b.setAttribute('aria-label', 'Open ' + ph.title);
  b.innerHTML = `<img loading="lazy" src="${ph.src}" alt="${ph.title}, ${ph.cat.toLowerCase()} landscape"><span>${ph.title}</span>`;
  b.onclick = () => { lastFocus = b; openLightbox(i); };
  ph.el = b;
  grid.appendChild(b);
});

// ---------- Filter buttons ----------
['All', ...Object.keys(cats)].forEach(c => {
  const b = document.createElement('button');
  b.textContent = c;
  b.setAttribute('aria-pressed', c === 'All');
  b.onclick = () => filter(c, b);
  filters.appendChild(b);
});

function filter(c, btn) {
  current = c;
  [...filters.children].forEach(x => x.setAttribute('aria-pressed', x === btn));
  photos.forEach(ph => {
    const show = c === 'All' || ph.cat === c;
    if (show) {
      ph.el.classList.remove('hide');
      ph.el.classList.add('fade');
      requestAnimationFrame(() => requestAnimationFrame(() => ph.el.classList.remove('fade')));
    } else {
      ph.el.classList.add('hide');
    }
  });
}

// ---------- Lightbox ----------
function currentList() { return photos.filter(p => current === 'All' || p.cat === current); }

function openLightbox(i) {
  visible = currentList();
  idx = visible.indexOf(photos[i]);
  show(true);
  lb.classList.add('open');
  lb.querySelector('.close').focus();
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lb.classList.remove('open');
  document.body.style.overflow = '';
  if (lastFocus) lastFocus.focus();
}

function show(first) {
  const ph = visible[idx];
  const apply = () => {
    lbImg.src = ph.src;
    lbImg.alt = ph.title;
    lbCap.innerHTML = `${ph.title}<small>${ph.cat} &middot; ${idx + 1} of ${visible.length}</small>`;
    lbImg.classList.remove('swap');
    lastFocus = ph.el;
  };
  if (first) apply();
  else { lbImg.classList.add('swap'); setTimeout(apply, 200); }
}

function step(d) {
  idx = (idx + d + visible.length) % visible.length;
  show();
}

lb.querySelector('.prev').onclick = () => step(-1);
lb.querySelector('.next').onclick = () => step(1);
lb.querySelector('.close').onclick = closeLightbox;
lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

document.addEventListener('keydown', e => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'ArrowRight') step(1);
});

// Swipe support on touch screens
let tx = null;
lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', e => {
  if (tx === null) return;
  const dx = e.changedTouches[0].clientX - tx;
  if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  tx = null;
});