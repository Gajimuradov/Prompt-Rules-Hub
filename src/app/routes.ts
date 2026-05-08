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
      return 'Rules list';
    case 'rule-details':
      return 'Rule details';
    case 'rule-create':
      return 'Create rule';
    case 'rule-edit':
      return 'Edit rule';
    case 'context-builder':
      return 'Context builder';
    case 'export':
      return 'Export';
    case 'not-found':
      return 'Not found';
  }
};
