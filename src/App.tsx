import { useState, useEffect, useRef } from "react";
import "./index.css";

type Priority = "high" | "medium" | "low";
type Filter = "all" | "active" | "completed";

interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  createdAt: number;
  dueDate?: string;
}

const STORAGE_KEY = "todo-tasks";

const priorityConfig: Record<Priority, { label: string; color: string; dot: string }> = {
  high:   { label: "高", color: "bg-red-50 text-red-600 border-red-200",          dot: "bg-red-400" },
  medium: { label: "中", color: "bg-amber-50 text-amber-600 border-amber-200",    dot: "bg-amber-400" },
  low:    { label: "低", color: "bg-emerald-50 text-emerald-600 border-emerald-200", dot: "bg-emerald-400" },
};

export default function App() {
  const [tasks, setTasks]         = useState<Task[]>([]);
  const [filter, setFilter]       = useState<Filter>("all");
  const [inputText, setInputText] = useState("");
  const [priority, setPriority]   = useState<Priority>("medium");
  const [dueDate, setDueDate]     = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText]   = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setTasks(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    const text = inputText.trim();
    if (!text) return;
    setTasks(prev => [{
      id: crypto.randomUUID(),
      text,
      completed: false,
      priority,
      createdAt: Date.now(),
      dueDate: dueDate || undefined,
    }, ...prev]);
    setInputText("");
    setDueDate("");
    inputRef.current?.focus();
  };

  const toggleTask     = (id: string) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTask     = (id: string) =>
    setTasks(prev => prev.filter(t => t.id !== id));
  const clearCompleted = () =>
    setTasks(prev => prev.filter(t => !t.completed));

  const startEdit = (task: Task) => { setEditingId(task.id); setEditText(task.text); };
  const saveEdit  = (id: string) => {
    const text = editText.trim();
    if (text) setTasks(prev => prev.map(t => t.id === id ? { ...t, text } : t));
    setEditingId(null);
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === "active")    return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const activeCount    = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
  const isOverdue = (d: string) => new Date(d) < new Date(new Date().toDateString());

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50 p-4 md:p-10">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">To-Do</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {activeCount > 0 ? `${activeCount}件のタスクが残っています` : "すべて完了しました 🎉"}
            </p>
          </div>
          {tasks.length > 0 && (
            <div className="text-right">
              <span className="text-3xl font-black text-blue-400">
                {Math.round(completedCount / tasks.length * 100)}%
              </span>
              <p className="text-xs text-slate-400">完了率</p>
            </div>
          )}
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-4 mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${priorityConfig[priority].dot}`} />
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTask()}
              placeholder="新しいタスクを入力..."
              className="flex-1 outline-none text-slate-700 placeholder-slate-300 text-sm font-medium"
            />
            <button
              onClick={addTask}
              disabled={!inputText.trim()}
              className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 text-white flex items-center justify-center transition-colors text-xl leading-none"
            >
              +
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3">
            <span className="text-xs text-slate-400 flex-shrink-0">優先度:</span>
            <div className="flex gap-1.5">
              {(["high", "medium", "low"] as Priority[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`px-2.5 py-0.5 rounded-full text-xs border font-medium transition-all ${
                    priority === p
                      ? priorityConfig[p].color + " shadow-sm"
                      : "bg-white text-slate-300 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {priorityConfig[p].label}
                </button>
              ))}
            </div>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="ml-auto text-xs text-slate-400 outline-none border border-slate-200 rounded-lg px-2 py-0.5"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 bg-slate-200/60 rounded-xl p-1 mb-4">
          {([
            ["all",       "すべて",   tasks.length],
            ["active",    "未完了",   activeCount],
            ["completed", "完了済み", completedCount],
          ] as [Filter, string, number][]).map(([f, label, count]) => (
            <button
              key={f}
              onClick={() => setFilter(f as Filter)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                filter === f
                  ? "bg-white text-slate-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {label}
              <span className={`text-xs rounded-full px-1.5 leading-5 ${
                filter === f ? "bg-blue-100 text-blue-600" : "bg-slate-300/60 text-slate-400"
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="space-y-2">
          {filteredTasks.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">
                {filter === "completed" ? "📋" : filter === "active" ? "✅" : "📝"}
              </div>
              <p className="text-slate-400 text-sm">
                {filter === "completed" ? "完了したタスクはありません"
                  : filter === "active"  ? "未完了のタスクはありません"
                  : "タスクを追加してください"}
              </p>
            </div>
          )}

          {filteredTasks.map(task => (
            <div
              key={task.id}
              className={`bg-white rounded-xl border px-4 py-3 flex items-start gap-3 group transition-all ${
                task.completed
                  ? "border-slate-100 opacity-50"
                  : "border-slate-200 hover:border-blue-200 hover:shadow-sm"
              }`}
            >
              <button
                onClick={() => toggleTask(task.id)}
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                  task.completed
                    ? "bg-blue-500 border-blue-500"
                    : "border-slate-300 hover:border-blue-400"
                }`}
              >
                {task.completed && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>

              <div className="flex-1 min-w-0">
                {editingId === task.id ? (
                  <input
                    autoFocus
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onBlur={() => saveEdit(task.id)}
                    onKeyDown={e => {
                      if (e.key === "Enter")  saveEdit(task.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="w-full outline-none text-sm text-slate-800 bg-transparent border-b-2 border-blue-400 pb-0.5"
                  />
                ) : (
                  <p
                    onDoubleClick={() => !task.completed && startEdit(task)}
                    title={task.completed ? undefined : "ダブルクリックで編集"}
                    className={`text-sm leading-snug ${
                      task.completed ? "line-through text-slate-400" : "text-slate-700 cursor-text"
                    }`}
                  >
                    {task.text}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full border ${priorityConfig[task.priority].color}`}>
                    {priorityConfig[task.priority].label}
                  </span>
                  {task.dueDate && (
                    <span className={`text-xs ${
                      !task.completed && isOverdue(task.dueDate) ? "text-red-400 font-medium" : "text-slate-400"
                    }`}>
                      {!task.completed && isOverdue(task.dueDate) && "⚠ "}
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => deleteTask(task.id)}
                className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5"
                title="削除"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between px-1">
          <p className="text-xs text-slate-400">ダブルクリックでタスクを編集</p>
          {completedCount > 0 && (
            <button
              onClick={clearCompleted}
              className="text-xs text-slate-400 hover:text-red-400 transition-colors"
            >
              完了済みを全削除 ({completedCount})
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
