# AI Decision Workflow

A visual AI workflow builder where each node represents an AI-powered **YES / NO decision**.

Workflows are designed visually using React Flow, executed as durable steps using Inngest, and evaluated using OpenAI. During execution, the frontend receives realtime updates and highlights the path taken through the workflow.

## Features

- Visual drag-and-drop workflow editor
- Add and connect decision nodes
- Editable AI prompts
- Separate YES and NO branches
- AI-powered binary decisions using OpenAI
- Dynamic workflow traversal
- Durable workflow execution with Inngest
- Realtime execution updates
- Visual highlighting of executed nodes
- Animated active edges
- Execution log panel
- Save and load workflows locally
- Export workflows as JSON
- Import workflows from JSON
- Basic workflow error handling

## Tech Stack

- **Next.js**
- **React**
- **TypeScript**
- **React Flow / XYFlow**
- **Inngest**
- **OpenAI API**

## How It Works

Each workflow node contains a decision prompt, for example:

```text
Is this a support request?
```

When a workflow is executed, the user provides an input such as:

```text
I forgot my password and cannot log into my account.
```

The workflow is sent to Inngest.

Each node is executed as an Inngest step. The node prompt and workflow input are sent to OpenAI, which is instructed to return only:

```text
YES
```

or:

```text
NO
```

The result determines which React Flow edge should be followed.

For example:

```text
                    Is this a support request?
                           /       \
                         YES        NO
                         /           \
                        v             v
                Is it urgent?   Is this a sales request?
```

If the AI returns `YES`, execution follows the YES edge.

If it returns `NO`, execution follows the NO edge.

The process continues until the current node has no matching outgoing edge.

## Execution Flow

```text
React Flow Editor
        |
        v
Next.js API Route
        |
        v
Inngest Event
        |
        v
Inngest Workflow
        |
        v
AI Decision Node
        |
        v
OpenAI -> YES / NO
        |
        v
Matching React Flow Edge
        |
        v
Next Decision Node
```

Inngest realtime messages are also published during execution:

```text
Inngest
   |
   v
Realtime Update
   |
   v
React Frontend
   |
   +--> Highlight executed node
   +--> Animate selected edge
   +--> Update execution log
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Ladinski/ai-decision-workflow.git
cd ai-decision-workflow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key_here
INNGEST_DEV=1
```

You need your own OpenAI API key to execute AI decision nodes.

> Never commit your real API key to GitHub.

Environment files are excluded through `.gitignore`.

### 4. Start Next.js

Run:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

### 5. Start the Inngest development server

Open a second terminal and run:

```bash
npx inngest-cli@latest dev
```

The local Inngest dashboard will be available at:

```text
http://localhost:8288
```

Keep both Next.js and the Inngest dev server running while testing workflows.

## Using the Application

1. Open the application at `http://localhost:3000`.
2. Click **Add Node** to create decision nodes.
3. Edit the prompt inside each node.
4. Connect the **YES** and **NO** handles to other nodes.
5. Enter the input that the AI should evaluate.
6. Click **Run Workflow**.
7. Watch the selected workflow path update in realtime.
8. View each AI decision in the Execution Log.

### Example

Create the following nodes:

```text
Node 1:
Is this a support request?

YES -> Node 2
NO  -> Node 3

Node 2:
Is this urgent?

Node 3:
Is this a sales request?
```

Then enter:

```text
I forgot my password and cannot log into my account.
```

A possible execution is:

```text
Is this a support request?
        |
       YES
        |
        v
Is this urgent?
        |
       YES
        |
        v
      END
```

The execution log will display the decisions in order.

## Saving Workflows

The application supports local workflow persistence.

Click:

```text
Save
```

to store the current workflow in browser `localStorage`.

Click:

```text
Load
```

to restore it.

## JSON Export / Import

Workflows can also be exported as JSON.

Click **Export JSON** to download the current workflow as:

```text
ai-workflow.json
```

Use **Import JSON** to restore a previously exported workflow.

This makes workflows portable between browser sessions and machines.

## Inngest

Workflow execution is handled by Inngest.

The application sends a:

```text
workflow/run
```

event containing:

- Nodes
- Edges
- Workflow input
- Starting node ID
- Run ID

Each AI decision is executed as an Inngest step.

Execution history contains information such as:

```json
{
  "executionHistory": [
    {
      "nodeId": "1",
      "prompt": "Is this a support request?",
      "decision": "YES"
    },
    {
      "nodeId": "2",
      "prompt": "Is this urgent?",
      "decision": "NO"
    }
  ],
  "finalNodeId": "2"
}
```

## AI Decision Rules

The AI acts as a strict binary classification engine.

For every node it must return exactly:

```text
YES
```

or:

```text
NO
```

Any other response is treated as an invalid AI response and causes the workflow step to fail.

## Project Structure

```text
app/
├── api/
│   ├── inngest/
│   │   └── route.ts
│   └── run-workflow/
│       └── route.ts
├── actions.ts
├── channels.ts
├── client.ts
├── functions.ts
├── layout.tsx
├── page.tsx
└── globals.css

components/
└── DecisionNode.tsx
```

### Important Files

**`app/page.tsx`**

Contains the React Flow editor, workflow controls, realtime execution UI, save/load functionality, and JSON import/export.

**`components/DecisionNode.tsx`**

Defines the custom React Flow YES/NO decision node.

**`app/functions.ts`**

Contains the Inngest workflow execution and OpenAI decision logic.

**`app/client.ts`**

Creates the Inngest client.

**`app/channels.ts`**

Defines realtime channels used to publish workflow execution updates.

**`app/actions.ts`**

Generates the server-side subscription token used by the frontend for Inngest realtime updates.

**`app/api/inngest/route.ts`**

Exposes the Inngest functions to the Inngest development server.

**`app/api/run-workflow/route.ts`**

Receives workflow execution requests from the frontend and sends the Inngest event.

## Assignment Requirements

### Phase 1 — Setup

- [x] Next.js application
- [x] React Flow
- [x] Inngest
- [x] OpenAI SDK
- [x] Environment configuration
- [x] Git repository
- [x] README

### Phase 2 — Foundations

- [x] React Flow canvas
- [x] Add nodes
- [x] Connect nodes
- [x] Editable node prompts
- [x] YES paths
- [x] NO paths
- [x] Local workflow state
- [x] Save/load workflow

### Phase 3 — Core Build

- [x] Inngest workflow execution
- [x] AI-powered decision nodes
- [x] Strict YES/NO responses
- [x] Dynamic edge traversal
- [x] Execution order tracking
- [x] End-to-end workflow execution

### Phase 4 — Polish

Implemented:

- [x] Visual execution state
- [x] Execution logs panel
- [x] Save/load workflows
- [x] JSON export/import
- [x] Animated active edges
- [x] Basic error handling
- [x] Realtime execution updates

## Security

API keys are stored using environment variables and should never be committed to the repository.

The repository's `.gitignore` excludes environment files:

```gitignore
.env*
```

## Author

Built by [Ladinski](https://github.com/Ladinski).