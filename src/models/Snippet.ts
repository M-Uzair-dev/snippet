import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISnippet extends Document {
  title: string;
  description: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const SnippetSchema = new Schema<ISnippet>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

const Snippet: Model<ISnippet> =
  mongoose.models.Snippet ?? mongoose.model<ISnippet>('Snippet', SnippetSchema);

export default Snippet;
