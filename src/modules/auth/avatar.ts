export function profileAvatarUrl(updatedAt: Date | string) {
  return `/api/profile/avatar?v=${new Date(updatedAt).getTime()}`;
}
