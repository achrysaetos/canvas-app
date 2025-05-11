"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text as KonvaText } from 'react-konva';
import { CanvasElement } from '../../lib/types';
import Konva from 'konva';

interface CanvasProps {
  currentTool: string;
  elements: CanvasElement[];
  addElement: (element: Omit<CanvasElement, 'id'>) => void;
  toolbarHeight: number;
  editingElement: CanvasElement | null;
  onSetEditingElement: (element: CanvasElement | null) => void;
  onUpdateElement: (element: CanvasElement) => void;
}

const Canvas: React.FC<CanvasProps> = ({
  currentTool,
  elements,
  addElement,
  toolbarHeight,
  editingElement,
  onSetEditingElement,
  onUpdateElement,
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingRect, setDrawingRect] = useState<Omit<CanvasElement, 'id' | 'type' | 'fill'> & { fill?: string } | null>(null);

  const [inlineEditText, setInlineEditText] = useState('');
  const [textareaStyles, setTextareaStyles] = useState<React.CSSProperties>({ display: 'none' });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    console.log("Current tool in Canvas:", currentTool, "Toolbar Height:", toolbarHeight);
    setIsDrawing(false);
    setDrawingRect(null);
    if (editingElement && editingElement.type !== 'text') {
        onSetEditingElement(null);
    }
  }, [currentTool, toolbarHeight, editingElement, onSetEditingElement]);

  useEffect(() => {
    if (editingElement && editingElement.type === 'text' && stageRef.current && layerRef.current) {
      const textNode = stageRef.current.findOne(`#${editingElement.id}`) as Konva.Text;
      if (textNode) {
        const textPosition = textNode.getAbsolutePosition();
        const stageBox = stageRef.current.container().getBoundingClientRect();

        const areaPosition = {
            x: stageBox.left + textPosition.x,
            y: stageBox.top + textPosition.y
        };

        setTextareaStyles({
          display: 'block',
          position: 'absolute',
          top: `${areaPosition.y}px`,
          left: `${areaPosition.x}px`,
          width: `${textNode.width() * textNode.scaleX()}px`,
          height: `${textNode.height() * textNode.scaleY() + 5}px`,
          fontSize: `${textNode.fontSize()}px`,
          fontFamily: textNode.fontFamily(),
          lineHeight: String(textNode.lineHeight()),
          border: '1px solid #333',
          padding: `${textNode.padding()}px`,
          margin: '0',
          overflow: 'hidden',
          background: 'white',
          zIndex: 1000,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word'
        });
        setInlineEditText(editingElement.text || '');
        textareaRef.current?.focus();
      } else {
        setTextareaStyles({ display: 'none' });
      }
    } else {
      setTextareaStyles({ display: 'none' });
    }
  }, [editingElement, elements]);

  const handleTextareaBlur = () => {
    if (editingElement && editingElement.type === 'text') {
      onUpdateElement({ ...editingElement, text: inlineEditText });
      onSetEditingElement(null);
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextareaBlur();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onSetEditingElement(null);
    }
  };

  const handleMouseDown = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    if (currentTool === 'rectangle') {
      if (editingElement) onSetEditingElement(null);
      setIsDrawing(true);
      setDrawingRect({ x: pos.x, y: pos.y, width: 0, height: 0, fill: 'rgba(0,0,255,0.5)' });
    } else if (currentTool === 'text') {
      if (editingElement) onSetEditingElement(null);
      addElement({ type: 'text', x: pos.x, y: pos.y, text: 'Type here...', fill: 'black' });
    }
  };

  const handleMouseMove = () => {
    if (!isDrawing || currentTool !== 'rectangle' || !drawingRect) return;
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    setDrawingRect({ ...drawingRect, width: pos.x - (drawingRect.x || 0), height: pos.y - (drawingRect.y || 0) });
  };

  const handleMouseUp = () => {
    if (isDrawing && currentTool === 'rectangle' && drawingRect) {
      const { x, y, width, height } = drawingRect;
      if (typeof x === 'number' && typeof y === 'number' && typeof width === 'number' && typeof height === 'number' && width !== 0 && height !== 0) {
        addElement({ type: 'rectangle', x: width > 0 ? x : x + width, y: height > 0 ? y : y + height, width: Math.abs(width), height: Math.abs(height), fill: 'blue' });
      }
    }
    setIsDrawing(false);
    setDrawingRect(null);
  };

  const [stageDimensions, setStageDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (typeof window !== "undefined") {
        const th = typeof toolbarHeight === 'number' && !isNaN(toolbarHeight) ? toolbarHeight : 50;
        setStageDimensions({ width: window.innerWidth, height: window.innerHeight - th });
      }
    };
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, [toolbarHeight]);

  return (
    <div style={{ flexGrow: 1, position: 'relative' }}>
      <Stage
        width={stageDimensions.width}
        height={stageDimensions.height}
        ref={stageRef}
        style={{ border: '1px solid #ccc', backgroundColor: '#f0f0f0' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer ref={layerRef}>
          {elements.map((el) => {
            const isCurrentlyEditing = editingElement && editingElement.id === el.id && editingElement.type === 'text';
            if (el.type === 'rectangle' && el.width && el.height) {
              return (
                <Rect
                  key={el.id}
                  id={el.id}
                  x={el.x}
                  y={el.y}
                  width={el.width}
                  height={el.height}
                  fill={el.fill}
                  draggable={currentTool === 'select'}
                  onClick={() => {
                    if (currentTool === 'select') console.log('Selected Rectangle:', el);
                    if (editingElement) onSetEditingElement(null);
                  }}
                />
              );
            }
            if (el.type === 'text' && el.text) {
              return (
                <KonvaText
                  key={el.id}
                  id={el.id}
                  x={el.x}
                  y={el.y}
                  text={el.text}
                  fontSize={el.fontSize || 20}
                  fontFamily={el.fontFamily || 'sans-serif'}
                  fill={el.fill}
                  draggable={currentTool === 'select'}
                  visible={!isCurrentlyEditing}
                  onDblClick={() => {
                    if (currentTool === 'select' || currentTool === 'text') {
                      onSetEditingElement(el);
                    }
                  }}
                  onClick={() => {
                     if (currentTool === 'select') console.log('Selected Text:', el);
                  }}
                />
              );
            }
            return null;
          })}
          {isDrawing && currentTool === 'rectangle' && drawingRect && (
            <Rect
              x={drawingRect.x || 0}
              y={drawingRect.y || 0}
              width={drawingRect.width || 0}
              height={drawingRect.height || 0}
              fill={drawingRect.fill || 'transparent'}
              stroke="black"
              strokeWidth={1}
            />
          )}
        </Layer>
      </Stage>
      {editingElement && editingElement.type === 'text' && (
        <textarea
          ref={textareaRef}
          value={inlineEditText}
          onChange={(e) => setInlineEditText(e.target.value)}
          onBlur={handleTextareaBlur}
          onKeyDown={handleTextareaKeyDown}
          style={textareaStyles}
        />
      )}
    </div>
  );
};

export default Canvas; 