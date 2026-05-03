'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { X, Eye, EyeOff } from 'lucide-react';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface Snippet {
  _id: string;
  title: string;
  description: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (snippet: Snippet) => void;
}

interface FormErrors {
  title?: boolean;
  description?: boolean;
  content?: boolean;
}

export default function CreateModal({ isOpen, onClose, onSuccess }: CreateModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setContent('');
      setErrors({});
      setLoading(false);
      setPassword('');
      setShowPassword(false);
      setPasswordError(false);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) {
      onClose();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newErrors: FormErrors = {};
    if (!title.trim()) newErrors.title = true;
    if (!description.trim()) newErrors.description = true;
    if (!content.trim()) newErrors.content = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!password.trim()) {
      setPasswordError(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-snippet-password': password },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), content: content.trim() }),
      });

      if (res.status === 401) {
        setPasswordError(true);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error('Failed to create snippet');
      const data = await res.json();
      onSuccess(data);
    } catch {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
    >
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-modal-in">
        {/* Modal header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[#f1f5f9]">New Snippet</h2>
          <button
            onClick={onClose}
            className="text-[#64748b] hover:text-[#f1f5f9] transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: false }));
              }}
              placeholder="Snippet title"
              className={`bg-[#1a1a1a] border rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-blue-500 w-full placeholder:text-[#64748b] transition-colors ${
                errors.title ? 'border-red-500' : 'border-[#2a2a2a]'
              }`}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: false }));
              }}
              placeholder="Brief description of the snippet"
              rows={2}
              className={`bg-[#1a1a1a] border rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-blue-500 w-full resize-none placeholder:text-[#64748b] transition-colors ${
                errors.description ? 'border-red-500' : 'border-[#2a2a2a]'
              }`}
            />
          </div>

          {/* Content — MD Editor */}
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-1">Content</label>
            <div
              data-color-mode="dark"
              className={`rounded-lg overflow-hidden border transition-colors ${
                errors.content ? 'border-red-500' : 'border-[#2a2a2a]'
              }`}
            >
              <MDEditor
                value={content}
                onChange={(v) => {
                  setContent(v ?? '');
                  if (errors.content && v && v.trim()) {
                    setErrors((prev) => ({ ...prev, content: false }));
                  }
                }}
                height={300}
                preview="edit"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
                placeholder="Enter password to confirm"
                className={`bg-[#1a1a1a] border rounded-lg px-3 py-2 pr-10 text-gray-100 focus:outline-none focus:border-blue-500 w-full placeholder:text-[#64748b] transition-colors ${passwordError ? 'border-red-500' : 'border-[#2a2a2a]'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordError && <p className="text-red-500 text-xs mt-1">Incorrect password</p>}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-100 px-4 py-2 rounded-lg transition-colors text-sm"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium min-w-[80px]"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
