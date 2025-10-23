/**
 * Chunk Upload Utility
 *
 * Utilidad para subir archivos grandes en chunks (trozos) para evitar timeouts
 * y permitir reintentos parciales.
 *
 * Características:
 * - Divide archivos grandes en chunks de tamaño configurable
 * - Sube chunks en paralelo (configurable)
 * - Reintentos automáticos en caso de error
 * - Progress tracking detallado
 * - Soporte para cancelación
 * - Reanudación desde el último chunk exitoso
 */

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB por chunk
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_PARALLEL_UPLOADS = 3;

export class ChunkUploader {
  constructor(file, options = {}) {
    this.file = file;
    this.chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
    this.maxRetries = options.maxRetries || DEFAULT_MAX_RETRIES;
    this.parallelUploads = options.parallelUploads || DEFAULT_PARALLEL_UPLOADS;
    this.onProgress = options.onProgress || (() => {});
    this.onError = options.onError || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.uploadUrl = options.uploadUrl;

    this.chunks = [];
    this.uploadedChunks = new Set();
    this.aborted = false;
    this.uploadId = null;

    this._initChunks();
  }

  /**
   * Dividir archivo en chunks
   */
  _initChunks() {
    const totalChunks = Math.ceil(this.file.size / this.chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, this.file.size);
      const chunk = this.file.slice(start, end);

      this.chunks.push({
        index: i,
        blob: chunk,
        start,
        end,
        size: chunk.size,
        retries: 0,
      });
    }
  }

  /**
   * Iniciar el upload con el servidor
   */
  async _initUpload() {
    try {
      const response = await fetch(`${this.uploadUrl}/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          filename: this.file.name,
          filesize: this.file.size,
          mimetype: this.file.type,
          totalChunks: this.chunks.length,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize upload');
      }

      const data = await response.json();
      this.uploadId = data.uploadId;

      return data;
    } catch (error) {
      console.error('Error initializing upload:', error);
      throw error;
    }
  }

  /**
   * Subir un chunk individual
   */
  async _uploadChunk(chunk) {
    if (this.aborted) {
      throw new Error('Upload aborted');
    }

    const formData = new FormData();
    formData.append('file', chunk.blob);
    formData.append('uploadId', this.uploadId);
    formData.append('chunkIndex', chunk.index);
    formData.append('totalChunks', this.chunks.length);

    try {
      const response = await fetch(`${this.uploadUrl}/chunk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Chunk ${chunk.index} upload failed`);
      }

      return await response.json();
    } catch (error) {
      // Reintentar si no se ha excedido el límite
      if (chunk.retries < this.maxRetries) {
        chunk.retries++;
        console.log(`Retrying chunk ${chunk.index} (attempt ${chunk.retries}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * chunk.retries)); // Backoff exponencial
        return this._uploadChunk(chunk);
      }

      throw error;
    }
  }

  /**
   * Finalizar el upload en el servidor
   */
  async _finalizeUpload() {
    try {
      const response = await fetch(`${this.uploadUrl}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          uploadId: this.uploadId,
          filename: this.file.name,
          totalChunks: this.chunks.length,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to finalize upload');
      }

      return await response.json();
    } catch (error) {
      console.error('Error finalizing upload:', error);
      throw error;
    }
  }

  /**
   * Actualizar progreso
   */
  _updateProgress() {
    const uploadedSize = Array.from(this.uploadedChunks).reduce((sum, index) => {
      return sum + this.chunks[index].size;
    }, 0);

    const progress = {
      uploadedChunks: this.uploadedChunks.size,
      totalChunks: this.chunks.length,
      uploadedBytes: uploadedSize,
      totalBytes: this.file.size,
      percentage: Math.round((uploadedSize / this.file.size) * 100),
    };

    this.onProgress(progress);
  }

  /**
   * Iniciar el proceso de upload
   */
  async start() {
    try {
      // 1. Inicializar upload en el servidor
      await this._initUpload();

      // 2. Subir chunks en paralelo
      const chunkQueue = [...this.chunks];
      const activeUploads = [];

      while (chunkQueue.length > 0 || activeUploads.length > 0) {
        if (this.aborted) {
          throw new Error('Upload aborted by user');
        }

        // Llenar slots de uploads paralelos
        while (activeUploads.length < this.parallelUploads && chunkQueue.length > 0) {
          const chunk = chunkQueue.shift();

          // Solo subir chunks que no se hayan subido ya
          if (!this.uploadedChunks.has(chunk.index)) {
            const uploadPromise = this._uploadChunk(chunk)
              .then(() => {
                this.uploadedChunks.add(chunk.index);
                this._updateProgress();
              })
              .catch((error) => {
                console.error(`Failed to upload chunk ${chunk.index}:`, error);
                this.onError(error, chunk);
                throw error;
              });

            activeUploads.push(uploadPromise);
          }
        }

        // Esperar a que termine al menos un upload
        if (activeUploads.length > 0) {
          await Promise.race(activeUploads);
          // Remover uploads completados
          activeUploads.splice(0, activeUploads.findIndex(p => p.settled) + 1);
        }
      }

      // 3. Finalizar upload
      const result = await this._finalizeUpload();

      // 4. Callback de completado
      this.onComplete(result);

      return result;
    } catch (error) {
      console.error('Upload failed:', error);
      this.onError(error);
      throw error;
    }
  }

  /**
   * Cancelar el upload
   */
  abort() {
    this.aborted = true;

    // Notificar al servidor (opcional)
    if (this.uploadId && this.uploadUrl) {
      fetch(`${this.uploadUrl}/abort`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ uploadId: this.uploadId }),
      }).catch(console.error);
    }
  }

  /**
   * Reanudar upload desde el último chunk exitoso
   */
  resume() {
    this.aborted = false;
    return this.start();
  }
}

/**
 * Función helper para uploads simples
 */
export const uploadLargeFile = async (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploader = new ChunkUploader(file, {
      ...options,
      onComplete: (result) => {
        if (options.onComplete) {
          options.onComplete(result);
        }
        resolve(result);
      },
      onError: (error) => {
        if (options.onError) {
          options.onError(error);
        }
        reject(error);
      },
    });

    uploader.start().catch(reject);
  });
};

/**
 * Verificar si un archivo necesita chunk upload
 */
export const needsChunkUpload = (file, thresholdMB = 50) => {
  const thresholdBytes = thresholdMB * 1024 * 1024;
  return file.size > thresholdBytes;
};
