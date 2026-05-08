import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import {
  type CreateRuleInput,
  type Rule,
  type UpdateRuleInput,
  ruleSchema
} from '../src/shared/ruleSchema.js';
import { ApiError } from './errors.js';
import { seedRules } from './seedRules.js';

const dataDirectory = path.resolve(process.cwd(), 'data');
const dataFilePath = path.join(dataDirectory, 'rules.json');
const rulesCollectionSchema = z.array(ruleSchema);

const normalizeList = (items: string[] | undefined): string[] => {
  if (!items) {
    return [];
  }

  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
};

const createRuleId = (title: string): string => {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return `${slug || 'rule'}-${randomUUID().slice(0, 8)}`;
};

const ensureDataFile = async () => {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(dataFilePath, 'utf8');
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code !== 'ENOENT') {
      throw error;
    }

    await writeFile(dataFilePath, `${JSON.stringify(seedRules, null, 2)}\n`, 'utf8');
  }
};

const validateRuleGraph = (rules: Rule[]) => {
  const rulesById = new Map(rules.map((rule) => [rule.id, rule]));
  const visitedRuleIds = new Set<string>();
  const activeRuleIds = new Set<string>();

  const visit = (rule: Rule) => {
    if (visitedRuleIds.has(rule.id)) {
      return;
    }

    if (activeRuleIds.has(rule.id)) {
      throw new ApiError(409, `Circular parent rule reference detected at "${rule.id}"`);
    }

    activeRuleIds.add(rule.id);
    for (const parentRuleId of rule.parentRuleIds) {
      if (parentRuleId === rule.id) {
        throw new ApiError(400, 'A rule cannot inherit from itself');
      }

      const parentRule = rulesById.get(parentRuleId);
      if (!parentRule) {
        throw new ApiError(400, `Parent rule "${parentRuleId}" does not exist`);
      }

      visit(parentRule);
    }
    activeRuleIds.delete(rule.id);
    visitedRuleIds.add(rule.id);
  };

  for (const rule of rules) {
    visit(rule);
  }
};

export const readRules = async (): Promise<Rule[]> => {
  await ensureDataFile();
  const rawData = await readFile(dataFilePath, 'utf8');
  const parsedJson: unknown = JSON.parse(rawData);
  const parsedRules = rulesCollectionSchema.safeParse(parsedJson);

  if (!parsedRules.success) {
    throw new ApiError(500, 'Local rules storage is invalid', parsedRules.error.flatten());
  }

  validateRuleGraph(parsedRules.data);
  return parsedRules.data;
};

export const writeRules = async (rules: Rule[]): Promise<void> => {
  validateRuleGraph(rules);
  await writeFile(dataFilePath, `${JSON.stringify(rules, null, 2)}\n`, 'utf8');
};

export const createRule = async (input: CreateRuleInput): Promise<Rule> => {
  const rules = await readRules();
  const newRule: Rule = {
    ...input,
    id: createRuleId(input.title),
    parentRuleIds: normalizeList(input.parentRuleIds),
    tags: normalizeList(input.tags),
    updatedAt: new Date().toISOString()
  };

  const nextRules = [...rules, newRule];
  await writeRules(nextRules);
  return newRule;
};

export const updateRule = async (ruleId: string, input: UpdateRuleInput): Promise<Rule> => {
  const rules = await readRules();
  const existingRule = rules.find((rule) => rule.id === ruleId);

  if (!existingRule) {
    throw new ApiError(404, 'Rule not found');
  }

  const updatedRule: Rule = {
    ...existingRule,
    ...input,
    parentRuleIds:
      input.parentRuleIds === undefined
        ? existingRule.parentRuleIds
        : normalizeList(input.parentRuleIds),
    tags: input.tags === undefined ? existingRule.tags : normalizeList(input.tags),
    updatedAt: new Date().toISOString()
  };

  const nextRules = rules.map((rule) => (rule.id === ruleId ? updatedRule : rule));
  await writeRules(nextRules);
  return updatedRule;
};

export const deleteRule = async (ruleId: string): Promise<void> => {
  const rules = await readRules();
  const existingRule = rules.find((rule) => rule.id === ruleId);

  if (!existingRule) {
    throw new ApiError(404, 'Rule not found');
  }

  const nextRules = rules
    .filter((rule) => rule.id !== ruleId)
    .map((rule) => ({
      ...rule,
      parentRuleIds: rule.parentRuleIds.filter((parentRuleId) => parentRuleId !== ruleId)
    }));

  await writeRules(nextRules);
};
