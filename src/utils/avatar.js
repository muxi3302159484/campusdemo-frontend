// src/utils/avatar.js
export function getAvatarUrl(avatarId) {
  // 兼容无效id
  const id = [1,2,3,4].includes(Number(avatarId)) ? avatarId : 1;
  return require(`@/assets/avatars/avatar_${id}.png`);
}
