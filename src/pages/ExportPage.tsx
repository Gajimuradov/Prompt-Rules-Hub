import { useState } from 'react';
import styles from '../app/App.module.css';
import { StatusBlock } from '../components/StatusBlock';
import { useRulesStore } from '../store/rulesStore';

const downloadFile = (fileName: string, contents: string, mimeType: string) => {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const ExportPage = () => {
  const { composedContext } = useRulesStore();
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  if (!composedContext) {
    return (
      <StatusBlock
        title="Пока нечего экспортировать"
        message="Сначала соберите контекст, а потом возвращайтесь сюда за Markdown и JSON."
        action={
          <a className={styles.button} href="#/context">
            Открыть сборщик
          </a>
        }
      />
    );
  }

  const jsonText = JSON.stringify(composedContext.json, null, 2);

  const copy = async (contents: string, label: string) => {
    try {
      await navigator.clipboard.writeText(contents);
      setCopyStatus(`${label} скопирован в буфер обмена`);
    } catch {
      setCopyStatus(`Не получилось скопировать ${label}. Текст можно взять из предпросмотра ниже.`);
    }
  };

  return (
    <section className={styles.previewPanel}>
      {copyStatus && <StatusBlock title="Готово" message={copyStatus} />}

      <section className={styles.statGrid}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{composedContext.selectedRuleIds.length}</span>
          <span className={styles.statLabel}>Выбрано правил</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{composedContext.includedRules.length}</span>
          <span className={styles.statLabel}>Попало в контекст</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {Math.round(composedContext.markdown.length / 100) / 10}k
          </span>
          <span className={styles.statLabel}>Символов в Markdown</span>
        </div>
      </section>

      <section className={styles.exportLayout}>
        <article className={styles.panel}>
          <div className={styles.pageHeader}>
            <div>
              <h2 className={styles.panelTitle}>Markdown</h2>
              <p className={styles.helpText}>Подходит для ChatGPT, Codex, Cursor и других AI-инструментов.</p>
            </div>
            <div className={styles.buttonRow}>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => copy(composedContext.markdown, 'Markdown')}
              >
                Скопировать
              </button>
              <button
                className={styles.button}
                type="button"
                onClick={() =>
                  downloadFile('prompt-rules-context.md', composedContext.markdown, 'text/markdown')
                }
              >
                Скачать
              </button>
            </div>
          </div>
          <pre className={styles.codePreview}>{composedContext.markdown}</pre>
        </article>

        <article className={styles.panel}>
          <div className={styles.pageHeader}>
            <div>
              <h2 className={styles.panelTitle}>JSON</h2>
              <p className={styles.helpText}>Подходит для автоматизации, интеграций и внутренних ассистентов.</p>
            </div>
            <div className={styles.buttonRow}>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => copy(jsonText, 'JSON')}
              >
                Скопировать
              </button>
              <button
                className={styles.button}
                type="button"
                onClick={() => downloadFile('prompt-rules-context.json', jsonText, 'application/json')}
              >
                Скачать
              </button>
            </div>
          </div>
          <pre className={styles.codePreview}>{jsonText}</pre>
        </article>
      </section>
    </section>
  );
};
