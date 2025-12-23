import Calendar from '../components/Calendar';
import Reminders from '../components/Reminders';

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <Calendar />
        </div>
        <div className="lg:col-span-1">
          <Reminders />
        </div>
      </div>
    </div>
  );
}