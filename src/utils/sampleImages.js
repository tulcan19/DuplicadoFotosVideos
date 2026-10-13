/**
 * Genera imágenes de prueba sintéticas directamente en Canvas
 * para que el usuario pueda probar el detector inmediatamente sin tener que buscar archivos.
 */
export async function generateSampleImages() {
  const samples = [];

  // 1. Grupo A: Foto de "Atardecer" en alta y baja resolución
  const baseSunset = createSunsetCanvas(800, 600, "Atardecer Playa (Original HD)");
  const baseSunsetBlob = await canvasToBlob(baseSunset, 'image/jpeg', 0.95);
  samples.push(new File([baseSunsetBlob], 'playa_atardecer_original.jpg', { type: 'image/jpeg', lastModified: Date.now() - 100000 }));

  // Misma pero menor resolución (640x480) y más comprimida
  const sunsetLow = createSunsetCanvas(400, 300, "Atardecer Playa (Comprimida)");
  const sunsetLowBlob = await canvasToBlob(sunsetLow, 'image/jpeg', 0.6);
  samples.push(new File([sunsetLowBlob], 'playa_atardecer_whatsapp.jpg', { type: 'image/jpeg', lastModified: Date.now() - 50000 }));

  // Misma pero idéntica exacta bit a bit con otro nombre
  samples.push(new File([baseSunsetBlob], 'copia_de_playa_atardecer.jpg', { type: 'image/jpeg', lastModified: Date.now() - 20000 }));

  // 2. Grupo B: Foto de "Montañas"
  const mountainHD = createMountainCanvas(900, 600, "Montañas Nevadas (4K)");
  const mountainHDBlob = await canvasToBlob(mountainHD, 'image/png');
  samples.push(new File([mountainHDBlob], 'vacaciones_montana_hd.png', { type: 'image/png', lastModified: Date.now() - 80000 }));

  const mountainSmall = createMountainCanvas(450, 300, "Montañas Nevadas (Miniatura)");
  const mountainSmallBlob = await canvasToBlob(mountainSmall, 'image/jpeg', 0.7);
  samples.push(new File([mountainSmallBlob], 'vacaciones_montana_thumb.jpg', { type: 'image/jpeg', lastModified: Date.now() - 40000 }));

  // 3. Foto Única (Sin duplicados): "Ciudad de Noche"
  const city = createCityCanvas(800, 600, "Ciudad Nocturna");
  const cityBlob = await canvasToBlob(city, 'image/jpeg', 0.9);
  samples.push(new File([cityBlob], 'ciudad_luces.jpg', { type: 'image/jpeg', lastModified: Date.now() - 10000 }));

  return samples;
}

function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.9) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function createSunsetCanvas(w, h, label) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Gradiente atardecer
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#f97316');
  grad.addColorStop(0.5, '#ec4899');
  grad.addColorStop(1, '#3b82f6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Sol
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.45, Math.min(w, h) * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Mar
  ctx.fillStyle = 'rgba(30, 58, 138, 0.85)';
  ctx.fillRect(0, h * 0.65, w, h * 0.35);

  // Texto
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = `bold ${Math.max(14, Math.floor(w * 0.03))}px sans-serif`;
  ctx.fillText(label, 20, 35);

  return canvas;
}

function createMountainCanvas(w, h, label) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Cielo
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0284c7');
  grad.addColorStop(0.7, '#bae6fd');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Montañas
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h);
  ctx.lineTo(w * 0.4, h * 0.3);
  ctx.lineTo(w * 0.7, h);
  ctx.fill();

  // Nieve en la cima
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(w * 0.35, h * 0.42);
  ctx.lineTo(w * 0.4, h * 0.3);
  ctx.lineTo(w * 0.45, h * 0.42);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = `bold ${Math.max(14, Math.floor(w * 0.03))}px sans-serif`;
  ctx.fillText(label, 20, 35);

  return canvas;
}

function createCityCanvas(w, h, label) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Noche
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, w, h);

  // Rascacielos
  const buildings = 8;
  const bWidth = w / buildings;
  for (let i = 0; i < buildings; i++) {
    const bHeight = h * (0.3 + (i % 3) * 0.2);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(i * bWidth, h - bHeight, bWidth - 4, bHeight);

    // Ventanas iluminadas
    ctx.fillStyle = '#fef08a';
    for (let r = h - bHeight + 10; r < h - 10; r += 18) {
      for (let c = i * bWidth + 6; c < (i + 1) * bWidth - 10; c += 14) {
        if (Math.random() > 0.4) {
          ctx.fillRect(c, r, 6, 8);
        }
      }
    }
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = `bold ${Math.max(14, Math.floor(w * 0.03))}px sans-serif`;
  ctx.fillText(label, 20, 35);

  return canvas;
}
