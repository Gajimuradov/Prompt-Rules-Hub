import { useEffect, useMemo, useState } from 'react';
import styles from './App.module.css';
import { ContextBuilderPage } from '../pages/ContextBuilderPage';
import { ExportPage } from '../pages/ExportPage';
import { RuleDetailsPage } from '../pages/RuleDetailsPage';
import { RuleFormPage } from '../pages/RuleFormPage';
import { RulesListPage } from '../pages/RulesListPage';
import { StatusBlock } from '../components/StatusBlock';
import { getRouteTitle, parseRoute, type AppRoute } from './routes';

type NavItem = {
  label: string;
  href: string;
  matches: (route: AppRoute) => boolean;
};

const navItems: NavItem[] = [
  {
    label: 'Правила',
    href: '#/',
    matches: (route) => ['rules-list', 'rule-details', 'rule-create', 'rule-edit'].includes(route.name)
  },
  {
    label: 'Контекст',
    href: '#/context',
    matches: (route) => route.name === 'context-builder'
  },
  {
    label: 'Экспорт',
    href: '#/export',
    matches: (route) => route.name === 'export'
  },
  {
    label: 'Новое',
    href: '#/rules/new',
    matches: (route) => route.name === 'rule-create'
  }
];

const renderRoute = (route: AppRoute) => {
  switch (route.name) {
    case 'rules-list':
      return <RulesListPage />;
    case 'rule-details':
      return <RuleDetailsPage ruleId={route.ruleId} />;
    case 'rule-create':
      return <RuleFormPage />;
    case 'rule-edit':
      return <RuleFormPage ruleId={route.ruleId} />;
    case 'context-builder':
      return <ContextBuilderPage />;
    case 'export':
      return <ExportPage />;
    case 'not-found':
      return (
        <StatusBlock
          title="Такой страницы нет"
          message="Похоже, ссылка устарела или в адресе есть ошибка."
          action={
            <a className={styles.button} href="#/">
              К списку правил
            </a>
          }
        />
      );
  }
};

export const App = () => {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute(window.location.hash));

  useEffect(() => {
    const syncRoute = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);

  const title = useMemo(() => getRouteTitle(route), [route]);

  return (
    <div className={styles.appShell}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <div className={styles.brandMark}>PR</div>
          <div>
            <h1 className={styles.brandTitle}>Prompt Rules Hub</h1>
            <p className={styles.brandText}>
              Живые правила для AI-ассистентов frontend-команды.
            </p>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Основная навигация">
          {navItems.map((item) => (
            <a
              key={item.href}
              className={`${styles.navLink} ${item.matches(route) ? styles.navLinkActive : ''}`}
              href={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      <main className={styles.main}>
        <header className={styles.pageHeader}>
          <div>
            <h2 className={styles.pageTitle}>{title}</h2>
            <p className={styles.pageSubtitle}>
              Собирайте командные правила, связывайте их наследованием и отдавайте ассистенту понятный контекст без ручной копипасты.
            </p>
          </div>
        </header>
        {renderRoute(route)}
      </main>
    </div>
  );
};
