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
  new Intl.DateTimeFormat('ru', {
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
  const categoryCount = useMemo(
    () => new Set(rules.map((rule) => rule.category)).size,
    [rules]
  );
  const inheritedRulesCount = useMemo(
    () => rules.filter((rule) => rule.parentRuleIds.length > 0).length,
    [rules]
  );

  if (isRulesLoading && rules.length === 0) {
    return <StatusBlock title="Загружаем правила" message="Читаем локальное JSON-хранилище через API." />;
  }

  if (error && rules.length === 0) {
    return <StatusBlock title="Не удалось загрузить правила" message={error} tone="error" />;
  }

  return (
    <>
      <section className={styles.toolbar}>
        <input
          className={styles.input}
          type="search"
          placeholder="Найти по названию, тегу, категории или версии"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <select
          className={styles.select}
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value as RuleCategory | 'all')}
        >
          <option value="all">Все категории</option>
          {ruleCategoryValues.map((category) => (
            <option key={category} value={category}>
              {categoryLabels[category]}
            </option>
          ))}
        </select>
        <a className={styles.button} href="#/rules/new">
          Новое правило
        </a>
      </section>

      {rules.length > 0 && (
        <section className={styles.summaryStrip}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{rules.length}</span>
            <span className={styles.summaryLabel}>правил в базе</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{categoryCount}</span>
            <span className={styles.summaryLabel}>направлений команды</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{inheritedRulesCount}</span>
            <span className={styles.summaryLabel}>правил с наследованием</span>
          </div>
        </section>
      )}

      {rules.length === 0 ? (
        <StatusBlock
          title="Пока нет правил"
          message="Добавьте первое правило, чтобы начать собирать контекст для AI-ассистента."
          action={
            <a className={styles.button} href="#/rules/new">
              Создать правило
            </a>
          }
        />
      ) : filteredRules.length === 0 ? (
        <StatusBlock
          title="Ничего не нашли"
          message="Попробуйте другой запрос или сбросьте фильтр по категории."
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
                <span>{rule.parentRuleIds.length} родительских</span>
                <span>Обновлено {formatDate(rule.updatedAt)}</span>
              </footer>
            </article>
          ))}
        </section>
      )}
    </>
  );
};
