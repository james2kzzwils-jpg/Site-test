'use server';

import { revalidatePath } from 'next/cache';
import { setPortalLocaleCookie, type PortalLocale } from '@/lib/portal/i18n';

// Server action triggered by the LocaleSwitcher buttons in the portal
// header. Writes the chosen locale to a cookie and revalidates the
// whole portal tree so the new strings render on the next request.
export async function switchLocaleAction(formData: FormData) {
  const raw = String(formData.get('locale') ?? 'en');
  const locale: PortalLocale = raw === 'ru' ? 'ru' : 'en';
  await setPortalLocaleCookie(locale);
  revalidatePath('/portal', 'layout');
}
