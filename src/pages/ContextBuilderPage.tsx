import { useEffect, useMemo, useState } from 'react';
import styles from '../app/App.module.css';
import { CategoryPill } from '../components/CategoryPill';
import { StatusBlock } from '../components/StatusBlock';
import { useRulesStore } from '../store/rulesStore';
import { categoryLabels } from '../shared/ruleSchema';

export const ContextBuilderPage = () => {
  const {
    rules,
    contextSelection,
    composedContext,
    isRulesLoading,
    isComposing,
    error,
    fetchRules,
    setContextSelection,
    composeContext
  } = useRulesStore();
  const [includeMetadata, setIncludeMetadata] = useState(true);

  useEffect(() => {
    void fetchRules();
  }, [fetchRules]);

  const selectedRules = useMemo(
    () => rules.filter((rule) => contextSelection.includes(rule.id)),
    [contextSelection, rules]
  );

  const toggleRule = (ruleId: string) => {
    setContextSelection(
      contextSelection.includes(ruleId)
        ? contextSelection.filter((selectedRuleId) => selectedRuleId !== ruleId)
        : [...contextSelection, ruleId]
    );
  };

  const handleCompose = async () => {
    try {
      await composeContext({
        ruleIds: contextSelection,
        includeMetadata
      });
    } catch {
      // Ошибка уже выводится рядом с preview.
    }
  };

  if (isRulesLoading && rules.length === 0) {
    return <StatusBlock title="Загружаем правила" message="Готовим сборщик контекста." />;
  }

  if (rules.length === 0 && !isRulesLoading) {
    return (
      <StatusBlock
        title="Пока нет правил"
        message="Сначала создайте хотя бы одно правило, а потом соберите контекст для ассистента."
        action={
          <a className={styles.button} href="#/rules/new">
            Создать правило
          </a>
        }
      />
    );
  }

  return (
    <section className={styles.builderLayout}>
      <aside className={`${styles.panel} ${styles.selectionPanel}`}>
        <div>
          <h2 className={styles.panelTitle}>Выберите правила</h2>
          <p className={styles.helpText}>
            Сервер сам найдет родительские правила и поставит их перед выбранными дочерними.
          </p>
        </div>

        <section className={`${styles.statGrid} ${styles.contextStatGrid}`}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{rules.length}</span>
            <span className={styles.statLabel}>Правил в хабе</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{selectedRules.length}</span>
            <span className={styles.statLabel}>Выбранные правила</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{composedContext?.includedRules.length ?? 0}</span>
            <span className={styles.statLabel}>Правила с учетом родителей</span>
          </div>
        </section>

        <label className={styles.checkboxCard}>
          <input
            type="checkbox"
            checked={includeMetadata}
            onChange={(event) => setIncludeMetadata(event.target.checked)}
          />
          <span>
            <span className={styles.checkboxTitle}>Добавить служебные детали</span>
            <span className={styles.checkboxMeta}>ID, категории, версии, теги и родительские связи</span>
          </span>
        </label>

        <div className={`${styles.checkboxGrid} ${styles.rulesPickerScroll}`}>
          {rules.map((rule) => (
            <label key={rule.id} className={styles.checkboxCard}>
              <input
                type="checkbox"
                checked={contextSelection.includes(rule.id)}
                onChange={() => toggleRule(rule.id)}
              />
              <span>
                <span className={styles.checkboxTitle}>{rule.title}</span>
                <span className={styles.checkboxMeta}>
                  {categoryLabels[rule.category]} - родителей: {rule.parentRuleIds.length}
                </span>
              </span>
            </label>
          ))}
        </div>

        <div className={`${styles.buttonRow} ${styles.selectionActions}`}>
          <button
            className={styles.button}
            type="button"
            disabled={contextSelection.length === 0 || isComposing}
            onClick={handleCompose}
          >
            {isComposing ? 'Собираем' : 'Собрать контекст'}
          </button>
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={contextSelection.length === 0}
            onClick={() => setContextSelection([])}
          >
            Очистить
          </button>
        </div>
      </aside>

      <main className={styles.previewPanel}>
        {error && <StatusBlock title="Контекст не собрался" message={error} tone="error" />}

        {composedContext ? (
          <section className={`${styles.panel} ${styles.promptPanel}`}>
            <div className={`${styles.pageHeader} ${styles.promptPanelHeader}`}>
              <div>
                <h2 className={styles.panelTitle}>Предпросмотр Markdown</h2>
                <p className={styles.helpText}>
                  Родительские правила уже стоят перед дочерними.
                </p>
              </div>
              <a className={styles.secondaryButton} href="#/export">
                Перейти к экспорту
              </a>
            </div>
            {selectedRules.length > 0 && (
              <div className={`${styles.pillRow} ${styles.selectedRulesCompact}`}>
                {selectedRules.map((rule) => (
                  <span key={rule.id} className={styles.tagPill}>
                    {rule.title}
                  </span>
                ))}
              </div>
            )}
            <div className={`${styles.pillRow} ${styles.promptRulesRow}`}>
              {composedContext.includedRules.map((rule) => (
                <span key={rule.id} className={styles.includedRulePill}>
                  <CategoryPill category={rule.category} />
                  <span>{rule.title}</span>
                </span>
              ))}
            </div>
            <pre className={`${styles.markdownPreview} ${styles.promptPreview}`}>
              {composedContext.markdown}
            </pre>
          </section>
        ) : (
          <StatusBlock
            title="Предпросмотр пока пустой"
            message="Выберите одно или несколько правил и соберите контекст, чтобы увидеть готовый Markdown."
          />
        )}
      </main>
    </section>
  );
};
