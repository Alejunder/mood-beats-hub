import Swal from 'sweetalert2';

export const showConfirmDeleteTrack = async (trackName, artistName, t) => {
  const result = await Swal.fire({
    title: t('deleteTrackConfirm') || '¿Eliminar esta canción?',
    html: `
      <div style="text-align: center; padding: 10px 20px;">
        <div style="margin: 20px 0;">
          <div style="font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 8px;">
            🎵 ${trackName}
          </div>
          <div style="font-size: 14px; color: #d5b9b2;">
            👤 ${artistName}
          </div>
        </div>
        <div style="margin-top: 20px; padding: 15px; background: rgba(255, 107, 107, 0.1); border-radius: 8px; border-left: 3px solid #ff6b6b;">
          <p style="margin: 0; color: #ff6b6b; font-size: 13px;">
            ⚠️ Esta acción no se puede deshacer
          </p>
        </div>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('delete') || 'Eliminar',
    cancelButtonText: t('cancel') || 'Cancelar',
    confirmButtonColor: '#ff4757',
    cancelButtonColor: '#597081',
    background: '#2a2438',
    color: '#d5b9b2',
    customClass: {
      popup: 'delete-track-modal',
      title: 'delete-track-title',
      htmlContainer: 'delete-track-content',
      confirmButton: 'delete-track-confirm-btn',
      cancelButton: 'delete-track-cancel-btn'
    },
    reverseButtons: true
  });

  return result.isConfirmed;
};
