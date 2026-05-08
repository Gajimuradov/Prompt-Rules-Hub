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
  frontend: 'Фронтенд',
  testing: 'Тестирование',
  review: 'Ревью кода',
  'design-system': 'Дизайн-система',
  security: 'Безопасность'
};

export const ruleSchema = z.object({
  id: z.string().min(1, 'Нужен идентификатор правила'),
  title: z.string().min(3, 'Название должно быть не короче 3 символов'),
  category: ruleCategorySchema,
  version: z.string().min(1, 'Укажите версию правила'),
  description: z.string().min(10, 'Описание должно быть не короче 10 символов'),
  content: z.string().min(20, 'Контент должен быть не короче 20 символов'),
  parentRuleIds: z.array(z.string().min(1)).default([]),
  tags: z.array(z.string().min(1)).default([]),
  updatedAt: z.string().datetime('updatedAt должен быть ISO-датой')
});

export const createRuleSchema = ruleSchema
  .omit({ id: true, updatedAt: true })
  .extend({
    parentRuleIds: z.array(z.string().min(1)).default([]),
    tags: z.array(z.string().min(1)).default([])
  });

export const updateRuleSchema = createRuleSchema.partial();

export const composeContextRequestSchema = z.object({
  ruleIds: z.array(z.string().min(1)).min(1, 'Выберите хотя бы одно правило'),
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
