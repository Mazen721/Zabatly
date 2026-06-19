import colors from '@/theme/colors';

export function getKycStatusMeta(status) {
  switch (status) {
    case 'verified':
      return {
        label: 'Verified',
        bg: colors.status.active.bg,
        text: colors.status.active.text,
        border: colors.status.active.border,
      };
    case 'pending':
    case 'manual_review':
      return {
        label: 'Pending review',
        bg: colors.status.pending.bg,
        text: colors.status.pending.text,
        border: colors.status.pending.border,
      };
    case 'rejected':
      return {
        label: 'Rejected',
        bg: colors.status.error.bg,
        text: colors.status.error.text,
        border: colors.status.error.border,
      };
    default:
      return {
        label: 'Not verified',
        bg: colors.warmLinen,
        text: colors.ashSecondary,
        border: colors.stoneBorder,
      };
  }
}
