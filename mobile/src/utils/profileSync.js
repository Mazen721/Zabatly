import { getProfile } from '@/api/client';

export async function syncFullProfile(refreshUser) {
  const { data } = await getProfile();
  await refreshUser(data);
  return data;
}
