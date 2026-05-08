import type { ReactNode } from 'react';
import styles from '../app/App.module.css';

type StatusBlockProps = {
  title: string;
  message: string;
  tone?: 'neutral' | 'error';
  action?: ReactNode;
};

export const StatusBlock = ({ title, message, tone = 'neutral', action }: StatusBlockProps) => (
  <section
    className={`${styles.statusBlock} ${tone === 'error' ? styles.errorBlock : ''}`}
    role={tone === 'error' ? 'alert' : 'status'}
  >
    <h2>{title}</h2>
    <p>{message}</p>
    {action}
  </section>
);
