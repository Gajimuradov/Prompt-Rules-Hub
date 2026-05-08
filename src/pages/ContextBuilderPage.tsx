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
      // The store exposes the API error in-page.
    }
  };

  if (isRulesLoading && rules.length === 0) {
    return <StatusBlock title="Loading rules" message="Preparing context builder." />;
  }

  if (rules.length === 0 && !isRulesLoading) {
    return (
      <StatusBlock
        title="No rules available"
        message="Create at least one rule before composing an AI context."
        action={
          <a className={styles.button} href="#/rules/new">
            Create rule
          </a>
        }
      />
    );
  }

  return (
    <section className={styles.builderLayout}>
      <aside className={`${styles.panel} ${styles.selectionPanel}`}>
        <div>
          <h2 className={styles.panelTitle}>Select rules</h2>
          <p className={styles.helpText}>
            Parent rules are resolved by the backend and included before selected child rules.
          </p>
        </div>

        <label className={styles.checkboxCard}>
          <input
            type="checkbox"
            checked={includeMetadata}
            onChange={(event) => setIncludeMetadata(event.target.checked)}
          />
          <span>
            <span className={styles.checkboxTitle}>Include metadata</span>
            <span className={styles.checkboxMeta}>IDs, categories, versions, tags, and parents</span>
          </span>
        </label>

        <div className={styles.checkboxGrid}>
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
                  {categoryLabels[rule.category]} - {rule.parentRuleIds.length} parents
                </span>
              </span>
            </label>
          ))}
        </div>

        <div className={styles.buttonRow}>
          <button
            className={styles.button}
            type="button"
            disabled={contextSelection.length === 0 || isComposing}
            onClick={handleCompose}
          >
            {isComposing ? 'Composing' : 'Compose context'}
          </button>
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={contextSelection.length === 0}
            onClick={() => setContextSelection([])}
          >
            Clear
          </button>
        </div>
      </aside>

      <main className={styles.previewPanel}>
        {error && <StatusBlock title="Could not compose context" message={error} tone="error" />}

        <section className={styles.statGrid}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{rules.length}</span>
            <span className={styles.statLabel}>Rules in hub</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{selectedRules.length}</span>
            <span className={styles.statLabel}>Selected</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{composedContext?.includedRules.length ?? 0}</span>
            <span className={styles.statLabel}>Included with parents</span>
          </div>
        </section>

        {selectedRules.length > 0 && (
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Current selection</h2>
            <div className={styles.pillRow}>
              {selectedRules.map((rule) => (
                <span key={rule.id} className={styles.tagPill}>
                  {rule.title}
                </span>
              ))}
            </div>
          </section>
        )}

        {composedContext ? (
          <section className={styles.panel}>
            <div className={styles.pageHeader}>
              <div>
                <h2 className={styles.panelTitle}>Markdown preview</h2>
                <p className={styles.helpText}>
                  The backend ordered parent rules before child rules.
                </p>
              </div>
              <a className={styles.secondaryButton} href="#/export">
                Open export
              </a>
            </div>
            <div className={styles.pillRow}>
              {composedContext.includedRules.map((rule) => (
                <span key={rule.id} className={styles.tagPill}>
                  <CategoryPill category={rule.category} /> {rule.title}
                </span>
              ))}
            </div>
            <pre className={styles.markdownPreview}>{composedContext.markdown}</pre>
          </section>
        ) : (
          <StatusBlock
            title="Preview is empty"
            message="Select one or more rules and compose context to see the final Markdown."
          />
        )}
      </main>
    </section>
  );
};
