export type ElementType = 'rectangle' | 'text';

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width?: number; // Optional for text, required for rectangle
  height?: number; // Optional for text, required for rectangle
  text?: string; // Optional for rectangle, required for text
  fill: string;
  // Add other properties like stroke, strokeWidth, etc. as needed
} 