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
        title="Nothing to export"
        message="Build a context first, then return here to export Markdown or JSON."
        action={
          <a className={styles.button} href="#/context">
            Open context builder
          </a>
        }
      />
    );
  }

  const jsonText = JSON.stringify(composedContext.json, null, 2);

  const copy = async (contents: string, label: string) => {
    try {
      await navigator.clipboard.writeText(contents);
      setCopyStatus(`${label} copied to clipboard`);
    } catch {
      setCopyStatus(`Could not copy ${label}. Use the preview text instead.`);
    }
  };

  return (
    <section className={styles.previewPanel}>
      {copyStatus && <StatusBlock title="Copied" message={copyStatus} />}

      <section className={styles.statGrid}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{composedContext.selectedRuleIds.length}</span>
          <span className={styles.statLabel}>Selected rules</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{composedContext.includedRules.length}</span>
          <span className={styles.statLabel}>Included rules</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {Math.round(composedContext.markdown.length / 100) / 10}k
          </span>
          <span className={styles.statLabel}>Markdown characters</span>
        </div>
      </section>

      <section className={styles.exportLayout}>
        <article className={styles.panel}>
          <div className={styles.pageHeader}>
            <div>
              <h2 className={styles.panelTitle}>Markdown</h2>
              <p className={styles.helpText}>Use this for chat-based assistants and code agents.</p>
            </div>
            <div className={styles.buttonRow}>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => copy(composedContext.markdown, 'Markdown')}
              >
                Copy
              </button>
              <button
                className={styles.button}
                type="button"
                onClick={() =>
                  downloadFile('prompt-rules-context.md', composedContext.markdown, 'text/markdown')
                }
              >
                Download
              </button>
            </div>
          </div>
          <pre className={styles.codePreview}>{composedContext.markdown}</pre>
        </article>

        <article className={styles.panel}>
          <div className={styles.pageHeader}>
            <div>
              <h2 className={styles.panelTitle}>JSON</h2>
              <p className={styles.helpText}>Use this for automation or custom assistant pipelines.</p>
            </div>
            <div className={styles.buttonRow}>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => copy(jsonText, 'JSON')}
              >
                Copy
              </button>
              <button
                className={styles.button}
                type="button"
                onClick={() => downloadFile('prompt-rules-context.json', jsonText, 'application/json')}
              >
                Download
              </button>
            </div>
          </div>
          <pre className={styles.codePreview}>{jsonText}</pre>
        </article>
      </section>
    </section>
  );
};
