import { create } from 'zustand';
import { rulesApi } from '../api/rulesApi';
import type {
  ComposeContextRequest,
  ComposedContext,
  CreateRuleInput,
  Rule,
  UpdateRuleInput
} from '../shared/ruleSchema';

type RulesState = {
  rules: Rule[];
  activeRule: Rule | null;
  composedContext: ComposedContext | null;
  contextSelection: string[];
  isRulesLoading: boolean;
  isRuleLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  isComposing: boolean;
  error: string | null;
  fetchRules: () => Promise<void>;
  fetchRule: (ruleId: string) => Promise<Rule>;
  createRule: (input: CreateRuleInput) => Promise<Rule>;
  updateRule: (ruleId: string, input: UpdateRuleInput) => Promise<Rule>;
  deleteRule: (ruleId: string) => Promise<void>;
  composeContext: (input: ComposeContextRequest) => Promise<ComposedContext>;
  setContextSelection: (ruleIds: string[]) => void;
  clearError: () => void;
};

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Что-то пошло не так';

export const useRulesStore = create<RulesState>((set) => ({
  rules: [],
  activeRule: null,
  composedContext: null,
  contextSelection: [],
  isRulesLoading: false,
  isRuleLoading: false,
  isSaving: false,
  isDeleting: false,
  isComposing: false,
  error: null,

  fetchRules: async () => {
    set({ isRulesLoading: true, error: null });

    try {
      const rules = await rulesApi.getRules();
      set({ rules, isRulesLoading: false });
    } catch (error) {
      set({ error: toErrorMessage(error), isRulesLoading: false });
    }
  },

  fetchRule: async (ruleId: string) => {
    set({ isRuleLoading: true, error: null });

    try {
      const rule = await rulesApi.getRule(ruleId);
      set({ activeRule: rule, isRuleLoading: false });
      return rule;
    } catch (error) {
      const message = toErrorMessage(error);
      set({ error: message, isRuleLoading: false });
      throw new Error(message);
    }
  },

  createRule: async (input: CreateRuleInput) => {
    set({ isSaving: true, error: null });

    try {
      const rule = await rulesApi.createRule(input);
      set((state) => ({
        rules: [rule, ...state.rules],
        activeRule: rule,
        isSaving: false
      }));
      return rule;
    } catch (error) {
      const message = toErrorMessage(error);
      set({ error: message, isSaving: false });
      throw new Error(message);
    }
  },

  updateRule: async (ruleId: string, input: UpdateRuleInput) => {
    set({ isSaving: true, error: null });

    try {
      const updatedRule = await rulesApi.updateRule(ruleId, input);
      set((state) => ({
        rules: state.rules.map((rule) => (rule.id === ruleId ? updatedRule : rule)),
        activeRule: updatedRule,
        isSaving: false
      }));
      return updatedRule;
    } catch (error) {
      const message = toErrorMessage(error);
      set({ error: message, isSaving: false });
      throw new Error(message);
    }
  },

  deleteRule: async (ruleId: string) => {
    set({ isDeleting: true, error: null });

    try {
      await rulesApi.deleteRule(ruleId);
      set((state) => ({
        rules: state.rules
          .filter((rule) => rule.id !== ruleId)
          .map((rule) => ({
            ...rule,
            parentRuleIds: rule.parentRuleIds.filter((parentRuleId) => parentRuleId !== ruleId)
          })),
        activeRule: state.activeRule?.id === ruleId ? null : state.activeRule,
        contextSelection: state.contextSelection.filter((selectedRuleId) => selectedRuleId !== ruleId),
        isDeleting: false
      }));
    } catch (error) {
      const message = toErrorMessage(error);
      set({ error: message, isDeleting: false });
      throw new Error(message);
    }
  },

  composeContext: async (input: ComposeContextRequest) => {
    set({ isComposing: true, error: null, contextSelection: input.ruleIds });

    try {
      const composedContext = await rulesApi.composeContext(input);
      set({ composedContext, isComposing: false });
      return composedContext;
    } catch (error) {
      const message = toErrorMessage(error);
      set({ error: message, isComposing: false });
      throw new Error(message);
    }
  },

  setContextSelection: (ruleIds: string[]) => {
    set({ contextSelection: ruleIds });
  },

  clearError: () => {
    set({ error: null });
  }
}));
