# Whiteboard Application Development Steps

## Phase 1: Core Frontend & Basic Backend PoC

This phase focuses on implementing the core frontend requirements with a basic backend for initial persistence.

### I. Project Setup & Initial Frontend Structure
1.  **Install Dependencies:**
    *   `npm install konva react-konva`
    *   `npm install zustand` (for state management, optional, can start with Context API)
2.  **Basic Project Structure:**
    *   `app/page.tsx` is the main whiteboard page.
    *   Create `components/canvas/Canvas.tsx`.
    *   Create `components/ui/Toolbar.tsx`.
    *   Consider a `lib/` directory for Konva helpers or types.
3.  **Initial Page and Canvas Component:**
    *   Set up `app/page.tsx` to render the `Toolbar` and `Canvas` components.
    *   `Canvas.tsx` should initialize a basic Konva Stage.

### II. Basic Canvas & Static Element Rendering (Konva.js)
1.  **Initialize Konva Stage & Layer:**
    *   In `Canvas.tsx`, use `Stage` and `Layer` from `react-konva`.
    *   Set initial dimensions for the canvas.
2.  **Static Element Rendering:**
    *   Manually define an array of shapes (e.g., a rectangle and a text object with predefined properties).
    *   Render these shapes on the canvas using `Rect` and `Text` components from `react-konva`. This verifies Konva is working.

### III. Toolbar & Tool Selection
1.  **Create `Toolbar` Component:**
    *   Add buttons for "Rectangle", "Text", "Select/Delete".
2.  **Implement Tool State:**
    *   Use `useState` in `app/page.tsx` or a Zustand store to manage the `currentTool`.
    *   Pass the `setCurrentTool` function and `currentTool` to the `Toolbar`.
    *   Update `currentTool` when toolbar buttons are clicked.

### IV. Interactive Element Creation
1.  **Rectangle Drawing:**
    *   In `Canvas.tsx`, add an event handler for `onMouseDown` on the Konva Stage.
    *   If `currentTool` is "rectangle":
        *   Store the starting coordinates.
        *   On `onMouseMove`, draw a temporary rectangle (preview).
        *   On `onMouseUp`, finalize the rectangle's dimensions and add it to a list of elements in the state.
2.  **Text Input:**
    *   If `currentTool` is "text":
        *   On `onMouseDown` (or `onClick`) on the Stage, record the click position.
        *   **Option 1 (Konva Text Edit):** Use Konva's `Text` node and enable editing on double click. This can be complex for initial setup.
        *   **Option 2 (HTML Input Overlay):** Show an absolute-positioned HTML `<textarea>` over the canvas at the click position.
        *   When text is submitted (e.g., on blur or Enter key), create a Konva `Text` element with the input value and position, and add it to the elements state.

### V. Element Selection & Deletion
1.  **Element State:**
    *   Maintain an array of element objects in your state (e.g., `app/page.tsx` or Zustand store). Each object should have `id`, `type`, `x`, `y`, `width`, `height`, `text`, `fill`, etc.
    *   Render elements on the canvas by mapping over this array.
2.  **Selection (`Select/Delete` Tool):**
    *   When `currentTool` is "select/delete":
        *   Make elements clickable. On click, set a `selectedElementId` in the state.
        *   Visually indicate the selected element (e.g., using `Konva.Transformer` or changing stroke).
3.  **Deletion:**
    *   Add a "Delete" button to the `Toolbar`.
    *   If an element is selected, clicking "Delete" (or pressing the key) should:
        *   Remove the element from the elements array in the state.
        *   Trigger a re-render of the canvas.

### VI. Basic Backend Setup (Next.js API Routes)
1.  **Define Data Structures:**
    *   In `lib/types.ts` (or similar), define interfaces for `CanvasElement` (e.g., `{ id: string, type: 'rectangle' | 'text', x: number, ... }`).
2.  **Create API Routes (Mock Implementation):**
    *   `app/api/canvas/[canvasId]/elements/route.ts`:
        *   `GET`: Return a hardcoded list of elements for now, or elements from a temporary in-memory store.
        *   `POST`: Receive an element, add it to the in-memory store, and return success.
    *   `app/api/canvas/[canvasId]/elements/[elementId]/route.ts`:
        *   `DELETE`: Remove an element from the in-memory store by ID.
    *   (For simplicity, a single `canvasId` like "default-canvas" can be assumed initially).
    *   *Note: A proper `canvas` entity will be handled later with DB integration.*

### VII. Frontend State Management & Initial Persistence
1.  **State Management Choice:**
    *   Decide between React Context or a library like Zustand for managing `elements` array, `currentTool`, `selectedElementId`.
2.  **API Interaction:**
    *   **Load:** On initial `Canvas` component mount, `useEffect` to fetch elements from `GET /api/canvas/default-canvas/elements` and populate the frontend state.
    *   **Save (Add):** After adding a new element (rectangle/text) to the frontend state, make a `POST` request to `/api/canvas/default-canvas/elements` with the new element's data.
    *   **Delete:** After deleting an element from the frontend state, make a `DELETE` request to `/api/canvas/default-canvas/elements/[elementId]`.
    *   **Update (Optional for PoC):** If implementing element modification (e.g., moving, resizing), make `PUT` requests. For PoC, add/delete might be sufficient.
3.  **Optimistic Updates (Optional but good UX):**
    *   Update the UI immediately after a user action (add, delete).
    *   Then, make the API call. If the API call fails, revert the UI change and notify the user.

This plan provides a focused approach to building a working proof of concept for the core frontend features with basic backend interaction. Subsequent phases will involve full database integration, real-time collaboration features, and deployment. 