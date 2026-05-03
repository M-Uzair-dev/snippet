import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Snippet from '@/models/Snippet';

export async function GET() {
  try {
    await connectToDatabase();
    const snippets = await Snippet.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(snippets);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch snippets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const password = request.headers.get('x-snippet-password');
  if (!password || password !== process.env.SNIPPETS_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await connectToDatabase();
    const body = await request.json();
    const { title, description, content } = body;

    if (!title?.trim() || !description?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'title, description, and content are required' }, { status: 400 });
    }

    const snippet = await Snippet.create({ title, description, content });
    return NextResponse.json(snippet, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create snippet' }, { status: 500 });
  }
}
