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

  return 'Проверьте поля формы';
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
          .map((issue) => `${issue.path.join('.') || 'форма'}: ${issue.message}`)
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
    return <StatusBlock title="Загружаем правило" message="Готовим форму редактирования." />;
  }

  if (isEditMode && error && !isRuleLoading) {
    return <StatusBlock title="Не удалось загрузить правило" message={error} tone="error" />;
  }

  return (
    <form className={`${styles.panel} ${styles.form}`} onSubmit={handleSubmit}>
      {(formError || error) && (
        <StatusBlock
          title="Не получилось сохранить правило"
          message={formError ?? error ?? 'Проверьте данные и попробуйте еще раз.'}
          tone="error"
        />
      )}

      <section className={styles.formGrid}>
        <label className={styles.field}>
          <span className={styles.label}>Название</span>
          <input
            className={styles.input}
            value={formState.title}
            onChange={(event) => updateField('title', event.target.value)}
            placeholder="Правила API компонентов"
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Категория</span>
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
          <span className={styles.label}>Версия</span>
          <input
            className={styles.input}
            value={formState.version}
            onChange={(event) => updateField('version', event.target.value)}
            placeholder="1.0.0"
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Теги</span>
          <input
            className={styles.input}
            value={formState.tagsInput}
            onChange={(event) => updateField('tagsInput', event.target.value)}
            placeholder="react, ревью, тесты"
          />
        </label>

        <label className={`${styles.field} ${styles.fieldWide}`}>
          <span className={styles.label}>Короткое описание</span>
          <textarea
            className={styles.textarea}
            value={formState.description}
            onChange={(event) => updateField('description', event.target.value)}
            placeholder="Коротко объясните, когда команде нужно это правило."
            required
          />
        </label>

        <label className={`${styles.field} ${styles.fieldWide}`}>
          <span className={styles.label}>Текст правила</span>
          <textarea
            className={styles.textarea}
            value={formState.content}
            onChange={(event) => updateField('content', event.target.value)}
            placeholder="Напишите Markdown-инструкции для AI-ассистента."
            required
          />
        </label>
      </section>

      <section className={styles.field}>
        <span className={styles.label}>Родительские правила</span>
        <p className={styles.helpText}>
          Они автоматически попадут в итоговый контекст перед этим правилом.
        </p>

        {parentCandidates.length === 0 ? (
          <StatusBlock
            title="Пока не из чего наследоваться"
            message="Создайте еще одно правило, чтобы выстроить наследование."
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
          {isSaving ? 'Сохраняем' : isEditMode ? 'Сохранить изменения' : 'Создать правило'}
        </button>
        <a
          className={styles.secondaryButton}
          href={isEditMode && ruleId ? `#/rules/${encodeURIComponent(ruleId)}` : '#/'}
        >
          Отмена
        </a>
      </div>
    </form>
  );
};
