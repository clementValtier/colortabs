import '@melloware/coloris/dist/coloris.css';
import Coloris from '@melloware/coloris';
import { isValidHex, normalizeHex } from './utils.js';

export function initColoris(currentColoris, newColoris) {
  Coloris.init();
  Coloris({
    el: [currentColoris, newColoris],
    wrap: false,
    alpha: false,
    format: 'hex',
    closeButton: true,
    closeLabel: 'Done',
    themeMode: 'auto',
    swatches: [
      '#FF3B30', '#FF6B35', '#FF9500', '#FFCC00', '#FFD60A',
      '#34C759', '#00C7BE', '#007AFF', '#5856D6', '#BF5AF2',
      '#C00000', '#C84B00', '#B38600', '#248A3D', '#0040DD',
      '#3634A3', '#FF2D55', '#AEAEB2', '#E5E5EA', '#FFFFFF',
    ],
    onChange: (color, input) => {
      if (!input) return;
      const preview = input.closest('.color-preview');
      if (!preview) return;
      preview.querySelector('.swatch-display').style.backgroundColor = color;
      const row = preview.closest('.color-row');
      const hexInput = row?.querySelector('.hex-input');
      if (hexInput) hexInput.value = color.toUpperCase();
    },
  });

  [currentColoris, newColoris].forEach(input => {
    input.addEventListener('open',  () => document.body.classList.add('picker-open'));
    input.addEventListener('close', () => document.body.classList.remove('picker-open'));
  });
}

export function setColor(colorisInput, swatchEl, hexInput, color) {
  const upper = color.toUpperCase();
  colorisInput.value = upper;
  swatchEl.style.backgroundColor = color;
  hexInput.value = upper;
}

export function bindHexInput(hexInput, colorisInput, swatchEl) {
  hexInput.addEventListener('input', () => {
    const val = normalizeHex(hexInput.value);
    if (isValidHex(val)) {
      swatchEl.style.backgroundColor = val;
      colorisInput.value = val;
      colorisInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
}
