/**
 * Build edition marker.
 *
 * The public source defaults to the Community Edition. The store build script
 * replaces this file inside its staging directory with the commercial edition
 * marker; it never changes the working tree.
 */
export const EDITION = 'community';
export const PRO_ENABLED = false;
