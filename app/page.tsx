"use client";

import React, { useState, useRef, useEffect } from 'react';
import Canvas from '../components/canvas/Canvas';
import Toolbar from '../components/ui/Toolbar';
import { CanvasElement } from '../lib/types';
import { v4 as uuidv4 } from 'uuid';

export default function WhiteboardPage() {
  const [currentTool, setCurrentTool] = useState<string>('select');
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [editingElement, setEditingElement] = useState<CanvasElement | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null); // State for selected element ID

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
        text: newElementPartial.text || "Type here...",
        fill: newElementPartial.fill || 'black',
        fontSize: newElementPartial.fontSize || 20,
        fontFamily: newElementPartial.fontFamily || 'sans-serif',
      };
    } else {
      fullElement = newElementPartial;
    }
    const elementWithId: CanvasElement = { ...fullElement, id: uuidv4() };
    setElements((prevElements) => [...prevElements, elementWithId]);
    // setSelectedElementId(elementWithId.id); // Optionally select new elements
    // if (fullElement.type === 'text') setEditingElement(elementWithId); // Optionally edit new text elements
  };

  const updateElement = (updatedElement: CanvasElement) => {
    setElements((prevElements) =>
      prevElements.map((el) => (el.id === updatedElement.id ? updatedElement : el))
    );
    // setEditingElement(null); // EditingElement is set to null by Canvas interactions already
  };

  const handleSetEditingElement = (element: CanvasElement | null) => {
    setEditingElement(element);
    if (element) setSelectedElementId(element.id); // Also select if starting to edit
    else setSelectedElementId(null); // Or clear selection if stopping edit
  };

  const handleSetSelectedElementId = (id: string | null) => {
    setSelectedElementId(id);
    if (id === null) {
      setEditingElement(null); // Stop editing if deselecting
    }
    // If an element is selected, and it's different from the currently editing one, stop editing.
    if (id && editingElement && id !== editingElement.id) {
        setEditingElement(null);
    }
  };

  const deleteSelectedElement = () => {
    if (!selectedElementId) return;
    setElements((prevElements) => prevElements.filter((el) => el.id !== selectedElementId));
    setSelectedElementId(null);
    setEditingElement(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative' }}>
      <div ref={toolbarWrapperRef}>
        <Toolbar
          currentTool={currentTool}
          setCurrentTool={setCurrentTool}
          deleteSelectedElement={deleteSelectedElement} // Pass delete function
          selectedElementId={selectedElementId} // Pass selectedId to enable/disable delete button
        />
      </div>
      <Canvas
        currentTool={currentTool}
        elements={elements}
        addElement={addElement}
        toolbarHeight={toolbarHeight}
        editingElement={editingElement}
        onSetEditingElement={handleSetEditingElement}
        onUpdateElement={updateElement}
        selectedElementId={selectedElementId} // Pass selectedId
        onSetSelectedElementId={handleSetSelectedElementId} // Pass setter
      />
    </div>
  );
}
