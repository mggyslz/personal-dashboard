import Notes from '../components/Notes';
import CodeEmbed from '../components/CodeEmbed';

export default function NotesPage() {
  return (
    <div className="space-y-6 p-6">
      <Notes />
      <CodeEmbed />
    </div>
  );
}
