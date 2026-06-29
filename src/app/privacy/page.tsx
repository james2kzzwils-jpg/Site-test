'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useLanguage } from '@/i18n/LanguageContext';

export default function PrivacyPage() {
  const { locale } = useLanguage();

  return (
    <>
      <Navigation rooted />
      <main className="bg-[var(--background)]">
        <article className="mx-auto max-w-[820px] px-6 pb-24 pt-36 sm:px-10 lg:px-14 lg:pt-44">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)]">
            <span className="accent-diamond">◆</span>{' '}
            {locale === 'ru' ? 'Юридическая информация' : 'Legal'}
          </p>
          <h1 className="font-display text-[clamp(2rem,5vw,3.6rem)] font-medium leading-[1.05] tracking-[-0.03em] text-[var(--foreground)]">
            {locale === 'ru'
              ? 'Политика конфиденциальности'
              : 'Privacy Policy'}
          </h1>

          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--foreground)]/40">
            {locale === 'ru'
              ? 'Последнее обновление: 29 июня 2026 г.'
              : 'Last updated: June 29, 2026'}
          </p>

          <div className="privacy-content mt-12 space-y-8 text-[15px] leading-[1.75] text-[var(--foreground)]/70">
            {locale === 'ru' ? <ContentRu /> : <ContentEn />}
          </div>

          <div className="mt-16 border-t border-[var(--hairline)] pt-8">
            <Link
              href="/"
              className="hover-line inline-block pb-[3px] font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--foreground)]/55 transition-colors hover:text-[var(--foreground)]"
              data-cursor="hover"
            >
              ← {locale === 'ru' ? 'На главную' : 'Back to Home'}
            </Link>
          </div>
        </article>
        <Footer />
      </main>
    </>
  );
}

/* ─── Russian version (152-ФЗ + GDPR) ─────────────────────────── */
function ContentRu() {
  return (
    <>
      <section>
        <h2 className="mb-3 font-display text-[20px] font-medium text-[var(--foreground)]">
          1. Общие положения
        </h2>
        <p>
          Настоящая Политика конфиденциальности (далее — «Политика») определяет
          порядок обработки и защиты персональных данных посетителей сайта{' '}
          <strong className="text-[var(--foreground)]">aepovcg.pro</strong>{' '}
          (далее — «Сайт»), принадлежащего Андрею Эпову / Epov Creative Labs
          (далее — «Оператор»).
        </p>
        <p>
          Политика разработана в соответствии с Федеральным законом от 27.07.2006
          № 152-ФЗ «О персональных данных» (Россия) и Общим регламентом по защите
          данных (GDPR, Регламент (ЕС) 2016/679).
        </p>
        <p>
          Используя Сайт, вы подтверждаете, что ознакомились с условиями данной
          Политики. Если вы не согласны с условиями, пожалуйста, покиньте Сайт.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-[20px] font-medium text-[var(--foreground)]">
          2. Какие данные мы собираем
        </h2>
        <p>Сайт может обрабатывать следующие категории данных:</p>
        <ul className="ml-6 list-disc space-y-1">
          <li>
            <strong className="text-[var(--foreground)]">IP-адрес</strong> —
            определяется автоматически при посещении Сайта.
          </li>
          <li>
            <strong className="text-[var(--foreground)]">Файлы cookie</strong> —
            небольшие текстовые файлы, сохраняемые браузером. Мы используем
            технические cookie (для корректной работы Сайта) и аналитические
            cookie (только с вашего согласия).
          </li>
          <li>
            <strong className="text-[var(--foreground)]">
              Данные о поведении на сайте
            </strong>{' '}
            — просмотренные страницы, время на сайте, тип устройства, источник
            перехода. Собираются сервисами аналитики только при наличии согласия.
          </li>
          <li>
            <strong className="text-[var(--foreground)]">
              Данные контактной формы
            </strong>{' '}
            — имя, электронная почта и текст сообщения, если вы заполняете форму
            обратной связи.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-[20px] font-medium text-[var(--foreground)]">
          3. Цели обработки данных
        </h2>
        <ul className="ml-6 list-disc space-y-1">
          <li>
            Анализ пользовательского опыта и улучшение работы сайта-портфолио.
          </li>
          <li>Обеспечение корректного функционирования Сайта.</li>
          <li>Обработка обращений через контактную форму.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-[20px] font-medium text-[var(--foreground)]">
          4. Сервисы аналитики
        </h2>
        <p>
          При вашем согласии на Сайте активируются следующие сервисы аналитики:
        </p>
        <ul className="ml-6 list-disc space-y-2">
          <li>
            <strong className="text-[var(--foreground)]">Яндекс Метрика</strong>{' '}
            — сервис веб-аналитики, предоставляемый ООО «Яндекс» (Россия, ул.
            Льва Толстого, д. 16, Москва, 119021). Данные обрабатываются на
            территории Российской Федерации. Подробнее:{' '}
            <a
              href="https://yandex.ru/legal/confidential/"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-[var(--foreground)]/25 underline-offset-2 transition-colors hover:text-[var(--foreground)]"
            >
              Политика Яндекса
            </a>
            .
          </li>
          <li>
            <strong className="text-[var(--foreground)]">
              Google Analytics
            </strong>{' '}
            — сервис веб-аналитики, предоставляемый Google LLC (США, 1600
            Amphitheatre Parkway, Mountain View, CA 94043). Данные могут
            передаваться и обрабатываться на серверах Google, в том числе за
            пределами Российской Федерации и Европейской экономической зоны (в
            США). Google соблюдает Data Privacy Framework (EU-U.S. DPF).
            Подробнее:{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-[var(--foreground)]/25 underline-offset-2 transition-colors hover:text-[var(--foreground)]"
            >
              Политика Google
            </a>
            .
          </li>
        </ul>
        <p className="mt-3">
          <strong className="text-[var(--foreground)]">Важно:</strong> скрипты
          аналитики не загружаются до тех пор, пока вы не нажмёте «Принять всё»
          в Cookie-баннере. Если согласие не дано или отклонено, ни один
          аналитический скрипт не исполняется.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-[20px] font-medium text-[var(--foreground)]">
          5. Трансграничная передача данных
        </h2>
        <p>
          При использовании Google Analytics персональные данные могут
          передаваться в США. Оператор принимает необходимые меры для обеспечения
          защиты прав субъектов данных в соответствии со статьёй 12 Федерального
          закона № 152-ФЗ и главой V GDPR.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-[20px] font-medium text-[var(--foreground)]">
          6. Правовые основания обработки
        </h2>
        <ul className="ml-6 list-disc space-y-1">
          <li>
            <strong className="text-[var(--foreground)]">Согласие</strong> (ст. 6
            (1)(a) GDPR, ст. 6 152-ФЗ) — для аналитических cookie.
          </li>
          <li>
            <strong className="text-[var(--foreground)]">
              Законный интерес
            </strong>{' '}
            (ст. 6 (1)(f) GDPR) — для технических cookie, обеспечивающих
            работоспособность Сайта.
          </li>
          <li>
            <strong className="text-[var(--foreground)]">
              Исполнение запроса субъекта
            </strong>{' '}
            — для обработки контактных форм.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-[20px] font-medium text-[var(--foreground)]">
          7. Сроки хранения данных
        </h2>
        <p>
          Данные аналитики хранятся в соответствии с политиками Яндекса и Google
          (как правило, до 26 месяцев). Данные контактных форм хранятся до
          завершения коммуникации, после чего удаляются. Выбор cookie-согласия
          хранится в localStorage вашего браузера в течение 1 года.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-[20px] font-medium text-[var(--foreground)]">
          8. Ваши права
        </h2>
        <p>
          В соответствии с 152-ФЗ и GDPR вы имеете право:
        </p>
        <ul className="ml-6 list-disc space-y-1">
          <li>Запросить информацию о том, какие данные обрабатываются.</li>
          <li>Потребовать исправления неточных данных.</li>
          <li>Потребовать удаления ваших данных.</li>
          <li>Отозвать согласие на обработку в любое время.</li>
          <li>
            Подать жалобу в уполномоченный орган (Роскомнадзор — для РФ, или
            соответствующий надзорный орган ЕС).
          </li>
        </ul>
        <p className="mt-2">
          Чтобы отозвать согласие на cookie, очистите данные сайта в настройках
          браузера — при следующем посещении баннер появится снова.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-[20px] font-medium text-[var(--foreground)]">
          9. Безопасность данных
        </h2>
        <p>
          Оператор принимает организационные и технические меры для защиты
          персональных данных от несанкционированного доступа, утраты, изменения
          или распространения, включая использование протокола HTTPS.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-[20px] font-medium text-[var(--foreground)]">
          10. Контактная информация
        </h2>
        <p>
          По всем вопросам, связанным с обработкой персональных данных, вы можете
          связаться с Оператором:
        </p>
        <ul className="ml-6 list-disc space-y-1">
          <li>
            Email:{' '}
            <a
              href="mailto:cggeneralistandrey@gmail.com"
              className="underline decoration-[var(--foreground)]/25 underline-offset-2 transition-colors hover:text-[var(--foreground)]"
            >
              cggeneralistandrey@gmail.com
            </a>
          </li>
          <li>
            Telegram:{' '}
            <a
              href="https://t.me/aepov_2kzz"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-[var(--foreground)]/25 underline-offset-2 transition-colors hover:text-[var(--foreground)]"
            >
              @aepov_2kzz
            </a>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-[20px] font-medium text-[var(--foreground)]">
          11. Изменение Политики
        </h2>
        <p>
          Оператор вправе вносить изменения в настоящую Политику. Актуальная
          версия всегда доступна по адресу{' '}
          <Link
            href="/privacy"
            className="underline decoration-[var(--foreground)]/25 underline-offset-2 transition-colors hover:text-[var(--foreground)]"
          >
            aepovcg.pro/privacy
          </Link>
          . Продолжая использовать Сайт после внесения изменений, вы принимаете
          обновлённые условия.
        </p>
      </section>
    </>
  );
}

/* ─── English version ──────────────────────────────────────────── */
function ContentEn() {
  return (
    <>
      <section>
        <h2 className="mb-3 font-display text-[20px] font-medium text-[var(--foreground)]">
          1. Introduction
        </h2>
        <p>
          This Privacy Policy (&quot;Policy&quot;) describes how{' '}
          <strong className="text-[var(--foreground)]">aepovcg.pro</strong>{' '}
          (&quot;Website&quot;), operated by Andrey Epov / Epov Creative Labs
          (&quot;Operator&quot;), collects, processes and protects personal data
          of its visitors.
        </p>
        <p>
          The Policy is designed in accordance with the Russian Federal Law
          No. 152-FZ &quot;On Personal Data&quot; and the EU General Data
          Protection Regulation (GDPR, Regulation (EU) 2016/679).
        </p>
        <p>
          By using the Website you confirm that you have read this Policy. If you
          disagree with any terms, please leave the Website.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-[20px] font-medium text-[var(--foreground)]">
          2. Data We Collect
        </h2>
        <ul className="ml-6 list-disc space-y-1">
          <li>
            <strong className="text-[var(--foreground)]">IP address</strong> —
            automatically determined when you visit the Website.
          </li>
          <li>
            <strong className="text-[var(--foreground)]">Cookies</strong> —
            small text files stored by your browser. We use essential cookies
            (required for the Website to function) and analytics cookies (only
            with your consent).
          </li>
          <li>
            <strong className="text-[var(--foreground)]">
              Behavioral data
            </strong>{' '}
            — pages viewed, time on site, device type, referral source. Collected
            by analytics services only when consent is given.
          </li>
          <li>
            <strong className="text-[var(--foreground)]">Contact form data</strong>{' '}
            — name, email and message text, if you submit the contact form.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-[20px] font-medium text-[var(--foreground)]">
          3. Purpose of Processing
        </h2>
        <ul className="ml-6 list-disc space-y-1">
          <li>
            Analyzing user experience and improving the portfolio website.
          </li>
          <li>Ensuring the Website functions correctly.</li>
          <li>Processing inquiries submitted through the contact form.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-[20px] font-medium text-[var(--foreground)]">
          4. Analytics Services
        </h2>
        <p>With your consent, the following analytics services are activated:</p>
        <ul className="ml-6 list-disc space-y-2">
          <li>
            <strong className="text-[var(--foreground)]">
              Yandex Metrica
            </strong>{' '}
            — a web analytics service provided by Yandex LLC (Russia). Data is
            processed within the Russian Federation.{' '}
            <a
              href="https://yandex.ru/legal/confidential/"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-[var(--foreground)]/25 underline-offset-2 transition-colors hover:text-[var(--foreground)]"
            >
              Yandex Privacy Policy
            </a>
            .
          </li>
          <li>
            <strong className="text-[var(--foreground)]">
              Google Analytics
            </strong>{' '}
            — a web analytics service provided by Google LLC (USA). Data may be
            transferred to and processed on Google servers, including outside
            the Russian Federation and the EEA (in the United States). Google
            adheres to the Data Privacy Framework (EU-U.S. DPF).{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-[var(--foreground)]/25 underline-offset-2 transition-colors hover:text-[var(--foreground)]"
            >
              Google Privacy Policy
            </a>
            .
          </li>
        </ul>
        <p className="mt-3">
          <strong className="text-[var(--foreground)]">Important:</strong>{' '}
          analytics scripts are not loaded until you click &quot;Accept
          all&quot; in the cookie banner. If consent is not given or is
          declined, no analytics script will execute.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-[20px] font-medium text-[var(--foreground)]">
          5. Cross-border Data Transfers
        </h2>
        <p>
          When Google Analytics is used, personal data may be transferred to the
          United States. The Operator takes the necessary measures to protect the
          rights of data subjects in accordance with Article 12 of Federal Law
          No. 152-FZ and Chapter V of the GDPR.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-[20px] font-medium text-[var(--foreground)]">
          6. Legal Basis
        </h2>
        <ul className="ml-6 list-disc space-y-1">
          <li>
            <strong className="text-[var(--foreground)]">Consent</strong> (Art. 6
            (1)(a) GDPR) — for analytics cookies.
          </li>
          <li>
            <strong className="text-[var(--foreground)]">
              Legitimate interest
            </strong>{' '}
            (Art. 6 (1)(f) GDPR) — for essential cookies.
          </li>
          <li>
            <strong className="text-[var(--foreground)]">
              Performance of a request
            </strong>{' '}
            — for processing contact form submissions.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-[20px] font-medium text-[var(--foreground)]">
          7. Data Retention
        </h2>
        <p>
          Analytics data is retained per Yandex and Google policies (typically up
          to 26 months). Contact form data is retained until the communication is
          complete and then deleted. Your cookie consent choice is stored in your
          browser&apos;s localStorage for 1 year.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-[20px] font-medium text-[var(--foreground)]">
          8. Your Rights
        </h2>
        <p>Under 152-FZ and the GDPR you have the right to:</p>
        <ul className="ml-6 list-disc space-y-1">
          <li>Request information about data being processed.</li>
          <li>Request correction of inaccurate data.</li>
          <li>Request deletion of your data.</li>
          <li>Withdraw consent at any time.</li>
          <li>
            Lodge a complaint with a supervisory authority (Roskomnadzor for
            Russia, or the relevant EU authority).
          </li>
        </ul>
        <p className="mt-2">
          To withdraw cookie consent, clear the Website data in your browser
          settings — the banner will reappear on your next visit.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-[20px] font-medium text-[var(--foreground)]">
          9. Data Security
        </h2>
        <p>
          The Operator takes organizational and technical measures to protect
          personal data from unauthorized access, loss, alteration or
          disclosure, including the use of HTTPS.
        </p>
      </section>

      <section>
        <h2 className="mb-3 font-display text-[20px] font-medium text-[var(--foreground)]">
          10. Contact Information
        </h2>
        <p>
          For any questions regarding personal data processing, you can reach the
          Operator at:
        </p>
        <ul className="ml-6 list-disc space-y-1">
          <li>
            Email:{' '}
            <a
              href="mailto:cggeneralistandrey@gmail.com"
              className="underline decoration-[var(--foreground)]/25 underline-offset-2 transition-colors hover:text-[var(--foreground)]"
            >
              cggeneralistandrey@gmail.com
            </a>
          </li>
          <li>
            Telegram:{' '}
            <a
              href="https://t.me/aepov_2kzz"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-[var(--foreground)]/25 underline-offset-2 transition-colors hover:text-[var(--foreground)]"
            >
              @aepov_2kzz
            </a>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-display text-[20px] font-medium text-[var(--foreground)]">
          11. Changes to This Policy
        </h2>
        <p>
          The Operator may update this Policy at any time. The current version is
          always available at{' '}
          <Link
            href="/privacy"
            className="underline decoration-[var(--foreground)]/25 underline-offset-2 transition-colors hover:text-[var(--foreground)]"
          >
            aepovcg.pro/privacy
          </Link>
          . By continuing to use the Website after changes are made, you accept
          the updated terms.
        </p>
      </section>
    </>
  );
}
