import DeepWorkSprint from '../components/DeepWork';
import MITDaily from '../components/MITDaily';
import OutputTracker from '../components/OutputTracker';

export default function ProductivityPage() {
  return (
    <div className="flex justify-center pb-16">
      <div className="w-full max-w-7xl space-y-8"> {/* Ensures consistent spacing */}
        <DeepWorkSprint />
        <MITDaily />
        <OutputTracker />
      </div>
    </div>
  );
}
