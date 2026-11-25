/** Konstanta & helper pembayaran donasi (aman dipakai di server maupun client). */

export const MIN_DONATION = 1_000;
export const MAX_DONATION = 1_000_000_000;

export const TX_PENDING = "Menunggu Verifikasi";
export const TX_CONFIRMED = "Dikonfirmasi";
export const TX_REJECTED = "Ditolak";

/** Transaksi lama tanpa status sudah dihitung ke dana terkumpul -> dianggap terkonfirmasi. */
export const txStatus = (t: { status?: string }) => t.status || TX_CONFIRMED;
export const isPending = (t: { status?: string }) => t.status === TX_PENDING;
