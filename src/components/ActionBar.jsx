import React, { useState } from 'react';
import { Download, FileText, Terminal, Trash2, Loader2, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import { formatBytes } from '../utils/imageHasher';

export default function ActionBar({
  allImages,
  groups,
  selectedForRemoval,
  selectedBytes,
  onPhotosDeleted,
}) {
  const [isZipping, setIsZipping] = useState(false);
  const [isTrashing, setIsTrashing] = useState(false);
  const selectedCount = selectedForRemoval.size;

  const isElectron = typeof window !== 'undefined' && !!window.electronAPI?.isElectron;

  if (selectedCount === 0) return null;

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.85 },
      colors: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b'],
    });
  };

  // Mover directamente a la Papelera de Reciclaje de Windows (Exclusivo en PC / Electron)
  const handleMoveToRecycleBin = async () => {
    const selectedImages = allImages.filter((img) => selectedForRemoval.has(img.id));
    const pathsToTrash = selectedImages
      .map((img) => img.filePath)
      .filter((p) => typeof p === 'string' && p.trim().length > 0);

    if (pathsToTrash.length === 0) {
      alert('Las fotos cargadas no tienen rutas directas del disco (posiblemente fotos de prueba). Utiliza la descarga de ZIP o el script para estas fotos.');
      return;
    }

    const confirmDelete = window.confirm(
      `¿Deseas mover ${pathsToTrash.length} foto(s) a la Papelera de Reciclaje de Windows?\n\n` +
      `Tranquilo: no se borrarán definitivamente, podrás recuperarlas desde tu Papelera si lo necesitas.`
    );

    if (!confirmDelete) return;

    try {
      setIsTrashing(true);
      const res = await window.electronAPI.moveToTrash(pathsToTrash);

      if (res && res.success && res.success.length > 0) {
        triggerConfetti();
        alert(`¡Éxito! Se movieron ${res.success.length} foto(s) a la Papelera de Reciclaje de Windows.`);

        // Notificar a App para removerlas de la interfaz
        if (onPhotosDeleted) {
          const removedIds = selectedImages
            .filter((img) => res.success.includes(img.filePath))
            .map((img) => img.id);
          onPhotosDeleted(removedIds);
        }
      } else {
        alert('No se pudieron mover los archivos. Verifica que sigan existiendo en disco.');
      }
    } catch (err) {
      console.error('Error al mover a la papelera:', err);
      alert('Ocurrió un error al intentar mover las fotos a la Papelera.');
    } finally {
      setIsTrashing(false);
    }
  };

  // Descargar ZIP con las fotos conservadas
  const handleDownloadKeptZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();
      const keptImages = allImages.filter((img) => !selectedForRemoval.has(img.id));

      for (const img of keptImages) {
        zip.file(img.name, img.file);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Fotos_Limpias_Optimizadas_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      triggerConfetti();
    } catch (err) {
      console.error('Error al empaquetar ZIP:', err);
      alert('Hubo un error al generar el archivo ZIP.');
    } finally {
      setIsZipping(false);
    }
  };

  // Descargar reporte TXT / CSV
  const handleDownloadReport = () => {
    const lines = [
      '====================================================',
      'REPORTE DE LIMPIEZA DE FOTOS DUPLICADAS - FOTOCLEAN',
      `Fecha: ${new Date().toLocaleString()}`,
      `Total fotos analizadas: ${allImages.length}`,
      `Fotos marcadas para descarte: ${selectedCount}`,
      `Espacio recuperable: ${formatBytes(selectedBytes)}`,
      '====================================================\n',
      '--- ARCHIVOS SUGERIDOS PARA DESCARTAR/ELIMINAR ---',
    ];

    allImages
      .filter((img) => selectedForRemoval.has(img.id))
      .forEach((img, i) => {
        lines.push(`${i + 1}. [${img.name}] (${img.filePath || 'Sin ruta'}) - ${img.resolutionText} - ${img.formattedSize}`);
      });

    lines.push('\n--- ARCHIVOS CONSERVADOS (MEJOR CALIDAD) ---');
    allImages
      .filter((img) => !selectedForRemoval.has(img.id))
      .forEach((img, i) => {
        lines.push(`${i + 1}. [${img.name}] (${img.filePath || 'Sin ruta'}) - ${img.resolutionText} - ${img.formattedSize}`);
      });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Duplicados_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    triggerConfetti();
  };

  // Generar script de PowerShell para mover a carpeta en Windows
  const handleDownloadPowerShellScript = () => {
    const removalFiles = allImages.filter((img) => selectedForRemoval.has(img.id));
    const scriptLines = [
      '# Script de limpieza seguro para Windows (PowerShell)',
      '# Mueve los duplicados a una subcarpeta llamada "Fotos_Duplicadas_Eliminadas"',
      'Write-Host "Iniciando limpieza de duplicados seleccionados..." -ForegroundColor Cyan',
      '$targetFolder = Join-Path -Path $PSScriptRoot -ChildPath "Fotos_Duplicadas_Eliminadas"',
      'if (-not (Test-Path $targetFolder)) { New-Item -ItemType Directory -Path $targetFolder | Out-Null }',
      '',
    ];

    removalFiles.forEach((img) => {
      const targetPath = img.filePath || img.name;
      const safeName = targetPath.replace(/"/g, '`"');
      scriptLines.push(`if (Test-Path "${safeName}") { Move-Item -Path "${safeName}" -Destination $targetFolder -Force; Write-Host "Movido: ${safeName}" -ForegroundColor Yellow }`);
    });

    scriptLines.push('');
    scriptLines.push('Write-Host "¡Limpieza completada! Los duplicados están en la carpeta Fotos_Duplicadas_Eliminadas." -ForegroundColor Green');
    scriptLines.push('Pause');

    const blob = new Blob([scriptLines.join('\r\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `limpiar_duplicados_windows.ps1`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    triggerConfetti();
  };

  return (
    <div className="action-bar-floating animate-fade-in">
      <div className="action-bar-inner">
        <div className="action-bar-left">
          <div className="action-counter">
            <span className="action-counter-num">{selectedCount}</span>
            <span className="action-counter-text">
              fotos para descartar ({formatBytes(selectedBytes)})
            </span>
          </div>
        </div>

        <div className="action-bar-buttons">
          {/* Botón de Papelera de Windows en modo de escritorio Electron */}
          {isElectron && (
            <button
              type="button"
              className="btn-action-trash-direct"
              onClick={handleMoveToRecycleBin}
              disabled={isTrashing}
              title="Mueve los archivos seleccionados directamente a la Papelera de reciclaje de Windows"
            >
              {isTrashing ? <Loader2 size={16} className="spinner-icon" /> : <Trash2 size={16} />}
              <span>{isTrashing ? 'Moviendo...' : 'Mover a Papelera de Windows'}</span>
            </button>
          )}

          <button
            type="button"
            className="btn-action-primary"
            onClick={handleDownloadKeptZip}
            disabled={isZipping}
            title="Descarga un archivo ZIP únicamente con las fotos de mejor calidad conservadas"
          >
            {isZipping ? <Loader2 size={16} className="spinner-icon" /> : <Download size={16} />}
            <span>{isZipping ? 'Comprimiendo...' : 'Descargar ZIP (Conservadas)'}</span>
          </button>

          {!isElectron && (
            <button
              type="button"
              className="btn-action-script"
              onClick={handleDownloadPowerShellScript}
              title="Descarga un script para mover automáticamente las fotos en tu carpeta de Windows"
            >
              <Terminal size={16} />
              <span>Script Windows (.ps1)</span>
            </button>
          )}

          <button
            type="button"
            className="btn-action-secondary"
            onClick={handleDownloadReport}
            title="Descargar lista de duplicados en archivo de texto"
          >
            <FileText size={16} />
            <span>Reporte TXT</span>
          </button>
        </div>
      </div>
    </div>
  );
}
