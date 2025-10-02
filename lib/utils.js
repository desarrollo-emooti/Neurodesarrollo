import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Utilidades para fechas
export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  return new Date(date).toLocaleDateString('es-ES', defaultOptions);
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('es-ES');
};

export const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Utilidades para generar IDs
export const generateUserId = async () => {
  const users = await import('@/entities/User').then(m => m.User.list('-created_date', 1));
  const lastUser = users[0];
  const lastNumber = lastUser?.user_id ? parseInt(lastUser.user_id.replace('USR_', '')) : 0;
  return `USR_${String(lastNumber + 1).padStart(3, '0')}`;
};

export const generateStudentId = async () => {
  const students = await import('@/entities/Student').then(m => m.Student.list('-created_date', 1));
  const lastStudent = students[0];
  const lastNumber = lastStudent?.student_id ? parseInt(lastStudent.student_id.replace('STU_', '')) : 0;
  return `STU_${String(lastNumber + 1).padStart(3, '0')}`;
};

// Utilidades para validación
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateDNI = (dni) => {
  const re = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
  return re.test(dni);
};

export const validatePhone = (phone) => {
  const re = /^[+]?[0-9\s\-\(\)]{9,}$/;
  return re.test(phone);
};

// Utilidades para formateo
export const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  return phone;
};

export const formatDNI = (dni) => {
  if (!dni) return '';
  return dni.toUpperCase();
};

// Utilidades para arrays
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (direction === 'desc') {
      return bVal > aVal ? 1 : -1;
    }
    return aVal > bVal ? 1 : -1;
  });
};

// Utilidades para texto
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const capitalizeWords = (text) => {
  if (!text) return '';
  return text.split(' ').map(word => capitalizeFirst(word)).join(' ');
};

// Utilidades para colores
export const getStatusColor = (status) => {
  const colors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    'pending_invitation': 'bg-yellow-100 text-yellow-800',
    'invitation_sent': 'bg-blue-100 text-blue-800',
    'Sí': 'bg-green-100 text-green-800',
    'No': 'bg-red-100 text-red-800',
    'Pendiente': 'bg-yellow-100 text-yellow-800',
    'N/A': 'bg-gray-100 text-gray-800',
    'Pagado': 'bg-green-100 text-green-800',
    'Pendiente': 'bg-yellow-100 text-yellow-800',
    'baja': 'bg-gray-100 text-gray-800',
    'media': 'bg-yellow-100 text-yellow-800',
    'alta': 'bg-orange-100 text-orange-800',
    'urgente': 'bg-red-100 text-red-800'
  };
  
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Utilidades para archivos
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename) => {
  return filename.split('.').pop().toLowerCase();
};

// Utilidades para URLs
export const generateQRUrl = (data, size = 150) => {
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(data)}&size=${size}x${size}&margin=10`;
};

// Utilidades para cálculos
export const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

export const calculateAgeInMonths = (birthDate) => {
  if (!birthDate) return null;
  
  const today = new Date();
  const birth = new Date(birthDate);
  const yearDiff = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  return yearDiff * 12 + monthDiff;
};

// Utilidades para debounce
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Utilidades para throttle
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

