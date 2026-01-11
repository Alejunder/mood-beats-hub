import Swal from 'sweetalert2';

export const showConfirmDeletePlaylist = async (playlistName, t) => {
  const result = await Swal.fire({
    title: t('deleteConfirm')?.replace('{name}', playlistName) || `⚠️ ¿Eliminar "${playlistName}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: t('delete') || 'Eliminar',
    cancelButtonText: t('cancel') || 'Cancelar',
    confirmButtonColor: '#ff4757',
    cancelButtonColor: '#597081',
    background: '#2a2438',
    color: '#d5b9b2',
    customClass: {
      popup: 'playlist-delete-modal',
      title: 'playlist-delete-title',
      htmlContainer: 'playlist-delete-content',
      confirmButton: 'playlist-delete-confirm-btn',
      cancelButton: 'playlist-delete-cancel-btn'
    },
    reverseButtons: true
  });

  return result.isConfirmed;
};
