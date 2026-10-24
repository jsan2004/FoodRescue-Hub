import React from 'react';
import { CheckCircle2, Clock, Truck, PackageCheck, AlertCircle, XCircle } from 'lucide-react';

const STEPS = [
  { key: 'posted', label: 'Posted', icon: Clock },
  { key: 'accepted', label: 'Accepted', icon: CheckCircle2 },
  { key: 'assigned', label: 'Volunteer Assigned', icon: Truck },
  { key: 'picked_up', label: 'In Transit', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: PackageCheck }
];

export default function StatusStepper({ currentStatus }) {
  if (currentStatus === 'expired') {
    return (
      <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-sm">
        <AlertCircle className="w-5 h-5 text-slate-500 flex-shrink-0" />
        <span><strong>Status: Expired</strong> — Unclaimed prior to safe consumption window.</span>
      </div>
    );
  }

  if (currentStatus === 'cancelled') {
    return (
      <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
        <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
        <span><strong>Status: Cancelled</strong> — This donation was cancelled.</span>
      </div>
    );
  }

  const getStepIndex = (status) => {
    switch (status) {
      case 'posted': return 0;
      case 'accepted': return 1;
      case 'assigned': return 2;
      case 'picked_up': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(currentStatus);

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Background Connecting Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-0" />
        {/* Active Filled Line */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-600 transition-all duration-500 -z-0" 
          style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const StepIcon = step.icon;

          let circleClass = "bg-white border-2 border-slate-300 text-slate-400";
          let textClass = "text-slate-500 font-normal";

          if (isCompleted) {
            circleClass = "bg-emerald-600 border-2 border-emerald-600 text-white shadow-sm";
            textClass = "text-emerald-700 font-semibold";
          } else if (isCurrent) {
            circleClass = "bg-white border-2 border-emerald-600 text-emerald-600 ring-4 ring-emerald-100 shadow-sm";
            textClass = "text-emerald-800 font-bold";
          }

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${circleClass}`}>
                <StepIcon className="w-4 h-4" />
              </div>
              <span className={`text-[11px] mt-1.5 text-center whitespace-nowrap ${textClass}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
