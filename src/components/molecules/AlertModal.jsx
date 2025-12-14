import Swal from 'sweetalert2';

// Alert de error
export const showErrorAlert = async (message, t) => {
  await Swal.fire({
    title: t('error') || 'Error',
    text: message,
    icon: 'error',
    confirmButtonText: t('ok') || 'OK',
    confirmButtonColor: '#9a031e',
    background: '#000000',
    color: '#d5b9b2',
    customClass: {
      popup: 'error-alert-modal',
      title: 'error-alert-title',
      confirmButton: 'error-alert-confirm-btn',
      htmlContainer: 'error-alert-content'
    }
  });
};

// Alert de advertencia
export const showWarningAlert = async (message, t) => {
  await Swal.fire({
    title: t('warning') || 'Advertencia',
    text: message,
    icon: 'warning',
    confirmButtonText: t('ok') || 'OK',
    confirmButtonColor: '#597081',
    background: '#000000',
    color: '#d5b9b2',
    customClass: {
      popup: 'warning-alert-modal',
      title: 'warning-alert-title',
      confirmButton: 'warning-alert-confirm-btn',
      htmlContainer: 'warning-alert-content'
    }
  });
};

// Alert de éxito
export const showSuccessAlert = async (message, t) => {
  await Swal.fire({
    title: t('success') || 'Éxito',
    text: message,
    icon: 'success',
    confirmButtonText: t('ok') || 'OK',
    confirmButtonColor: '#597081',
    background: '#000000',
    color: '#d5b9b2',
    customClass: {
      popup: 'success-alert-modal',
      title: 'success-alert-title',
      confirmButton: 'success-alert-confirm-btn',
      htmlContainer: 'success-alert-content'
    }
  });
};

// Alert de información
export const showInfoAlert = async (message, t) => {
  await Swal.fire({
    title: t('info') || 'Información',
    text: message,
    icon: 'info',
    confirmButtonText: t('ok') || 'OK',
    confirmButtonColor: '#597081',
    background: '#000000',
    color: '#d5b9b2',
    customClass: {
      popup: 'info-alert-modal',
      title: 'info-alert-title',
      confirmButton: 'info-alert-confirm-btn',
      htmlContainer: 'info-alert-content'
    }
  });
};
