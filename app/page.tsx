"use client";

import React, { useState, useRef, useEffect } from 'react';
import Canvas from '../components/canvas/Canvas';
import Toolbar from '../components/ui/Toolbar';
import { CanvasElement } from '../lib/types';

export default function WhiteboardPage() {
  const [currentTool, setCurrentTool] = useState<string>('select');
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [editingElement, setEditingElement] = useState<CanvasElement | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null); // State for selected element ID

  const toolbarWrapperRef = useRef<HTMLDivElement>(null);
  const [toolbarHeight, setToolbarHeight] = useState(0);

  const canvasId = "canvas01"; // Define canvasId

  useEffect(() => {
    const fetchElements = async () => {
      try {
        const response = await fetch(`/api/canvases/${canvasId}/elements`);
        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            // Ignore if response is not JSON
          }
          console.error('Failed to fetch elements. Status:', response.status, 'Data:', errorData);
          throw new Error(`Failed to fetch elements: ${errorData?.message || response.statusText}`);
        }
        const fetchedElements: CanvasElement[] = await response.json();
        setElements(fetchedElements);
        console.log('Elements fetched successfully:', fetchedElements);
      } catch (error) {
        console.error('Error fetching elements:', error);
        // setElements([]); // Optionally clear elements or show an error message
      }
    };
    fetchElements();
  }, []); // Empty dependency array ensures this runs only once on mount

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

  const addElement = async (newElementPartial: Omit<CanvasElement, 'id'>) => {
    let fullElementOnFrontend: Omit<CanvasElement, 'id'>; // Renamed to avoid confusion
    if (newElementPartial.type === 'text') {
      fullElementOnFrontend = {
        ...newElementPartial,
        text: newElementPartial.text || "Type here...",
        fill: newElementPartial.fill || 'black',
        fontSize: newElementPartial.fontSize || 20,
        fontFamily: newElementPartial.fontFamily || 'sans-serif',
      };
    } else {
      fullElementOnFrontend = newElementPartial;
    }
    // No longer create elementWithId here for optimistic update with frontend ID
    // Optimistic update will use a temporary ID or handle differently if needed,
    // but final state should come from backend response.

    try {
      // Send only the necessary data, backend will generate ID
      const response = await fetch(`/api/canvases/${canvasId}/elements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullElementOnFrontend), // Send data without frontend ID
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          // Ignore if response is not JSON
        }
        console.error('Failed to add element. Status:', response.status, 'Data:', errorData);
        throw new Error(`Failed to add element: ${errorData?.message || response.statusText}`);
      }
      
      const savedElement = await response.json() as CanvasElement; // Element from backend with backend-generated ID
      
      setElements((prevElements) => [...prevElements, savedElement]); // Add the confirmed element from backend
      console.log('Element added successfully with backend ID:', savedElement);

      // Optionally select new elements or set for editing
      // setSelectedElementId(savedElement.id);
      // if (savedElement.type === 'text') setEditingElement(savedElement);

    } catch (error) {
      console.error('Error adding element:', error);
      // Consider how to handle error: maybe remove an optimistically added element if you had one
    }
  };

  const updateElement = async (updatedElement: CanvasElement) => {
    const oldElements = elements;
    setElements((prevElements) =>
      prevElements.map((el) => (el.id === updatedElement.id ? updatedElement : el))
    );

    try {
      const response = await fetch(`/api/canvases/${canvasId}/elements/${updatedElement.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedElement),
      });
      if (!response.ok) {
        throw new Error(`Failed to update element: ${response.statusText}`);
      }
      console.log('Element updated successfully:', updatedElement);
    } catch (error) {
      console.error('Error updating element:', error);
      // Optionally: revert state update if API call fails
      setElements(oldElements);
    }
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

  const deleteSelectedElement = async () => {
    if (!selectedElementId) return;

    const oldElements = elements;
    const elementToDelete = elements.find(el => el.id === selectedElementId);

    setElements((prevElements) => prevElements.filter((el) => el.id !== selectedElementId));
    setSelectedElementId(null);
    setEditingElement(null);

    if (elementToDelete) {
      try {
        const response = await fetch(`/api/canvases/${canvasId}/elements/${elementToDelete.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`Failed to delete element: ${response.statusText}`);
        }
        console.log('Element deleted successfully:', elementToDelete.id);
      } catch (error) {
        console.error('Error deleting element:', error);
        // Optionally: revert state update if API call fails
        setElements(oldElements);
        setSelectedElementId(elementToDelete.id); // Reselect if delete failed
      }
    }
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
