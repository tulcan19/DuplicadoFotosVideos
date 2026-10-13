/**
 * Motor de Detección de Fotos y Videos Duplicados y Similares
 * Soporta:
 * - Fotos: JPG, PNG, WEBP, GIF, BMP, AVIF
 * - Videos: MP4, WEBM, MOV, MKV, AVI, M4V
 * Algoritmos:
 * - dHash (Difference Hash, 64-bit) sobre imagen o fotograma clave del video
 * - aHash (Average Hash, 64-bit)
 * - Comparativa de duración para videos
 * - Matriz de similitud y agrupamiento
 */

/**
 * Procesa un archivo (imagen o video) y extrae metadatos y hashes.
 * @param {File} file 
 * @returns {Promise<Object>}
 */
export async function analyzeMedia(file) {
  const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(file.name);
  if (isVideo) {
    return analyzeVideo(file);
  }
  return analyzeImage(file);
}

// Alias para retrocompatibilidad
export const analyzeImage = analyzeImageFile;

/**
 * Procesa un archivo File de imagen.
 */
function analyzeImageFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const aspectRatio = width / (height || 1);

      const dHash = computeDHash(img);
      const aHash = computeAHash(img);
      const colorProfile = computeColorProfile(img);

      const qualityScore = (width * height) + Math.round(file.size / 1024);

      resolve({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        filePath: file.path || file.webkitRelativePath || '',
        isVideo: false,
        size: file.size,
        formattedSize: formatBytes(file.size),
        width,
        height,
        resolutionText: `${width} × ${height}`,
        megapixels: ((width * height) / 1000000).toFixed(2),
        aspectRatio: aspectRatio.toFixed(2),
        lastModified: file.lastModified,
        formattedDate: new Date(file.lastModified).toLocaleDateString(),
        previewUrl: objectUrl,
        dHash,
        aHash,
        colorProfile,
        qualityScore,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`No se pudo cargar la imagen: ${file.name}`));
    };

    img.src = objectUrl;
  });
}

/**
 * Procesa un archivo File de video y captura un fotograma clave para dHash.
 */
function analyzeVideo(file) {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    let isResolved = false;

    // Timeout de seguridad de 5s por si el códec no puede ser renderizado en el navegador
    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve(createFallbackVideoObject(file, objectUrl));
      }
    }, 5000);

    const cleanup = () => {
      clearTimeout(timeoutId);
      video.pause();
      video.removeAttribute('src');
      video.load();
    };

    video.onloadeddata = () => {
      const duration = video.duration || 0;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      const aspectRatio = width / (height || 1);

      // Buscar fotograma al 25% del video o al segundo 1
      const seekTime = Math.min(Math.max(0.5, duration * 0.25), Math.max(0.5, duration - 0.5));
      
      const onSeeked = () => {
        if (isResolved) return;
        isResolved = true;

        try {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(width, 640);
          canvas.height = Math.round(canvas.width / (aspectRatio || 1.77));
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const thumbDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const dHash = computeDHash(canvas);
          const aHash = computeAHash(canvas);
          const colorProfile = computeColorProfile(canvas);

          // Puntuación de calidad para video: resolución + tamaño + duración
          const qualityScore = (width * height * 1.5) + Math.round(file.size / 1024) + Math.round(duration * 50);

          cleanup();
          resolve({
            id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).substring(2, 7)}`,
            file,
            name: file.name,
            filePath: file.path || file.webkitRelativePath || '',
            isVideo: true,
            duration,
            formattedDuration: formatDuration(duration),
            size: file.size,
            formattedSize: formatBytes(file.size),
            width,
            height,
            resolutionText: `${width} × ${height}`,
            megapixels: ((width * height) / 1000000).toFixed(2),
            aspectRatio: aspectRatio.toFixed(2),
            lastModified: file.lastModified,
            formattedDate: new Date(file.lastModified).toLocaleDateString(),
            previewUrl: thumbDataUrl,
            videoSrcUrl: objectUrl,
            dHash,
            aHash,
            colorProfile,
            qualityScore,
          });
        } catch (err) {
          console.warn('Error capturando fotograma de video:', err);
          cleanup();
          resolve(createFallbackVideoObject(file, objectUrl, duration, width, height));
        }
      };

      video.addEventListener('seeked', onSeeked, { once: true });
      video.currentTime = seekTime;
    };

    video.onerror = () => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve(createFallbackVideoObject(file, objectUrl));
      }
    };

    video.src = objectUrl;
  });
}

function createFallbackVideoObject(file, objectUrl, duration = 0, width = 1280, height = 720) {
  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).substring(2, 7)}`,
    file,
    name: file.name,
    filePath: file.path || file.webkitRelativePath || '',
    isVideo: true,
    duration,
    formattedDuration: duration ? formatDuration(duration) : 'Video',
    size: file.size,
    formattedSize: formatBytes(file.size),
    width,
    height,
    resolutionText: width ? `${width} × ${height}` : 'Video',
    megapixels: ((width * height) / 1000000).toFixed(2),
    aspectRatio: '1.77',
    lastModified: file.lastModified,
    formattedDate: new Date(file.lastModified).toLocaleDateString(),
    previewUrl: '',
    videoSrcUrl: objectUrl,
    dHash: generatePseudoHash(file.name, file.size),
    aHash: generatePseudoHash(file.name, file.size),
    colorProfile: { r: 50, g: 50, b: 50 },
    qualityScore: file.size,
  };
}

function generatePseudoHash(name, size) {
  let hash = '';
  const str = `${name}-${size}`;
  for (let i = 0; i < 64; i++) {
    const charCode = str.charCodeAt(i % str.length) || 0;
    hash += ((charCode + i) % 2).toString();
  }
  return hash;
}

/**
 * Calcula Difference Hash (dHash)
 */
function computeDHash(drawable) {
  const canvas = document.createElement('canvas');
  canvas.width = 9;
  canvas.height = 8;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return '0'.repeat(64);

  ctx.drawImage(drawable, 0, 0, 9, 8);
  const imgData = ctx.getImageData(0, 0, 9, 8).data;

  const grays = [];
  for (let i = 0; i < imgData.length; i += 4) {
    const r = imgData[i];
    const g = imgData[i + 1];
    const b = imgData[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    grays.push(gray);
  }

  let hash = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const leftPixel = grays[row * 9 + col];
      const rightPixel = grays[row * 9 + col + 1];
      hash += leftPixel > rightPixel ? '1' : '0';
    }
  }

  return hash;
}

/**
 * Calcula Average Hash (aHash)
 */
function computeAHash(drawable) {
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 8;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return '0'.repeat(64);

  ctx.drawImage(drawable, 0, 0, 8, 8);
  const imgData = ctx.getImageData(0, 0, 8, 8).data;

  const grays = [];
  let sum = 0;
  for (let i = 0; i < imgData.length; i += 4) {
    const gray = 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];
    grays.push(gray);
    sum += gray;
  }

  const avg = sum / 64;
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += grays[i] >= avg ? '1' : '0';
  }

  return hash;
}

function computeColorProfile(drawable) {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { r: 128, g: 128, b: 128 };
  ctx.drawImage(drawable, 0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return { r: d[0], g: d[1], b: d[2] };
}

export function hammingDistance(strA, strB) {
  let diff = 0;
  const len = Math.min(strA.length, strB.length);
  for (let i = 0; i < len; i++) {
    if (strA[i] !== strB[i]) diff++;
  }
  return diff;
}

/**
 * Calcula el porcentaje de similitud entre dos archivos (fotos o videos).
 */
export function calculateSimilarity(itemA, itemB) {
  // Duplicado idéntico exacto
  if (itemA.size === itemB.size && itemA.name === itemB.name && itemA.dHash === itemB.dHash) {
    return 100;
  }

  // No comparar un video con una foto como duplicados similares
  if (Boolean(itemA.isVideo) !== Boolean(itemB.isVideo)) {
    return 0;
  }

  // Si ambos son videos, comparar también duración
  if (itemA.isVideo && itemB.isVideo) {
    const durA = itemA.duration || 0;
    const durB = itemB.duration || 0;
    const diffDur = Math.abs(durA - durB);

    // Si la duración difiere en más de 3 segundos y más del 8%, son videos diferentes
    if (durA > 0 && durB > 0 && diffDur > 3 && diffDur / Math.max(durA, durB) > 0.08) {
      return 0;
    }
  }

  const distD = hammingDistance(itemA.dHash, itemB.dHash);
  const simD = Math.max(0, (1 - distD / 64) * 100);

  const distA = hammingDistance(itemA.aHash, itemB.aHash);
  const simA = Math.max(0, (1 - distA / 64) * 100);

  let combinedSim = (simD * 0.7) + (simA * 0.3);

  const aspectDiff = Math.abs(parseFloat(itemA.aspectRatio) - parseFloat(itemB.aspectRatio));
  if (aspectDiff < 0.05) {
    combinedSim = Math.min(100, combinedSim + 2);
  } else if (aspectDiff > 0.3) {
    combinedSim = Math.max(0, combinedSim - 10);
  }

  return Math.round(combinedSim * 10) / 10;
}

/**
 * Agrupa una lista de imágenes/videos analizados según el umbral de similitud.
 */
export function groupSimilarImages(items, threshold = 85) {
  const n = items.length;
  if (n <= 1) return [];

  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (i) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const union = (i, j) => {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      parent[rootI] = rootJ;
    }
  };

  const pairSimilarities = new Map();

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sim = calculateSimilarity(items[i], items[j]);

      if (sim >= threshold) {
        pairSimilarities.set(`${i}-${j}`, sim);
        union(i, j);
      }
    }
  }

  const groupsMap = new Map();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!groupsMap.has(root)) {
      groupsMap.set(root, []);
    }
    groupsMap.get(root).push(i);
  }

  const resultGroups = [];
  let groupIndex = 1;

  for (const [, indices] of groupsMap.entries()) {
    if (indices.length < 2) continue;

    const groupItems = indices.map((idx) => ({ ...items[idx] }));

    // Ordenar elementos por puntuación de calidad (descendente)
    groupItems.sort((a, b) => b.qualityScore - a.qualityScore);

    let maxSim = 0;
    for (let i = 0; i < indices.length; i++) {
      for (let j = i + 1; j < indices.length; j++) {
        const u = Math.min(indices[i], indices[j]);
        const v = Math.max(indices[i], indices[j]);
        const sim = pairSimilarities.get(`${u}-${v}`) || 0;
        if (sim > maxSim) maxSim = sim;
      }
    }

    const isExactMatch = maxSim >= 99.9;
    const isVideoGroup = groupItems.some((item) => item.isVideo);

    const enrichedItems = groupItems.map((item, idx) => {
      const isRecommended = idx === 0;
      let badgeReason = '';

      if (isRecommended) {
        badgeReason = item.isVideo 
          ? 'Mayor resolución / Mejor tasa de bits'
          : 'Mayor resolución / Mejor calidad';
      } else {
        if (isExactMatch && item.size === groupItems[0].size) {
          badgeReason = 'Copia idéntica';
        } else if (item.width < groupItems[0].width || item.height < groupItems[0].height) {
          badgeReason = 'Menor resolución';
        } else if (item.size < groupItems[0].size) {
          badgeReason = 'Menor tamaño (más comprimido)';
        } else {
          badgeReason = 'Versión similar / Duplicada';
        }
      }

      return {
        ...item,
        isRecommended,
        badgeReason,
        suggestedAction: isRecommended ? 'keep' : 'remove',
      };
    });

    const potentialSavingBytes = enrichedItems
      .slice(1)
      .reduce((acc, curr) => acc + curr.size, 0);

    resultGroups.push({
      id: `group-${groupIndex++}`,
      maxSimilarity: maxSim,
      isExactMatch,
      isVideoGroup,
      images: enrichedItems,
      recommendedImage: enrichedItems[0],
      potentialSavingBytes,
      formattedSaving: formatBytes(potentialSavingBytes),
    });
  }

  resultGroups.sort((a, b) => b.maxSimilarity - a.maxSimilarity);
  return resultGroups;
}

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
