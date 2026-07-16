import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import PortalHeader from '../_shared/PortalHeader';
import Breadcrumb from '../_shared/Breadcrumb';
import { getPortalLocale, tFactory, type PortalLocale } from '@/lib/portal/i18n';
import {
  loadProjectActivity,
  type PortalInboxItem,
} from '@/lib/portal/inbox';

function payloadString(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === 'string' ? value : null;
}

function formatActivityDate(locale: PortalLocale, value: string) {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function latestActivityTitle(item: PortalInboxItem, locale: PortalLocale) {
  const stage =
    payloadString(item.payload, 'stage_kind') ??
    payloadString(item.payload, 'to_stage') ??
    payloadString(item.payload, 'from_stage');
  const decision = payloadString(item.payload, 'decision');

  switch (item.type) {
    case 'approval_requested':
      return locale === 'ru'
        ? `Этап ${stage ?? 'текущий'} готов к ревью`
        : `${stage ?? 'Current stage'} is ready for review`;
    case 'approval_decided':
      return decision === 'changes_requested'
        ? locale === 'ru'
          ? 'По этапу зафиксированы правки'
          : 'Changes were requested on the stage'
        : locale === 'ru'
          ? 'Твое approval уже записано'
          : 'Your approval is already recorded';
    case 'comment_added':
      return item.actorRole === 'admin'
        ? locale === 'ru'
          ? 'Студия оставила новый комментарий'
          : 'The studio left a new comment'
        : locale === 'ru'
          ? 'В треде появился новый комментарий'
          : 'There is a new comment in the thread';
    case 'file_uploaded':
      return item.actorRole === 'admin'
        ? locale === 'ru'
          ? 'Студия загрузила новый файл'
          : 'The studio uploaded a new file'
        : locale === 'ru'
          ? 'В проект добавлен новый файл'
          : 'A new file was added to the project';
    case 'stage_changed':
      return locale === 'ru'
        ? `Проект переведён в ${payloadString(item.payload, 'to_stage') ?? 'новый статус'}`
        : `The project moved to ${payloadString(item.payload, 'to_stage') ?? 'a new status'}`;
    case 'project_created':
      return locale === 'ru' ? 'Проект создан' : 'Project created';
    default:
      return locale === 'ru' ? 'Есть новое обновление' : 'There is a new update';
  }
}

function fallbackProjectHint(args: {
  locale: PortalLocale;
  status: string;
  dueDate: string | null;
}) {
  const { locale, status, dueDate } = args;

  if (status === 'archived') {
    return locale === 'ru'
      ? 'Проект уже завершён. Здесь остаётся доступ к финальным материалам и всей истории обсуждений.'
      : 'This project is already wrapped. You can still return here for final assets and the full delivery history.';
  }

  if (dueDate) {
    return locale === 'ru'
      ? `Следующий ориентир по сроку — ${dueDate}. Когда появится новый review или файл, это будет видно здесь.`
      : `The next timing checkpoint is ${dueDate}. As soon as a new review or file lands, it will show up here.`;
  }

  return locale === 'ru'
    ? 'Проект движется по pipeline. Следующее заметное обновление появится в этой строке.'
    : 'The project is moving through the pipeline. The next meaningful update will appear in this row.';
}

// Client landing: list all projects visible to the signed-in client
// (RLS already filters to client_members rows). For most clients this
// will be one or two projects.
export default async function ClientProjectsPage() {
  const supabase = await createSupabaseServerClient();
  const locale = await getPortalLocale();
  const t = tFactory(locale);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role === 'admin') redirect('/portal/admin');

  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, status, due_date')
    .order('created_at', { ascending: false });

  const activityByProject = new Map<
    string,
    { item: PortalInboxItem | null; status: 'ready' | 'not_ready' | 'error' }
  >();

  await Promise.all(
    (projects ?? []).map(async (project) => {
      const result = await loadProjectActivity({
        supabase,
        projectId: project.id,
        limit: 1,
      });

      activityByProject.set(project.id, {
        item: result.items[0] ?? null,
        status: result.status,
      });
    })
  );

  const hasActivityPreview = [...activityByProject.values()].some(
    (entry) => entry.item != null
  );
  const hasNotReadyActivity = [...activityByProject.values()].some(
    (entry) => entry.status === 'not_ready'
  );

  return (
    <>
      <PortalHeader
        label={`${t('role.client')} / ${t('admin.client.projects')}`}
        email={profile?.email ?? user.email ?? ''}
        role="client"
      />

      <Breadcrumb trail={[{ label: t('crumb.myProjects') }]} />

      <h1 className="mb-3 font-display text-[clamp(2rem,4.5vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
        {t('client.title')}
      </h1>
      <p className="mb-10 text-[14px] leading-[1.7] text-[var(--foreground)]/55">
        {t('client.subtitle')}
      </p>

      {hasNotReadyActivity ? (
        <div className="mb-8 border border-[var(--accent)] bg-[var(--accent)]/10 p-4 text-[13px] leading-[1.7] text-[var(--foreground)]/75">
          {locale === 'ru'
            ? 'Лента быстрых обновлений начнёт показываться здесь после активации portal events на сервере.'
            : 'Quick activity previews will start showing here once portal events are active on the server.'}
        </div>
      ) : hasActivityPreview ? (
        <div className="mb-8 border border-[var(--hairline)] p-4 text-[13px] leading-[1.7] text-[var(--foreground)]/65">
          {locale === 'ru'
            ? 'Теперь в списке проектов сразу видно последнее заметное обновление по каждому проекту — без необходимости открывать каждый по очереди.'
            : 'The project list now shows the latest meaningful update for each project, so you do not need to open them one by one just to see what changed.'}
        </div>
      ) : null}

      <div className="border-t border-[var(--hairline)]">
        {(projects ?? []).length === 0 ? (
          <p className="py-10 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--foreground)]/45">
            {t('client.empty')}
          </p>
        ) : (
          <ul>
            {projects!.map((p) => {
              const latest = activityByProject.get(p.id);
              const latestItem = latest?.item ?? null;

              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-6 border-b border-[var(--hairline)] py-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[20px] leading-[1.2] tracking-[-0.01em]">
                      {p.title}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/45">
                      {p.status}
                      {p.due_date ? ` · ${t('admin.project.due')} ${p.due_date}` : ''}
                    </p>
                    <div className="mt-3 flex flex-col gap-1">
                      <p className="text-[13px] leading-[1.6] text-[var(--foreground)]/72">
                        {latestItem
                          ? latestActivityTitle(latestItem, locale)
                          : fallbackProjectHint({
                              locale,
                              status: p.status,
                              dueDate: p.due_date,
                            })}
                      </p>
                      {latestItem ? (
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--foreground)]/38">
                          {formatActivityDate(locale, latestItem.createdAt)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <Link
                    href={`/portal/client/${p.id}`}
                    className="shrink-0 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--foreground)]/55 hover:text-[var(--accent)]"
                  >
                    {t('common.open')} →
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
