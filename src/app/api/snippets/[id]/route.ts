import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Snippet from '@/models/Snippet';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const snippet = await Snippet.findById(id).lean();
    if (!snippet) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(snippet);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch snippet' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  const password = request.headers.get('x-snippet-password');
  if (!password || password !== process.env.SNIPPETS_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    await connectToDatabase();
    const body = await request.json();
    const { title, description, content } = body;

    if (!title?.trim() || !description?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'title, description, and content are required' }, { status: 400 });
    }

    const snippet = await Snippet.findByIdAndUpdate(
      id,
      { title, description, content },
      { new: true, runValidators: true }
    );
    if (!snippet) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(snippet);
  } catch {
    return NextResponse.json({ error: 'Failed to update snippet' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const password = _req.headers.get('x-snippet-password');
  if (!password || password !== process.env.SNIPPETS_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    await connectToDatabase();
    const snippet = await Snippet.findByIdAndDelete(id);
    if (!snippet) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete snippet' }, { status: 500 });
  }
}
