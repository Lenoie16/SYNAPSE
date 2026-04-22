
import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskStatus } from '@/types';

interface KanbanProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

export const Kanban: React.FC<KanbanProps> = ({ tasks, setTasks }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('00:00:00');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDesc, setModalDesc] = useState('');
  const [modalPriority, setModalPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [modalColumn, setModalColumn] = useState<TaskStatus>(TaskStatus.TODO);

  // Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${h}:${m}:${s}`);
    };
    const interval = setInterval(updateClock, 1000);
    updateClock();
    return () => clearInterval(interval);
  }, []);

  // Wave Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let wt = 0;
    let animationFrameId: number;

    const resizeWave = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    
    window.addEventListener('resize', resizeWave);
    resizeWave();

    const drawWaves = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;

      // Wave 1 - pink/magenta
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const y = h * 0.35 + Math.sin(x / w * Math.PI * 2.5 + wt * 0.4) * 80
          + Math.sin(x / w * Math.PI * 1.2 + wt * 0.25) * 40;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(255,45,120,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Wave 2 - purple
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const y = h * 0.65 + Math.sin(x / w * Math.PI * 2 + wt * 0.3 + 1) * 60
          + Math.sin(x / w * Math.PI * 3 + wt * 0.5) * 25;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(155,77,255,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();

      wt += 0.008;
      animationFrameId = requestAnimationFrame(drawWaves);
    };

    drawWaves();

    return () => {
      window.removeEventListener('resize', resizeWave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMsg(`⟡ ${msg}`);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Task Actions
  const addTask = (title: string, p: 'low' | 'medium' | 'high', status: TaskStatus) => {
    if (!title.trim()) return;
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      assignee: 'PHANTOM_X', // Hardcoded for now based on design
      status,
      priority: p,
      createdAt: Date.now(),
      author: 'User',
      tags: [],
      progress: 0
    };
    setTasks(prev => [newTask, ...prev]);
    showToast('TASK INJECTED INTO QUEUE');
  };

  const handleQuickAdd = () => {
    addTask(newTaskTitle, priority, TaskStatus.TODO);
    setNewTaskTitle('');
  };

  const handleModalAdd = () => {
    addTask(modalTitle, modalPriority, modalColumn);
    closeModal();
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    showToast('TASK TERMINATED');
  };

  // Drag & Drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id);
    // Add dragging class after a short delay to allow the drag image to be captured
    setTimeout(() => {
        const el = document.getElementById(`task-${id}`);
        if (el) el.classList.add('dragging');
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent, id: string) => {
    const el = document.getElementById(`task-${id}`);
    if (el) el.classList.remove('dragging');
    setDraggedId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-target');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-target');
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-target');
    const id = e.dataTransfer.getData('text/plain');
    
    if (id) {
        setTasks(prev => {
            const index = prev.findIndex(t => t.id === id);
            if (index === -1) return prev;
            const task = { ...prev[index], status };
            const newTasks = prev.filter(t => t.id !== id);
            newTasks.push(task);
            return newTasks;
        });
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
        showToast('TASK STATUS UPDATED');
    }
  };

  const handleTaskDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    if (offsetY > rect.height / 2) {
        e.currentTarget.classList.remove('drag-over-top');
        e.currentTarget.classList.add('drag-over-bottom');
    } else {
        e.currentTarget.classList.remove('drag-over-bottom');
        e.currentTarget.classList.add('drag-over-top');
    }
  };

  const handleTaskDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over-top');
    e.currentTarget.classList.remove('drag-over-bottom');
  };

  const handleTaskDrop = (e: React.DragEvent, status: TaskStatus, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over-top');
    e.currentTarget.classList.remove('drag-over-bottom');

    const id = e.dataTransfer.getData('text/plain');
    if (!id || id === targetId) return;

    setTasks(prev => {
        const draggedTaskIndex = prev.findIndex(t => t.id === id);
        if (draggedTaskIndex === -1) return prev;
        
        const draggedTask = { ...prev[draggedTaskIndex], status };
        let newTasks = prev.filter(t => t.id !== id);
        
        const targetIndex = newTasks.findIndex(t => t.id === targetId);
        if (targetIndex === -1) {
            newTasks.push(draggedTask);
        } else {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const offsetY = e.clientY - rect.top;
            if (offsetY > rect.height / 2) {
                newTasks.splice(targetIndex + 1, 0, draggedTask);
            } else {
                newTasks.splice(targetIndex, 0, draggedTask);
            }
        }
        
        return newTasks;
    });
    showToast('TASK REPOSITIONED');
  };

  // Modal
  const openModal = (col: TaskStatus) => {
    setModalColumn(col);
    setModalTitle('');
    setModalDesc('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Column Helper
  const renderColumn = (status: TaskStatus, title: string, colClass: string) => {
    const colTasks = tasks.filter(t => t.status === status);
    
    return (
      <div 
        className={`kb-column ${colClass}`}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, status)}
        onDragLeave={handleDragLeave}
      >
        <div className="kb-col-header">
          <div className="kb-col-header-bar"></div>
          <div className="kb-col-title">
            {title}
            <span className="kb-col-count">{colTasks.length}</span>
          </div>
          <button className="kb-col-add" onClick={() => openModal(status)}>+</button>
        </div>
        <div className="kb-col-body">
          {colTasks.length === 0 ? (
            <div className="kb-col-empty">
              <div className="kb-col-empty-icon">◌</div>
              <div className="kb-col-empty-text">NO TASKS</div>
            </div>
          ) : (
            colTasks.map(task => (
              <div
                key={task.id}
                id={`task-${task.id}`}
                className="kb-task-card"
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={(e) => handleDragEnd(e, task.id)}
                onDragOver={handleTaskDragOver}
                onDragLeave={handleTaskDragLeave}
                onDrop={(e) => handleTaskDrop(e, status, task.id)}
              >
                <div className="kb-card-top">
                  <div className="kb-card-title">{task.title}</div>
                  <button className="kb-card-menu" onClick={() => deleteTask(task.id)}>✕</button>
                </div>
                <div className="kb-card-meta">
                  <div className="kb-card-author">{task.assignee}</div>
                  <div className={`kb-priority-badge kb-priority-${task.priority}`}>{task.priority}</div>
                </div>
                {/* Simulated progress for visual fidelity to design */}
                {status === TaskStatus.DOING && (
                    <div className="kb-card-progress">
                        <div className="kb-progress-bar">
                            <div className="kb-progress-fill" style={{ width: '65%' }}></div>
                        </div>
                    </div>
                )}
                {status === TaskStatus.DONE && (
                    <div className="kb-card-progress">
                        <div className="kb-progress-bar">
                            <div className="kb-progress-fill" style={{ width: '100%' }}></div>
                        </div>
                    </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="kanban-wrapper h-full w-full relative">
        <div className="kb-stars"></div>
        <div className="kb-scanline"></div>
        <canvas ref={canvasRef} className="kb-wave-canvas" />

        <div className="kb-app h-full">
            {/* MAIN */}
            <div className="kb-main">
                <div className="kb-content">
                    {/* Task Input */}
                    <div className="kb-task-input-bar">
                        <div className="kb-task-input-wrap">
                            <input 
                                type="text" 
                                className="kb-task-input" 
                                placeholder="INJECT NEW TASK INTO QUEUE..."
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                            />
                        </div>
                        <select 
                            className="kb-priority-select"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as any)}
                        >
                            <option value="high">HIGH</option>
                            <option value="medium">MEDIUM</option>
                            <option value="low">LOW</option>
                        </select>
                        <button className="kb-add-btn" onClick={handleQuickAdd}>+ INJECT TASK</button>
                    </div>

                    {/* Board */}
                    <div className="kb-board">
                        {renderColumn(TaskStatus.TODO, 'TO DO', 'kb-col-todo')}
                        {renderColumn(TaskStatus.DOING, 'IN PROGRESS', 'kb-col-progress')}
                        {renderColumn(TaskStatus.DONE, 'DONE', 'kb-col-done')}
                    </div>
                </div>
            </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
            <div className="kb-modal-overlay open" onClick={(e) => e.target === e.currentTarget && closeModal()}>
                <div className="kb-modal">
                    <div className="kb-modal-title">INJECT NEW TASK</div>
                    <button className="kb-modal-close" onClick={closeModal}>✕</button>
                    <div className="kb-modal-field">
                        <div className="kb-modal-label">TASK DESIGNATION</div>
                        <input 
                            type="text" 
                            className="kb-modal-input" 
                            placeholder="Enter task name..."
                            value={modalTitle}
                            onChange={(e) => setModalTitle(e.target.value)}
                        />
                    </div>
                    <div className="kb-modal-field">
                        <div className="kb-modal-label">DESCRIPTION</div>
                        <textarea 
                            className="kb-modal-textarea" 
                            placeholder="Optional details..."
                            value={modalDesc}
                            onChange={(e) => setModalDesc(e.target.value)}
                        ></textarea>
                    </div>
                    <div className="kb-modal-field">
                        <div className="kb-modal-label">PRIORITY LEVEL</div>
                        <select 
                            className="kb-modal-select"
                            value={modalPriority}
                            onChange={(e) => setModalPriority(e.target.value as any)}
                        >
                            <option value="high">HIGH</option>
                            <option value="medium">MEDIUM</option>
                            <option value="low">LOW</option>
                        </select>
                    </div>
                    <div className="kb-modal-field">
                        <div className="kb-modal-label">TARGET COLUMN</div>
                        <select 
                            className="kb-modal-select"
                            value={modalColumn}
                            onChange={(e) => setModalColumn(e.target.value as any)}
                        >
                            <option value={TaskStatus.TODO}>TO DO</option>
                            <option value={TaskStatus.DOING}>IN PROGRESS</option>
                            <option value={TaskStatus.DONE}>DONE</option>
                        </select>
                    </div>
                    <div className="kb-modal-actions">
                        <button className="kb-modal-btn kb-modal-btn-secondary" onClick={closeModal}>ABORT</button>
                        <button className="kb-modal-btn kb-modal-btn-primary" onClick={handleModalAdd}>INJECT TASK</button>
                    </div>
                </div>
            </div>
        )}

        {/* Toast */}
        <div className={`kb-toast ${toastMsg ? 'show' : ''}`}>
            {toastMsg}
        </div>
    </div>
  );
};

