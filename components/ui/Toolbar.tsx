"use client";

import React from 'react';

interface ToolbarProps {
  currentTool: string;
  setCurrentTool: (tool: string) => void;
  deleteSelectedElement: () => void;
  selectedElementId: string | null;
}

const Toolbar: React.FC<ToolbarProps> = ({ currentTool, setCurrentTool, deleteSelectedElement, selectedElementId }) => {
  const tools = [
    { name: 'Select', id: 'select' },
    { name: 'Rectangle', id: 'rectangle' },
    { name: 'Text', id: 'text' },
    // { name: 'Delete', id: 'delete' } // Delete might be part of select or a separate action
  ];

  return (
    <div style={{
      padding: '10px',
      borderBottom: '1px solid #ccc',
      display: 'flex',
      gap: '10px',
      backgroundColor: '#fff',
      alignItems: 'center'
    }}>
      {tools.map(tool => (
        <button
          key={tool.id}
          onClick={() => setCurrentTool(tool.id)}
          style={{
            padding: '8px 12px',
            border: currentTool === tool.id ? '2px solid blue' : '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: currentTool === tool.id ? 'lightblue' : 'white'
          }}
        >
          {tool.name}
        </button>
      ))}
      <button
        onClick={deleteSelectedElement}
        disabled={!selectedElementId}
        style={{
          padding: '8px 12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: selectedElementId ? 'pointer' : 'not-allowed',
          backgroundColor: selectedElementId ? 'pink' : 'lightgray',
          marginLeft: '20px'
        }}
      >
        Delete Selected
      </button>
      <span style={{ marginLeft: 'auto', alignSelf: 'center' }}>Current Tool: {currentTool}</span>
    </div>
  );
};

export default Toolbar; 