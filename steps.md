# Whiteboard Application Development Steps

## Phase 1: Core Frontend & Backend PoC with Local Persistence

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

### VI. Basic Backend Setup (Next.js API Routes with Local DynamoDB PoC)
1.  **Install AWS SDK & DynamoDB Local:**
    *   Install AWS SDK v3: `npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb`
    *   Set up DynamoDB Local for development (e.g., using Docker: `docker run -p 8000:8000 amazon/dynamodb-local`, or a downloadable JAR). Refer to AWS documentation for setup.
2.  **Define Data Structures for DynamoDB:**
    *   In `lib/types.ts`, define interfaces for `CanvasElement` (and `Canvas` if managing multiple canvases from PoC).
    *   Example `CanvasElement`: `{ id: string, canvasId: string, type: 'rectangle' | 'text', x: number, y: number, width?: number, height?: number, text?: string, fill?: string }`
3.  **Create API Routes (Local DynamoDB Implementation):**
    *   Configure Next.js API routes to connect to DynamoDB Local endpoint (e.g., `http://localhost:8000`).
    *   Use `DynamoDBDocumentClient` from `@aws-sdk/lib-dynamodb` for easier interaction.
    *   `app/api/canvas/[canvasId]/elements/route.ts`:
        *   `GET`: Fetch elements from local DynamoDB table for a given `canvasId`.
        *   `POST`: Add an element to local DynamoDB, generating an `elementId` (e.g., using `uuid`).
    *   `app/api/canvas/[canvasId]/elements/[elementId]/route.ts`:
        *   `PUT`: Update an element in local DynamoDB (Optional for PoC).
        *   `DELETE`: Remove an element from local DynamoDB using `canvasId` and `elementId`.
    *   A default `canvasId` (e.g., "default-canvas") can be used if full canvas management is not yet implemented.
4.  **Local DynamoDB Table Setup:**
    *   Programmatically or manually create a table (e.g., `CanvasElements-dev`) in DynamoDB Local.
        *   Partition Key: `canvasId` (String)
        *   Sort Key: `elementId` (String)

### VII. Frontend State Management & Persistence with Local DynamoDB
1.  **State Management Choice:** (As previously decided: React Context or Zustand)
2.  **API Interaction with Local DynamoDB Backend:**
    *   **Load:** On `Canvas` component mount, `useEffect` to fetch elements from `GET /api/canvas/default-canvas/elements` and populate the frontend state.
    *   **Save (Add):** After adding a new element to the frontend state, make a `POST` request to `/api/canvas/default-canvas/elements` with the new element's data.
    *   **Delete:** After deleting an element from the frontend state, make a `DELETE` request to `/api/canvas/default-canvas/elements/[elementId]`.
    *   **Update (Optional for PoC):** If implementing element modification, make `PUT` requests.
3.  **Optimistic Updates (Optional but good UX):**
    *   Update the UI immediately. Revert and notify on API failure.

## Phase 2: AWS DynamoDB Cloud Integration

This phase transitions the backend from local DynamoDB to a cloud-hosted AWS DynamoDB instance for persistent, scalable storage.

### I. AWS DynamoDB Setup in the Cloud
1.  **Create DynamoDB Tables in AWS Console:**
    *   Log in to the AWS Management Console.
    *   Create two main tables:
        *   **`Canvases` Table:**
            *   Purpose: Store metadata for each whiteboard canvas.
            *   Partition Key: `canvasId` (String).
            *   Attributes: `name` (String), `createdAt` (String - ISO 8601 format), `updatedAt` (String - ISO 8601 format). Consider other metadata as needed.
        *   **`CanvasElements` Table:**
            *   Purpose: Store all visual elements (shapes, text) for each canvas.
            *   Partition Key: `canvasId` (String).
            *   Sort Key: `elementId` (String).
            *   Attributes: `type` (String: 'rectangle', 'text'), `x` (Number), `y` (Number), `width` (Number, optional), `height` (Number, optional), `text` (String, optional), `fill` (String, optional), etc.
2.  **IAM Configuration for Secure Access:**
    *   Create an IAM user for your Next.js backend application.
    *   Attach a policy to this user granting necessary DynamoDB permissions (e.g., `GetItem`, `PutItem`, `DeleteItem`, `Query`, `Scan`) for the specific tables created. Avoid using `AmazonDynamoDBFullAccess` for production if possible; prefer least privilege.
    *   Securely store the generated Access Key ID and Secret Access Key.

### II. Update Backend API Routes for AWS DynamoDB
1.  **Configure AWS SDK for Cloud Environment:**
    *   Ensure AWS SDK v3 (`@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`) is installed.
    *   Configure the DynamoDB client in your Next.js backend to use AWS credentials (via environment variables) and the appropriate AWS region.
2.  **Adapt API Route Logic:**
    *   Modify API route handlers (e.g., in `app/api/...`) to use the AWS SDK to interact with your cloud DynamoDB tables.
    *   Update table names to match those created in AWS.
    *   Implement API endpoints based on `spec.md` if not fully covered by PoC:
        *   `POST /api/canvases`: Create a new canvas entry in the `Canvases` table.
        *   `GET /api/canvases`: List all canvases.
        *   `GET /api/canvases/[canvasId]`: Load canvas metadata (from `Canvases`) and all its elements (from `CanvasElements`).
    *   Element-specific routes (`POST`, `PUT`, `DELETE` under `/api/canvases/[canvasId]/elements`) should interact with the `CanvasElements` table.
3.  **Environment Variables for Backend:**
    *   `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`.
    *   `DYNAMODB_CANVASES_TABLE_NAME` (e.g., "Canvases-prod").
    *   `DYNAMODB_ELEMENTS_TABLE_NAME` (e.g., "CanvasElements-prod").

### III. Data Modeling and Error Handling
1.  **Refine Data Types:** Ensure `lib/types.ts` accurately reflects DynamoDB attribute types and any transformations needed (e.g., for dates).
2.  **Robust API Implementation:**
    *   Implement comprehensive error handling (try-catch blocks, check SDK responses).
    *   Add input validation for API request bodies and parameters.
    *   Return appropriate HTTP status codes and meaningful error messages.

## Phase 3: Deployment to Vercel

This phase details deploying the Next.js application (frontend and backend with DynamoDB integration) to Vercel.

### I. Preparation for Vercel Deployment
1.  **Git Repository:** Ensure project is in a Git repository (GitHub, GitLab, etc.).
2.  **Local Build:** Confirm `npm run build` completes without errors.
3.  **Vercel Account:** Sign up or log in to Vercel.

### II. Vercel Project Setup
1.  **Import Project:** In Vercel, create a new project and import your Git repository.
2.  **Configure Project:**
    *   Vercel usually auto-detects Next.js. Confirm Framework Preset is "Next.js".
    *   Check Root Directory (usually the repository root).
    *   Build and Output Settings typically require no changes for Next.js.

### III. Environment Variables on Vercel
1.  **Access Project Settings:** Go to your project on Vercel > Settings > Environment Variables.
2.  **Add Secure Variables:**
    *   `AWS_ACCESS_KEY_ID`
    *   `AWS_SECRET_ACCESS_KEY`
    *   `AWS_REGION`
    *   `DYNAMODB_CANVASES_TABLE_NAME`
    *   `DYNAMODB_ELEMENTS_TABLE_NAME`
    *   (And any other runtime environment variables your application needs).
3.  **Scope Variables:** Assign variables to Production, Preview, and Development environments as appropriate.

### IV. Deploy and Test
1.  **Trigger Deployment:**
    *   Pushing to the connected Git branch (e.g., `main`) usually triggers an automatic deployment.
    *   Manual deployments can be initiated from the Vercel dashboard.
2.  **Monitor Build:** Observe the deployment process in Vercel logs.
3.  **Verify Functionality:**
    *   Once deployed, access the provided Vercel URL.
    *   Thoroughly test all application features, ensuring backend API calls to DynamoDB work correctly.
    *   Check Vercel's runtime logs for functions if issues arise.

### V. Custom Domain (Optional)
1.  If you have a custom domain, add and configure it under Vercel Project Settings > Domains.

## Phase 4: Advanced Features & Refinements (Future Scope)
*   Real-time collaboration features (e.g., using WebSockets, AWS AppSync with DynamoDB).
*   User authentication and authorization (e.g., NextAuth.js, AWS Cognito).
*   Advanced drawing tools (curves, polygons, image uploads).
*   Canvas management features (listing, searching, sharing).
*   Comprehensive undo/redo functionality on the frontend.
*   Performance optimizations for very large numbers of elements on a canvas.
*   Automated testing (unit, integration, and end-to-end tests).

This updated plan guides the development from a local backend proof of concept through cloud integration and deployment, setting the stage for further enhancements to the whiteboard application. 