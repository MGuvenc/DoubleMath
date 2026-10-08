export const PACKAGE_ACCESS_GRACE_DAYS = 3;

export function hasPackageAccess(
  packageExpiresAt: string | null,
  now = Date.now()
): boolean {
  if (packageExpiresAt === null) return true;

  const expiryTime = new Date(packageExpiresAt).getTime();
  if (Number.isNaN(expiryTime)) return false;

  const gracePeriod = PACKAGE_ACCESS_GRACE_DAYS * 24 * 60 * 60 * 1000;
  return expiryTime + gracePeriod > now;
}
