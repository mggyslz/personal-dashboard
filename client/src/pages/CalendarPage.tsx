import Calendar from '../components/Calendar';
import Reminders from '../components/Reminders';

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <Reminders />
      <Calendar />
    </div>
  );
}