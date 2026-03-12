import Markdown from 'react-markdown';
import { Mail } from 'lucide-react';
import readmeContent from '../../README.md?raw';

export default function HelpTab() {
  return (
    <div className="w-full max-w-2xl flex flex-col gap-6">
      <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-zinc-200">
        <div className="markdown-body">
          <Markdown>{readmeContent}</Markdown>
        </div>
      </div>
      
      <div className="bg-blue-50 p-6 md:p-8 rounded-[2rem] border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <h3 className="text-lg font-bold text-blue-900">Have feedback or found a bug?</h3>
          <p className="text-sm text-blue-700 mt-1">We'd love to hear from you to help improve MAHA LOG.</p>
        </div>
        <a 
          href="mailto:feedback@example.com?subject=MAHA%20LOG%20Feedback" 
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-bold transition-all shadow-sm whitespace-nowrap"
        >
          <Mail size={18} />
          Send Feedback
        </a>
      </div>
    </div>
  );
}
