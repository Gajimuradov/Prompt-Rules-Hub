import styles from '../app/App.module.css';
import { categoryLabels, type RuleCategory } from '../shared/ruleSchema';

type CategoryPillProps = {
  category: RuleCategory;
};

const categoryClassByValue: Record<RuleCategory, string> = {
  frontend: styles.categoryFrontend,
  testing: styles.categoryTesting,
  review: styles.categoryReview,
  'design-system': styles.categoryDesignSystem,
  security: styles.categorySecurity
};

export const CategoryPill = ({ category }: CategoryPillProps) => (
  <span className={`${styles.categoryPill} ${categoryClassByValue[category]}`}>
    {categoryLabels[category]}
  </span>
);
