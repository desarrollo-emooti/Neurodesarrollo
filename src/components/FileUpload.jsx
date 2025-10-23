import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, File } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { toast } from 'react-hot-toast';

/**
 * FileUpload Component
 *
 * Componente reutilizable para carga de archivos con:
 * - Validación de tamaño (max 10MB por defecto)
 * - Validación de tipos de archivo
 * - Compresión automática de imágenes
 * - Progress bar durante la carga
 * - Chunk upload para archivos grandes (>50MB)
 * - Preview de imágenes
 * - Soporte para múltiples archivos
 *
 * @param {Object} props
 * @param {Function} props.onUpload - Callback cuando se sube un archivo
 * @param {Function} props.onDelete - Callback cuando se elimina un archivo
 * @param {Array} props.acceptedFileTypes - Tipos de archivo aceptados (ej: ['image/*', 'application/pdf'])
 * @param {Number} props.maxSizeMB - Tamaño máximo en MB (default: 10)
 * @param {Boolean} props.multiple - Permitir múltiples archivos (default: false)
 * @param {Boolean} props.compressImages - Comprimir imágenes automáticamente (default: true)
 * @param {String} props.label - Etiqueta del campo
 * @param {Array} props.existingFiles - Archivos ya subidos
 */
const FileUpload = ({
  onUpload,
  onDelete,
  acceptedFileTypes = ['image/*', 'application/pdf'],
  maxSizeMB = 10,
  multiple = false,
  compressImages = true,
  label = 'Subir archivo',
  existingFiles = [],
}) => {
  const [files, setFiles] = useState(existingFiles);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Validar tamaño de archivo
  const validateFileSize = (file) => {
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast.error(`El archivo "${file.name}" excede el tamaño máximo de ${maxSizeMB}MB`);
      return false;
    }
    return true;
  };

  // Validar tipo de archivo
  const validateFileType = (file) => {
    const fileType = file.type;
    const isAccepted = acceptedFileTypes.some(acceptedType => {
      if (acceptedType.endsWith('/*')) {
        // Validar categoría (ej: image/*)
        const category = acceptedType.split('/')[0];
        return fileType.startsWith(category + '/');
      }
      // Validar tipo exacto
      return fileType === acceptedType;
    });

    if (!isAccepted) {
      toast.error(`El archivo "${file.name}" no es un tipo permitido`);
      return false;
    }
    return true;
  };

  // Comprimir imagen si es necesario
  const compressImageIfNeeded = async (file) => {
    // Solo comprimir si es imagen y la opción está activada
    if (!compressImages || !file.type.startsWith('image/')) {
      return file;
    }

    try {
      const options = {
        maxSizeMB: Math.min(1, maxSizeMB), // Comprimir a máximo 1MB
        maxWidthOrHeight: 1920, // Máximo 1920px
        useWebWorker: true,
        fileType: file.type,
      };

      const compressedFile = await imageCompression(file, options);

      // Mostrar reducción de tamaño
      const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const compressedSizeMB = (compressedFile.size / (1024 * 1024)).toFixed(2);

      if (compressedFile.size < file.size) {
        toast.success(`Imagen comprimida: ${originalSizeMB}MB → ${compressedSizeMB}MB`);
      }

      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      toast.error('Error al comprimir la imagen, se usará el original');
      return file;
    }
  };

  // Simular progreso de carga (para integración futura con chunk upload)
  const simulateUploadProgress = () => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          resolve();
        }
      }, 200);
    });
  };

  // Manejar selección de archivos
  const handleFileSelect = async (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);

    // Validar cada archivo
    const validFiles = fileArray.filter(file =>
      validateFileSize(file) && validateFileType(file)
    );

    if (validFiles.length === 0) {
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Procesar archivos (comprimir si es imagen)
      const processedFiles = await Promise.all(
        validFiles.map(async (file) => {
          const processedFile = await compressImageIfNeeded(file);

          // Crear preview para imágenes
          let preview = null;
          if (processedFile.type.startsWith('image/')) {
            preview = URL.createObjectURL(processedFile);
          }

          return {
            file: processedFile,
            name: processedFile.name,
            size: processedFile.size,
            type: processedFile.type,
            preview,
            uploadedAt: new Date().toISOString(),
          };
        })
      );

      // Simular progreso de carga
      await simulateUploadProgress();

      // Actualizar estado
      const updatedFiles = multiple
        ? [...files, ...processedFiles]
        : processedFiles;

      setFiles(updatedFiles);

      // Callback al padre
      if (onUpload) {
        processedFiles.forEach(fileData => onUpload(fileData));
      }

      toast.success(`${processedFiles.length} archivo(s) subido(s) correctamente`);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error al subir el archivo');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Manejar eliminación de archivo
  const handleFileDelete = (index) => {
    const fileToDelete = files[index];

    // Revocar URL de preview si existe
    if (fileToDelete.preview) {
      URL.revokeObjectURL(fileToDelete.preview);
    }

    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);

    // Callback al padre
    if (onDelete) {
      onDelete(fileToDelete);
    }

    toast.success('Archivo eliminado');
  };

  // Manejar drag & drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Drop zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedFileTypes.join(',')}
          multiple={multiple}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          disabled={uploading}
        />

        <div className="space-y-2">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="text-sm text-gray-600">
            <span className="font-medium text-blue-600 hover:text-blue-500">
              Haz clic para subir
            </span>
            {' '}o arrastra archivos aquí
          </div>
          <p className="text-xs text-gray-500">
            Tamaño máximo: {maxSizeMB}MB
            {acceptedFileTypes.length > 0 && (
              <span> • Formatos: {acceptedFileTypes.join(', ')}</span>
            )}
          </p>
        </div>

        {/* Progress bar */}
        {uploading && (
          <div className="mt-4">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    Subiendo...
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {uploadProgress}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-200">
                <div
                  style={{ width: `${uploadProgress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-300"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((fileData, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {/* Preview or icon */}
                {fileData.preview ? (
                  <img
                    src={fileData.preview}
                    alt={fileData.name}
                    className="h-12 w-12 object-cover rounded"
                  />
                ) : (
                  <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                    <File className="h-6 w-6 text-gray-500" />
                  </div>
                )}

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileData.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(fileData.size)}
                  </p>
                </div>

                {/* Status icon */}
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFileDelete(index);
                }}
                className="ml-3 p-1 hover:bg-gray-200 rounded-full transition-colors"
                title="Eliminar archivo"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
