import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { Eraser, Pen, RefreshCcw, Hand, MousePointer2, Square, Circle, Type, ArrowUpRight, Undo2, Redo2, Download, Trash2 } from 'lucide-react';
import { Stage, Layer, Line, Rect, Ellipse, Text as KonvaText, Arrow, Transformer } from 'react-konva';
import Konva from 'konva';

interface WhiteboardProps {
    socket: Socket | null;
    roomName: string;
}

type ToolType = 'select' | 'pan' | 'pen' | 'eraser' | 'rect' | 'circle' | 'arrow' | 'text';

interface WbObject {
    id: string;
    type: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    radiusX?: number;
    radiusY?: number;
    points?: number[];
    text?: string;
    fontSize?: number;
    color: string;
    strokeWidth: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    globalCompositeOperation?: string;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({ socket, roomName }) => {
    const stageRef = useRef<Konva.Stage>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDrawing = useRef(false);
    
    const [objects, setObjects] = useState<WbObject[]>([]);
    const [selectedId, selectShape] = useState<string | null>(null);
    const [tool, setTool] = useState<ToolType>('pen');
    const [color, setColor] = useState('#FF2D78');
    const [strokeWidth, setStrokeWidth] = useState(3);
    const [scale, setScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
    
    // Undo/Redo queues
    const [undoStack, setUndoStack] = useState<WbObject[][]>([]);
    const [redoStack, setRedoStack] = useState<WbObject[][]>([]);

    useEffect(() => {
        if (!socket) return;
        
        socket.on('whiteboard:sync', (initialState: WbObject[]) => {
            setObjects(initialState);
            setUndoStack([initialState]);
            setRedoStack([]);
        });

        socket.on('whiteboard:action', ({ action, data }: { action: string, data: WbObject }) => {
            setObjects(prev => {
                if (action === 'add') return [...prev, data];
                if (action === 'update') return prev.map(obj => obj.id === data.id ? { ...obj, ...data } : obj);
                if (action === 'remove') return prev.filter(obj => obj.id !== data.id);
                return prev;
            });
        });

        socket.on('whiteboard:clear', () => {
            setObjects([]);
            selectShape(null);
        });

        return () => {
             socket.off('whiteboard:sync');
             socket.off('whiteboard:action');
             socket.off('whiteboard:clear');
        };
    }, [socket]);

    useEffect(() => {
        const handleResize = () => {
             if (containerRef.current) {
                 setStageSize({
                     width: containerRef.current.clientWidth,
                     height: containerRef.current.clientHeight
                 });
             }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Handle Keyboard Delete
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedId && tool === 'select') {
                    // Prevent deleting text inside input
                    const activeEl = document.activeElement;
                    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;
                    handleDeleteSelected();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, tool]);

    const emitAction = (action: 'add' | 'update' | 'remove', data: Partial<WbObject>) => {
        if (!socket) return;
        socket.emit('whiteboard:action', { action, data });
    };

    const commitStateToHistory = () => {
        setUndoStack(prev => {
             const newStack = [...prev, objects];
             if (newStack.length > 50) newStack.shift(); // Max 50 undos
             return newStack;
        });
        setRedoStack([]);
    };

    const handleUndo = () => {
         if (undoStack.length <= 1) return;
         const currentState = undoStack[undoStack.length - 1];
         const previousState = undoStack[undoStack.length - 2];
         
         setRedoStack(prev => [currentState, ...prev]);
         setUndoStack(prev => prev.slice(0, -1));
         
         // In a real robust system, we would calculate diffs and emit update/add/remove. 
         // For a simple hackathon version, if you undo, it might desync slightly if others are drawing, 
         // but we can locally set objects or emit a full sync (expensive). 
         // To keep it simple, we just set locally, maybe emit updates for changed items.
         // A hack: just rely on it locally for now, or emit a clear + bulk add.
         // Let's just do it locally. If they need to force sync, they can draw something.
         setObjects(previousState);
    };

    const handleRedo = () => {
         if (redoStack.length === 0) return;
         const nextState = redoStack[0];
         
         setUndoStack(prev => [...prev, nextState]);
         setRedoStack(prev => prev.slice(1));
         setObjects(nextState);
    };

    const generateId = () => Math.random().toString(36).substr(2, 9);

    const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            selectShape(null);
        }
    };

    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (tool === 'select' || tool === 'pan') {
            checkDeselect(e);
            return;
        }

        const stage = e.target.getStage();
        if (!stage) return;
        
        const pos = stage.getPointerPosition();
        if (!pos) return;
        
        // Transform pos to relative canvas coords taking scale/pos into account
        const x = (pos.x - stagePos.x) / scale;
        const y = (pos.y - stagePos.y) / scale;

        isDrawing.current = true;
        selectShape(null); // Deselect when drawing new shape

        const newObj: WbObject = {
            id: generateId(),
            type: tool,
            color: tool === 'eraser' ? '#000000' : color,
            strokeWidth: tool === 'eraser' ? strokeWidth * 2 : strokeWidth,
            globalCompositeOperation: tool === 'eraser' ? 'destination-out' : 'source-over'
        };

        if (tool === 'pen' || tool === 'eraser') {
            newObj.points = [x, y];
        } else if (tool === 'text') {
            const text = prompt('Enter text:');
            if (!text) {
                isDrawing.current = false;
                setTool('select');
                return;
            }
            newObj.x = x;
            newObj.y = y;
            newObj.text = text;
            newObj.fontSize = strokeWidth * 6 + 12;
            isDrawing.current = false; // Text is instant
        } else {
            // rect, circle, arrow
            newObj.x = x;
            newObj.y = y;
            newObj.width = 0;
            newObj.height = 0;
            if (tool === 'arrow') {
                newObj.points = [x, y, x, y];
            } else if (tool === 'circle') {
                newObj.radiusX = 0;
                newObj.radiusY = 0;
            }
        }

        const newObjects = [...objects, newObj];
        setObjects(newObjects);
        emitAction('add', newObj);
        commitStateToHistory();
    };

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (!isDrawing.current || tool === 'select' || tool === 'pan' || tool === 'text') {
            return;
        }

        const stage = e.target.getStage();
        if (!stage) return;
        
        const pos = stage.getPointerPosition();
        if (!pos) return;
        
        const x = (pos.x - stagePos.x) / scale;
        const y = (pos.y - stagePos.y) / scale;

        const lastElement = objects[objects.length - 1];
        if (!lastElement) return;

        const updatedData: Partial<WbObject> = { id: lastElement.id };

        if (tool === 'pen' || tool === 'eraser') {
            const newPoints = lastElement.points ? lastElement.points.concat([x, y]) : [x, y];
            lastElement.points = newPoints;
            updatedData.points = newPoints;
        } else if (tool === 'rect') {
            lastElement.width = x - (lastElement.x || 0);
            lastElement.height = y - (lastElement.y || 0);
            updatedData.width = lastElement.width;
            updatedData.height = lastElement.height;
        } else if (tool === 'circle') {
            lastElement.radiusX = Math.abs(x - (lastElement.x || 0));
            lastElement.radiusY = Math.abs(y - (lastElement.y || 0));
            updatedData.radiusX = lastElement.radiusX;
            updatedData.radiusY = lastElement.radiusY;
        } else if (tool === 'arrow') {
            const startX = lastElement.points ? lastElement.points[0] : 0;
            const startY = lastElement.points ? lastElement.points[1] : 0;
            lastElement.points = [startX, startY, x, y];
            updatedData.points = lastElement.points;
        }

        setObjects([...objects.slice(0, -1), lastElement]);
        
        // Throttling emit could be added here, but for simplicity we'll emit every move
        emitAction('update', updatedData);
    };

    const handleMouseUp = () => {
        if (isDrawing.current) {
            isDrawing.current = false;
        }
    };

    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        if (e.evt.ctrlKey || e.evt.metaKey) {
            // Zoom
            const stage = stageRef.current;
            if(!stage) return;
            const oldScale = stage.scaleX();
            const pointer = stage.getPointerPosition();
            if(!pointer) return;

            const mousePointTo = {
                x: (pointer.x - stage.x()) / oldScale,
                y: (pointer.y - stage.y()) / oldScale,
            };

            const direction = e.evt.deltaY > 0 ? -1 : 1;
            const zoomAmount = 1.1;
            const newScale = direction > 0 ? oldScale * zoomAmount : oldScale / zoomAmount;
            
            const limitedScale = Math.min(Math.max(newScale, 0.1), 5);
            setScale(limitedScale);
            setStagePos({
                x: pointer.x - mousePointTo.x * limitedScale,
                y: pointer.y - mousePointTo.y * limitedScale
            });
        } else {
            // Pan
            setStagePos(prev => ({
                x: prev.x - e.evt.deltaX,
                y: prev.y - e.evt.deltaY
            }));
        }
    };
    
    const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
        if (tool !== 'select') return;
        selectShape(e.target.id());
    };

    const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
        if (tool !== 'select') return;
        const id = e.target.id();
        const x = e.target.x();
        const y = e.target.y();
        
        setObjects(prev => prev.map(obj => obj.id === id ? { ...obj, x, y } : obj));
        emitAction('update', { id, x, y });
        commitStateToHistory();
    };
    
    const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
        const node = e.target;
        const id = node.id();
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const rotation = node.rotation();
        const x = node.x();
        const y = node.y();

        setObjects(prev => prev.map(obj => obj.id === id ? { ...obj, x, y, scaleX, scaleY, rotation } : obj));
        emitAction('update', { id, x, y, scaleX, scaleY, rotation });
        commitStateToHistory();
    };

    const handleDeleteSelected = () => {
        if (selectedId) {
            setObjects(prev => prev.filter(obj => obj.id !== selectedId));
            emitAction('remove', { id: selectedId });
            commitStateToHistory();
            selectShape(null);
        }
    };

    const handleClearServer = () => {
        setObjects([]);
        selectShape(null);
        if(socket) socket.emit('whiteboard:clear');
        setStagePos({x:0, y:0});
        setScale(1);
    };
    
    const handleResetView = () => {
        setStagePos({ x: 0, y: 0 });
        setScale(1);
        if (stageRef.current) {
            stageRef.current.position({ x: 0, y: 0 });
            stageRef.current.scale({ x: 1, y: 1 });
            stageRef.current.batchDraw();
        }
    };

    const handleDownload = () => {
        const stage = stageRef.current;
        if (!stage) return;
        // Briefly deselect to avoid rendering transformer in image
        const prevSelected = selectedId;
        selectShape(null);
        
        setTimeout(() => {
            const dataURL = stage.toDataURL({ pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = `synapse-board-${Date.now()}.png`;
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            selectShape(prevSelected);
        }, 50);
    };

    return (
        <div className="h-full w-full flex flex-col items-center bg-[#0D0D0D] rounded-xl border border-hack-border overflow-hidden relative">
            
            {/* Toolbar Top Left */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <div className="bg-hack-surface/90 backdrop-blur-md p-2 rounded-lg border border-hack-border flex md:flex-col gap-2 shadow-lg w-max">
                    <ToolButton icon={<MousePointer2 size={18}/>} tooltip="Select" active={tool === 'select'} onClick={() => setTool('select')} />
                    <ToolButton icon={<Hand size={18} />} tooltip="Pan Space" active={tool === 'pan'} onClick={() => { setTool('pan'); selectShape(null); }} />
                    <div className="h-px w-full bg-hack-border my-1 hidden md:block"></div>
                    <div className="w-px h-full bg-hack-border mx-1 md:hidden"></div>
                    <ToolButton icon={<Pen size={18} />} tooltip="Pen" active={tool === 'pen'} onClick={() => { setTool('pen'); selectShape(null); }} />
                    <ToolButton icon={<Eraser size={18} />} tooltip="Eraser" active={tool === 'eraser'} onClick={() => { setTool('eraser'); selectShape(null); }} />
                    <div className="h-px w-full bg-hack-border my-1 hidden md:block"></div>
                    <div className="w-px h-full bg-hack-border mx-1 md:hidden"></div>
                    <ToolButton icon={<Square size={18} />} tooltip="Rectangle" active={tool === 'rect'} onClick={() => { setTool('rect'); selectShape(null); }} />
                    <ToolButton icon={<Circle size={18} />} tooltip="Circle" active={tool === 'circle'} onClick={() => { setTool('circle'); selectShape(null); }} />
                    <ToolButton icon={<ArrowUpRight size={18} />} tooltip="Arrow" active={tool === 'arrow'} onClick={() => { setTool('arrow'); selectShape(null); }} />
                    <ToolButton icon={<Type size={18} />} tooltip="Text" active={tool === 'text'} onClick={() => { setTool('text'); selectShape(null); }} />
                </div>
                
                {/* Properties Panel */}
                {(tool !== 'select' && tool !== 'pan' && tool !== 'eraser') && (
                    <div className="bg-hack-surface/90 backdrop-blur-md p-2 rounded-lg border border-hack-border flex md:flex-col gap-2 shadow-lg items-center">
                         <input 
                            type="color" 
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-8 h-8 p-0 border-0 rounded cursor-pointer shrink-0"
                            title="Color"
                        />
                        <input 
                           type="range"
                           min="1"
                           max="20"
                           value={strokeWidth}
                           onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                           className="w-24 md:w-auto mt-2"
                           title={`Size: ${strokeWidth}px`}
                        />
                    </div>
                )}
            </div>

            {/* Actions Top Right */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                 <div className="bg-hack-surface/90 backdrop-blur-md p-1 rounded-lg border border-hack-border flex gap-1 shadow-lg items-center px-2">
                    <button onClick={handleUndo} disabled={undoStack.length <= 1} className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><Undo2 size={18}/></button>
                    <button onClick={handleRedo} disabled={redoStack.length === 0} className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><Redo2 size={18}/></button>
                </div>
                
                <div className="bg-hack-surface/90 backdrop-blur-md p-1 rounded-lg border border-hack-border flex gap-1 shadow-lg items-center px-3">
                   <span className="text-[10px] font-mono text-gray-400 mr-2">{Math.round(scale*100)}%</span>
                   <button onClick={handleResetView} className="text-gray-400 hover:text-hack-primary text-[10px] font-mono font-bold tracking-wider">RESET</button>
                </div>
                
                {selectedId && tool === 'select' && (
                    <button onClick={handleDeleteSelected} className="bg-hack-surface/90 backdrop-blur-md p-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white transition-colors shadow-lg" title="Delete Selected">
                        <Trash2 size={18} />
                    </button>
                )}
                
                <button onClick={handleDownload} className="bg-hack-surface/90 backdrop-blur-md p-2 rounded-lg border border-hack-primary/50 text-hack-primary hover:bg-hack-primary hover:text-black transition-colors shadow-lg" title="Export PNG">
                    <Download size={18} />
                </button>

                <button 
                    onClick={handleClearServer}
                    className="bg-hack-surface/90 backdrop-blur-md p-2 rounded-lg border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-black transition-colors shadow-lg ml-2"
                    title="Clear Board for Everyone"
                >
                    <RefreshCcw size={18} />
                </button>
            </div>
            
            {/* Canvas Container */}
            <div 
                ref={containerRef} 
                className="w-full h-full relative"
                style={{
                  backgroundPosition: `${stagePos.x}px ${stagePos.y}px`,
                  backgroundSize: `${24 * scale}px ${24 * scale}px`,
                  backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.1) ${1 * scale}px, transparent ${1 * scale}px)`
                }}
            >
               <Stage
                    ref={stageRef}
                    width={stageSize.width}
                    height={stageSize.height}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onWheel={handleWheel}
                    onTouchStart={handleMouseDown}
                    onTouchMove={handleMouseMove}
                    onTouchEnd={handleMouseUp}
                    scaleX={scale}
                    scaleY={scale}
                    x={stagePos.x}
                    y={stagePos.y}
                    draggable={tool === 'pan'}
                    onDragEnd={(e) => {
                        if(tool === 'pan') {
                            setStagePos({ x: e.target.x(), y: e.target.y() });
                        }
                    }}
                    className={tool === 'pan' ? 'cursor-grab active:cursor-grabbing' : tool === 'select' ? 'cursor-default' : 'cursor-crosshair'}
               >
                    <Layer>
                        {objects.map((obj, i) => {
                            const isSelected = obj.id === selectedId;
                            const commonProps = {
                                key: obj.id,
                                id: obj.id,
                                x: obj.x,
                                y: obj.y,
                                scaleX: obj.scaleX || 1,
                                scaleY: obj.scaleY || 1,
                                rotation: obj.rotation || 0,
                                draggable: tool === 'select',
                                onClick: () => { if (tool === 'select') selectShape(obj.id); },
                                onTap: () => { if (tool === 'select') selectShape(obj.id); },
                                onDragStart: handleDragStart,
                                onDragEnd: handleDragEnd,
                                onTransformEnd: handleTransformEnd,
                                globalCompositeOperation: obj.globalCompositeOperation as GlobalCompositeOperation
                            };

                            let shapeNode;
                            if (obj.type === 'pen' || obj.type === 'eraser') {
                                shapeNode = <Line {...commonProps} points={obj.points || []} stroke={obj.color} strokeWidth={obj.strokeWidth} tension={0.5} lineCap="round" lineJoin="round" />;
                            } else if (obj.type === 'rect') {
                                shapeNode = <Rect {...commonProps} width={obj.width} height={obj.height} stroke={obj.color} strokeWidth={obj.strokeWidth} />;
                            } else if (obj.type === 'circle') {
                                shapeNode = <Ellipse {...commonProps} radiusX={obj.radiusX || 0} radiusY={obj.radiusY || 0} stroke={obj.color} strokeWidth={obj.strokeWidth} />;
                            } else if (obj.type === 'arrow') {
                                shapeNode = <Arrow {...commonProps} points={obj.points || []} stroke={obj.color} strokeWidth={obj.strokeWidth} fill={obj.color} pointerLength={10} pointerWidth={10} />;
                            } else if (obj.type === 'text') {
                                shapeNode = <KonvaText {...commonProps} text={obj.text} fontSize={obj.fontSize} fill={obj.color} fontFamily="monospace" />;
                            }

                            return <React.Fragment key={obj.id}>{shapeNode}</React.Fragment>;
                        })}
                        <SelectionTransformer selectedId={selectedId} tool={tool} />
                    </Layer>
               </Stage>
            </div>
        </div>
    );
};

// Extracted ToolButton for clean UI
const ToolButton = ({ icon, tooltip, active, onClick }: { icon: React.ReactNode, tooltip: string, active: boolean, onClick: () => void }) => (
    <button 
        onClick={onClick}
        title={tooltip}
        className={`p-2 rounded-md transition-all ${active ? 'bg-hack-primary text-black shadow-[0_0_10px_rgba(var(--hack-primary),0.5)]' : 'text-gray-400 hover:bg-hack-surface-light border border-transparent hover:text-white'}`}
    >
        {icon}
    </button>
);

// Helper component for Transformer
const SelectionTransformer = ({ selectedId, tool }: { selectedId: string | null, tool: ToolType }) => {
    const trRef = useRef<Konva.Transformer>(null);

    useEffect(() => {
        if (!trRef.current) return;
        const stage = trRef.current.getStage();
        if (!stage) return;
        
        if (selectedId && tool === 'select') {
            const node = stage.findOne(`#${selectedId}`);
            if (node) {
                // For lines/arrows, we might not want to show all rotation anchors, but Konva handles it decently.
                trRef.current.nodes([node]);
                trRef.current.getLayer()?.batchDraw();
            } else {
                trRef.current.nodes([]);
            }
        } else {
            trRef.current.nodes([]);
        }
    }, [selectedId, tool]);

    return (
        <Transformer 
            ref={trRef} 
            boundBoxFunc={(oldBox, newBox) => {
                // limit resize
                if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) return oldBox;
                return newBox;
            }}
            borderStroke="#FACC15"
            anchorStroke="#FACC15"
            anchorFill="#000"
            anchorSize={8}
            rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
        />
    );
};
