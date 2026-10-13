import React, { useState } from 'react';
import { X, CheckCircle, Trash2, ArrowLeftRight, ShieldCheck, AlertCircle, Video } from 'lucide-react';
import { calculateSimilarity } from '../utils/imageHasher';

export default function ComparisonModal({
  group,
  onClose,
  selectedForRemoval,
  onToggleRemoval,
}) {
  if (!group || !group.images || group.images.length === 0) return null;

  const [leftIndex, setLeftIndex] = useState(0);
  const [rightIndex, setRightIndex] = useState(Math.min(1, group.images.length - 1));

  const imgLeft = group.images[leftIndex];
  const imgRight = group.images[rightIndex];
  const pairSim = calculateSimilarity(imgLeft, imgRight);

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <ArrowLeftRight size={20} className="modal-icon" />
            <h2>
              {group.isVideoGroup ? 'Comparación de Videos Lado a Lado' : 'Comparación Detallada Lado a Lado'}
            </h2>
            <span className="modal-similarity-tag">
              {pairSim}% Similitud entre seleccionados
            </span>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Cerrar modal">
            <X size={20} />
          </button>
        </div>

        {/* Selector de archivos para comparar si hay más de 2 en el grupo */}
        {group.images.length > 2 && (
          <div className="modal-image-selectors">
            <div className="selector-side">
              <label>Archivo Izquierdo (A):</label>
              <select
                value={leftIndex}
                onChange={(e) => setLeftIndex(Number(e.target.value))}
                className="custom-select"
              >
                {group.images.map((img, idx) => (
                  <option key={img.id} value={idx}>
                    {img.name} ({img.resolutionText}) {img.isVideo ? `[${img.formattedDuration}]` : ''} {img.isRecommended ? '⭐ [Mejor]' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="selector-side">
              <label>Archivo Derecho (B):</label>
              <select
                value={rightIndex}
                onChange={(e) => setRightIndex(Number(e.target.value))}
                className="custom-select"
              >
                {group.images.map((img, idx) => (
                  <option key={img.id} value={idx}>
                    {img.name} ({img.resolutionText}) {img.isVideo ? `[${img.formattedDuration}]` : ''} {img.isRecommended ? '⭐ [Mejor]' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Comparación Visual */}
        <div className="comparison-views-grid">
          {/* Panel Izquierdo */}
          <div className="comparison-card">
            <div className="comparison-card-header">
              <span className="card-side-label">Archivo A</span>
              {imgLeft.isRecommended && (
                <span className="badge-recommend-pill">
                  <ShieldCheck size={12} /> ⭐ Recomendado
                </span>
              )}
            </div>

            <div className="comparison-img-wrapper">
              {imgLeft.isVideo ? (
                <video
                  src={imgLeft.videoSrcUrl}
                  controls
                  className="comparison-video"
                  poster={imgLeft.previewUrl}
                />
              ) : (
                <img src={imgLeft.previewUrl} alt={imgLeft.name} className="comparison-img" />
              )}
            </div>

            <div className="comparison-details">
              <div className="detail-row">
                <span className="detail-key">Nombre:</span>
                <span className="detail-val truncate" title={imgLeft.name}>{imgLeft.name}</span>
              </div>
              {imgLeft.isVideo && (
                <div className="detail-row">
                  <span className="detail-key">Duración:</span>
                  <span className="detail-val">{imgLeft.formattedDuration}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-key">Resolución:</span>
                <span className={`detail-val highlight ${imgLeft.width * imgLeft.height >= imgRight.width * imgRight.height ? 'val-winner' : ''}`}>
                  {imgLeft.resolutionText} {!imgLeft.isVideo ? `(${imgLeft.megapixels} MP)` : ''}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Tamaño:</span>
                <span className="detail-val">{imgLeft.formattedSize}</span>
              </div>

              <button
                type="button"
                className={`btn-toggle-status ${selectedForRemoval.has(imgLeft.id) ? 'btn-marked-remove' : 'btn-marked-keep'}`}
                onClick={() => onToggleRemoval(imgLeft.id)}
              >
                {selectedForRemoval.has(imgLeft.id) ? (
                  <>
                    <Trash2 size={16} />
                    <span>Marcado para Descartar</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    <span>Conservar este archivo</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Panel Derecho */}
          <div className="comparison-card">
            <div className="comparison-card-header">
              <span className="card-side-label">Archivo B</span>
              {imgRight.isRecommended && (
                <span className="badge-recommend-pill">
                  <ShieldCheck size={12} /> ⭐ Recomendado
                </span>
              )}
            </div>

            <div className="comparison-img-wrapper">
              {imgRight.isVideo ? (
                <video
                  src={imgRight.videoSrcUrl}
                  controls
                  className="comparison-video"
                  poster={imgRight.previewUrl}
                />
              ) : (
                <img src={imgRight.previewUrl} alt={imgRight.name} className="comparison-img" />
              )}
            </div>

            <div className="comparison-details">
              <div className="detail-row">
                <span className="detail-key">Nombre:</span>
                <span className="detail-val truncate" title={imgRight.name}>{imgRight.name}</span>
              </div>
              {imgRight.isVideo && (
                <div className="detail-row">
                  <span className="detail-key">Duración:</span>
                  <span className="detail-val">{imgRight.formattedDuration}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-key">Resolución:</span>
                <span className={`detail-val highlight ${imgRight.width * imgRight.height >= imgLeft.width * imgLeft.height ? 'val-winner' : ''}`}>
                  {imgRight.resolutionText} {!imgRight.isVideo ? `(${imgRight.megapixels} MP)` : ''}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Tamaño:</span>
                <span className="detail-val">{imgRight.formattedSize}</span>
              </div>

              <button
                type="button"
                className={`btn-toggle-status ${selectedForRemoval.has(imgRight.id) ? 'btn-marked-remove' : 'btn-marked-keep'}`}
                onClick={() => onToggleRemoval(imgRight.id)}
              >
                {selectedForRemoval.has(imgRight.id) ? (
                  <>
                    <Trash2 size={16} />
                    <span>Marcado para Descartar</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    <span>Conservar este archivo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Resumen Comparativo */}
        <div className="comparison-footer-hint">
          <AlertCircle size={16} />
          <span>
            {imgLeft.qualityScore > imgRight.qualityScore
              ? `El Archivo A (${imgLeft.name}) posee mayor resolución o calidad técnica.`
              : imgRight.qualityScore > imgLeft.qualityScore
              ? `El Archivo B (${imgRight.name}) posee mayor resolución o calidad técnica.`
              : 'Ambos archivos tienen calidad equivalente.'}
          </span>
        </div>
      </div>
    </div>
  );
}
