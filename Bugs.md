# Bugs & Issues

This document tracks known bugs, defects, and issues in the VENDRA application.

## Bug Status Legend

- 🔴 **Critical** - Blocks core functionality, needs immediate attention
- 🟡 **High** - Significant impact on user experience
- 🟢 **Medium** - Noticeable issue but has workarounds
- 🔵 **Low** - Minor issue, cosmetic or edge case
- ✅ **Fixed** - Issue resolved
- 🚧 **In Progress** - Currently being worked on
- ⬚ **Open** - Identified but not yet assigned

---

## Open Bugs

_No bugs currently tracked._

---

## Fixed Bugs

### [BUG-001] Persona has unauthorized product knowledge in cold call scenarios

**Status:** ✅
**Severity:** Critical (Fixed)
**Component:** AI/ConversationOrchestrator
**Reported:** 2025-12-05
**Fixed:** 2025-12-05

**Description:**
During cold call simulations, the generated persona already had knowledge about the product being sold, even though this information was never provided to them. This broke the realism of cold call scenarios where the client should have no prior knowledge of the seller or product.

**Steps to Reproduce:**
1. Create a new session with call type "cold_call"
2. Configure a scenario with product information
3. Start the conversation without providing product details to the persona
4. Observe that the AI persona responds as if they already know about the product

**Expected Behavior:**
In cold call scenarios, the persona should have zero knowledge about the seller's company or product unless explicitly told during the conversation.

**Actual Behavior:**
The persona demonstrated knowledge of the product without being informed, breaking the simulation's authenticity.

**Root Cause:**
The `buildSystemPrompt()` function in `src/lib/conversation-orchestrator.ts` was always revealing full product information to the client persona regardless of contact type:

```typescript
## El vendedor te ofrece:
- Producto: ${scenario.productName}
- Descripción: ${scenario.description}
- Precio/condiciones: ${scenario.priceDetails}
```

This information was exposed to ALL contact types, including `cold_call` where the client shouldn't know anything.

**Impact:**
- Broke training effectiveness for cold call practice
- Salespeople couldn't practice proper product introduction techniques
- Undermined the core value proposition of realistic scenario training

**Solution:**
Implemented conditional context injection based on `contactType` in `conversation-orchestrator.ts`:

1. **Added `determineColdCallKnowledge()` function**: Determines product knowledge level based on persona personality traits
   - Curious/open personas: Complete desconocimiento
   - Escéptico/analítico personas: Conocimiento de categoría + resistencia
   - Default: Conocimiento básico de categoría

2. **Modified `buildSystemPrompt()`**: Different product knowledge contexts by contact type
   - `cold_call`: Uses `determineColdCallKnowledge()` - NO specific product info
   - `follow_up`: Mentions previous conversation and product name
   - `inbound_callback`: Client already showed interest

3. **Updated `buildMockClientReply()`**: Mock responses now respect contact type

4. **Added `generatePreviousContext()`**: Generates simulated conversation history for follow_up/inbound_callback scenarios

**Files Modified:**
- `src/lib/conversation-orchestrator.ts:135-254` (buildSystemPrompt)
- `src/lib/conversation-orchestrator.ts:69-98` (buildMockClientReply)
- `src/lib/conversation-orchestrator.ts:135-207` (generatePreviousContext)
- `src/lib/conversation-orchestrator.ts:444-503` (orchestrateConversation)
- `src/lib/persona-engine.ts:35-79` (prompt improvements)

**Verification:**
- TypeScript compilation: ✅ No errors
- Build: ✅ Successful
- Expected behavior: Cold call personas now respond with appropriate level of ignorance about the product

---

## Bug Report Template

When adding a new bug, use this format:

```markdown
### [BUG-XXX] Short Description

**Status:** 🔴/🟡/🟢/🔵 | ⬚/🚧/✅
**Severity:** Critical/High/Medium/Low
**Component:** API/Frontend/Database/AI/Auth/Other
**Reported:** YYYY-MM-DD
**Fixed:** YYYY-MM-DD (if applicable)

**Description:**
Clear description of the bug and its impact.

**Steps to Reproduce:**
1. Step one
2. Step two
3. Expected vs actual behavior

**Environment:**
- Browser/Node version
- AI Provider (if relevant)
- Other relevant details

**Workaround:**
If any temporary workaround exists.

**Solution:**
(Fill in when fixed) Description of the fix implemented.
```

---

## Notes

- Update this file immediately when bugs are discovered
- Change status markers as work progresses: ⬚ → 🚧 → ✅
- Keep fixed bugs in the "Fixed Bugs" section for historical reference
- Cross-reference bug fixes in git commit messages (e.g., "fixes BUG-001")
