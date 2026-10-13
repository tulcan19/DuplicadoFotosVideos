import React, { useRef, useState } from 'react';
import { UploadCloud, FolderOpen, ImagePlus, Video, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { generateSampleImages } from '../utils/sampleImages';

export default function Dropzone({ onFilesSelected, isAnalyzing, progress, currentCount = 0 }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const handleFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setWarningMessage('');

    // Filtrar fotos y videos
    const mediaFiles = Array.from(fileList).filter((f) => 
      f.type.startsWith('image/') || 
      f.type.startsWith('video/') || 
      /\.(jpg|jpeg|png|webp|bmp|gif|avif|mp4|webm|mov|mkv|avi|m4v)$/i.test(f.name)
    );

    if (mediaFiles.length === 0) {
      setWarningMessage('No se encontraron fotos o videos compatibles en la selección.');
      return;
    }

    onFilesSelected(mediaFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleLoadSamples = async () => {
    setWarningMessage('');
    try {
      const sampleFiles = await generateSampleImages();
      onFilesSelected(sampleFiles);
    } catch (err) {
      console.error(err);
      setWarningMessage('Hubo un problema al generar las fotos de prueba.');
    }
  };

  return (
    <div className="dropzone-container">
      <div
        className={`dropzone-card ${isDragOver ? 'drag-over' : ''} ${isAnalyzing ? 'analyzing' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/*,video/*"
          className="hidden-input"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          type="file"
          ref={folderInputRef}
          webkitdirectory=""
          directory=""
          multiple
          className="hidden-input"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {isAnalyzing ? (
          <div className="dropzone-loading">
            <div className="spinner-wrapper">
              <Loader2 className="spinner-icon" size={48} />
            </div>
            <h3>Analizando fotos y videos con Perceptual Hash...</h3>
            <p className="loading-detail">
              Extrayendo fotogramas clave, resoluciones, duraciones y matrices de similitud
            </p>
            {progress && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
                <span className="progress-text">
                  {progress.current} de {progress.total} analizados ({Math.round((progress.current / progress.total) * 100)}%)
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="dropzone-content">
            <div className="icon-bubble">
              <UploadCloud size={40} className="bubble-icon" />
            </div>

            <h2 className="dropzone-title">
              Arrastra y suelta tus fotos y videos aquí
            </h2>
            <p className="dropzone-desc">
              Fotos (JPG, PNG, WEBP, etc.) y Videos (MP4, WEBM, MOV, MKV, AVI). 100% privado en tu PC.
            </p>

            <div className="dropzone-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus size={18} />
                <span>Seleccionar Archivos</span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => folderInputRef.current?.click()}
              >
                <FolderOpen size={18} />
                <span>Escanear Carpeta</span>
              </button>

              <button
                type="button"
                className="btn-ghost"
                onClick={handleLoadSamples}
                title="Carga fotos de muestra creadas dinámicamente con diferentes resoluciones y duplicados"
              >
                <Sparkles size={16} />
                <span>Probar con fotos de ejemplo</span>
              </button>
            </div>

            <div className="dropzone-limit-note">
              <strong>Capacidad ilimitada</strong> &bull; {currentCount > 0 ? `${currentCount} fotos cargadas actualmente` : 'Sube tantas fotos como desees'}
            </div>
          </div>
        )}
      </div>

      {warningMessage && (
        <div className="warning-banner animate-fade-in">
          <AlertCircle size={18} />
          <span>{warningMessage}</span>
        </div>
      )}
    </div>
  );
}
