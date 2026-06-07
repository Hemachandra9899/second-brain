<div align="center">

  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="140" height="140">
    <defs>
      <linearGradient id="brainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6D55E6" />
        <stop offset="100%" stop-color="#3B82F6" />
      </linearGradient>
    </defs>
    <path d="M 50 15 C 25 10, 5 30, 15 55 C 20 75, 35 85, 48 85 L 48 15 Z" fill="none" stroke="url(#brainGrad)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 50 15 C 75 10, 95 30, 85 55 C 80 75, 65 85, 52 85 L 52 15 Z" fill="none" stroke="url(#brainGrad)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="32" cy="35" r="4.5" fill="#6D55E6"/>
    <circle cx="68" cy="35" r="4.5" fill="#6D55E6"/>
    <circle cx="25" cy="55" r="4.5" fill="#6D55E6"/>
    <circle cx="75" cy="55" r="4.5" fill="#6D55E6"/>
    <circle cx="42" cy="70" r="4.5" fill="#6D55E6"/>
    <circle cx="58" cy="70" r="4.5" fill="#6D55E6"/>
    <circle cx="50" cy="45" r="5" fill="#3B82F6"/>
    <line x1="32" y1="35" x2="25" y2="55" stroke="#6D55E6" stroke-width="1.5" stroke-dasharray="3 3"/>
    <line x1="68" y1="35" x2="75" y2="55" stroke="#6D55E6" stroke-width="1.5" stroke-dasharray="3 3"/>
    <line x1="25" y1="55" x2="42" y2="70" stroke="#6D55E6" stroke-width="1.5" stroke-dasharray="3 3"/>
    <line x1="75" y1="55" x2="58" y2="70" stroke="#6D55E6" stroke-width="1.5" stroke-dasharray="3 3"/>
    <line x1="32" y1="35" x2="50" y2="45" stroke="#6D55E6" stroke-width="1.5" stroke-dasharray="3 3"/>
    <line x1="68" y1="35" x2="50" y2="45" stroke="#6D55E6" stroke-width="1.5" stroke-dasharray="3 3"/>
    <line x1="42" y1="70" x2="50" y2="45" stroke="#6D55E6" stroke-width="1.5" stroke-dasharray="3 3"/>
    <line x1="58" y1="70" x2="50" y2="45" stroke="#6D55E6" stroke-width="1.5" stroke-dasharray="3 3"/>
  </svg>

  <h1>🧠 Second Brain</h1>
  <p><b>A Personal Knowledge Management System powered by Embeddings & Vector Search.</b></p>
  
  ![Status: Building](https://img.shields.io/badge/Status-Active_Development-6D55E6?style=flat-square)
  ![Version: Demo](https://img.shields.io/badge/Version-Demo_Phase-000000?style=flat-square)

</div>

> [!NOTE]
> **🚧 Currently in Active Development:** Second Brain is in its demo phase. The core embedding and retrieval pipelines are functional, but we are still actively building out advanced memory systems and the overarching architecture. Expect rapid changes to the repository!

---

## The Problem with Traditional Notes

Standard keyword search relies on exact text matches. If you search for "automobile," it won't pull up your notes that only use the word "car." 

**Second Brain is different.** It stores, searches, and retrieves notes intelligently using semantic embeddings. It understands **meaning and context** to surface exactly what you need, even if your search query and the note don't share a single identical word.

---

## ✨ Features

* **🔍 Semantic Search** – Retrieve notes by their underlying meaning and concepts, not just rigid keywords.
* **📒 Smart Storage** – Notes are converted into high-dimensional vector embeddings upon ingestion.
* **⚡ Fast Retrieval** – Powered by Pinecone’s highly scalable vector database infrastructure.
* **🧠 AI-Powered** – Utilizes advanced embeddings models from Hugging Face and OpenAI to accurately interpret intent.

---

## 🛠️ Tech Stack

| Technology | Overview | Implementation Responsibility |
| :--- | :--- | :--- |
| ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) | **Runtime Environment** | Handles backend orchestration, API endpoints, and processing user input. |
| ![Pinecone](https://img.shields.io/badge/Pinecone-000000?style=flat-square&logo=pinecone&logoColor=white) | **Vector Database** | Stores high-dimensional note embeddings and executes ultra-fast nearest-neighbor semantic queries. |
| ![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat-square&logo=openai&logoColor=white) | **Embedding Generation** | Translates raw text notes into dense mathematical vectors representing context. |
| ![Hugging Face](https://img.shields.io/badge/Hugging%20Face-FFD21E?style=flat-square&logo=huggingface&logoColor=black) | **Alternative Models** | Open-source ecosystem for local or specialized embedding model integrations. |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following configured locally before pulling the repository:

* **Node.js** (>= *16*)
* **Pinecone** account & API key
* **OpenAI** API key (or alternative embedding provider)

### Installation & Execution

*1.* **Clone the repository:**
```bash
git clone [https://github.com/Hemachandra9899/second-brain.git](https://github.com/Hemachandra9899/second-brain.git)
cd second-brain
