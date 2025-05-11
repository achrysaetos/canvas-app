"use client";

import React, { useState } from 'react';
import Canvas from '../components/canvas/Canvas';
import Toolbar from '../components/ui/Toolbar';

export default function WhiteboardPage() {
  // Basic state for tool selection, will be expanded later
  const [currentTool, setCurrentTool] = useState<string>('select'); // Default tool

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Toolbar currentTool={currentTool} setCurrentTool={setCurrentTool} />
      <Canvas currentTool={currentTool} />
    </div>
  );
}
