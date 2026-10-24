import React, { useState } from 'react';
import { ShieldCheck, Check, AlertCircle, X } from 'lucide-react';

export default function FoodSafetyModal({ isOpen, onClose, onConfirm, isSubmitting }) {
  const [checks, setChecks] = useState({
    food_covered: false,
    clean_containers: false,
    temperature_checked: false,
    prepared_within_safe_window: false
  });

  if (!isOpen) return null;

  const allChecked = Object.values(checks).every(Boolean);

  const toggleCheck = (key) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const checklistItems = [
    {
      key: 'food_covered',
      title: 'Covered & Sealed Storage',
      desc: 'Food has been kept fully covered in clean, hygienic, protective packaging or thermal food trays.'
    },
    {
      key: 'clean_containers',
      title: 'Food-Grade Containers',
      desc: 'All packaging and containers used are clean, food-safe, and intact without signs of tampering.'
    },
    {
      key: 'temperature_checked',
      title: 'Temperature Adherence',
      desc: 'Cooked hot food has been held above 63°C, or chilled perishable items kept below 5°C.'
    },
    {
      key: 'prepared_within_safe_window',
      title: 'Safe Time Window',
      desc: 'Food was prepared recently, shows no discoloration or odor, and expiry time reflects strict safety standards.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Food Safety Verification</h3>
              <p className="text-xs text-slate-500">FSSAI & Hygiene Quality Standards: Pre-redistribution Checklist</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            To ensure beneficiary safety and prevent foodborne illnesses, donors must verify and confirm the following food handling protocols prior to publishing:
          </p>

          {checklistItems.map((item) => (
            <label
              key={item.key}
              onClick={() => toggleCheck(item.key)}
              className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                checks[item.key]
                  ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-200'
                  : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70'
              }`}
            >
              <div className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                checks[item.key]
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-white border-slate-300'
              }`}>
                {checks[item.key] && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-normal">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>

        {!allChecked && (
          <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs mb-4">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Please review and verify all 4 food safety criteria above to post.</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Back to Edit
          </button>
          <button
            type="button"
            disabled={!allChecked || isSubmitting}
            onClick={() => onConfirm(checks)}
            className={`px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-sm transition-all flex items-center gap-2 ${
              allChecked && !isSubmitting
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25 cursor-pointer'
                : 'bg-slate-300 cursor-not-allowed text-slate-500'
            }`}
          >
            {isSubmitting ? 'Posting...' : 'Confirm & Post Donation'}
          </button>
        </div>
      </div>
    </div>
  );
}
