import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Dropzone from './components/Dropzone';
import StatsBar from './components/StatsBar';
import ControlsBar from './components/ControlsBar';
import DuplicateGroupCard from './components/DuplicateGroupCard';
import ComparisonModal from './components/ComparisonModal';
import ActionBar from './components/ActionBar';
import { analyzeMedia, groupSimilarImages } from './utils/imageHasher';
import { CheckCircle2, Sparkles } from 'lucide-react';
import './App.css';

export default function App() {
  const [images, setImages] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [threshold, setThreshold] = useState(85);
  const [filterType, setFilterType] = useState('all');
  const [selectedForRemoval, setSelectedForRemoval] = useState(new Set());
  const [inspectingGroup, setInspectingGroup] = useState(null);

  // Calcular grupos de fotos duplicadas/similares
  const groups = useMemo(() => {
    return groupSimilarImages(images, threshold);
  }, [images, threshold]);

  // Filtrar grupos según la selección de la barra de control
  const filteredGroups = useMemo(() => {
    if (filterType === 'exact') {
      return groups.filter((g) => g.isExactMatch);
    }
    if (filterType === 'similar') {
      return groups.filter((g) => !g.isExactMatch);
    }
    return groups;
  }, [groups, filterType]);

  // Auto-seleccionar fotos de menor calidad
  const handleAutoSelectWorse = useCallback(() => {
    const newSelected = new Set();
    groups.forEach((group) => {
      // Dejar la recomendada (índice 0) sin marcar, marcar todas las demás del grupo
      group.images.forEach((img) => {
        if (!img.isRecommended) {
          newSelected.add(img.id);
        }
      });
    });
    setSelectedForRemoval(newSelected);
  }, [groups]);

  // Cuando cambian los grupos y se detectan duplicados por primera vez, sugerir automáticamente
  useEffect(() => {
    if (groups.length > 0 && selectedForRemoval.size === 0) {
      handleAutoSelectWorse();
    }
  }, [groups, handleAutoSelectWorse]);

  // Manejar carga y análisis de archivos (Sin límite de cantidad, por lotes concurrentes para máxima velocidad)
  const handleFilesSelected = async (newFiles) => {
    setIsAnalyzing(true);
    const total = newFiles.length;
    setProgress({ current: 0, total });

    const analyzedList = [];
    // Procesar en tandas de 4 simultáneas para mantener fluidez y velocidad en Canvas
    const BATCH_SIZE = 4;
    for (let i = 0; i < total; i += BATCH_SIZE) {
      const slice = newFiles.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        slice.map(async (file) => {
          try {
            return await analyzeMedia(file);
          } catch (err) {
            console.warn('Error al procesar archivo:', err);
            return null;
          }
        })
      );

      for (const res of batchResults) {
        if (res) analyzedList.push(res);
      }

      setProgress({ current: Math.min(i + BATCH_SIZE, total), total });
      // Ceder un ciclo al event loop para actualizar la barra de progreso suavemente
      await new Promise((r) => setTimeout(r, 0));
    }

    setImages((prev) => [...prev, ...analyzedList]);
    setIsAnalyzing(false);
    setProgress(null);
  };

  // Alternar selección de una foto
  const handleToggleRemoval = (id) => {
    setSelectedForRemoval((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Marcar todas las duplicadas
  const handleSelectAllDuplicates = () => {
    const next = new Set();
    groups.forEach((g) => {
      g.images.forEach((img) => {
        if (!img.isRecommended) next.add(img.id);
      });
    });
    setSelectedForRemoval(next);
  };

  // Desmarcar todas
  const handleDeselectAll = () => {
    setSelectedForRemoval(new Set());
  };

  // Reiniciar sesión y liberar memoria de Object URLs
  const handleReset = () => {
    images.forEach((img) => {
      if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
    });
    setImages([]);
    setSelectedForRemoval(new Set());
    setInspectingGroup(null);
    setProgress(null);
  };

  // Calcular bytes seleccionados para eliminación
  const selectedBytes = useMemo(() => {
    return images
      .filter((img) => selectedForRemoval.has(img.id))
      .reduce((acc, curr) => acc + curr.size, 0);
  }, [images, selectedForRemoval]);

  // Manejar fotos eliminadas (por ejemplo al enviarlas a la Papelera de Windows)
  const handlePhotosDeleted = (deletedIds) => {
    setImages((prev) => prev.filter((img) => !deletedIds.includes(img.id)));
    setSelectedForRemoval((prev) => {
      const next = new Set(prev);
      deletedIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  return (
    <div className="app-container">
      <Header totalImages={images.length} />

      <main className="main-content">
        {images.length === 0 ? (
          <Dropzone
            onFilesSelected={handleFilesSelected}
            isAnalyzing={isAnalyzing}
            progress={progress}
            currentCount={images.length}
          />
        ) : (
          <div className="workspace-view">
            <StatsBar
              totalImages={images.length}
              groupsCount={groups.length}
              selectedCount={selectedForRemoval.size}
              selectedBytes={selectedBytes}
              onReset={handleReset}
            />

            {/* Zona compacta para añadir más fotos en cualquier momento */}
            <div className="compact-add-area">
              <Dropzone
                onFilesSelected={handleFilesSelected}
                isAnalyzing={isAnalyzing}
                progress={progress}
                currentCount={images.length}
              />
            </div>

            <ControlsBar
              threshold={threshold}
              setThreshold={setThreshold}
              filterType={filterType}
              setFilterType={setFilterType}
              onAutoSelectWorse={handleAutoSelectWorse}
              onDeselectAll={handleDeselectAll}
              onSelectAllDuplicates={handleSelectAllDuplicates}
            />

            {filteredGroups.length === 0 ? (
              <div className="empty-results-card animate-fade-in">
                <div className="empty-icon-wrap">
                  <CheckCircle2 size={44} className="empty-check-icon" />
                </div>
                <h3>¡No se encontraron fotos duplicadas con esta sensibilidad!</h3>
                <p>
                  Prueba bajando el umbral de similitud (por ejemplo al 80% o 75%) si sospechas que tienes fotos de ráfaga o editadas.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setThreshold(80)}
                >
                  <Sparkles size={16} /> Probar con umbral 80%
                </button>
              </div>
            ) : (
              <div className="groups-list">
                {filteredGroups.map((group, index) => (
                  <DuplicateGroupCard
                    key={group.id}
                    group={group}
                    index={index}
                    selectedForRemoval={selectedForRemoval}
                    onToggleRemoval={handleToggleRemoval}
                    onInspectComparison={setInspectingGroup}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal de comparación lado a lado */}
      {inspectingGroup && (
        <ComparisonModal
          group={inspectingGroup}
          onClose={() => setInspectingGroup(null)}
          selectedForRemoval={selectedForRemoval}
          onToggleRemoval={handleToggleRemoval}
        />
      )}

      {/* Barra de acción flotante inferior */}
      <ActionBar
        allImages={images}
        groups={groups}
        selectedForRemoval={selectedForRemoval}
        selectedBytes={selectedBytes}
        onPhotosDeleted={handlePhotosDeleted}
      />
    </div>
  );
}
