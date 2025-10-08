/**
 * User Validation Utilities
 * Validaciones específicas por rol de usuario
 */

// User types
export const USER_TYPES = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  CLINICA: 'CLINICA',
  ORIENTADOR: 'ORIENTADOR',
  EXAMINADOR: 'EXAMINADOR',
  FAMILIA: 'FAMILIA',
};

// User statuses
export const USER_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING_INVITATION: 'pending_invitation',
  INVITATION_SENT: 'invitation_sent',
};

// Payment methods
export const PAYMENT_METHODS = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  ANNUAL: 'annual',
  PER_TEST: 'per_test',
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const errors = [];

  if (!email || email.trim() === '') {
    errors.push('El email es obligatorio');
    return errors;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('El formato del email no es válido');
  }

  return errors;
};

/**
 * Validate DNI/NIE format (Spanish ID)
 */
export const validateDNI = (dni) => {
  const errors = [];

  if (!dni || dni.trim() === '') {
    return errors; // DNI is optional
  }

  const dniRegex = /^[0-9]{8}[A-Z]$/;
  const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/;

  if (!dniRegex.test(dni) && !nieRegex.test(dni)) {
    errors.push('El formato del DNI/NIE no es válido (ej: 12345678A o X1234567A)');
  }

  return errors;
};

/**
 * Validate phone number
 */
export const validatePhone = (phone) => {
  const errors = [];

  if (!phone || phone.trim() === '') {
    return errors; // Phone is optional
  }

  // Accept various formats: +34 600123456, 600123456, +34600123456, etc.
  const phoneRegex = /^(\+34|0034)?[6-9][0-9]{8}$/;
  const cleanPhone = phone.replace(/\s|-/g, '');

  if (!phoneRegex.test(cleanPhone)) {
    errors.push('El formato del teléfono no es válido (ej: +34 600123456)');
  }

  return errors;
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  const errors = [];

  if (!password || password.trim() === '') {
    return errors; // Password can be optional (pending_invitation)
  }

  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una mayúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una minúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  return errors;
};

/**
 * Validate required fields for ADMINISTRADOR
 */
export const validateAdministrador = (formData) => {
  const errors = {};

  // Basic required fields
  if (!formData.full_name || formData.full_name.trim() === '') {
    errors.full_name = 'El nombre completo es obligatorio';
  }

  const emailErrors = validateEmail(formData.email);
  if (emailErrors.length > 0) {
    errors.email = emailErrors[0];
  }

  return errors;
};

/**
 * Validate required fields for CLINICA
 */
export const validateClinica = (formData) => {
  const errors = {};

  // Basic required fields
  if (!formData.full_name || formData.full_name.trim() === '') {
    errors.full_name = 'El nombre completo es obligatorio';
  }

  const emailErrors = validateEmail(formData.email);
  if (emailErrors.length > 0) {
    errors.email = emailErrors[0];
  }

  // CLINICA-specific fields
  if (!formData.specialty || formData.specialty.trim() === '') {
    errors.specialty = 'La especialidad es obligatoria para CLINICA';
  }

  if (!formData.center_ids || formData.center_ids.length === 0) {
    errors.center_ids = 'Debe seleccionar al menos un centro';
  }

  return errors;
};

/**
 * Validate required fields for ORIENTADOR
 */
export const validateOrientador = (formData) => {
  const errors = {};

  // Basic required fields
  if (!formData.full_name || formData.full_name.trim() === '') {
    errors.full_name = 'El nombre completo es obligatorio';
  }

  const emailErrors = validateEmail(formData.email);
  if (emailErrors.length > 0) {
    errors.email = emailErrors[0];
  }

  // ORIENTADOR-specific fields
  if (!formData.center_id || formData.center_id.trim() === '') {
    errors.center_id = 'El centro es obligatorio para ORIENTADOR';
  }

  return errors;
};

/**
 * Validate required fields for EXAMINADOR
 */
export const validateExaminador = (formData) => {
  const errors = {};

  // Basic required fields
  if (!formData.full_name || formData.full_name.trim() === '') {
    errors.full_name = 'El nombre completo es obligatorio';
  }

  const emailErrors = validateEmail(formData.email);
  if (emailErrors.length > 0) {
    errors.email = emailErrors[0];
  }

  // EXAMINADOR-specific fields
  if (!formData.center_ids || formData.center_ids.length === 0) {
    errors.center_ids = 'Debe seleccionar al menos un centro';
  }

  return errors;
};

/**
 * Validate required fields for FAMILIA
 */
export const validateFamilia = (formData) => {
  const errors = {};

  // Basic required fields
  if (!formData.full_name || formData.full_name.trim() === '') {
    errors.full_name = 'El nombre completo es obligatorio';
  }

  const emailErrors = validateEmail(formData.email);
  if (emailErrors.length > 0) {
    errors.email = emailErrors[0];
  }

  // FAMILIA-specific fields
  if (!formData.payment_method || formData.payment_method.trim() === '') {
    errors.payment_method = 'El método de pago es obligatorio para FAMILIA';
  }

  return errors;
};

/**
 * Validate user based on role
 */
export const validateUserByRole = (formData) => {
  const userType = formData.user_type;

  switch (userType) {
    case USER_TYPES.ADMINISTRADOR:
      return validateAdministrador(formData);
    case USER_TYPES.CLINICA:
      return validateClinica(formData);
    case USER_TYPES.ORIENTADOR:
      return validateOrientador(formData);
    case USER_TYPES.EXAMINADOR:
      return validateExaminador(formData);
    case USER_TYPES.FAMILIA:
      return validateFamilia(formData);
    default:
      return { user_type: 'Tipo de usuario no válido' };
  }
};

/**
 * Validate complete user form
 */
export const validateUserForm = (formData) => {
  const errors = {};

  // User type is always required
  if (!formData.user_type) {
    errors.user_type = 'El tipo de usuario es obligatorio';
    return errors; // Can't continue without user type
  }

  // Role-specific validation
  const roleErrors = validateUserByRole(formData);
  Object.assign(errors, roleErrors);

  // Common optional validations
  const dniErrors = validateDNI(formData.dni);
  if (dniErrors.length > 0) {
    errors.dni = dniErrors[0];
  }

  const phoneErrors = validatePhone(formData.phone);
  if (phoneErrors.length > 0) {
    errors.phone = phoneErrors[0];
  }

  if (formData.password) {
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      errors.password = passwordErrors.join(', ');
    }
  }

  // Birth date validation
  if (formData.birth_date) {
    const birthDate = new Date(formData.birth_date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    if (age < 18) {
      errors.birth_date = 'El usuario debe ser mayor de 18 años';
    }

    if (birthDate > today) {
      errors.birth_date = 'La fecha de nacimiento no puede ser futura';
    }
  }

  return errors;
};

/**
 * Check if user has protected fields (base44 user)
 */
export const isProtectedUser = (user) => {
  return user?.status === USER_STATUSES.ACTIVE || user?.status === USER_STATUSES.INVITATION_SENT;
};

/**
 * Get protected fields for a user
 */
export const getProtectedFields = (user) => {
  if (!isProtectedUser(user)) {
    return [];
  }

  return ['full_name', 'email'];
};

/**
 * Validate that protected fields are not being modified
 */
export const validateProtectedFields = (originalUser, updatedData) => {
  const errors = {};

  if (!isProtectedUser(originalUser)) {
    return errors;
  }

  const protectedFields = getProtectedFields(originalUser);

  protectedFields.forEach(field => {
    if (updatedData[field] && updatedData[field] !== originalUser[field]) {
      errors[field] = `Este campo está protegido para usuarios invitados por base44`;
    }
  });

  return errors;
};

/**
 * Get required fields by user type
 */
export const getRequiredFieldsByType = (userType) => {
  const baseFields = ['full_name', 'email', 'user_type'];

  switch (userType) {
    case USER_TYPES.ADMINISTRADOR:
      return baseFields;

    case USER_TYPES.CLINICA:
      return [...baseFields, 'specialty', 'center_ids'];

    case USER_TYPES.ORIENTADOR:
      return [...baseFields, 'center_id'];

    case USER_TYPES.EXAMINADOR:
      return [...baseFields, 'center_ids'];

    case USER_TYPES.FAMILIA:
      return [...baseFields, 'payment_method'];

    default:
      return baseFields;
  }
};

/**
 * Check if a field is required for a user type
 */
export const isFieldRequired = (field, userType) => {
  const requiredFields = getRequiredFieldsByType(userType);
  return requiredFields.includes(field);
};

/**
 * Validate bulk update data
 */
export const validateBulkUpdate = (updateData, userCount) => {
  const errors = {};

  if (Object.keys(updateData).length === 0) {
    errors._general = 'Debe seleccionar al menos un campo para actualizar';
    return errors;
  }

  // Validate user_type if provided
  if (updateData.user_type && !Object.values(USER_TYPES).includes(updateData.user_type)) {
    errors.user_type = 'Tipo de usuario no válido';
  }

  // Validate status if provided
  if (updateData.status && !Object.values(USER_STATUSES).includes(updateData.status)) {
    errors.status = 'Estado no válido';
  }

  // Validate arrays are not empty
  if (updateData.center_ids && updateData.center_ids.length === 0) {
    errors.center_ids = 'Debe seleccionar al menos un centro';
  }

  if (updateData.allowed_etapas && updateData.allowed_etapas.length === 0) {
    errors.allowed_etapas = 'Debe seleccionar al menos una etapa';
  }

  return errors;
};

export default {
  USER_TYPES,
  USER_STATUSES,
  PAYMENT_METHODS,
  validateEmail,
  validateDNI,
  validatePhone,
  validatePassword,
  validateUserByRole,
  validateUserForm,
  isProtectedUser,
  getProtectedFields,
  validateProtectedFields,
  getRequiredFieldsByType,
  isFieldRequired,
  validateBulkUpdate,
};
