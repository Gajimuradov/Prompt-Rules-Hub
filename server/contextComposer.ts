import { categoryLabels, type ComposedContext, type Rule } from '../src/shared/ruleSchema.js';
import { ApiError } from './errors.js';

type ComposeOptions = {
  includeMetadata: boolean;
};

const formatRuleMetadata = (rule: Rule): string[] => [
  `- ID: ${rule.id}`,
  `- Категория: ${categoryLabels[rule.category]}`,
  `- Версия: ${rule.version}`,
  `- Теги: ${rule.tags.length > 0 ? rule.tags.join(', ') : 'нет тегов'}`,
  `- Родительские правила: ${rule.parentRuleIds.length > 0 ? rule.parentRuleIds.join(', ') : 'нет'}`
];

export const composeContext = (
  rules: Rule[],
  selectedRuleIds: string[],
  options: ComposeOptions
): ComposedContext => {
  const rulesById = new Map(rules.map((rule) => [rule.id, rule]));
  const visitedRuleIds = new Set<string>();
  const activeRuleIds = new Set<string>();
  const orderedRules: Rule[] = [];
  const missingRuleIds = new Set<string>();

  const visit = (ruleId: string) => {
    if (visitedRuleIds.has(ruleId)) {
      return;
    }

    if (activeRuleIds.has(ruleId)) {
      throw new ApiError(409, `В наследовании правил найден цикл у "${ruleId}"`);
    }

    const rule = rulesById.get(ruleId);
    if (!rule) {
      missingRuleIds.add(ruleId);
      return;
    }

    activeRuleIds.add(ruleId);
    for (const parentRuleId of rule.parentRuleIds) {
      visit(parentRuleId);
    }
    activeRuleIds.delete(ruleId);

    visitedRuleIds.add(ruleId);
    orderedRules.push(rule);
  };

  for (const ruleId of selectedRuleIds) {
    visit(ruleId);
  }

  if (missingRuleIds.size > 0) {
    throw new ApiError(404, 'Some selected or parent rules were not found', {
      missingRuleIds: Array.from(missingRuleIds)
    });
  }

  const generatedAt = new Date().toISOString();
  const markdownParts = [
    '# Контекст для AI-ассистента',
    '',
    `Собрано: ${generatedAt}`,
    `Выбранные правила: ${selectedRuleIds.join(', ')}`,
    `Всего правил в контексте: ${orderedRules.length}`,
    '',
    'Используй эти правила как основной контекст проекта. Родительские правила уже добавлены перед дочерними.'
  ];

  orderedRules.forEach((rule, index) => {
    markdownParts.push('', `## ${index + 1}. ${rule.title}`, '');

    if (options.includeMetadata) {
      markdownParts.push(...formatRuleMetadata(rule), '');
    }

    markdownParts.push(rule.content.trim(), '');
  });

  return {
    selectedRuleIds,
    includedRules: orderedRules,
    markdown: markdownParts.join('\n').trimEnd(),
    json: {
      generatedAt,
      selectedRuleIds,
      includedRules: orderedRules
    }
  };
};
