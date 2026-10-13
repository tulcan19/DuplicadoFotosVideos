import React from 'react';
import { Sparkles, Eye, CheckCircle2, Trash2, ShieldCheck, AlertTriangle, Video, Film } from 'lucide-react';

export default function DuplicateGroupCard({
  group,
  index,
  selectedForRemoval,
  onToggleRemoval,
  onInspectComparison,
}) {
  const isExact = group.isExactMatch;
  const isVideo = group.isVideoGroup;

  return (
    <div className={`group-card animate-fade-in ${isExact ? 'border-exact' : ''}`}>
      <div className="group-header">
        <div className="group-header-left">
          <div className="group-badge-num">Grupo {index + 1}</div>
          <div className={`similarity-badge ${isExact ? 'badge-exact' : 'badge-similar'}`}>
            {isExact ? (
              <>
                <CheckCircle2 size={14} />
                <span>100% Idénticos</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>{group.maxSimilarity}% Similitud</span>
              </>
            )}
          </div>
          <span className="group-files-count">
            {group.images.length} {isVideo ? 'videos' : 'fotos'}
          </span>
        </div>

        <div className="group-header-right">
          <span className="group-savings-text">
            Ahorro potencial: <strong>{group.formattedSaving}</strong>
          </span>
          <button
            type="button"
            className="btn-inspect"
            onClick={() => onInspectComparison(group)}
            title="Comparar archivos en vista detallada lado a lado"
          >
            <Eye size={16} />
            <span>Comparar lado a lado</span>
          </button>
        </div>
      </div>

      <div className="group-images-grid">
        {group.images.map((img) => {
          const isSelected = selectedForRemoval.has(img.id);
          const isRecommended = img.isRecommended;

          return (
            <div
              key={img.id}
              className={`photo-card ${isRecommended ? 'card-recommended' : ''} ${isSelected ? 'card-selected-removal' : ''}`}
              onClick={() => onToggleRemoval(img.id)}
            >
              <div className="photo-thumbnail-container">
                {img.previewUrl ? (
                  <img
                    src={img.previewUrl}
                    alt={img.name}
                    className="photo-thumbnail"
                    loading="lazy"
                  />
                ) : (
                  <div className="video-fallback-thumb">
                    <Film size={40} className="fallback-film-icon" />
                    <span>{img.formattedDuration || 'Video'}</span>
                  </div>
                )}

                {/* Insignia de Video si aplica */}
                {img.isVideo && (
                  <div className="video-duration-pill">
                    <Video size={12} />
                    <span>{img.formattedDuration}</span>
                  </div>
                )}

                <div className="card-top-badges">
                  {isRecommended ? (
                    <div className="badge-recommend">
                      <ShieldCheck size={13} />
                      <span>Recomendado: Conservar</span>
                    </div>
                  ) : (
                    <div className="badge-warning">
                      <AlertTriangle size={13} />
                      <span>{img.badgeReason}</span>
                    </div>
                  )}
                </div>

                <div className={`selection-checkbox-wrap ${isSelected ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleRemoval(img.id);
                    }}
                    className="custom-checkbox"
                  />
                </div>
              </div>

              <div className="photo-meta">
                <span className="photo-name" title={img.name}>
                  {img.name}
                </span>

                <div className="photo-specs">
                  {img.isVideo && (
                    <span className="spec-badge spec-video">
                      🎬 {img.formattedDuration}
                    </span>
                  )}
                  <span className="spec-badge spec-res">
                    {img.resolutionText}
                  </span>
                  <span className="spec-badge spec-size">
                    {img.formattedSize}
                  </span>
                  {!img.isVideo && (
                    <span className="spec-badge spec-mp">
                      {img.megapixels} MP
                    </span>
                  )}
                </div>

                <div className="photo-action-hint">
                  {isSelected ? (
                    <span className="text-marked-removal">
                      <Trash2 size={13} /> Marcado para descarte
                    </span>
                  ) : isRecommended ? (
                    <span className="text-marked-keep">
                      ⭐ Mejor calidad conservada
                    </span>
                  ) : (
                    <span className="text-click-to-mark">
                      Clic para marcar
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
