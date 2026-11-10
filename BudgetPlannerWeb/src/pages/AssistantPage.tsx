import { useState, type FormEvent } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { assistantTips } from '../data/tips';
import { api } from '../lib/api';
import { buildAssistantReply } from '../lib/assistant';
import { useUser } from '../lib/auth';
import { useBudget } from '../lib/useBudget';

const INITIAL_REPLY = 'Ask about your spending, savings, or how much you have left this month. Answers use your bank data.';

export function AssistantPage() {
  const { user_id: userId } = useUser();
  const { data } = useBudget();
  const [prompt, setPrompt] = useState('Where is most of my money going this month?');
  const [reply, setReply] = useState(INITIAL_REPLY);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || pending) return;
    setPending(true);
    try {
      setReply(await api.askAssistant(userId, prompt.trim()));
    } catch {
      // Backend unreachable: answer locally from the loaded budget.
      setReply(buildAssistantReply(prompt, data.summary));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="page">
      <PageHeader eyebrow="Assistant" title="Budget guidance" />

      <Panel>
        <form onSubmit={handleSubmit}>
          <textarea
            className="textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
            }}
            placeholder="Ask about savings, cash flow, or bills"
            aria-label="Question for the budget assistant"
          />
          <button type="submit" className="btn-primary" disabled={pending}>
            {pending ? 'Thinking…' : 'Ask assistant'}
          </button>
        </form>
      </Panel>

      <div className="reply-box" aria-live="polite" aria-busy={pending}>
        {reply}
      </div>

      <Panel title="Helpful tips">
        <ul className="tips-list">
          {assistantTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
