import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Sparkles, LogIn, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { getSeoAdminAccess, suggestSeo } from '@/lib/seo-suggestions.functions';
import { seoInput, type SeoSuggestions as Suggestions } from '@/lib/seo-suggestions-schema';

export function SeoSuggestions() {
  const checkAccess = useServerFn(getSeoAdminAccess);
  const generate = useServerFn(suggestSeo);
  const [access, setAccess] = useState<'checking' | 'signed-out' | 'allowed' | 'denied'>('checking');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Suggestions | null>(null);
  useEffect(() => {
    let active = true;
    async function check() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (!data.session) { setAccess('signed-out'); return; }
      try { const reply = await checkAccess(); if (active) setAccess(reply.allowed ? 'allowed' : 'denied'); }
      catch { if (active) setAccess('denied'); }
    }
    void check();
    return () => { active = false; };
  }, [checkAccess]);
  const login = async (provider: 'google' | 'lovable') => {
    setError('');
    try { const reply = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/seo` }); if (reply.error) setError('Sign-in could not be completed. Please try again.'); }
    catch { setError('Sign-in could not be completed. Please try again.'); }
  };
  return <section className="border-t border-border py-8">
    <p className="text-xs font-mono uppercase text-muted-foreground">Administrator workspace</p>
    <h2 className="mt-3 text-2xl font-bold">AI SEO suggestions</h2>
    {access === 'checking' && <p className="mt-4" role="status">Checking access…</p>}
    {access === 'signed-out' && <div className="mt-5"><p className="text-sm text-muted-foreground">Sign in with your approved administrator account.</p><div className="mt-4 flex flex-wrap gap-3"><Button onClick={() => login('google')}><LogIn />Sign in with Google</Button><Button variant="outline" onClick={() => login('lovable')}>Sign in with Lovable</Button></div></div>}
    {access === 'denied' && <p className="mt-4" role="alert">This account does not have administrator access.</p>}
    {(access === 'allowed' || access === 'denied') && <Button variant="ghost" className="mt-4" onClick={() => supabase.auth.signOut()}><LogOut />Sign out</Button>}
    {access === 'allowed' && <form className="mt-6 space-y-5" onSubmit={async event => {
      event.preventDefault(); setError(''); setResult(null);
      const parsed = seoInput.safeParse({ title, content });
      if (!parsed.success) { setError('Enter a title and 30–20,000 characters of page content.'); return; }
      setBusy(true);
      try { const reply = await generate({ data: parsed.data }); setResult(reply.result); setError(reply.error ?? ''); }
      catch { setError('Unable to generate suggestions. Check administrator access and try again.'); }
      finally { setBusy(false); }
    }}>
      <label className="block text-sm font-semibold">Page title<input required maxLength={200} value={title} onChange={e => { setTitle(e.target.value); setResult(null); }} className="mt-2 min-h-11 w-full rounded-md border border-input bg-background px-3 text-base" /></label>
      <label className="block text-sm font-semibold">Page content<textarea required minLength={30} maxLength={20000} rows={9} value={content} onChange={e => { setContent(e.target.value); setResult(null); }} className="mt-2 w-full rounded-md border border-input bg-background p-3 text-base" /></label>
      <p className="text-sm text-muted-foreground">Submitted text is sent to AI for review. Suggestions do not change or publish your pages.</p>
      <Button type="submit" disabled={busy}><Sparkles />{busy ? 'Reviewing…' : 'Suggest improvements'}</Button>
    </form>}
    {error && <p role="alert" className="mt-5 text-sm">{error}</p>}
    {result && <div className="mt-8 space-y-6" aria-live="polite">
      <div className="border-y border-border py-5"><h3 className="font-semibold">Suggested title</h3><p className="mt-2 break-words">{result.suggestedTitle}</p><h3 className="mt-5 font-semibold">Suggested description</h3><p className="mt-2 break-words">{result.suggestedDescription}</p></div>
      {result.suggestions.map((item, i) => <article key={i} className="border-b border-border pb-5"><p className="text-xs font-mono uppercase text-muted-foreground">{item.priority} priority · {item.area}</p><h3 className="mt-2 font-semibold">{item.action}</h3><p className="mt-2 text-sm text-muted-foreground">{item.reason}</p></article>)}
      <div><h3 className="font-semibold">Review boundaries</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">{result.limitations.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
    </div>}
  </section>;
}