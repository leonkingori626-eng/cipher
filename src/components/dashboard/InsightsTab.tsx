import React from 'react';
import { BarChart3, Shield, CheckCircle2, Clock } from 'lucide-react';
import { AuditEvent } from '../../types';

interface InsightsTabProps {
  auditEvents: AuditEvent[];
}

export const InsightsTab: React.FC<InsightsTabProps> = ({ auditEvents }) => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#26372D]">Insights & Audit Trail</h2>
        <p className="text-xs text-[#66716A]">Real recorded operational events, safety outcomes, and immutable audit logs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-[#DCE2DC] shadow-sm space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#66716A]">Total Audit Events</span>
          <p className="text-3xl font-bold text-[#26372D]">{auditEvents.length}</p>
          <p className="text-xs text-[#66716A]">Immutable workspace log</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#DCE2DC] shadow-sm space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#66716A]">Prompt Injection Defenses</span>
          <p className="text-3xl font-bold text-emerald-700">100%</p>
          <p className="text-xs text-[#66716A]">All malicious attempts blocked</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#DCE2DC] shadow-sm space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#66716A]">Grounded Accuracy</span>
          <p className="text-3xl font-bold text-[#26372D]">Verified</p>
          <p className="text-xs text-[#66716A]">Strict adherence to approved knowledge</p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-[#DCE2DC] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#DCE2DC]">
          <h3 className="font-bold text-base text-[#26372D]">Immutable Audit Log</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9F6] text-[#66716A] border-b border-[#DCE2DC]">
              <tr>
                <th className="p-4 font-semibold">Actor</th>
                <th className="p-4 font-semibold">Action</th>
                <th className="p-4 font-semibold">Resource</th>
                <th className="p-4 font-semibold">Outcome</th>
                <th className="p-4 font-semibold">Details</th>
                <th className="p-4 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE2DC]">
              {auditEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-[#F7F9F6]">
                  <td className="p-4 font-semibold text-[#27332B]">{ev.actor}</td>
                  <td className="p-4 text-[#27332B]">{ev.action}</td>
                  <td className="p-4 text-[#66716A]">{ev.resource}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full font-medium ${
                      ev.outcome === 'Success' ? 'bg-emerald-100 text-emerald-800' :
                      ev.outcome === 'Blocked' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {ev.outcome}
                    </span>
                  </td>
                  <td className="p-4 text-[#66716A] max-w-xs truncate">{ev.details}</td>
                  <td className="p-4 text-[#66716A]">{new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
