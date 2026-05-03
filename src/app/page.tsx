import { connectToDatabase } from '@/lib/mongodb';
import Snippet from '@/models/Snippet';
import SnippetList from '@/components/SnippetList';

export default async function Home() {
  await connectToDatabase();
  const snippets = await Snippet.find({}).sort({ createdAt: -1 }).lean();
  const serialized = JSON.parse(JSON.stringify(snippets));
  return <SnippetList snippets={serialized} />;
}
