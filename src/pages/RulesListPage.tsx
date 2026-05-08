import { useEffect, useMemo, useState } from 'react';
import styles from '../app/App.module.css';
import { CategoryPill } from '../components/CategoryPill';
import { StatusBlock } from '../components/StatusBlock';
import { useRulesStore } from '../store/rulesStore';
import {
  categoryLabels,
  ruleCategoryValues,
  type Rule,
  type RuleCategory
} from '../shared/ruleSchema';

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));

const matchesSearch = (rule: Rule, searchTerm: string): boolean => {
  const normalizedTerm = searchTerm.trim().toLowerCase();
  if (!normalizedTerm) {
    return true;
  }

  return [rule.title, rule.description, rule.category, rule.version, ...rule.tags]
    .join(' ')
    .toLowerCase()
    .includes(normalizedTerm);
};

export const RulesListPage = () => {
  const { rules, isRulesLoading, error, fetchRules } = useRulesStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<RuleCategory | 'all'>('all');

  useEffect(() => {
    void fetchRules();
  }, [fetchRules]);

  const filteredRules = useMemo(
    () =>
      rules.filter(
        (rule) =>
          matchesSearch(rule, searchTerm) &&
          (categoryFilter === 'all' || rule.category === categoryFilter)
      ),
    [categoryFilter, rules, searchTerm]
  );

  if (isRulesLoading && rules.length === 0) {
    return <StatusBlock title="Loading rules" message="Reading local JSON storage from the API." />;
  }

  if (error && rules.length === 0) {
    return <StatusBlock title="Could not load rules" message={error} tone="error" />;
  }

  return (
    <>
      <section className={styles.toolbar}>
        <input
          className={styles.input}
          type="search"
          placeholder="Search by title, tag, category, or version"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <select
          className={styles.select}
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value as RuleCategory | 'all')}
        >
          <option value="all">All categories</option>
          {ruleCategoryValues.map((category) => (
            <option key={category} value={category}>
              {categoryLabels[category]}
            </option>
          ))}
        </select>
        <a className={styles.button} href="#/rules/new">
          New rule
        </a>
      </section>

      {rules.length === 0 ? (
        <StatusBlock
          title="No rules yet"
          message="Create the first rule to start building reusable AI-assistant context."
          action={
            <a className={styles.button} href="#/rules/new">
              Create rule
            </a>
          }
        />
      ) : filteredRules.length === 0 ? (
        <StatusBlock
          title="No matching rules"
          message="Try a different search term or clear the category filter."
        />
      ) : (
        <section className={styles.rulesGrid}>
          {filteredRules.map((rule) => (
            <article key={rule.id} className={styles.ruleCard}>
              <div className={styles.ruleCardHeader}>
                <div className={styles.pillRow}>
                  <CategoryPill category={rule.category} />
                  <span className={styles.tagPill}>v{rule.version}</span>
                </div>
                <h2 className={styles.ruleCardTitle}>
                  <a className={styles.ruleCardLink} href={`#/rules/${encodeURIComponent(rule.id)}`}>
                    {rule.title}
                  </a>
                </h2>
              </div>

              <p className={styles.ruleDescription}>{rule.description}</p>

              <div className={styles.pillRow}>
                {rule.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className={styles.tagPill}>
                    {tag}
                  </span>
                ))}
              </div>

              <footer className={styles.cardFooter}>
                <span>{rule.parentRuleIds.length} parents</span>
                <span>Updated {formatDate(rule.updatedAt)}</span>
              </footer>
            </article>
          ))}
        </section>
      )}
    </>
  );
};
