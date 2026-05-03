'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ArrowLeft, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface Snippet {
  _id: string;
  title: string;
  description: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  snippet: Snippet;
  onClose: () => void;
  onDeleted: (id: string) => void;
  onUpdated: (updated: Snippet) => void;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function SnippetViewModal({ snippet: initial, onClose, onDeleted, onUpdated }: Props) {
  const [snippet, setSnippet] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editPasswordError, setEditPasswordError] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deletePasswordError, setDeletePasswordError] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (showDelete) { setShowDelete(false); setDeletePassword(''); setShowDeletePassword(false); setDeletePasswordError(false); return; }
      if (editing) { setEditing(false); return; }
      onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [editing, showDelete, onClose]);

  function enterEdit() {
    setEditTitle(snippet.title);
    setEditDesc(snippet.description);
    setEditContent(snippet.content);
    setEditPassword('');
    setShowEditPassword(false);
    setEditPasswordError(false);
    setEditing(true);
  }

  async function handleSave() {
    if (!editTitle.trim() || !editDesc.trim() || !editContent.trim()) return;
    if (!editPassword.trim()) { setEditPasswordError(true); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/snippets/${snippet._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-snippet-password': editPassword },
        body: JSON.stringify({ title: editTitle.trim(), description: editDesc.trim(), content: editContent.trim() }),
      });
      if (res.status === 401) { setEditPasswordError(true); setSaving(false); return; }
      if (res.ok) {
        const updated: Snippet = await res.json();
        setSnippet(updated);
        onUpdated(updated);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletePassword.trim()) { setDeletePasswordError(true); return; }
    setDeleting(true);
    try {
      const res = await fetch(`/api/snippets/${snippet._id}`, {
        method: 'DELETE',
        headers: { 'x-snippet-password': deletePassword },
      });
      if (res.status === 401) { setDeletePasswordError(true); setDeleting(false); return; }
      if (res.ok) onDeleted(snippet._id);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] overflow-y-auto animate-modal-in">
      {editing ? (
        <div className="px-4 py-12 max-w-4xl mx-auto">
          <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-gray-400 hover:text-gray-100 transition-colors mb-8 text-sm">
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="text-2xl font-bold text-[#f1f5f9] mb-6">Edit Snippet</h1>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-1">Title</label>
              <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-blue-500 w-full transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-1">Description</label>
              <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-blue-500 w-full resize-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-1">Content</label>
              <div data-color-mode="dark" className="rounded-lg overflow-hidden border border-[#2a2a2a]">
                <MDEditor value={editContent} onChange={v => setEditContent(v ?? '')} height={400} preview="edit" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#94a3b8] mb-1">Password</label>
              <div className="relative">
                <input
                  type={showEditPassword ? 'text' : 'password'}
                  value={editPassword}
                  onChange={(e) => { setEditPassword(e.target.value); setEditPasswordError(false); }}
                  placeholder="Enter password to save"
                  className={`bg-[#1a1a1a] border rounded-lg px-3 py-2 pr-10 text-gray-100 focus:outline-none focus:border-blue-500 w-full placeholder:text-[#64748b] transition-colors ${editPasswordError ? 'border-red-500' : 'border-[#2a2a2a]'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8] transition-colors"
                  tabIndex={-1}
                >
                  {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {editPasswordError && <p className="text-red-500 text-xs mt-1">Incorrect password</p>}
            </div>
            <div className="flex justify-end gap-2 mt-1">
              <button onClick={() => setEditing(false)} disabled={saving} className="text-gray-400 hover:text-gray-100 px-4 py-2 rounded-lg transition-colors text-sm disabled:opacity-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium min-w-[100px]">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-12 max-w-4xl mx-auto">
          <button onClick={onClose} className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-100 transition-colors mb-8 text-sm">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-start justify-between mb-8 gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-gray-100 break-words">{snippet.title}</h1>
              <p className="text-gray-400 mt-2">{snippet.description}</p>
              <p className="text-[#64748b] text-sm mt-1">Created {formatDate(snippet.createdAt)}</p>
            </div>
            <div className="flex gap-2 shrink-0 mt-1">
              <button onClick={enterEdit} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-100 border border-[#2a2a2a] hover:border-[#3a3a3a] bg-[#111111] hover:bg-[#141414] px-3 py-1.5 rounded-lg transition-all">
                <Pencil size={14} /> Edit
              </button>
              <button onClick={() => setShowDelete(true)} className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 border border-[#2a2a2a] hover:border-red-900/50 bg-[#111111] hover:bg-[#141414] px-3 py-1.5 rounded-lg transition-all">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
          <div className="border-t border-[#1f1f1f] mb-8" />
          <div className="prose prose-invert prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-[#2a2a2a] prose-pre:p-0 prose-pre:overflow-hidden prose-code:before:content-none prose-code:after:content-none max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div"
                      customStyle={{ margin: 0, borderRadius: 0, background: '#1a1a1a' }} {...props}>
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className="bg-[#1a1a1a] px-1 py-0.5 rounded text-sm font-mono text-blue-300" {...props}>{children}</code>
                  );
                },
              }}
            >
              {snippet.content}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-modal-in">
            <h2 className="text-lg font-semibold text-[#f1f5f9] mb-2">Delete Snippet</h2>
            <p className="text-[#94a3b8] text-sm mb-4">
              Are you sure you want to delete <span className="font-semibold text-[#f1f5f9]">{snippet.title}</span>? This cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#94a3b8] mb-1">Password</label>
              <div className="relative">
                <input
                  type={showDeletePassword ? 'text' : 'password'}
                  value={deletePassword}
                  onChange={(e) => { setDeletePassword(e.target.value); setDeletePasswordError(false); }}
                  placeholder="Enter password to confirm"
                  className={`bg-[#1a1a1a] border rounded-lg px-3 py-2 pr-10 text-gray-100 focus:outline-none focus:border-red-500 w-full placeholder:text-[#64748b] transition-colors ${deletePasswordError ? 'border-red-500' : 'border-[#2a2a2a]'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8] transition-colors"
                  tabIndex={-1}
                >
                  {showDeletePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {deletePasswordError && <p className="text-red-500 text-xs mt-1">Incorrect password</p>}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowDelete(false); setDeletePassword(''); setShowDeletePassword(false); setDeletePasswordError(false); }} disabled={deleting} className="text-gray-400 hover:text-gray-100 px-4 py-2 rounded-lg transition-colors text-sm disabled:opacity-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium min-w-[80px]">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
