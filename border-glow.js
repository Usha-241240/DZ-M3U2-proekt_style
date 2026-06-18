(function () {
  'use strict';

  const SELECTORS = [
    '.portfolio-card',
    '.post-card',
    '.contact-box',
    '.pricing-card',
    '.card',
    '.hero__photo-frame',
  ].join(', ');

  const THEMES = {
    light: {
      backgroundColor: '#FFFFFF',
      glowColor: '210 100 62',
      colors: ['#2563eb', '#38bdf8', '#818cf8'],
      fillOpacity: 0.62,
      edgeSensitivity: 16,
      glowIntensity: 1.4,
      coneSpread: 34,
      glowRadius: 50,
    },
    dark: {
      backgroundColor: '#334155',
      glowColor: '205 100 72',
      colors: ['#38bdf8', '#60A5FA', '#a78bfa'],
      fillOpacity: 0.68,
      edgeSensitivity: 16,
      glowIntensity: 1.45,
      coneSpread: 34,
      glowRadius: 54,
    },
    hero: {
      backgroundColor: '#FFFFFF',
      glowColor: '210 100 58',
      colors: ['#2563eb', '#0ea5e9', '#8b5cf6', '#ec4899'],
      fillOpacity: 0.58,
      edgeSensitivity: 12,
      glowIntensity: 1.55,
      coneSpread: 38,
      glowRadius: 60,
    },
  };

  const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
  const GRADIENT_KEYS = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven'];
  const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

  function parseHSL(hslStr) {
    const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
    if (!match) return { h: 213, s: 93, l: 68 };
    return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
  }

  function buildGlowVars(glowColor, intensity) {
    const { h, s, l } = parseHSL(glowColor);
    const base = `${h}deg ${s}% ${l}%`;
    const opacities = [100, 60, 50, 40, 30, 20, 10];
    const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10'];
    const vars = {};
    for (let i = 0; i < opacities.length; i++) {
      vars[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(opacities[i] * intensity, 100)}%)`;
    }
    return vars;
  }

  function buildGradientVars(colors) {
    const map = colors.length >= 4 ? [0, 1, 2, 3, 0, 1, 2] : COLOR_MAP;
    const vars = {};
    for (let i = 0; i < 7; i++) {
      const c = colors[Math.min(map[i], colors.length - 1)];
      vars[GRADIENT_KEYS[i]] = `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 38%)`;
    }
    vars['--gradient-base'] = `linear-gradient(${colors[0]} 0 100%)`;
    return vars;
  }

  function getTheme(el) {
    if (el.dataset.glowTheme) return el.dataset.glowTheme;
    if (el.classList.contains('hero__photo-frame')) return 'hero';
    if (
      el.classList.contains('contact-box') ||
      el.classList.contains('pricing-card--accent') ||
      el.classList.contains('card--featured')
    ) {
      return 'dark';
    }
    return 'light';
  }

  function getBorderRadius(el) {
    if (el.dataset.glowRadius) return parseInt(el.dataset.glowRadius, 10);
    if (el.classList.contains('contact-box') || el.classList.contains('hero__photo-frame')) return 16;
    return 12;
  }

  function getCenterOfElement(el) {
    const { width, height } = el.getBoundingClientRect();
    return [width / 2, height / 2];
  }

  function getEdgeProximity(el, x, y) {
    const [cx, cy] = getCenterOfElement(el);
    const dx = x - cx;
    const dy = y - cy;
    let kx = Infinity;
    let ky = Infinity;
    if (dx !== 0) kx = cx / Math.abs(dx);
    if (dy !== 0) ky = cy / Math.abs(dy);
    return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
  }

  function getCursorAngle(el, x, y) {
    const [cx, cy] = getCenterOfElement(el);
    const dx = x - cx;
    const dy = y - cy;
    if (dx === 0 && dy === 0) return 0;
    const radians = Math.atan2(dy, dx);
    let degrees = radians * (180 / Math.PI) + 90;
    if (degrees < 0) degrees += 360;
    return degrees;
  }

  function applyConfig(el, theme) {
    const config = THEMES[theme] || THEMES.light;
    const edgeSensitivity = el.dataset.edgeSensitivity
      ? parseFloat(el.dataset.edgeSensitivity)
      : (config.edgeSensitivity ?? 16);
    const glowRadius = el.dataset.glowRadius
      ? parseFloat(el.dataset.glowRadius)
      : (config.glowRadius ?? 50);
    const glowIntensity = el.dataset.glowIntensity
      ? parseFloat(el.dataset.glowIntensity)
      : (config.glowIntensity ?? 1.4);
    const coneSpread = el.dataset.coneSpread
      ? parseFloat(el.dataset.coneSpread)
      : (config.coneSpread ?? 34);
    const fillOpacity = el.dataset.fillOpacity
      ? parseFloat(el.dataset.fillOpacity)
      : config.fillOpacity;
    const borderRadius = getBorderRadius(el);

    const glowVars = buildGlowVars(config.glowColor, glowIntensity);
    const gradientVars = buildGradientVars(config.colors);

    el.style.setProperty('--card-bg', config.backgroundColor);
    el.style.setProperty('--edge-sensitivity', edgeSensitivity);
    el.style.setProperty('--border-radius', `${borderRadius}px`);
    el.style.setProperty('--glow-padding', `${glowRadius}px`);
    el.style.setProperty('--cone-spread', coneSpread);
    el.style.setProperty('--fill-opacity', fillOpacity);
    el.dataset.glowTheme = theme;

    Object.entries({ ...glowVars, ...gradientVars }).forEach(([key, value]) => {
      el.style.setProperty(key, value);
    });
  }

  function handlePointerMove(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const edge = getEdgeProximity(card, x, y);
    const angle = getCursorAngle(card, x, y);

    card.style.setProperty('--edge-proximity', (edge * 100).toFixed(3));
    card.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
  }

  function enhanceElement(el) {
    if (el.dataset.borderGlowInit) return;
    el.dataset.borderGlowInit = 'true';

    const theme = getTheme(el);
    el.classList.add('border-glow-card', `border-glow-card--${theme}`);

    const edgeLight = document.createElement('span');
    edgeLight.className = 'edge-light';
    edgeLight.setAttribute('aria-hidden', 'true');

    const inner = document.createElement('div');
    inner.className = 'border-glow-inner';

    while (el.firstChild) {
      inner.appendChild(el.firstChild);
    }

    el.appendChild(edgeLight);
    el.appendChild(inner);

    applyConfig(el, theme);
    el.addEventListener('pointermove', handlePointerMove);
  }

  function init() {
    document.querySelectorAll(SELECTORS).forEach(enhanceElement);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
