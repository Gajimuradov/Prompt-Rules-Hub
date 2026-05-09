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
    if (!window.confirm('Удалить это правило? У дочерних правил пропадет ссылка на него.')) {
      return;
    }

    try {
      await deleteRule(ruleId);
      navigateTo('/');
    } catch {
      // Ошибка уже выводится на странице через store.
    }
  };

  if (isRuleLoading && !rule) {
    return <StatusBlock title="Загружаем правило" message="Получаем карточку правила из API." />;
  }

  if (error && !rule) {
    return <StatusBlock title="Не удалось загрузить правило" message={error} tone="error" />;
  }

  if (!rule) {
    return (
      <StatusBlock
        title="Правило не найдено"
        message="В локальном хранилище нет такого правила."
        action={
          <a className={styles.secondaryButton} href="#/">
            К списку правил
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
              Редактировать
            </a>
            <button
              className={styles.dangerButton}
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? 'Удаляем' : 'Удалить'}
            </button>
          </div>
        </div>
        <pre className={styles.markdownPreview}>{rule.content}</pre>
      </article>

      <aside className={styles.panel}>
        <h3 className={styles.panelTitle}>Детали</h3>
        <dl className={styles.metaList}>
          <div>
            <dt>ID</dt>
            <dd>{rule.id}</dd>
          </div>
          <div>
            <dt>Обновлено</dt>
            <dd>{new Date(rule.updatedAt).toLocaleString('ru')}</dd>
          </div>
          <div>
            <dt>Теги</dt>
            <dd>
              <span className={styles.pillRow}>
                {rule.tags.length > 0
                  ? rule.tags.map((tag) => (
                      <span key={tag} className={styles.tagPill}>
                        {tag}
                      </span>
                    ))
                  : 'Без тегов'}
              </span>
            </dd>
          </div>
          <div>
            <dt>Родительские правила</dt>
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
                'Родительских правил нет'
              )}
            </dd>
          </div>
        </dl>
      </aside>
    </section>
  );
};
