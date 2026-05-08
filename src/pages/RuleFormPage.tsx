import { type FormEvent, useEffect, useMemo, useState } from 'react';
import styles from '../app/App.module.css';
import { navigateTo } from '../app/routes';
import { StatusBlock } from '../components/StatusBlock';
import { useRulesStore } from '../store/rulesStore';
import {
  categoryLabels,
  createRuleSchema,
  ruleCategoryValues,
  type CreateRuleInput,
  type RuleCategory
} from '../shared/ruleSchema';

type RuleFormPageProps = {
  ruleId?: string;
};

type RuleFormState = {
  title: string;
  category: RuleCategory;
  version: string;
  description: string;
  content: string;
  parentRuleIds: string[];
  tagsInput: string;
};

const emptyFormState: RuleFormState = {
  title: '',
  category: 'frontend',
  version: '1.0.0',
  description: '',
  content: '',
  parentRuleIds: [],
  tagsInput: ''
};

const formatValidationError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Validation failed';
};

const splitTags = (value: string): string[] =>
  Array.from(
    new Set(
      value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  );

export const RuleFormPage = ({ ruleId }: RuleFormPageProps) => {
  const isEditMode = ruleId !== undefined;
  const {
    rules,
    isRuleLoading,
    isSaving,
    error,
    fetchRules,
    fetchRule,
    createRule,
    updateRule
  } = useRulesStore();
  const [formState, setFormState] = useState<RuleFormState>(emptyFormState);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    void fetchRules();
  }, [fetchRules]);

  useEffect(() => {
    if (!ruleId) {
      setFormState(emptyFormState);
      return;
    }

    void fetchRule(ruleId)
      .then((rule) => {
        setFormState({
          title: rule.title,
          category: rule.category,
          version: rule.version,
          description: rule.description,
          content: rule.content,
          parentRuleIds: rule.parentRuleIds,
          tagsInput: rule.tags.join(', ')
        });
      })
      .catch((loadError: unknown) => {
        setFormError(formatValidationError(loadError));
      });
  }, [fetchRule, ruleId]);

  const parentCandidates = useMemo(
    () => rules.filter((rule) => rule.id !== ruleId),
    [ruleId, rules]
  );

  const updateField = <TKey extends keyof RuleFormState>(
    field: TKey,
    value: RuleFormState[TKey]
  ) => {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value
    }));
  };

  const toggleParent = (parentRuleId: string) => {
    setFormState((currentState) => {
      const isSelected = currentState.parentRuleIds.includes(parentRuleId);
      return {
        ...currentState,
        parentRuleIds: isSelected
          ? currentState.parentRuleIds.filter((selectedId) => selectedId !== parentRuleId)
          : [...currentState.parentRuleIds, parentRuleId]
      };
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const payload: CreateRuleInput = {
      title: formState.title.trim(),
      category: formState.category,
      version: formState.version.trim(),
      description: formState.description.trim(),
      content: formState.content.trim(),
      parentRuleIds: formState.parentRuleIds,
      tags: splitTags(formState.tagsInput)
    };

    const validationResult = createRuleSchema.safeParse(payload);
    if (!validationResult.success) {
      setFormError(
        validationResult.error.issues
          .map((issue) => `${issue.path.join('.') || 'form'}: ${issue.message}`)
          .join('\n')
      );
      return;
    }

    try {
      const savedRule =
        isEditMode && ruleId
          ? await updateRule(ruleId, validationResult.data)
          : await createRule(validationResult.data);
      navigateTo(`/rules/${encodeURIComponent(savedRule.id)}`);
    } catch (submitError) {
      setFormError(formatValidationError(submitError));
    }
  };

  if (isEditMode && isRuleLoading) {
    return <StatusBlock title="Loading rule" message="Preparing the edit form." />;
  }

  if (isEditMode && error && !isRuleLoading) {
    return <StatusBlock title="Could not load rule" message={error} tone="error" />;
  }

  return (
    <form className={`${styles.panel} ${styles.form}`} onSubmit={handleSubmit}>
      {(formError || error) && (
        <StatusBlock
          title="Could not save rule"
          message={formError ?? error ?? 'Unknown form error'}
          tone="error"
        />
      )}

      <section className={styles.formGrid}>
        <label className={styles.field}>
          <span className={styles.label}>Title</span>
          <input
            className={styles.input}
            value={formState.title}
            onChange={(event) => updateField('title', event.target.value)}
            placeholder="Component API rules"
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Category</span>
          <select
            className={styles.select}
            value={formState.category}
            onChange={(event) => updateField('category', event.target.value as RuleCategory)}
          >
            {ruleCategoryValues.map((category) => (
              <option key={category} value={category}>
                {categoryLabels[category]}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Version</span>
          <input
            className={styles.input}
            value={formState.version}
            onChange={(event) => updateField('version', event.target.value)}
            placeholder="1.0.0"
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Tags</span>
          <input
            className={styles.input}
            value={formState.tagsInput}
            onChange={(event) => updateField('tagsInput', event.target.value)}
            placeholder="react, review, testing"
          />
        </label>

        <label className={`${styles.field} ${styles.fieldWide}`}>
          <span className={styles.label}>Description</span>
          <textarea
            className={styles.textarea}
            value={formState.description}
            onChange={(event) => updateField('description', event.target.value)}
            placeholder="Explain when the team should use this rule."
            required
          />
        </label>

        <label className={`${styles.field} ${styles.fieldWide}`}>
          <span className={styles.label}>Content</span>
          <textarea
            className={styles.textarea}
            value={formState.content}
            onChange={(event) => updateField('content', event.target.value)}
            placeholder="Write Markdown instructions for the AI assistant."
            required
          />
        </label>
      </section>

      <section className={styles.field}>
        <span className={styles.label}>Parent rules</span>
        <p className={styles.helpText}>
          Parent rules are automatically included before this rule when context is composed.
        </p>

        {parentCandidates.length === 0 ? (
          <StatusBlock
            title="No parent candidates"
            message="Create more rules to enable inheritance."
          />
        ) : (
          <div className={styles.checkboxGrid}>
            {parentCandidates.map((rule) => (
              <label key={rule.id} className={styles.checkboxCard}>
                <input
                  type="checkbox"
                  checked={formState.parentRuleIds.includes(rule.id)}
                  onChange={() => toggleParent(rule.id)}
                />
                <span>
                  <span className={styles.checkboxTitle}>{rule.title}</span>
                  <span className={styles.checkboxMeta}>
                    {categoryLabels[rule.category]} - v{rule.version}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      <div className={styles.buttonRow}>
        <button className={styles.button} type="submit" disabled={isSaving}>
          {isSaving ? 'Saving' : isEditMode ? 'Save changes' : 'Create rule'}
        </button>
        <a
          className={styles.secondaryButton}
          href={isEditMode && ruleId ? `#/rules/${encodeURIComponent(ruleId)}` : '#/'}
        >
          Cancel
        </a>
      </div>
    </form>
  );
};
