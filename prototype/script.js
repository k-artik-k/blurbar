const overlay   = document.getElementById('overlay');
const barsvg    = document.getElementById('barsvg');
const linepath  = document.getElementById('linepath');
const hitzone   = document.getElementById('hitzone');
const modeLabel = document.getElementById('modeLabel');

let mode      = 'blur';
let hovering  = false;
let dragging  = false;

let coverage  = 30;
let intensity = 0.4;

const W = () => window.innerWidth;
const H = () => window.innerHeight;

barsvg.setAttribute('viewBox', `0 0 ${W()} ${H()}`);

let targetLineX  = W() * 0.30;
let currentLineX = targetLineX;
let vlx = 0;

let targetBlobY  = H() * 0.5;
let currentBlobY = targetBlobY;
let vby = 0;

let targetBlobW  = 0;
let currentBlobW = 0;
let vbw = 0;

let targetBlobH  = 60;
let currentBlobH = 60;
let vbh = 0;

let pressTimer = null;
let modeLabelTimer = null;
let blobDir = 1;

function applyOverlay() {
  overlay.style.width = coverage + '%';
  if (mode === 'blur') {
    overlay.style.backdropFilter       = `blur(${2 + intensity * 22}px)`;
    overlay.style.webkitBackdropFilter = `blur(${2 + intensity * 22}px)`;
    overlay.style.background = 'rgba(180,180,180,0.08)';
  } else {
    overlay.style.backdropFilter       = 'none';
    overlay.style.webkitBackdropFilter = 'none';
    overlay.style.background           = `rgba(0,0,0,${0.10 + intensity * 0.90})`;
  }
}

function buildPath(lx, by, bw, bh, dir) {
  const h  = H();
  const lw = 2;
  const hh = bh / 2;

  if (bw < 0.5) {
    return `M${lx - 1} 0 L${lx + 1} 0 L${lx + 1} ${h} L${lx - 1} ${h} Z`;
  }

  if (dir >= 0) {
    const tip = lx + lw / 2 + bw;
    return `
      M ${lx - 1} 0
      L ${lx + 1} 0
      L ${lx + 1} ${by - hh}
      C ${lx + 1} ${by - hh * 0.4}, ${tip} ${by - hh * 0.5}, ${tip} ${by}
      C ${tip} ${by + hh * 0.5}, ${lx + 1} ${by + hh * 0.4}, ${lx + 1} ${by + hh}
      L ${lx + 1} ${h}
      L ${lx - 1} ${h}
      Z
    `;
  } else {
    const tip = lx - lw / 2 - bw;
    return `
      M ${lx + 1} 0
      L ${lx - 1} 0
      L ${lx - 1} ${by - hh}
      C ${lx - 1} ${by - hh * 0.4}, ${tip} ${by - hh * 0.5}, ${tip} ${by}
      C ${tip} ${by + hh * 0.5}, ${lx - 1} ${by + hh * 0.4}, ${lx - 1} ${by + hh}
      L ${lx - 1} ${h}
      L ${lx + 1} ${h}
      Z
    `;
  }
}

function spring(cur, tgt, vel, k, d) {
  vel += (tgt - cur) * k;
  vel *= d;
  return [cur + vel, vel];
}

function animate() {
  [currentLineX, vlx] = spring(currentLineX, targetLineX, vlx, 0.12, 0.72);
  [currentBlobY, vby] = spring(currentBlobY, targetBlobY, vby, 0.18, 0.65);
  [currentBlobW, vbw] = spring(currentBlobW, targetBlobW, vbw, 0.20, 0.62);
  [currentBlobH, vbh] = spring(currentBlobH, targetBlobH, vbh, 0.20, 0.62);

  const speedX = Math.abs(vlx);
  const speedY = Math.abs(vby);

  if (dragging && speedX > 0.3) {
    blobDir = vlx > 0 ? 1 : -1;
  } else if (!dragging) {
    blobDir = 1;
  }

  if (dragging) {
    targetBlobW = 20 + Math.min(speedX * 3.0, 38);
    targetBlobH = 60 + Math.min(speedY * 2.2, 44);
  } else if (hovering) {
    targetBlobW = 20;
    targetBlobH = 60;
  } else {
    targetBlobW = 0;
    targetBlobH = 60;
  }

  linepath.setAttribute('opacity', hovering || dragging ? '0.85' : '0.40');
  linepath.setAttribute('d', buildPath(
    currentLineX,
    currentBlobY,
    Math.max(0, currentBlobW),
    currentBlobH,
    blobDir
  ));

  coverage = Math.max(0, Math.min(100, (currentLineX / W()) * 100));
  overlay.style.width = coverage + '%';
  hitzone.style.left  = (currentLineX - 22) + 'px';

  requestAnimationFrame(animate);
}

applyOverlay();
hitzone.style.left = (targetLineX - 22) + 'px';
animate();

hitzone.addEventListener('mouseenter', e => {
  hovering = true;
  targetBlobY  = e.clientY;
  currentBlobY = e.clientY;
});

hitzone.addEventListener('mouseleave', () => {
  if (!dragging) hovering = false;
});

hitzone.addEventListener('mousemove', e => {
  if (!dragging) targetBlobY = e.clientY;
});

hitzone.addEventListener('mousedown', e => {
  e.preventDefault();
  dragging = true;
  hovering = true;
  hitzone.classList.add('dragging');

  pressTimer = setTimeout(() => {
    mode = mode === 'blur' ? 'tint' : 'blur';
    modeLabel.textContent = mode;
    modeLabel.style.opacity = '1';
    clearTimeout(modeLabelTimer);
    modeLabelTimer = setTimeout(() => {
      modeLabel.style.opacity = '0';
    }, 1400);
    applyOverlay();
  }, 700);
});

document.addEventListener('mouseup', e => {
  if (!dragging) return;
  clearTimeout(pressTimer);
  dragging = false;
  hitzone.classList.remove('dragging');

  const onHandle = Math.abs(e.clientX - currentLineX) < 30;
  if (!onHandle) hovering = false;

  applyOverlay();
});

document.addEventListener('mousemove', e => {
  if (!dragging) return;
  clearTimeout(pressTimer);

  targetLineX = Math.max(10, Math.min(W() - 10, e.clientX));
  targetBlobY = Math.max(22, Math.min(H() - 22, e.clientY));

  intensity = 1 - (e.clientY / H());
  intensity = Math.max(0, Math.min(1, intensity));
  applyOverlay();
});

window.addEventListener('resize', () => {
  barsvg.setAttribute('viewBox', `0 0 ${W()} ${H()}`);
});