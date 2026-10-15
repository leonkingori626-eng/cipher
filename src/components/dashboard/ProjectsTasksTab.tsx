import React, { useState } from 'react';
import { Workflow, Plus, CheckCircle2, Clock, User, Calendar } from 'lucide-react';
import { Project, ProjectTask } from '../../types';

interface ProjectsTasksTabProps {
  projects: Project[];
  tasks: ProjectTask[];
  onAddTask: (task: Omit<ProjectTask, 'id'>) => void;
  onUpdateTaskStatus: (taskId: string, status: ProjectTask['status']) => void;
}

export const ProjectsTasksTab: React.FC<ProjectsTasksTabProps> = ({ projects, tasks, onAddTask, onUpdateTaskStatus }) => {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('Sarah Jenkins');
  const [taskPriority, setTaskPriority] = useState<ProjectTask['priority']>('Medium');
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    onAddTask({
      title: taskTitle.trim(),
      projectId: selectedProjectId,
      assignee: taskAssignee,
      status: 'To Do',
      priority: taskPriority,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setTaskTitle('');
    setShowTaskModal(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#26372D]">Projects & Work Management</h2>
          <p className="text-xs text-[#66716A]">Track project progress, deliverables, assignees, and task milestones.</p>
        </div>
        <button
          onClick={() => setShowTaskModal(true)}
          className="bg-[#497A58] hover:bg-[#385f44] text-white text-xs font-semibold px-5 py-3 rounded-xl transition-all shadow flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((proj) => (
          <div key={proj.id} className="bg-white rounded-3xl p-6 border border-[#DCE2DC] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[#26372D]">{proj.name}</h3>
              <span className="text-xs bg-[#E5EDE5] text-[#497A58] px-2.5 py-1 rounded-full font-semibold">{proj.status}</span>
            </div>
            <p className="text-xs text-[#66716A]">Client: {proj.clientName} • Owner: {proj.owner}</p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#66716A]">
                <span>Progress</span>
                <span>{proj.progress}%</span>
              </div>
              <div className="w-full bg-[#F0F2EF] h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#497A58] h-full rounded-full transition-all" style={{ width: `${proj.progress}%` }}></div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-[#66716A]">
              <span>Due: {proj.dueDate}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tasks Kanban / List */}
      <div className="bg-white rounded-3xl p-6 border border-[#DCE2DC] shadow-sm space-y-4">
        <h3 className="font-bold text-base text-[#26372D]">Project Tasks & Milestones</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9F6] text-[#66716A] border-b border-[#DCE2DC]">
              <tr>
                <th className="p-4 font-semibold">Task Title</th>
                <th className="p-4 font-semibold">Assignee</th>
                <th className="p-4 font-semibold">Priority</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE2DC]">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-[#F7F9F6]">
                  <td className="p-4 font-bold text-[#27332B]">{task.title}</td>
                  <td className="p-4 text-[#66716A]">{task.assignee}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full font-medium ${
                      task.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <select
                      value={task.status}
                      onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as ProjectTask['status'])}
                      className="text-xs bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-2.5 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Review">Review</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td className="p-4 text-[#66716A]">{task.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 space-y-6 shadow-2xl border border-[#DCE2DC]">
            <h3 className="text-xl font-bold text-[#26372D]">Add Project Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#66716A] mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Task description..."
                  className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Assignee</label>
                  <input
                    type="text"
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#66716A] mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full text-sm bg-[#F0F2EF] border border-[#DCE2DC] rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#497A58]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowTaskModal(false)} className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#F0F2EF]">Cancel</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#497A58] text-white">Save Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
