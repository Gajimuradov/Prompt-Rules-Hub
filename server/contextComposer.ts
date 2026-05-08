import type { ComposedContext, Rule } from '../src/shared/ruleSchema.js';
import { ApiError } from './errors.js';

type ComposeOptions = {
  includeMetadata: boolean;
};

const formatRuleMetadata = (rule: Rule): string[] => [
  `- ID: ${rule.id}`,
  `- Category: ${rule.category}`,
  `- Version: ${rule.version}`,
  `- Tags: ${rule.tags.length > 0 ? rule.tags.join(', ') : 'none'}`,
  `- Parent rules: ${rule.parentRuleIds.length > 0 ? rule.parentRuleIds.join(', ') : 'none'}`
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
      throw new ApiError(409, `Circular parent rule reference detected at "${ruleId}"`);
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
    '# AI Assistant Context',
    '',
    `Generated at: ${generatedAt}`,
    `Selected rule IDs: ${selectedRuleIds.join(', ')}`,
    `Included rules: ${orderedRules.length}`,
    '',
    'Use these rules as the authoritative project context. Parent rules are included before child rules.'
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
