import { useEffect } from 'react';
import styles from '../app/App.module.css';
import { navigateTo } from '../app/routes';
import { CategoryPill } from '../components/CategoryPill';
import { StatusBlock } from '../components/StatusBlock';
import { useRulesStore } from '../store/rulesStore';

type RuleDetailsPageProps = {
  ruleId: string;
};

export const RuleDetailsPage = ({ ruleId }: RuleDetailsPageProps) => {
  const {
    activeRule,
    rules,
    isRuleLoading,
    isDeleting,
    error,
    fetchRule,
    fetchRules,
    deleteRule
  } = useRulesStore();

  useEffect(() => {
    void fetchRule(ruleId);
    if (rules.length === 0) {
      void fetchRules();
    }
  }, [fetchRule, fetchRules, ruleId, rules.length]);

  const rule = activeRule?.id === ruleId ? activeRule : null;

  const handleDelete = async () => {
    if (!window.confirm('Delete this rule? Child rules will lose this parent reference.')) {
      return;
    }

    try {
      await deleteRule(ruleId);
      navigateTo('/');
    } catch {
      // The store exposes the API error in-page.
    }
  };

  if (isRuleLoading && !rule) {
    return <StatusBlock title="Loading rule" message="Fetching rule details from the API." />;
  }

  if (error && !rule) {
    return <StatusBlock title="Could not load rule" message={error} tone="error" />;
  }

  if (!rule) {
    return (
      <StatusBlock
        title="Rule not found"
        message="The selected rule does not exist in local storage."
        action={
          <a className={styles.secondaryButton} href="#/">
            Back to rules
          </a>
        }
      />
    );
  }

  const parentRules = rule.parentRuleIds
    .map((parentRuleId) => rules.find((candidateRule) => candidateRule.id === parentRuleId))
    .filter((candidateRule) => candidateRule !== undefined);

  return (
    <section className={styles.detailsLayout}>
      <article className={styles.panel}>
        <div className={styles.pageHeader}>
          <div>
            <div className={styles.pillRow}>
              <CategoryPill category={rule.category} />
              <span className={styles.tagPill}>v{rule.version}</span>
            </div>
            <h2 className={styles.pageTitle}>{rule.title}</h2>
            <p className={styles.pageSubtitle}>{rule.description}</p>
          </div>
          <div className={styles.buttonRow}>
            <a className={styles.secondaryButton} href={`#/rules/${encodeURIComponent(rule.id)}/edit`}>
              Edit
            </a>
            <button
              className={styles.dangerButton}
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? 'Deleting' : 'Delete'}
            </button>
          </div>
        </div>
        <pre className={styles.markdownPreview}>{rule.content}</pre>
      </article>

      <aside className={styles.panel}>
        <h3 className={styles.panelTitle}>Metadata</h3>
        <dl className={styles.metaList}>
          <div>
            <dt>ID</dt>
            <dd>{rule.id}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{new Date(rule.updatedAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt>Tags</dt>
            <dd>
              <span className={styles.pillRow}>
                {rule.tags.length > 0
                  ? rule.tags.map((tag) => (
                      <span key={tag} className={styles.tagPill}>
                        {tag}
                      </span>
                    ))
                  : 'No tags'}
              </span>
            </dd>
          </div>
          <div>
            <dt>Parent rules</dt>
            <dd>
              {parentRules.length > 0 ? (
                <span className={styles.pillRow}>
                  {parentRules.map((parentRule) => (
                    <a
                      key={parentRule.id}
                      className={styles.secondaryButton}
                      href={`#/rules/${encodeURIComponent(parentRule.id)}`}
                    >
                      {parentRule.title}
                    </a>
                  ))}
                </span>
              ) : (
                'No parent rules'
              )}
            </dd>
          </div>
        </dl>
      </aside>
    </section>
  );
};
