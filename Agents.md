# Agents.md
**AI Agent System Documentation for VENDRA**

---

# 1. Overview

VENDRA uses multiple specialized AI agents to deliver a realistic sales training experience. Each agent has a specific role and operates within defined constraints to ensure coherent, educational simulations.

---

# 2. Agent Catalog

## 2.1 PersonaEngine Agent

**Role**: Client persona generator

**Responsibility**: Creates unique, realistic client personas based on scenario configuration.

**Input**: ScenarioConfig (product, target profile, contact type, simulation preferences)

**Output**: PersonaProfile (name, age, location, occupation, motivations, pains, personality traits, briefStory, callAttitude)

**Behavior Rules**:
- Generate personas with authentic Peruvian/Latin American context
- Include subtle personality contradictions (e.g., "analytical but sometimes impulsive")
- Align motivations and pains with target profile
- Differentiate persona knowledge based on contact type:
  - `cold_call`: Generic needs, no product-specific knowledge
  - `follow_up`: Familiarity with product from previous interaction
  - `inbound_callback`: Proactive interest with specific questions
- Use neutral Latin American Spanish
- Create brief story as narrative paragraph, not bullet list
- Personality coherent with client intensity (difícil/neutro/tranquilo)

**Temperature**: 0.9 (high creativity for unique personas)

**Validation**: Zod schema (`personaProfileSchema`)

---

## 2.2 ConversationOrchestrator Agent

**Role**: AI client simulator

**Responsibility**: Simulates realistic client behavior in sales conversations.

**Input**:
- Seller text (transcribed from audio)
- Session ID (to load persona, scenario, and history)

**Output**: ClientResponse (clientText, interest level 1-10, interruption flag, wantsToEnd flag)

**Behavior Rules**:

### General Behavior
- Respond ONLY as the client persona in first person
- Never break character or explain actions
- Be coherent with persona profile and personality traits
- Interest dynamically adjusts based on seller performance

### Contact Type Differentiation
- **cold_call**:
  - No knowledge of caller or specific product
  - Initial interest: 3/10 (skeptical)
  - Product knowledge determined by personality:
    - Skeptical/analytical: Knows category, has experience with similar products
    - Curious/open: Complete lack of knowledge, asks what it's about
    - Default: Knows category generally but not this specific product
- **follow_up**:
  - Remembers previous conversation about the product
  - Initial interest: 5/10 (moderate)
  - Has basic product knowledge from prior contact
- **inbound_callback**:
  - Requested this call, proactive interest
  - Initial interest: 7/10 (high)
  - Has basic product knowledge and specific questions

### Intensity Levels
- **difícil**: Demanding, skeptical, difficult objections, not easily convinced
- **neutro**: Average client, normal questions, moderate interest
- **tranquilo**: Friendly, receptive, though doesn't necessarily decide quickly

### Realism Levels
- **exigente**: Very natural speech with pauses ("este...", "eh..."), topic changes, repetition if unconvinced
- **humano**: Conversational with regional expressions ("ya", "o sea", "mira"), small doubts, tangential questions
- **natural**: Conversational and coherent with professional Latin American Spanish

### Anti-Robotic Language
- FORBIDDEN phrases: "Entiendo tu preocupación", "Es una excelente pregunta", "Me parece muy bien"
- USE natural fragments: "O sea...", "Este...", "Ya...", "A ver..."
- Show AUTHENTIC emotions: real impatience, genuine curiosity, unfiltered doubts
- Can interrupt if seller talks too much or is repetitive
- Not excessively polite - realistic according to personality and socioeconomic level

### Emotional Arc
- Interest increases if seller handles objections well
- Interest decreases if seller evades questions or pressures too much
- Can end call if frustrated (if allowHangups enabled)

### Previous Context Generation
- For `follow_up` and `inbound_callback`, generates simulated previous conversation on first turn
- Previous context includes 1 seller message + 1 client message establishing prior contact
- Context stored with negative turn indices (-2, -1) to distinguish from real conversation

**Temperature**: 0.8 (balanced creativity and consistency)

**Validation**: Zod schema (`clientResponseSchema`)

---

## 2.3 AnalysisEngine Agent

**Role**: Post-call sales coach

**Responsibility**: Evaluates completed sales conversations and provides actionable feedback.

**Input**:
- Full conversation history with turn IDs
- Persona profile
- Scenario configuration

**Output**: Analysis (score 0-100, successes, improvements, key moments)

**Behavior Rules**:

### Evaluation Approach
- Holistic analysis, NOT a checklist
- Evaluates 8 interconnected dimensions:
  1. **Rapport**: Personal connection establishment
  2. **Descubrimiento**: Questions to understand client needs
  3. **Valor**: Clear value communication
  4. **Manejo de objeciones**: Adequate handling of doubts/resistance
  5. **Avance hacia cierre**: Guiding conversation toward decision
  6. **Comunicación**: Clarity, professionalism, empathy
  7. **Control de la llamada**: Conversation flow maintenance
  8. **Uso del tiempo**: Efficiency without rushing client

### Analysis Components
- **Score (0-100)**: Reflects real performance, considers dimension interrelationships
- **Successes**: Specific things seller did well (cite moments)
- **Improvements**: Actionable, specific suggestions with clear next steps (title + action)
- **Key Moments**: Critical conversation points with:
  - `turnId`: Exact turn ID reference
  - `quote`: Exact textual quote from conversation
  - `insight`: Why this moment is important
  - `recommendation`: What to do differently or reinforce

### Analysis Principles
- Be specific and constructive
- Cite textual moments from conversation
- Make improvements actionable, not generic
- Score must reflect actual performance
- Consider scenario context (contact type, client intensity, objectives)
- Consider persona profile (motivations, pains, personality)

**Temperature**: 0.7 (balanced analysis)

**Validation**: Zod schema (`analysisOutputSchema`)

---

## 2.4 PreviousContextGenerator Agent

**Role**: Historical context simulator

**Responsibility**: Generates realistic previous conversation for follow_up and inbound_callback scenarios.

**Input**:
- Persona profile
- Scenario configuration
- Contact type (follow_up or inbound_callback)

**Output**: PreviousContext (sellerMessage, clientMessage)

**Behavior Rules**:

### For follow_up
- Generate first contact where:
  - Seller briefly introduced product (2-3 sentences)
  - Seller asked if it was a good time
  - Client showed moderate interest
  - Client mentioned not having time or needing to think
  - Both agreed to talk later

### For inbound_callback
- Generate first contact where:
  - Client initiated contact (WhatsApp, web form, etc.)
  - Client expressed initial interest in product
  - Client asked 1-2 basic questions
  - Seller responded briefly
  - Seller proposed detailed discussion in this call

**Temperature**: 0.8 (natural conversation)

**Validation**: Zod schema (`previousContextSchema`)

---

# 3. Agent Interactions

## Flow Diagram

```
User Creates Scenario
    ↓
PersonaEngine Agent → Generates Persona
    ↓
Session Created with Persona Snapshot
    ↓
User Speaks (Audio)
    ↓
STT (AudioGateway) → Transcribes to Text
    ↓
ConversationOrchestrator Agent
    ↓ (first turn only for follow_up/inbound_callback)
PreviousContextGenerator Agent → Generates Previous Context
    ↓
ConversationOrchestrator Agent → Generates Client Response
    ↓
User Sees Client Reply (interest, interruption, wantsToEnd)
    ↓
[Loop continues until session ends]
    ↓
User Ends Session
    ↓
AnalysisEngine Agent → Generates Feedback
    ↓
User Views Analysis (score, successes, improvements, key moments)
```

---

# 4. Agent Configuration

## Environment Variables

All agents use the AI Provider Layer configured via:

- `AI_PROVIDER`: "openai" | "anthropic" | "mock"
- `AI_CHAT_MODEL`: Optional override for chat model
- `AI_STT_MODEL`: Optional override for STT model
- `OPENAI_API_KEY`: Required for OpenAI provider
- `ANTHROPIC_API_KEY`: Required for Anthropic provider
- `ASSEMBLYAI_API_KEY`: Required for STT when using Anthropic

## Provider Mappings

### OpenAI Provider
- Chat: `gpt-4o-mini`
- STT: `whisper-1`

### Anthropic Provider
- Chat: `claude-3-5-haiku-20241022`
- STT: AssemblyAI

### Mock Provider
- Chat: Mock responses
- STT: Mock transcription

---

# 5. Quality Assurance

## Persona Quality
- Personas must feel authentic and Peruvian/Latin American
- No generic "AI assistant" language
- Subtle contradictions make personas realistic
- Context-appropriate product knowledge

## Conversation Quality
- Client must never sound like AI assistant
- No corporate/robotic phrases
- Natural speech patterns and regional expressions
- Dynamic interest based on seller performance
- Coherent with persona personality throughout

## Analysis Quality
- Specific, actionable feedback
- Accurate quotes from conversation
- Holistic evaluation (not just checklist)
- Score reflects real performance
- Improvements are concrete next steps

---

# 6. Known Issues & Mitigations

## BUG-001: Product Knowledge Leak in Cold Calls
**Issue**: AI client knew product name in cold calls without seller introduction.

**Mitigation** (RESOLVED):
- Implemented `determineColdCallKnowledge()` function
- Contact type differentiation in system prompts
- Product knowledge instructions vary by persona traits
- Previous context only generated for follow_up/inbound_callback

## Anti-Robotic Language
**Issue**: Client sometimes used AI-like corporate phrases.

**Mitigation** (RESOLVED):
- Explicit forbidden phrases list in system prompt
- Natural speech fragment instructions
- Emotion authenticity requirements
- Regional expression examples

---

# 7. Future Agent Enhancements

## Potential Additions
- VoiceGenerator Agent: TTS for client voice (currently text-only)
- TeamCoach Agent: Multi-session analysis for teams
- ObjectionLibrary Agent: Curated objection database by industry
- EmotionalIntelligence Agent: Deeper psychological modeling

---
