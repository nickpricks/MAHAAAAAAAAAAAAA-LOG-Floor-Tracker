import Markdown from 'react-markdown';
import readmeContent from '../../README.md?raw';

export default function HelpTab() {
  return (
    <div className="w-full max-w-2xl bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-zinc-200">
      <div className="markdown-body">
        <Markdown>{readmeContent}</Markdown>
      </div>
    </div>
  );
}
