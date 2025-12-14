import Swal from 'sweetalert2';

export const showDeleteAccountConfirmation = async (t) => {
  const result = await Swal.fire({
    title: `⚠️ ${t('dangerZone')?.toUpperCase() || 'ZONA DE PELIGRO'}`,
    html: `
      <div style="text-align: left; color: #d5b9b2; line-height: 1.6;">
        <p style="margin-bottom: 16px; font-size: 15px;">
          ${t('deleteWarning') || 'Esta acción eliminará permanentemente tu cuenta y todos tus datos.'}
        </p>
        <p style="margin-bottom: 16px; font-size: 15px;">
          ${t('deleteNote') || 'Esta acción no se puede deshacer.'}
        </p>
        <p style="margin-top: 20px; font-weight: 600; color: #ece2d0;">
          ¿Deseas continuar con la eliminación?
        </p>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('continue') || 'Continuar',
    cancelButtonText: t('cancel') || 'Cancelar',
    confirmButtonColor: '#9a031e',
    cancelButtonColor: '#597081',
    background: '#000000',
    color: '#ece2d0',
    customClass: {
      popup: 'delete-account-confirm-modal',
      title: 'delete-account-confirm-title',
      htmlContainer: 'delete-account-confirm-content',
      confirmButton: 'delete-account-confirm-btn',
      cancelButton: 'delete-account-cancel-btn'
    },
    reverseButtons: true
  });

  return result.isConfirmed;
};

export const showDeleteAccountInput = async (t, username) => {
  const result = await Swal.fire({
    title: '🔒 ' + (t('finalConfirmation') || 'Confirmación Final'),
    html: `
      <div style="text-align: left; color: #d5b9b2; line-height: 1.6; margin-bottom: 20px;">
        <p style="margin-bottom: 16px; font-size: 15px;">
          Para confirmar la eliminación permanente de tu cuenta, escribe tu nombre de usuario exactamente:
        </p>
        <p style="text-align: center; font-weight: 700; font-size: 18px; color: #9a031e; letter-spacing: 1px; margin: 16px 0;">
          ${username}
        </p>
      </div>
    `,
    input: 'text',
    inputPlaceholder: username,
    showCancelButton: true,
    confirmButtonText: t('deleteAccount') || 'Eliminar Cuenta',
    cancelButtonText: t('cancel') || 'Cancelar',
    confirmButtonColor: '#9a031e',
    cancelButtonColor: '#597081',
    background: '#000000',
    color: '#ece2d0',
    inputAttributes: {
      autocapitalize: 'off',
      autocorrect: 'off'
    },
    customClass: {
      popup: 'delete-account-input-modal',
      title: 'delete-account-input-title',
      htmlContainer: 'delete-account-input-content',
      input: 'delete-account-input-field',
      confirmButton: 'delete-account-input-confirm-btn',
      cancelButton: 'delete-account-input-cancel-btn'
    },
    reverseButtons: true,
    preConfirm: (value) => {
      if (value !== username) {
        Swal.showValidationMessage(
          `Debes escribir "${username}" exactamente como se muestra`
        );
        return false;
      }
      return value;
    }
  });

  return result.isConfirmed ? result.value : null;
};

export const showDeleteCancelled = async (t) => {
  await Swal.fire({
    title: '✅ ' + (t('cancelled') || 'Operación Cancelada'),
    text: 'Tu cuenta está a salvo. No se ha realizado ningún cambio.',
    icon: 'info',
    confirmButtonText: t('ok') || 'Entendido',
    confirmButtonColor: '#597081',
    background: '#000000',
    color: '#d5b9b2',
    customClass: {
      popup: 'delete-cancelled-modal',
      title: 'delete-cancelled-title',
      confirmButton: 'delete-cancelled-confirm-btn',
      htmlContainer: 'delete-cancelled-content'
    }
  });
};

export const showDeleteSuccess = async (t) => {
  await Swal.fire({
    title: '✓ ' + (t('accountDeleted') || 'Cuenta Eliminada'),
    text: 'Tu cuenta ha sido eliminada completamente de todos los sistemas. Serás redirigido al inicio de sesión.',
    icon: 'success',
    confirmButtonText: t('ok') || 'Aceptar',
    confirmButtonColor: '#597081',
    background: '#000000',
    color: '#d5b9b2',
    customClass: {
      popup: 'delete-success-modal',
      title: 'delete-success-title',
      confirmButton: 'delete-success-confirm-btn',
      htmlContainer: 'delete-success-content'
    }
  });
};

export const showDeleteError = async (message, t) => {
  await Swal.fire({
    title: '⚠️ ' + (t('error') || 'Error al Eliminar'),
    text: message,
    icon: 'error',
    confirmButtonText: t('ok') || 'Entendido',
    confirmButtonColor: '#9a031e',
    background: '#000000',
    color: '#d5b9b2',
    customClass: {
      popup: 'delete-error-modal',
      title: 'delete-error-title',
      confirmButton: 'delete-error-confirm-btn',
      htmlContainer: 'delete-error-content'
    }
  });
};

