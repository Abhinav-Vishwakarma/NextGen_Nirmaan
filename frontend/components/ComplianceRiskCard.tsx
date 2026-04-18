import React from 'react'
import { 
  AlertTriangle, 
  TrendingUp, 
  Wallet, 
  Clock, 
  ShieldAlert,
  HelpCircle,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PenaltyBreakdown {
  lateFee: number
  interest: number
  statutoryPenalty: number
  total: number
  currency: string
}

interface ComplianceRiskCardProps {
  exposure: PenaltyBreakdown
  score: number
  className?: string
}

export const ComplianceRiskCard: React.FC<ComplianceRiskCardProps> = ({ exposure, score, className }) => {
  const isHighRisk = score < 70 || exposure.total > 50000
  const isMedRisk = (score >= 70 && score < 90) || (exposure.total > 0 && exposure.total <= 50000)

  return (
    <div className={cn(
      "glass-panel p-6 border-l-4 transition-all duration-500 hover:shadow-2xl hover:shadow-rose-500/10",
      isHighRisk ? "border-l-rose-500 bg-rose-500/[0.02]" : 
      isMedRisk ? "border-l-amber-500 bg-amber-500/[0.02]" : "border-l-emerald-500 bg-emerald-500/[0.02]",
      className
    )}>
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-2xl border shadow-inner",
            isHighRisk ? "bg-rose-500/10 border-rose-500/20 text-rose-500" :
            isMedRisk ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
            "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
          )}>
            <ShieldAlert size={28} className={isHighRisk ? "animate-pulse" : ""} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight leading-none">Financial Risk Analysis</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">Compliance Loss Estimation</p>
          </div>
        </div>
        <div className="text-right">
            <div className={cn(
                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                isHighRisk ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                isMedRisk ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            )}>
                {isHighRisk ? 'Critical Exposure' : isMedRisk ? 'Significant Risk' : 'Protected'}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          <div className="relative">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3">Total Estimated Liability</p>
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white tracking-tighter">₹{exposure.total.toLocaleString()}</span>
                <span className="text-xs font-bold text-slate-500 uppercase">{exposure.currency}</span>
            </div>
            {exposure.total > 0 && (
                <div className="mt-4 flex items-center gap-2 text-rose-400 animate-fadeIn">
                    <TrendingUp size={14} className="animate-bounce" />
                    <span className="text-[10px] font-black uppercase tracking-widest">+18% p.a. interest accruing daily</span>
                </div>
            )}
          </div>
        </div>

        <div className="p-5 bg-slate-950/50 border border-slate-900 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Factor</p>
                <span className="text-xs font-black text-white tracking-widest">{100 - score}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div 
                    className={cn(
                        "h-full transition-all duration-1000",
                        isHighRisk ? "bg-rose-500" : isMedRisk ? "bg-amber-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${100 - score}%` }}
                />
            </div>
            <p className="text-[9px] text-slate-600 font-medium italic">Calculated based on GSTR-3B filing delays and RERA section 61 guidelines.</p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Loss Breakdown</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="group p-5 bg-slate-950 border border-slate-900 rounded-2xl hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-3 mb-4">
                    <Clock size={16} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Late Fees</span>
                </div>
                <p className="text-lg font-black text-white tracking-tight">₹{exposure.lateFee.toLocaleString()}</p>
                <p className="text-[9px] text-slate-600 font-medium mt-1">₹50/day since due date</p>
            </div>

            <div className="group p-5 bg-slate-950 border border-slate-900 rounded-2xl hover:border-amber-500/30 transition-all">
                <div className="flex items-center gap-3 mb-4">
                    <TrendingUp size={16} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Interest Accrued</span>
                </div>
                <p className="text-lg font-black text-white tracking-tight">₹{exposure.interest.toLocaleString()}</p>
                <p className="text-[9px] text-slate-600 font-medium mt-1">18% p.a. on tax shortfall</p>
            </div>

            <div className="group p-5 bg-slate-950 border border-slate-900 rounded-2xl hover:border-rose-500/30 transition-all">
                <div className="flex items-center gap-3 mb-4">
                    <Wallet size={16} className="text-slate-500 group-hover:text-rose-400 transition-colors" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Statutory Penalty</span>
                </div>
                <p className="text-lg font-black text-white tracking-tight">₹{exposure.statutoryPenalty.toLocaleString()}</p>
                <p className="text-[9px] text-slate-600 font-medium mt-1">10% of tax or min ₹10k</p>
            </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-500">
            <HelpCircle size={14} />
            <span className="text-[10px] font-medium italic">Calculated for Indian GST Laws 2026</span>
        </div>
        <button className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] group/btn">
            View Penalty Guide
            <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  )
}
