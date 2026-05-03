'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface Snippet {
  _id: string;
  title: string;
  description: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function SnippetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [snippet, setSnippet] = useState<Snippet | null>(null);
  const [status, setStatus] = useState<'loading' | 'found' | 'notfound' | 'error'>('loading');

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function fetchSnippet() {
    try {
      const res = await fetch(`/api/snippets/${id}`);
      if (res.status === 404) {
        setStatus('notfound');
        return;
      }
      if (!res.ok) {
        setStatus('error');
        return;
      }
      const data: Snippet = await res.json();
      setSnippet(data);
      setStatus('found');
    } catch {
      setStatus('error');
    }
  }

  useEffect(() => {
    if (id) {
      fetchSnippet();
    }
  }, [id]);

  function enterEditMode() {
    if (!snippet) return;
    setEditTitle(snippet.title);
    setEditDescription(snippet.description);
    setEditContent(snippet.content);
    setEditing(true);
  }

  async function handleSave() {
    if (!snippet) return;
    if (!editTitle.trim() || !editDescription.trim() || !editContent.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/snippets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          content: editContent.trim(),
        }),
      });
      if (res.ok) {
        const updated: Snippet = await res.json();
        setSnippet(updated);
        setEditing(false);
      }
    } catch {
      // silent — stay in edit mode
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/snippets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/');
      }
    } catch {
      setDeleting(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" />
          <p className="text-[#64748b] text-sm">Loading snippet...</p>
        </div>
      </main>
    );
  }

  // ── Not found / error ────────────────────────────────────────────────────
  if (status === 'notfound' || status === 'error') {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-2xl font-semibold text-[#f1f5f9] mb-2">
            {status === 'notfound' ? 'Snippet not found' : 'Something went wrong'}
          </p>
          <p className="text-[#64748b] text-sm mb-6">
            {status === 'notfound'
              ? "The snippet you're looking for doesn't exist or has been deleted."
              : 'Failed to load the snippet. Please try again.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[#94a3b8] hover:text-[#f1f5f9] transition-colors text-sm"
          >
            <ArrowLeft size={15} />
            Back to snippets
          </Link>
        </div>
      </main>
    );
  }

  if (!snippet) return null;

  // ── Edit mode ────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] px-4 py-12 max-w-4xl mx-auto">
        {/* Back */}
        <button
          onClick={() => setEditing(false)}
          className="flex items-center gap-1 text-gray-400 hover:text-gray-100 transition-colors mb-8 text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <h1 className="text-2xl font-bold text-[#f1f5f9] mb-6">Edit Snippet</h1>

        <div className="flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-1">Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-blue-500 w-full placeholder:text-[#64748b] transition-colors"
              placeholder="Snippet title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-1">Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-blue-500 w-full resize-none placeholder:text-[#64748b] transition-colors"
              placeholder="Brief description"
            />
          </div>

          {/* MD Editor */}
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-1">Content</label>
            <div
              data-color-mode="dark"
              className="rounded-lg overflow-hidden border border-[#2a2a2a]"
            >
              <MDEditor
                value={editContent}
                onChange={(v) => setEditContent(v ?? '')}
                height={400}
                preview="edit"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="text-gray-400 hover:text-gray-100 px-4 py-2 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── View mode ────────────────────────────────────────────────────────────
  return (
    <>
      <main className="min-h-screen bg-[#0a0a0a] px-4 py-12 max-w-4xl mx-auto">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-100 transition-colors mb-8 text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </Link>

        {/* Header row */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-gray-100 break-words">{snippet.title}</h1>
            <p className="text-gray-400 mt-2">{snippet.description}</p>
            <p className="text-[#64748b] text-sm mt-1">Created {formatDate(snippet.createdAt)}</p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 shrink-0 mt-1">
            <button
              onClick={enterEditMode}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-100 border border-[#2a2a2a] hover:border-[#3a3a3a] bg-[#111111] hover:bg-[#141414] px-3 py-1.5 rounded-lg transition-all"
            >
              <Pencil size={14} />
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 border border-[#2a2a2a] hover:border-red-900/50 bg-[#111111] hover:bg-[#141414] px-3 py-1.5 rounded-lg transition-all"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#1f1f1f] mb-8" />

        {/* Markdown content */}
        <div className="prose prose-invert prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-[#2a2a2a] prose-pre:p-0 prose-pre:overflow-hidden prose-code:before:content-none prose-code:after:content-none max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{ margin: 0, borderRadius: 0, background: '#1a1a1a' }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code
                    className="bg-[#1a1a1a] px-1 py-0.5 rounded text-sm font-mono text-blue-300"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {snippet.content}
          </ReactMarkdown>
        </div>
      </main>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-semibold text-[#f1f5f9] mb-2">Delete Snippet</h2>
            <p className="text-[#94a3b8] text-sm mb-6">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-[#f1f5f9]">{snippet.title}</span>? This action
              cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="text-gray-400 hover:text-gray-100 px-4 py-2 rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
