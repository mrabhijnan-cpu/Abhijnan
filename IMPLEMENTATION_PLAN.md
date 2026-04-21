# System Architecture & Implementation Plan: Karma AI Engine 

This document tracks the phased rollout of the 19 comprehensive Intelligence modules requested for the Karma AI application, forming a complete end-to-end Learning Management System with deep, agentic LLM capabilities.

---

## What Has Been Completed So Far (Phase 1)

### Module 1: Agentic Conversational State Tracking (Active)
- **Status:** **Active** (`EducationOnboarding.tsx`)
- **How It Works:** We parse onboarding chat directly into a structured memory object using strict JSON generation from Gemini 3.1 Pro. The local UI recursively identifies null fields (Standard, Board, Goals, etc.) and naturally prompts the user until the schema is populated. 
- **Next Step:** Introduce a self-reflection generation call to cross-verify extracted constraints against hallucinations.

### Module 3: Soft Agentic RAG / Profile Injection (Active)
- **Status:** **Active** (`TutorChat.tsx`)
- **How It Works:** The extracted memory (`memoryContext`) is fetched directly from Firestore on session load and dynamically injected directly into the Gemini `systemInstruction`. This acts as an instantaneous, soft-RAG layer that enforces personalized interactions (e.g. knowing their exam bounds and weak subjects) constantly.

### Module 5: Abstractive Summarization for Auto Titles (Active)
- **Status:** **Active** (`TutorChat.tsx`)
- **How It Works:** The moment a user submits the first message of a new chat session, a non-blocking asynchronous call to Gemini summarizes the message into a 3-5 word title and commits it to Firestore without freezing the user interface.

### Module 8: Agentic Function Calling & Math Execution (Newly Deployed)
- **Status:** **Active** (`TutorChat.tsx`)
- **How It Works:** Native tool schemas (`calculate_math`) are shipped with the API payload. If Gemini encounters complex math in conversation (or zero-shot OCR), it constructs a `functionCall`. The frontend intercepts it, evaluates it natively securely via `mathjs` locally, and loops the deterministic result back to the model for perfect arithmetic reasoning without hallucination.

### Interface Integration: ML & Neural Memory Dashboard
- **Status:** **Active** (`MemoryProfileModal.tsx`)
- **How It Works:** A direct user portal accessible via the Left Navigation Panel in the Tutor workspace, providing real-time transparency into how the AI conceptualizes their "Memory State". It directly bridges the gap between chat and data by surfacing Bayesian Knowledge Tracking and SM-2 placeholder visualization.

---

## The Next Phased Rollout (Upcoming Priority)

### Phase 2: True RAG & Advanced Spaced Repetition (The "Retention" Upgrade)
1. **Module 6 — True RAG with Vector Embeddings:** We will integrate `text-embedding-004` to fragment real textbook PDFs. Using Pinecone or Firestore Vector Search, we will rerank (Top K) textbook chunks at query time.
2. **Module 7 — SM-2 Scheduler (Forgetting Curve):** An explicit chronological cron function updating "Easiness Factors" over time for specific micro-topics the student fails.
3. **Module 4 — Synthetic PYQ Generator:** Expand the `QuizMaster.tsx` component to accept past papers and execute self-reflective variant generation (`isOriginal: boolean`).

### Phase 3: The BKT & Analytics Engine
1. **Module 9 & 10 — Bayesian Knowledge Tracing (BKT) & Bandit Algorithms:** Implement the $P(Know)$ algorithmic tracker. If probability hits >85%, the system adapts using Thompson sampling to increase difficulty thresholds globally.
2. **Module 11 & 12 — Sentiment & Graph:** Inject lightweight text classifiers over 5-conversation sliding windows to alter the tutor's tone constraints dynamically.

---

This plan confirms the shift away from standard text-bots into a modular, highly autonomous React+Vite LMS framework backed by Google's finest LLM structures.
