import React from 'react';
import { Images, CopyCheck, Trash2, HardDrive, RefreshCw } from 'lucide-react';
import { formatBytes } from '../utils/imageHasher';

export default function StatsBar({
  totalImages,
  groupsCount,
  selectedCount,
  selectedBytes,
  onReset,
}) {
  return (
    <div className="stats-bar animate-fade-in">
      <div className="stat-card">
        <div className="stat-icon-wrapper stat-blue">
          <Images size={20} />
        </div>
        <div className="stat-info">
          <span className="stat-value">{totalImages}</span>
          <span className="stat-label">Fotos Cargadas</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper stat-purple">
          <CopyCheck size={20} />
        </div>
        <div className="stat-info">
          <span className="stat-value">{groupsCount}</span>
          <span className="stat-label">Grupos Duplicados</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper stat-rose">
          <Trash2 size={20} />
        </div>
        <div className="stat-info">
          <span className="stat-value">{selectedCount}</span>
          <span className="stat-label">Para Descartar</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper stat-emerald">
          <HardDrive size={20} />
        </div>
        <div className="stat-info">
          <span className="stat-value">{formatBytes(selectedBytes)}</span>
          <span className="stat-label">Espacio Recuperable</span>
        </div>
      </div>

      <button className="btn-reset-session" onClick={onReset} title="Limpiar sesión y cargar otras fotos">
        <RefreshCw size={16} />
        <span>Nueva Sesión</span>
      </button>
    </div>
  );
}
