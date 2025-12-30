/**
 * ElectricBorder - Vanilla JavaScript Implementation
 * React Bits'ten vanilla JS'e dönüştürüldü
 */

class ElectricBorder {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      color: options.color || '#5227FF',
      speed: options.speed || 1,
      chaos: options.chaos || 1,
      thickness: options.thickness || 2,
      ...options
    };

    this.filterId = `turbulent-displace-${this.generateId()}`;
    this.svgRef = null;
    this.strokeRef = null;
    this.resizeObserver = null;

    this.init();
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  init() {
    // Ana container'ı hazırla
    this.element.classList.add('electric-border');
    
    // CSS değişkenlerini ayarla
    this.element.style.setProperty('--electric-border-color', this.options.color);
    this.element.style.setProperty('--eb-border-width', `${this.options.thickness}px`);

    // SVG oluştur
    this.createSVG();

    // Katmanları oluştur
    this.createLayers();

    // İçeriği koru
    this.wrapContent();

    // Animasyonu başlat
    this.updateAnim();

    // Resize observer ekle
    this.setupResizeObserver();
  }

  createSVG() {
    this.svgRef = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgRef.classList.add('eb-svg');
    this.svgRef.setAttribute('aria-hidden', 'true');
    this.svgRef.setAttribute('focusable', 'false');

    this.svgRef.innerHTML = `
      <defs>
        <filter id="${this.filterId}" color-interpolation-filters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="1" />
          <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
            <animate attributeName="dy" values="700; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
          </feOffset>

          <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="1" />
          <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
            <animate attributeName="dy" values="0; -700" dur="6s" repeatCount="indefinite" calcMode="linear" />
          </feOffset>

          <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="2" />
          <feOffset in="noise1" dx="0" dy="0" result="offsetNoise3">
            <animate attributeName="dx" values="490; 0" dur="6s" repeatCount="indefinite" calcMode="linear" />
          </feOffset>

          <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="2" />
          <feOffset in="noise2" dx="0" dy="0" result="offsetNoise4">
            <animate attributeName="dx" values="0; -490" dur="6s" repeatCount="indefinite" calcMode="linear" />
          </feOffset>

          <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1" />
          <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2" />
          <feBlend in="part1" in2="part2" mode="color-dodge" result="combinedNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="combinedNoise"
            scale="30"
            xChannelSelector="R"
            yChannelSelector="B"
          />
        </filter>
      </defs>
    `;

    this.element.appendChild(this.svgRef);
  }

  createLayers() {
    const layers = document.createElement('div');
    layers.classList.add('eb-layers');

    this.strokeRef = document.createElement('div');
    this.strokeRef.classList.add('eb-stroke');

    const glow1 = document.createElement('div');
    glow1.classList.add('eb-glow-1');

    const glow2 = document.createElement('div');
    glow2.classList.add('eb-glow-2');

    const bgGlow = document.createElement('div');
    bgGlow.classList.add('eb-background-glow');

    layers.appendChild(this.strokeRef);
    layers.appendChild(glow1);
    layers.appendChild(glow2);
    layers.appendChild(bgGlow);

    this.element.appendChild(layers);
  }

  wrapContent() {
    const contentWrapper = document.createElement('div');
    contentWrapper.classList.add('eb-content');

    // Mevcut içeriği wrapper'a taşı (SVG ve layers hariç)
    const children = Array.from(this.element.childNodes).filter(
      node => !node.classList || (!node.classList.contains('eb-svg') && !node.classList.contains('eb-layers'))
    );

    children.forEach(child => {
      contentWrapper.appendChild(child);
    });

    this.element.appendChild(contentWrapper);
  }

  updateAnim() {
    if (!this.svgRef || !this.element) return;

    // Filtreyi stroke'a uygula
    if (this.strokeRef) {
      this.strokeRef.style.filter = `url(#${this.filterId})`;
    }

    // Element boyutlarını al
    const rect = this.element.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width || this.element.clientWidth));
    const height = Math.max(1, Math.round(rect.height || this.element.clientHeight));

    // dy animasyonlarını güncelle
    const dyAnims = this.svgRef.querySelectorAll('feOffset > animate[attributeName="dy"]');
    if (dyAnims.length >= 2) {
      dyAnims[0].setAttribute('values', `${height}; 0`);
      dyAnims[1].setAttribute('values', `0; -${height}`);
    }

    // dx animasyonlarını güncelle
    const dxAnims = this.svgRef.querySelectorAll('feOffset > animate[attributeName="dx"]');
    if (dxAnims.length >= 2) {
      dxAnims[0].setAttribute('values', `${width}; 0`);
      dxAnims[1].setAttribute('values', `0; -${width}`);
    }

    // Hız ayarı
    const baseDur = 6;
    const dur = Math.max(0.001, baseDur / (this.options.speed || 1));
    [...dyAnims, ...dxAnims].forEach(a => a.setAttribute('dur', `${dur}s`));

    // Chaos ayarı
    const disp = this.svgRef.querySelector('feDisplacementMap');
    if (disp) disp.setAttribute('scale', String(30 * (this.options.chaos || 1)));

    // Filter boyutlarını ayarla
    const filterEl = this.svgRef.querySelector(`#${CSS.escape(this.filterId)}`);
    if (filterEl) {
      filterEl.setAttribute('x', '-200%');
      filterEl.setAttribute('y', '-200%');
      filterEl.setAttribute('width', '500%');
      filterEl.setAttribute('height', '500%');
    }

    // Animasyonları yeniden başlat
    requestAnimationFrame(() => {
      [...dyAnims, ...dxAnims].forEach(a => {
        if (typeof a.beginElement === 'function') {
          try {
            a.beginElement();
          } catch (e) {
            console.warn('ElectricBorder: beginElement failed');
          }
        }
      });
    });
  }

  setupResizeObserver() {
    if (!window.ResizeObserver) return;

    this.resizeObserver = new ResizeObserver(() => {
      this.updateAnim();
    });

    this.resizeObserver.observe(this.element);
  }

  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    
    if (newOptions.color) {
      this.element.style.setProperty('--electric-border-color', newOptions.color);
    }
    if (newOptions.thickness !== undefined) {
      this.element.style.setProperty('--eb-border-width', `${newOptions.thickness}px`);
    }
    
    this.updateAnim();
  }
}

// Helper fonksiyonu: Tüm .electric-border elementlerini otomatik başlat
function initElectricBorders() {
  const elements = document.querySelectorAll('[data-electric-border]');
  const instances = [];

  elements.forEach(el => {
    const options = {
      color: el.dataset.electricColor || '#5227FF',
      speed: parseFloat(el.dataset.electricSpeed) || 1,
      chaos: parseFloat(el.dataset.electricChaos) || 1,
      thickness: parseFloat(el.dataset.electricThickness) || 2
    };

    const instance = new ElectricBorder(el, options);
    instances.push(instance);
  });

  return instances;
}

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initElectricBorders);
} else {
  initElectricBorders();
}

// Export for manual usage
window.ElectricBorder = ElectricBorder;
window.initElectricBorders = initElectricBorders;
