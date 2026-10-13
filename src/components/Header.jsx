import React from 'react';
import { Layers, ShieldCheck, Sparkles, Image as ImageIcon } from 'lucide-react';

export default function Header({ totalImages = 0 }) {
  return (
    <header className="app-header">
      <div className="header-badge">
        <Sparkles size={14} className="badge-icon-sparkle" />
        <span>Algoritmo Perceptual dHash + Calidad Inteligente</span>
      </div>

      <div className="header-title-container">
        <div className="logo-glow">
          <Layers className="logo-icon" size={32} />
        </div>
        <h1 className="main-title">
          Foto<span className="text-gradient">Clean</span>
        </h1>
      </div>

      <p className="header-subtitle">
        Detecta duplicados idénticos y archivos parecidos (fotos en ráfaga, videos comprimidos o en diferentes resoluciones).
        Recomendamos automáticamente cuál conservar para optimizar tu almacenamiento.
      </p>

      <div className="header-tags">
        <div className="tag-pill tag-shield">
          <ShieldCheck size={14} />
          <span>100% Local y Privado</span>
        </div>
        <div className="tag-pill tag-limit">
          <ImageIcon size={14} />
          <span>{totalImages > 0 ? `${totalImages} archivos analizados` : 'Fotos y Videos Ilimitados'}</span>
        </div>
      </div>
    </header>
  );
}
