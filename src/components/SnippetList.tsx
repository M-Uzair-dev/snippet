'use client';

import { useState, useMemo } from 'react';
import { Plus, Code2, Search, X } from 'lucide-react';
import CreateModal from './CreateModal';
import SnippetViewModal from './SnippetViewModal';

interface Snippet {
  _id: string;
  title: string;
  description: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SnippetList({ snippets: initial }: { snippets: Snippet[] }) {
  const [snippets, setSnippets] = useState(initial);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Snippet | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return snippets;
    return snippets.filter(s =>
      s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
    );
  }, [snippets, search]);

  function handleCreated(snippet: Snippet) {
    setSnippets(prev => [snippet, ...prev]);
    setCreateOpen(false);
  }

  function handleUpdated(updated: Snippet) {
    setSnippets(prev => prev.map(s => s._id === updated._id ? updated : s));
    setSelected(updated);
  }

  function handleDeleted(id: string) {
    setSnippets(prev => prev.filter(s => s._id !== id));
    setSelected(null);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#f1f5f9] tracking-tight">My Snippets</h1>
            <p className="mt-1 text-[#94a3b8] text-sm">Your personal collection of code snippets and notes</p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shrink-0"
          >
            <Plus size={16} />
            New Snippet
          </button>
        </div>

        {snippets.length > 0 && (
          <div className="relative mb-6">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search snippets..."
              className="w-full bg-[#111111] border border-[#1f1f1f] rounded-lg pl-9 pr-9 py-2 text-sm text-gray-100 placeholder:text-[#64748b] focus:outline-none focus:border-[#2563EB]/50 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-gray-300 transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {snippets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-4 rounded-xl bg-[#111111] border border-[#1f1f1f] p-5">
              <Code2 size={32} className="text-[#64748b]" />
            </div>
            <h2 className="text-lg font-semibold text-[#f1f5f9] mb-1">No snippets yet</h2>
            <p className="text-[#64748b] text-sm mb-6">Create your first snippet to get started.</p>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              New Snippet
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-[#64748b] text-sm">No snippets match &quot;{search}&quot;</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(snippet => (
              <button
                key={snippet._id}
                onClick={() => setSelected(snippet)}
                className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5 hover:border-[#2563EB]/40 hover:bg-[#141414] transition-all cursor-pointer text-left w-full"
              >
                <h2 className="font-semibold text-gray-100 mb-1 truncate">{snippet.title}</h2>
                <p className="text-gray-400 text-sm line-clamp-2 mb-4">{snippet.description}</p>
                <p className="text-[#64748b] text-xs">{formatDate(snippet.createdAt)}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <CreateModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onSuccess={handleCreated} />

      {selected && (
        <SnippetViewModal
          snippet={selected}
          onClose={() => setSelected(null)}
          onDeleted={handleDeleted}
          onUpdated={handleUpdated}
        />
      )}
    </main>
  );
}
