"use client";

import React, { useState, useRef, useEffect } from 'react';
import Canvas from '../components/canvas/Canvas';
import Toolbar from '../components/ui/Toolbar';
import { CanvasElement } from '../lib/types';
import { v4 as uuidv4 } from 'uuid';

export default function WhiteboardPage() {
  const [currentTool, setCurrentTool] = useState<string>('select');
  const [elements, setElements] = useState<CanvasElement[]>([]);

  // State for the element currently being edited (if any)
  const [editingElement, setEditingElement] = useState<CanvasElement | null>(null);

  const toolbarWrapperRef = useRef<HTMLDivElement>(null);
  const [toolbarHeight, setToolbarHeight] = useState(0);

  useEffect(() => {
    const updateToolbarHeight = () => {
      if (toolbarWrapperRef.current) {
        setToolbarHeight(toolbarWrapperRef.current.offsetHeight);
      }
    };
    updateToolbarHeight();
    window.addEventListener('resize', updateToolbarHeight);
    return () => window.removeEventListener('resize', updateToolbarHeight);
  }, []);

  const addElement = (newElementPartial: Omit<CanvasElement, 'id'>) => {
    let fullElement: Omit<CanvasElement, 'id'>;
    if (newElementPartial.type === 'text') {
      fullElement = {
        ...newElementPartial,
        text: newElementPartial.text || "Type here...", // Default text for new text elements
        fill: newElementPartial.fill || 'black',
        // Konva determines width/height for text based on content and fontSize
      };
    } else {
      fullElement = newElementPartial;
    }
    const elementWithId: CanvasElement = { ...fullElement, id: uuidv4() };
    setElements((prevElements) => [...prevElements, elementWithId]);
    // If it's a new text element, maybe we want to edit it immediately?
    // if (fullElement.type === 'text') {
    //   setEditingElement(elementWithId);
    // }
  };

  const updateElement = (updatedElement: CanvasElement) => {
    setElements((prevElements) =>
      prevElements.map((el) => (el.id === updatedElement.id ? updatedElement : el))
    );
    setEditingElement(null); // Stop editing after update
  };

  // This function will be called by Canvas when the user clicks (or dblclicks) a text element
  // or when a new text element is added and we want to edit it immediately.
  const handleSetEditingElement = (element: CanvasElement | null) => {
    setEditingElement(element);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative' }}>
      <div ref={toolbarWrapperRef}>
        <Toolbar currentTool={currentTool} setCurrentTool={setCurrentTool} />
      </div>
      <Canvas
        currentTool={currentTool}
        elements={elements}
        addElement={addElement} // Used by Canvas to add new elements (rectangles, or new text placeholders)
        toolbarHeight={toolbarHeight}
        editingElement={editingElement} // Pass the element being edited (or null)
        onSetEditingElement={handleSetEditingElement} // Allows Canvas to tell Page which element to edit
        onUpdateElement={updateElement} // Allows Canvas to send updated element data to Page
      />
      {/* The HTML textarea for editing will now be managed INSIDE Canvas.tsx */}
    </div>
  );
}
