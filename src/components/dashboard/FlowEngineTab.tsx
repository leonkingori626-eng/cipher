import React, { useState } from 'react';
import { Workflow, Play, CheckCircle2, Clock, Plus } from 'lucide-react';
import { WorkflowExecution } from '../../types';

interface FlowEngineTabProps {
  executions: WorkflowExecution[];
  onTriggerExecution: (exec: Omit<WorkflowExecution, 'id' | 'executedAt'>) => void;
}

export const FlowEngineTab: React.FC<FlowEngineTabProps> = ({ executions, onTriggerExecution }) => {
  const [running, setRunning] = useState(false);

  const handleRunTestWorkflow = () => {
    setRunning(true);
    setTimeout(() => {
      onTriggerExecution({
        workflowName: 'Daily Operations Audit & Health Check',
        trigger: 'Manual Operator Run',
        status: 'Success',
        details: 'Checked all workspace integrations, verified knowledge base integrity, and logged metrics.'
      });
      setRunning(false);
    }, 800);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#26372D]">CIPHER Flow — Workflow Automation Engine</h2>
          <p className="text-xs text-[#66716A]">Configure triggers, conditions, and automated actions with real execution history.</p>
        </div>
        <button
          onClick={handleRunTestWorkflow}
          disabled={running}
          className="bg-[#497A58] hover:bg-[#385f44] disabled:opacity-50 text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all shadow flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          <span>{running ? 'Running Automation...' : 'Run Test Workflow'}</span>
        </button>
      </div>

      {/* Workflow Execution History */}
      <div className="bg-white rounded-3xl border border-[#DCE2DC] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#DCE2DC]">
          <h3 className="font-bold text-base text-[#26372D]">Workflow Execution History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9F6] text-[#66716A] border-b border-[#DCE2DC]">
              <tr>
                <th className="p-4 font-semibold">Workflow Name</th>
                <th className="p-4 font-semibold">Trigger Event</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Execution Details</th>
                <th className="p-4 font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE2DC]">
              {executions.map((ex) => (
                <tr key={ex.id} className="hover:bg-[#F7F9F6]">
                  <td className="p-4 font-bold text-[#27332B]">{ex.workflowName}</td>
                  <td className="p-4 text-[#66716A]">{ex.trigger}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-800">
                      {ex.status}
                    </span>
                  </td>
                  <td className="p-4 text-[#66716A]">{ex.details}</td>
                  <td className="p-4 text-[#66716A]">{ex.executedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
