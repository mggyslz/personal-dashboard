import DeepWorkSprint from '../components/DeepWork';
import MITDaily from '../components/MITDaily';
import OutputTracker from '../components/OutputTracker';

export default function ProductivityPage() {
  return (
    <div className="space-y-8 pb-16 flex justify-center">
      <div className="w-full max-w-7xl space-y-8"> {/* match MIT width */}

        {/* Header */}
        <div className="bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm rounded-3xl p-8 border border-gray-200/50 shadow-sm">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-3xl font-light text-gray-800 mb-2">
                Productivity Tools
              </h1>
              <p className="text-gray-500 font-light">
                Focus on what matters with these productivity methodologies
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <DeepWorkSprint />
          <MITDaily />
          <OutputTracker />
        </div>
      </div>
    </div>
  );
}
