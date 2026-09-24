# ♻️ Waste2Worth

> **"Don't Throw It — Transform It"**  
> *AI-Powered Circular-Economy & Upcycling Ecosystem*

---

## 🌟 Overview & Product Philosophy

**Waste2Worth** is a production-grade circular-economy platform designed around a single, powerful belief: **"Every piece of waste can be the beginning of an idea."**

Rather than treating recycling as a passive disposal mechanism, Waste2Worth closes the loop by turning discarded household and commercial materials into creative DIY projects, sustainable businesses, community collaborations, and material donation networks.

```text
♻️ WASTE
   ↓
📸 SCAN
   ↓
🤖 AI IDENTIFIES MATERIAL
   ↓
💡 AI IDEAS + CREATOR IDEAS + COMMUNITY IDEAS
   ↓
👆 SELECT AN IDEA
   ↓
📖 PROJECT INSTRUCTIONS
   ↓
🛠️ CREATE
   ↓
📸 SHARE RESULT (Before & After)
   ↓
👥 COMMUNITY
   ↓
🤖 AI ORGANIZES COMMUNITY DISCUSSION
   ↓
💼 BUSINESS OPPORTUNITY
   ↓
💰 SELL / SHARE
   ↓
🤝 DONATE
   ↓
♻️ REUSE
```

---

## 🚀 Key Features by Application Section

### 1. 📸 AI Waste Scanner (Sections 6, 7 & 33)
* **Multi-Input Scanning**: Support for live camera capture, photo upload, and pre-packaged sample test cards (Cardboard, PET Bottles, Denim Jeans, Glass Jar, Organic Vegetable Scraps).
* **Deep Material Identification**: Detects material type, specific subtype, condition (*Good, Fair, Weathered, Contaminated*), reusability assessment, upcycling viability, safety warnings, and potential project categories.
* **Transparent Confidence & Correction**: Clear confidence meter (*e.g., 92%*). If confidence is below 85% or the user disagrees, a 1-click **"Change Material"** modal allows immediate manual correction across 17+ supported material categories.

### 2. 💡 AI Idea Generator & Creator Inspiration (Sections 8, 9, 10 & 11)
* **Personalized Concept Generation**: Generates actionable upcycling projects tailored to detected waste, available quantity, user skill level, budget, and available tools.
* **Quick Constraint Refinement**: Instant 1-tap prompts:
  * *"Give me easier ideas"*
  * *"Give me something decorative"*
  * *"Give me something I can sell"*
  * *"Give me a school project"*
  * *"Budget under ₹500"*
  * *"I don't have any tools"*
* **Co-Located Creator Inspiration**: AI suggestions are paired with real creator-submitted videos and tutorials with clear attribution, duration, and difficulty ratings.
* **Organic Waste & Composting**: Dedicated handling for food, fruit, vegetable, and yard waste with environmental safety steps, composting phases, and aerated soil enrichment recipes.
* **"I Don't Like These Ideas" Flow**: When users want something different, they can regenerate fresh concepts or immediately tap **"📢 Ask the Community"** to pre-populate an Idea Hub question with their exact material and quantity.

### 3. 📖 Step-by-Step Project Detail & AI Assistant (Sections 12, 13 & 35)
* **Clear Inventory Separation**: Divides requirements into **"YOU ALREADY HAVE"** (green checkmark) vs **"YOU MAY NEED"** (actionable checklist).
* **Decoupled Shopping & Eco-Alternatives**: If extra items are needed (e.g., glue, non-toxic paint, sealant), users can choose between eco-friendly alternatives (homemade flour paste, plant dyes), finding local stores, or asking the community to borrow.
* **Interactive AI Step Q&A**: Each step includes a dedicated **"Ask AI About This Step"** assistant for real-time guidance (e.g., cutting safety, glue curing times, structural reinforcement).
* **Hazard & Safety Enforcement**: Prominent warnings for sharp blades, hot glue, electrical components, or broken glass.

### 4. 👥 Discover Feed & Before/After Experience (Sections 17, 18 & 19)
* **Interactive Before/After Slider**: Signature visual comparison tool with a smooth interactive split-pane slider allowing users to drag between the raw waste item and the finished transformation.
* **Rich Social Actions**: Like, bookmark/save, copy link share, and creator follow capabilities with instant optimistic UI updates.
* **Publishing Studio**: Users can publish completed upcycles with before/after photos, step instructions, tools used, difficulty level, and maker tips.

### 5. 🤖 AI Comment Manager (Section 20)
* **Discussion Clustering**: AI groups high-volume comments into actionable themes (e.g., *"18 comments suggest adding modular compartments"*).
* **Grouped Questions**: Automatically synthesizes maker questions into topics (Materials, Durability, Cutting, Finishing).
* **Highlighted Useful Suggestions**: Elevates high-value technical ideas while preserving full transparency with a 1-click toggle to view all original chronological comments.

### 6. 💬 Idea Hub & Creator Connections (Sections 15 & 16)
* **Crowdsourced Q&A**: Community members post materials and open questions; responses feature both AI instant ideas and community member contributions.
* **Helpfulness Reactions**: Users can mark community advice as **"This helped"** or **"I used this idea"**.
* **Direct Creator Inquiry**: Users can initiate private, privacy-preserving conversations with featured creators without exposing personal email addresses or phone numbers.

### 7. 💼 Circular Business Hub (Sections 22, 23, 24 & 25)
* **Venture Concept Generator**: Generates commercial product concepts from waste materials with required tools, target markets, production considerations, differentiation, and challenges.
* **Mandatory Planning Disclaimers**: All cost and revenue figures are prominently labeled as estimated planning projections, never guaranteed financial promises.
* **Circular Business Directory**: Search and explore micro-enterprises turning waste into retail products.
* **"Help My Business" AI Advisor**: Business owners can submit current scrap inputs to receive new product diversification roadmaps, packaging alternatives, and zero-waste process enhancements.

### 8. 🤝 Material Donation Marketplace (Sections 26, 27 & 28)
* **Direct Material Exchange**: Donors list surplus reusable materials (boxes, bottles, scrap textiles, wood cutoffs) with condition, quantity, and approximate neighborhood location.
* **Partial Claim Tracking**: When a maker requests a portion of the batch (e.g., 20 out of 50 boxes), the listing automatically calculates remaining stock and updates status (*Available → Partially Claimed → Claimed*).
* **In-App Messaging & Privacy**: Built-in chat allows arrangement of collection times without exposing exact home addresses or contact numbers.

### 9. 🌱 Environmental Impact Metrics (Section 5)
* **100% Grounded Telemetry**: Zero fabricated NGO statistics. Real counters track platform activity:
  * ♻️ **Materials Reused** (from completed user projects)
  * 🛠️ **Projects Completed** (from maker checklists)
  * 📦 **Materials Donated** (from accepted donation requests)
  * 🌱 **Showcases Shared** (from published community transformations)

### 10. 🛡️ Admin Panel & Safety Moderation (Sections 39, 40 & 41)
* **Role-Based Access Control**: Standardized roles (`USER`, `CREATOR`, `BUSINESS`, `MODERATOR`, `ADMIN`).
* **Moderation Queue**: Review reported posts, comments, businesses, and donation listings with resolve/dismiss actions.
* **Live Event Stream**: Real-time telemetry feed of platform interactions (scans, ideas generated, posts published, donations claimed).

---

## 🛠️ Technology Stack

| Layer | Technologies Used | Description |
|---|---|---|
| **Frontend** | React 18, TypeScript, Lucide Icons | Component-driven responsive UI |
| **Styling** | Vanilla CSS (CSS Custom Properties) | Modern dark/light glassmorphic eco-aesthetic, responsive flexbox/grid, custom animations, zero CSS bloat |
| **Backend API** | Node.js, Express, TypeScript | RESTful JSON API with comprehensive error handling & file uploads |
| **Database** | Node 26 Native SQLite (`node:sqlite`) | Embedded relational SQL database with foreign key enforcement and WAL journal mode (zero external daemon required) |
| **AI Layer** | AIService Abstraction | Multi-provider architecture supporting Google Gemini, OpenAI, and a rich, realistic offline dataset |
| **Validation** | Zod, Multer, Bcrypt, JWT | Strict schema validation, secure password hashing, and stateless token authentication |
| **Testing** | Vitest, Supertest | 22 comprehensive integration tests validating end-to-end user journeys |

---

## 📁 Project Architecture

```text
waste2worth/
├── server/
│   ├── db.ts                     # SQLite schema definitions & foreign keys
│   ├── seed.ts                   # Realistic seed data for all categories
│   ├── index.ts                  # Express server, route mounting, Vite middleware
│   ├── middleware/
│   │   └── auth.ts               # JWT authentication & role-based access control
│   ├── services/
│   │   ├── aiService.ts          # AI service abstraction (Gemini / OpenAI / Mock)
│   │   ├── analyticsService.ts   # Platform telemetry & verified impact metrics
│   │   └── shoppingService.ts    # Decoupled eco-alternatives & local sourcing
│   ├── routes/
│   │   ├── admin.ts              # Moderation queue & user role updates
│   │   ├── auth.ts               # Register, login, profile, demo persona switcher
│   │   ├── business.ts           # Business ventures, profiles & AI advisor
│   │   ├── comments.ts           # Comments, nested replies & AI summary synthesis
│   │   ├── donations.ts          # Material listings, partial claims & messaging
│   │   ├── ideaHub.ts            # Community Q&A & direct creator inquiries
│   │   ├── ideas.ts              # AI idea generation & step Q&A assistant
│   │   ├── impact.ts             # Verified platform environmental counters
│   │   ├── notifications.ts      # User activity notifications
│   │   ├── posts.ts              # Discover feed, transformations, likes & saves
│   │   ├── scan.ts               # Waste scanning & material detection
│   │   ├── search.ts             # Global multi-entity search
│   │   └── shopping.ts           # Project materials & sustainable alternatives
│   └── test/
│       └── api.test.ts           # 22 integration & business logic tests
├── src/
│   ├── context/
│   │   ├── AuthContext.tsx       # Auth state, JWT storage & 1-click persona switch
│   │   └── ToastContext.tsx      # Global alerts & notification toasts
│   ├── styles/
│   │   └── theme.css             # Vanilla CSS design tokens & animations
│   ├── components/
│   │   ├── AdminPanel.tsx        # Moderation dashboard & live event stream
│   │   ├── AICommentManager.tsx  # Signature AI discussion grouping & highlights
│   │   ├── AIIdeaGenerator.tsx   # AI ideas, constraint prompts & creator inspiration
│   │   ├── AuthModal.tsx         # Sign in, registration & quick persona logins
│   │   ├── BeforeAfterSlider.tsx # Interactive split-pane comparison slider
│   │   ├── BottomNavigation.tsx  # Mobile navigation bar
│   │   ├── BusinessHub.tsx       # Business venture generator & directory
│   │   ├── CreateProjectModal.tsx# Project publishing with before/after photos
│   │   ├── DiscoverFeed.tsx      # Social transformation feed
│   │   ├── DonationHub.tsx       # Material donation marketplace & chat
│   │   ├── HeroSection.tsx       # Hero dashboard, CTAs & impact metrics
│   │   ├── IdeaHub.tsx           # Community questions & creator inquiries
│   │   ├── Navbar.tsx            # Desktop header with search & profile triggers
│   │   ├── ProjectDetailModal.tsx# Step-by-step checklist & AI step Q&A
│   │   ├── SearchModal.tsx       # Universal multi-entity search modal
│   │   ├── UserProfile.tsx       # Maker profile, badges & scan history
│   │   └── WasteScanner.tsx      # Radar viewfinder, camera, presets & correction
│   ├── App.tsx                   # Main layout & router orchestration
│   └── main.tsx                  # React DOM entry point
├── uploads/                      # Uploaded scan & project images
├── .env.example                  # Environment configuration template
├── package.json                  # Scripts & dependencies
└── tsconfig.json                 # TypeScript compiler configuration
```

---

## ⚙️ Quickstart Guide

### 1. Prerequisites
* **Node.js**: v20 or v22+ (Node 22+ recommended for built-in `node:sqlite`)
* **npm**: v9+

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-username/waste2worth.git
cd waste2worth
npm install
```

### 3. Environment Setup
Copy the example environment configuration:
```bash
cp .env.example .env
```
Default `.env` configuration:
```ini
PORT=5000
NODE_ENV=development
JWT_SECRET=waste2worth_dev_secret_jwt_key_2026_change_in_prod
DATABASE_PATH=waste2worth.db
UPLOAD_DIR=uploads

# AI Service Configuration ('mock', 'gemini', or 'openai')
AI_PROVIDER=mock
GEMINI_API_KEY=
OPENAI_API_KEY=
```
> *Note: By default, `AI_PROVIDER=mock` provides an extensive, production-grade offline AI knowledge base with zero external API dependencies or API keys required.*

### 4. Database Seeding
Populate the database with realistic sample materials, projects, creator transformations, comments, businesses, and donations:
```bash
npm run seed
```

### 5. Running the Application
Start the development server with Vite hot-reloading:
```bash
npm run dev
```
Open **`http://localhost:5000`** in your browser.

### 6. Running Tests
Execute the comprehensive integration test suite (22 tests):
```bash
npm test
```

### 7. Production Build
Build the client assets and compile the server TypeScript:
```bash
npm run build
npm start
```

---

## 🧪 Testing the Complete End-to-End User Journey (Section 61)

You can walk through the entire circular loop directly in the running application:

1. **Login & Persona Switcher**:
   * Open the app at `http://localhost:5000`.
   * Click **Sign In** and use the **1-Click Demo Personas** to switch between **Elena (Admin)**, **Rahul (Creator)**, **Aarav (Business)**, **Maya (Student)**, or **Vikram (Donor)**.
2. **Scan Waste Material**:
   * Tap **"📸 Scan Waste"** in the Hero section or bottom navigation.
   * Select the sample **"📦 Cardboard Box"** preset or upload your own photo.
   * Review AI detection: `Cardboard`, `92% confidence`, `Good condition`.
   * Test the **"Change Material"** button to view the manual correction dialog.
3. **Explore AI Ideas & Refine**:
   * Click **"Confirm & Generate Ideas"**.
   * Test quick refinement buttons: *"Give me easier ideas"*, *"Give me something decorative"*, *"Budget under ₹500"*.
   * Note the side-by-side **Creator Inspiration** tutorials.
4. **Try an Idea & Consult AI Step Assistant**:
   * Select **"Storage Organizer"**.
   * Review the checklist: *"YOU ALREADY HAVE"* vs *"YOU MAY NEED"*.
   * Select an eco-alternative (e.g., Homemade Rice Paste instead of commercial glue).
   * In Step 2, type a question in the **AI Step Assistant** (e.g., *"How do I make the folds clean?"*) to get instant real-time advice.
5. **Publish Transformation with Before/After Slider**:
   * Click **"Publish Transformation"**.
   * Review the interactive Before/After preview and publish the post.
6. **Experience AI Comment Manager in Discover**:
   * Navigate to **Discover** to see your post and other creator showcases.
   * Open any post with high comment activity (e.g., *"Desk Organizer from Old Shoe Box"*).
   * Observe the **AI Comment Manager** synthesizing 5+ comments into clustered suggestion themes, question topics, and highlighted tips. Toggle to raw comments at any time.
7. **Engage in the Idea Hub**:
   * Switch to **Idea Hub** to see community material questions.
   * React with **"This helped"** or tap **"Ask Creator"** to test the private creator inquiry conversation modal.
8. **Generate Circular Business Ventures**:
   * Navigate to **Business** → **Venture Generator**.
   * Input `Cardboard`, budget `₹2,000`, skill `Beginner`, and tap **"Generate Business Plan"**.
   * Note the explicit financial planning disclaimers and explore "Help My Business" advice.
9. **Claim Reusable Materials in Donations**:
   * Navigate to **Donate** and view available listings (e.g., *"50 Clean Cardboard Delivery Boxes"*).
   * Request `20 boxes` to see the listing transition to **Partially Claimed** with `30 boxes remaining`.
   * Open in-app chat to coordinate contactless pickup without sharing private contact information.

---

## 🔒 Security & Privacy Guarantees

* **Password Security**: Passwords hashed using industry-standard `bcryptjs`.
* **Private Locations**: Users' exact street addresses or coordinates are never exposed; only approximate neighborhoods/cities are shared.
* **Decoupled Commerce**: Shopping integrations are isolated behind a modular service layer with clear eco-friendly alternatives.
* **Strict Role-Based Authorization**: Client cannot spoof admin or moderator roles; server validates all permissions via database checks and JWT middleware.
* **Transparent AI**: Clear labels mark all AI-synthesized summaries, and financial estimations are explicitly marked as planning projections.

---

## 📄 License
MIT License. Built for the circular economy.  
**Don't Throw It — Transform It.** ♻️
