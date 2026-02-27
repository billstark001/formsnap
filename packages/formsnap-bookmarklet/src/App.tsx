import { useState } from "preact/hooks";
import { bookmarkletCode, bookmarkletLoaderCode } from "virtual:bookmarklets";
import { useAppI18n } from "./i18n";
import * as styles from "./styles.css";

function BookmarkletCard({
  title,
  description,
  code,
  wrapCode = false,
  dragLinkText,
  copiedText,
  copyUrlText,
}: {
  title: string;
  description: string;
  code: string;
  wrapCode?: boolean;
  dragLinkText: string;
  copiedText: string;
  copyUrlText: string;
}) {
  const [copied, setCopied] = useState(false);
  const href = wrapCode ? `javascript:!function(){${code}}();` : `javascript:${code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(href);
    } catch {
      // Fallback for environments without clipboard API
      const ta = document.createElement("textarea");
      ta.value = href;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>{title}</h2>
      <p className={styles.cardDesc}>{description}</p>
      <div className={styles.actionsRow}>
        <a href={href} className={styles.dragLink}>
          {dragLinkText}
        </a>
        <button onClick={handleCopy} className={styles.copyBtn}>
          {copied ? copiedText : copyUrlText}
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  const { t, toggleLang } = useAppI18n();
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>FormSnap</h1>
        <button className={styles.langBtn} onClick={toggleLang}>
          {t.langToggle}
        </button>
      </div>
      <p className={styles.pageDesc}>{t.pageDesc}</p>
      <BookmarkletCard
        title={t.card1Title}
        description={t.card1Desc}
        code={bookmarkletCode}
        wrapCode
        dragLinkText={t.dragLink}
        copiedText={t.copied}
        copyUrlText={t.copyUrl}
      />
      <BookmarkletCard
        title={t.card2Title}
        description={t.card2Desc}
        code={bookmarkletLoaderCode}
        wrapCode
        dragLinkText={t.dragLink}
        copiedText={t.copied}
        copyUrlText={t.copyUrl}
      />
      <footer className={styles.footer}>
        <a href="https://github.com/billstark001/formsnap" className={styles.footerLink}>
          GitHub
        </a>
      </footer>
    </div>
  );
}
