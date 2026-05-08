import { z } from 'zod';

export const ruleCategoryValues = [
  'frontend',
  'testing',
  'review',
  'design-system',
  'security'
] as const;

export const ruleCategorySchema = z.enum(ruleCategoryValues);

export const categoryLabels: Record<RuleCategory, string> = {
  frontend: 'Frontend',
  testing: 'Testing',
  review: 'Code review',
  'design-system': 'Design system',
  security: 'Security'
};

export const ruleSchema = z.object({
  id: z.string().min(1, 'Rule id is required'),
  title: z.string().min(3, 'Title should contain at least 3 characters'),
  category: ruleCategorySchema,
  version: z.string().min(1, 'Version is required'),
  description: z.string().min(10, 'Description should contain at least 10 characters'),
  content: z.string().min(20, 'Content should contain at least 20 characters'),
  parentRuleIds: z.array(z.string().min(1)).default([]),
  tags: z.array(z.string().min(1)).default([]),
  updatedAt: z.string().datetime('updatedAt should be an ISO datetime')
});

export const createRuleSchema = ruleSchema
  .omit({ id: true, updatedAt: true })
  .extend({
    parentRuleIds: z.array(z.string().min(1)).default([]),
    tags: z.array(z.string().min(1)).default([])
  });

export const updateRuleSchema = createRuleSchema.partial();

export const composeContextRequestSchema = z.object({
  ruleIds: z.array(z.string().min(1)).min(1, 'Select at least one rule'),
  includeMetadata: z.boolean().default(true)
});

export const composedContextSchema = z.object({
  selectedRuleIds: z.array(z.string()),
  includedRules: z.array(ruleSchema),
  markdown: z.string(),
  json: z.object({
    generatedAt: z.string().datetime(),
    selectedRuleIds: z.array(z.string()),
    includedRules: z.array(ruleSchema)
  })
});

export type RuleCategory = z.infer<typeof ruleCategorySchema>;
export type Rule = z.infer<typeof ruleSchema>;
export type CreateRuleInput = z.infer<typeof createRuleSchema>;
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>;
export type ComposeContextRequest = z.infer<typeof composeContextRequestSchema>;
export type ComposedContext = z.infer<typeof composedContextSchema>;
