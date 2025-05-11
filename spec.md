### **Context**

Your task is to develop a simplified **whiteboard web application** that enables users to create and interact with visual elements—text and shapes—while ensuring data persistence and a user-friendly experience.

---

### **Objective**

Build and deploy a **full-stack whiteboard application** with support for:

- Frontend development (interactive UI)
- Real-time state management
- Backend APIs
- Cloud database integration
- Cloud deployment

---

### **Core Requirements**

### **Frontend**

Use any frontend framework of your choice (e.g., React, Vue, Svelte) to implement a whiteboard where users can:

- Place **rectangles** on the canvas
- Write **text** on the canvas
- **Delete** existing elements
- Maintain a **persistent state** between sessions

#### **Technology Choices & Structure:**

*   **Framework:** Next.js (React)
*   **Language:** TypeScript
*   **Canvas Management:** Konva.js
    *   Use Konva to handle rendering shapes (rectangles) and text elements on an HTML5 canvas.
    *   Implement event listeners for user interactions (e.g., clicking to select, dragging to move/resize, double-clicking to edit text).
    *   Manage layers for different types of elements or features if needed.
*   **Component Structure (Suggested):**
    *   `WhiteboardPage`: Main page component housing the canvas and UI elements.
    *   `Canvas`: The core component integrating Konva.js, responsible for rendering elements and handling direct canvas interactions.
    *   `Toolbar`: Component for selecting tools (rectangle, text, delete), colors, etc.
    *   `Element` (or specific `RectangleShape`, `TextElement`): Components representing items on the canvas, managed by Konva.
*   **State Management:**
    *   Utilize Next.js capabilities combined with React Context API or a lightweight state management library (e.g., Zustand or Jotai) for managing:
        *   Current tool selection.
        *   Properties of elements being drawn/edited.
        *   The state of all canvas elements (positions, content, etc.) for real-time updates and persistence.

### **Backend & Database**

- Use a **cloud-hosted database** to store:
    - Canvas metadata (e.g., canvas ID, name, timestamps)
    - Canvas contents (shapes, text, positions)
- Create **API endpoints** to:
    - Load existing canvas data
    - Save or update canvas content

#### **Technology Choices & Structure:**

*   **Backend Framework:** Next.js API Routes
    *   Leverage the built-in API route functionality within Next.js to create backend endpoints.
*   **Database:** MongoDB (Cloud-hosted, e.g., MongoDB Atlas)
*   **Data Models (MongoDB Collections):**
    *   `canvases`:
        *   `_id`: ObjectId (Canvas ID)
        *   `name`: String (e.g., "My First Board")
        *   `createdAt`: Timestamp
        *   `updatedAt`: Timestamp
    *   `elements`:
        *   `_id`: ObjectId (Element ID)
        *   `canvasId`: ObjectId (foreign key to `canvases` collection)
        *   `type`: String ("rectangle", "text")
        *   `x`: Number
        *   `y`: Number
        *   `width`: Number (for rectangle)
        *   `height`: Number (for rectangle)
        *   `text`: String (for text element)
        *   `fill`: String (color)
        *   `stroke`: String (color)
        *   `strokeWidth`: Number
*   **API Endpoints (Next.js API Routes):**
    *   `POST /api/canvases`: Create a new canvas (returns canvas metadata).
    *   `GET /api/canvases`: List all available canvases.
    *   `GET /api/canvases/[id]`: Load a specific canvas and its elements.
        *   Request: `GET /api/canvases/some-canvas-id`
        *   Response: `{ canvas: { ...metadata }, elements: [ ...element_data ] }`
    *   `PUT /api/canvases/[id]`: Save/update the entire content of a canvas.
        *   Request Body: `{ elements: [ ...updated_element_data_array ] }`
    *   Alternatively, more granular endpoints for elements:
        *   `POST /api/canvases/[id]/elements`: Add a new element to a canvas.
        *   `PUT /api/canvases/[id]/elements/[elementId]`: Update an existing element.
        *   `DELETE /api/canvases/[id]/elements/[elementId]`: Delete an element.

### **Deployment**

- Deploy the full application on a cloud provider.
    - **Preferred:** AWS or GCP
    - Provide a publicly accessible URL

#### **Technology Choices & Structure:**

*   **Frontend & Backend (Next.js):** Vercel
    *   Vercel offers seamless deployment for Next.js applications, including handling API routes.
*   **Database:** MongoDB Atlas
    *   Use a managed MongoDB service like Atlas for database hosting, ensuring connection strings are securely managed in environment variables.
*   **Process:**
    1.  Set up a Next.js project.
    2.  Develop frontend components and backend API routes.
    3.  Configure MongoDB Atlas and connect the Next.js backend to it.
    4.  Push code to a Git repository (e.g., GitHub, GitLab).
    5.  Connect the Git repository to Vercel for continuous deployment.
    6.  Configure environment variables on Vercel (e.g., `MONGODB_URI`, `DATABASE_NAME`).

---

### **Product Requirements**

- Prioritize **user experience** and **intuitive design**
- Interface should be **simple**, **clean**, and **responsive**
- Provide a basic UI for canvas selection or switching

---

### **Deployment Environment**

You are provided with:

- ✅ **AWS Account**
- ✅ **GCP Account**
- ✅ **MongoDB Account**
- ✅ **Unlimited Internet Access**
- ✅ **Unlimited LLM Access**

### **Evaluation Criteria**

- Functionality and completeness of core features
- Code quality and architecture
- UX/UI design and responsiveness
- Data persistence and API implementation
- Cloud deployment setup and reliability