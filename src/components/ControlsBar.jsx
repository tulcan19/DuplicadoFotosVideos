import React from 'react';
import { Sliders, Wand2, CheckSquare, Square, Filter } from 'lucide-react';

export default function ControlsBar({
  threshold,
  setThreshold,
  filterType,
  setFilterType,
  onAutoSelectWorse,
  onDeselectAll,
  onSelectAllDuplicates,
}) {
  return (
    <div className="controls-bar animate-fade-in">
      <div className="controls-left">
        <div className="threshold-slider-group">
          <div className="slider-header">
            <div className="slider-title">
              <Sliders size={16} />
              <span>Sensibilidad de Similitud:</span>
            </div>
            <span className="threshold-badge">{threshold}%</span>
          </div>

          <div className="slider-track-wrap">
            <input
              type="range"
              min="70"
              max="100"
              step="1"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="custom-range"
            />
          </div>

          <div className="slider-presets">
            <button
              type="button"
              className={`preset-btn ${threshold === 100 ? 'active' : ''}`}
              onClick={() => setThreshold(100)}
            >
              100% (Idénticas)
            </button>
            <button
              type="button"
              className={`preset-btn ${threshold === 90 ? 'active' : ''}`}
              onClick={() => setThreshold(90)}
            >
              90% (Casi idénticas)
            </button>
            <button
              type="button"
              className={`preset-btn ${threshold === 80 ? 'active' : ''}`}
              onClick={() => setThreshold(80)}
            >
              80% (Ráfagas / Edición)
            </button>
          </div>
        </div>

        <div className="filter-group">
          <div className="filter-title">
            <Filter size={15} />
            <span>Filtro de vista:</span>
          </div>
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              Todos
            </button>
            <button
              className={`filter-tab ${filterType === 'exact' ? 'active' : ''}`}
              onClick={() => setFilterType('exact')}
            >
              Solo 100% Idénticas
            </button>
            <button
              className={`filter-tab ${filterType === 'similar' ? 'active' : ''}`}
              onClick={() => setFilterType('similar')}
            >
              Solo Similares
            </button>
          </div>
        </div>
      </div>

      <div className="controls-right">
        <button
          type="button"
          className="btn-magic"
          onClick={onAutoSelectWorse}
          title="Conserva la foto de mejor calidad y marca las de menor resolución para descarte"
        >
          <Wand2 size={16} />
          <span>Auto-seleccionar de menor calidad</span>
        </button>

        <div className="selection-quick-actions">
          <button
            type="button"
            className="btn-text-action"
            onClick={onSelectAllDuplicates}
            title="Marcar todas las fotos secundarias"
          >
            <CheckSquare size={14} />
            <span>Marcar todas</span>
          </button>
          <button
            type="button"
            className="btn-text-action"
            onClick={onDeselectAll}
            title="Desmarcar todas"
          >
            <Square size={14} />
            <span>Desmarcar todas</span>
          </button>
        </div>
      </div>
    </div>
  );
}
