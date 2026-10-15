import React from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { ApprovalRequest } from '../../types';

interface ApprovalsTabProps {
  approvals: ApprovalRequest[];
  onResolveApproval: (id: string, decision: 'Approved' | 'Rejected') => void;
}

export const ApprovalsTab: React.FC<ApprovalsTabProps> = ({ approvals, onResolveApproval }) => {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#26372D]">Approvals & Safety Center</h2>
        <p className="text-xs text-[#66716A]">Human approval is mandatory before publishing material changes to customer-facing policies.</p>
      </div>

      <div className="space-y-4">
        {approvals.map((app) => {
          const isPending = app.status === 'Pending';
          const isApproved = app.status === 'Approved';
          return (
            <div key={app.id} className="bg-white rounded-3xl p-6 border border-[#DCE2DC] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    isPending ? 'bg-amber-100 text-amber-800' : isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#26372D]">{app.action}</h3>
                    <p className="text-xs text-[#66716A]">Requested by {app.requestor} • Risk Level: {app.riskLevel}</p>
                  </div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  isPending ? 'bg-amber-100 text-amber-800' : isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {app.status}
                </span>
              </div>

              <div className="bg-[#F7F9F6] p-4 rounded-2xl border border-[#DCE2DC] space-y-2 text-xs">
                <p><strong className="text-[#26372D]">Reason:</strong> {app.reason}</p>
                <p><strong className="text-[#26372D]">Context:</strong> {app.context}</p>
              </div>

              {isPending ? (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => onResolveApproval(app.id, 'Rejected')}
                    className="bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => onResolveApproval(app.id, 'Approved')}
                    className="bg-[#497A58] hover:bg-[#385f44] text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Publish</span>
                  </button>
                </div>
              ) : (
                <div className="pt-2 text-xs text-[#66716A] flex items-center justify-between border-t border-[#DCE2DC]">
                  <span>Resolved by: {app.resolvedBy || 'Operator'}</span>
                  <span>{app.resolvedAt}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
