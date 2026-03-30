import Markdown from 'react-markdown';
import { Github, MessageCircle } from 'lucide-react';
import readmeContent from '../../README.md?raw';
import { APP_NAME, APP_VERSION } from '@/constants';

export default function HelpTab() {
  return (
    <div className="w-full max-w-2xl flex flex-col gap-6">
      <div className="bg-white dark:bg-zinc-900 p-8 md:p-12 rounded-[2rem] shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="markdown-body">
          <Markdown>{readmeContent}</Markdown>
          <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-zinc-400 dark:text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
            <span>{APP_NAME}</span>
            <span>{APP_VERSION}</span>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-6 md:p-8 rounded-[2rem] border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <h3 className="text-lg font-bold text-blue-900">Have feedback or found a bug?</h3>
          <p className="text-sm text-blue-700 mt-1">Open an issue on GitHub to help us improve {APP_NAME}.</p>
        </div>
        <a 
          href="https://github.com/nickpricks/MAHAAAAAAAAAAAAA-LOG-Floor-Tracker/issues/new?template=feedback.md" 
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-bold transition-all shadow-sm whitespace-nowrap"
        >
          <Github size={18} />
          Report on GitHub
        </a>
      </div>
    </div>
  );
}
