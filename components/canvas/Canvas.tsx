"use client";

import React, { useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';

interface CanvasProps {
  currentTool: string;
  // We'll add more props later, like elements to draw
}

const Canvas: React.FC<CanvasProps> = ({ currentTool }) => {
  const stageRef = useRef<any>(null); // Konva.Stage type can be more specific if needed

  // Static elements for initial rendering test
  const staticElements = [
    {
      id: 'rect1',
      type: 'rectangle',
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      fill: 'blue',
      draggable: true
    },
    {
      id: 'text1',
      type: 'text',
      x: 200,
      y: 80,
      text: 'Hello Konva',
      fontSize: 20,
      fill: 'black',
      draggable: true
    }
  ];

  useEffect(() => {
    // Placeholder for canvas interaction logic based on currentTool
    console.log("Current tool in Canvas:", currentTool);
  }, [currentTool]);

  return (
    <div style={{ flexGrow: 1, backgroundColor: '#f0f0f0' }}>
      <Stage
        width={window.innerWidth} // Adjust as needed, consider resize handling
        height={window.innerHeight - 50} // Assuming toolbar height is 50px, adjust
        ref={stageRef}
        style={{ border: '1px solid #ccc' }}
        // onClick, onMouseDown, onMouseMove, onMouseUp will be added here
      >
        <Layer>
          {/* Render static elements */}
          {staticElements.map((el) => {
            if (el.type === 'rectangle') {
              return (
                <Rect
                  key={el.id}
                  x={el.x}
                  y={el.y}
                  width={el.width}
                  height={el.height}
                  fill={el.fill}
                  draggable={el.draggable}
                />
              );
            }
            if (el.type === 'text') {
              return (
                <Text
                  key={el.id}
                  x={el.x}
                  y={el.y}
                  text={el.text}
                  fontSize={el.fontSize}
                  fill={el.fill}
                  draggable={el.draggable}
                />
              );
            }
            return null;
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas; 