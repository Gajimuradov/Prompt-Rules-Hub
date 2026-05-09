export type AppRoute =
  | { name: 'rules-list' }
  | { name: 'rule-details'; ruleId: string }
  | { name: 'rule-create' }
  | { name: 'rule-edit'; ruleId: string }
  | { name: 'context-builder' }
  | { name: 'export' }
  | { name: 'not-found' };

const getPathFromHash = (hash: string): string => {
  const normalizedPath = hash.replace(/^#/, '');
  return normalizedPath.length > 0 ? normalizedPath : '/';
};

export const parseRoute = (hash: string): AppRoute => {
  const path = getPathFromHash(hash);

  if (path === '/') {
    return { name: 'rules-list' };
  }

  if (path === '/rules/new') {
    return { name: 'rule-create' };
  }

  if (path === '/context') {
    return { name: 'context-builder' };
  }

  if (path === '/export') {
    return { name: 'export' };
  }

  const editMatch = path.match(/^\/rules\/([^/]+)\/edit$/);
  if (editMatch) {
    return { name: 'rule-edit', ruleId: decodeURIComponent(editMatch[1]) };
  }

  const detailsMatch = path.match(/^\/rules\/([^/]+)$/);
  if (detailsMatch) {
    return { name: 'rule-details', ruleId: decodeURIComponent(detailsMatch[1]) };
  }

  return { name: 'not-found' };
};

export const navigateTo = (path: string) => {
  window.location.hash = path;
};

export const getRouteTitle = (route: AppRoute): string => {
  switch (route.name) {
    case 'rules-list':
      return 'Библиотека правил';
    case 'rule-details':
      return 'Карточка правила';
    case 'rule-create':
      return 'Новое правило';
    case 'rule-edit':
      return 'Редактирование правила';
    case 'context-builder':
      return 'Сборка контекста';
    case 'export':
      return 'Экспорт';
    case 'not-found':
      return 'Страница не найдена';
  }
};

export const getRouteSubtitle = (route: AppRoute): string => {
  switch (route.name) {
    case 'rules-list':
      return 'Единая база инструкций для AI-ассистентов: кодстайл, review, тесты, дизайн-система и безопасность.';
    case 'rule-details':
      return 'Проверьте содержание, версию, теги и родительские связи перед добавлением правила в контекст.';
    case 'rule-create':
      return 'Опишите правило так, чтобы другой разработчик понял, когда и зачем его подключать.';
    case 'rule-edit':
      return 'Обновите формулировки, связи и теги без потери структуры правила.';
    case 'context-builder':
      return 'Выберите нужные правила, а хаб сам добавит родителей и соберет готовый Markdown для ассистента.';
    case 'export':
      return 'Скопируйте или скачайте финальный контекст в формате, удобном для AI-инструмента или автоматизации.';
    case 'not-found':
      return 'Такого раздела нет. Вернитесь к библиотеке правил и продолжите работу оттуда.';
  }
};
