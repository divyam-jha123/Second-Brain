type TabInfo = {
  title: string;
  link: string;
};

type SaveViewProps = {
  tab: TabInfo;
  title: string;
  link: string;
  status: string;
  onChangeTitle: (value: string) => void;
  onChangeLink: (value: string) => void;
  onSave: () => Promise<void>;
};

export function SaveView({
  tab,
  title,
  link,
  status,
  onChangeTitle,
  onChangeLink,
  onSave,
}: SaveViewProps) {
  return (
    <section className="card">
      <p className="muted">Ready to save this tab to your dashboard.</p>

      <label className="label" htmlFor="title">
        Title
      </label>
      <input
        id="title"
        className="input"
        value={title}
        onChange={(e) => onChangeTitle(e.target.value)}
        placeholder={tab.title || "Page title"}
      />

      <label className="label" htmlFor="link">
        Link
      </label>
      <input
        id="link"
        className="input"
        value={link}
        onChange={(e) => onChangeLink(e.target.value)}
        placeholder={tab.link || "https://..."}
      />

      <button className="primary-btn" onClick={onSave} disabled={!title.trim() || !link.trim()}>
        Save to Brain Expo
      </button>

      {status ? <p className="status">{status}</p> : null}
    </section>
  );
}

