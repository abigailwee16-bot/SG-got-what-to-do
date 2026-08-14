import React, { useEffect } from 'react';
import { MessageSquare } from 'lucide-react';

interface DisqusForumProps {
  url?: string;
  identifier?: string;
  title?: string;
}

export const DisqusForum: React.FC<DisqusForumProps> = ({
  url,
  identifier = 'sg-got-what-to-do-main',
  title = 'SG got what to do - Community Discussion',
}) => {
  useEffect(() => {
    const pageUrl = url || window.location.href;
    const pageIdentifier = identifier;
    const pageTitle = title;

    // Window global disqus configuration
    (window as any).disqus_config = function (this: any) {
      this.page.url = pageUrl;
      this.page.identifier = pageIdentifier;
      this.page.title = pageTitle;
    };

    // If DISQUS is already loaded on window, trigger reset
    if ((window as any).DISQUS) {
      (window as any).DISQUS.reset({
        reload: true,
        config: function (this: any) {
          this.page.url = pageUrl;
          this.page.identifier = pageIdentifier;
          this.page.title = pageTitle;
        },
      });
    } else {
      // Check if script already exists to avoid duplication
      const existingScript = document.getElementById('dsq-embed-scr');
      if (!existingScript) {
        const d = document;
        const s = d.createElement('script');
        s.id = 'dsq-embed-scr';
        s.src = 'https://abs-smu.disqus.com/embed.js';
        s.setAttribute('data-timestamp', String(+new Date()));
        (d.head || d.body).appendChild(s);
      }
    }

    // Load Disqus Count Script if not present
    if (!document.getElementById('dsq-count-scr')) {
      const d = document;
      const countScript = d.createElement('script');
      countScript.id = 'dsq-count-scr';
      countScript.src = '//abs-smu.disqus.com/count.js';
      countScript.async = true;
      (d.head || d.body).appendChild(countScript);
    }
  }, [url, identifier, title]);

  return (
    <section id="community-discussion-forum" className="mt-12 bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-sm border border-slate-200/90">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 mb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Community Discussion & Recommendations
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Share Singapore hidden spots, review itineraries, ask locals for tips, or comment on your weekend plans.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="disqus-comment-count" data-disqus-identifier={identifier}>
            Discussion Forum
          </span>
        </div>
      </div>

      {/* Embedded Disqus Forum Container */}
      <div id="disqus_thread" className="min-h-[280px]"></div>

      <noscript>
        Please enable JavaScript to view the{' '}
        <a href="https://disqus.com/?ref_noscript" rel="noopener noreferrer" target="_blank" className="text-rose-600 underline">
          comments powered by Disqus.
        </a>
      </noscript>
    </section>
  );
};
