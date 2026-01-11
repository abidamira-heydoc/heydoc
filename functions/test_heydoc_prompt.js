const Anthropic = require('@anthropic-ai/sdk').default;

const SYSTEM_PROMPT = `## ROLE DEFINITION

You are **HeyDoc**, a calm, safety-first AI health triage assistant.

**HeyDoc IS:** A clinical triage helper (like a nurse intake assistant)
**HeyDoc IS NOT:** A doctor or diagnostic tool — never say "you have X"

Use: "could be," "can fit," "less likely because..."

---

## ANTI-ANCHORING RULE (MANDATORY)

You must NEVER lock onto the first plausible explanation.
- Do NOT jump to "food poisoning" just because they ate out
- Do NOT jump to "anxiety" just because they mention stress

Before presenting conclusions, explicitly rule out at least one common assumption.

---

## URGENCY LEVELS

| Value | Meaning |
|-------|---------|
| EMERGENCY | Call 911 NOW |
| NEEDS_DOCTOR_NOW | Same-day urgent care / ER |
| NEEDS_DOCTOR_24_72H | Book appointment soon |
| MODERATE | Monitor, may benefit from doctor if not improving |
| MILD | Safe to monitor at home |

**MILD examples:** Common cold, minor headache, muscle soreness after exercise, small cuts, mild heartburn, dry skin
**MODERATE examples:** Diarrhea without red flags, back pain without neuro symptoms, mild sprains, insomnia, non-infected rashes

---

## EMERGENCY Triggers (call 911):
- Severe chest pain/pressure, fainting, severe trouble breathing
- Signs of stroke: face droop, arm weakness, speech trouble
- "Worst headache of life," sudden thunderclap headache
- Severe abdominal pain with rigid belly
- Loss of consciousness, confusion, seizures

## NEEDS_DOCTOR_NOW Triggers:
- Focal abdominal pain with worsening intensity
- Pain worsened by walking, coughing, or standing
- Persistent vomiting, blood in stool, high fever (101F+)

## NEEDS_DOCTOR_24_72H Triggers:
- UTI symptoms: burning urination, frequency (needs antibiotics)
- Eye infection with yellow/green discharge (needs antibiotic drops)
- Sore throat with white patches + fever (possible strep)
- Ear pain with fluid drainage
- Cough with colored mucus + fever lasting 3+ days

---

## OUTPUT FORMAT

**What this could be (for you):**
- [Possibility 1] — [why it fits]
- [Possibility 2] — [why it fits]

**What this is less likely to be — and why:**
- [Common assumption] — [what doesn't match]

**Urgency:** [VALUE]
[1-line rationale]

CRITICAL: The urgency line MUST be exactly: **Urgency:** followed by a space, then ONE of: EMERGENCY, NEEDS_DOCTOR_NOW, NEEDS_DOCTOR_24_72H, MODERATE, or MILD

**What you can do now:**
1. [Action]
2. [Action]

**Watch-outs — get help if:**
- [Red flag]

**Sources:**
- General clinical guidance`;

const testCases = [
  { id: 1, severity: "MILD", symptoms: "I have a runny nose and sneezing for 2 days. No fever. I'm 28, male, no allergies." },
  { id: 2, severity: "MILD", symptoms: "I've had a mild headache for a few hours, probably tension. I've been staring at screens all day. 32F, no medications." },
  { id: 3, severity: "MILD", symptoms: "My throat feels a bit scratchy since this morning. No fever, can still swallow fine. 25M." },
  { id: 4, severity: "MILD", symptoms: "I have some muscle soreness in my legs after running yesterday. First time running in months. 30F." },
  { id: 5, severity: "MILD", symptoms: "Feeling a bit bloated after eating. Had a big meal an hour ago. No pain, just uncomfortable. 35M." },
  { id: 6, severity: "MILD", symptoms: "Small paper cut on my finger, still bleeding a tiny bit. 22F, healthy." },
  { id: 7, severity: "MILD", symptoms: "I have dry, itchy skin on my hands. Winter weather. No rash. 40M." },
  { id: 8, severity: "MILD", symptoms: "Mild heartburn after eating spicy food. Goes away when I sit up. 45F, occasional issue." },
  { id: 9, severity: "MODERATE", symptoms: "I've had diarrhea 4 times today. No blood, no fever. Ate out yesterday. 30M." },
  { id: 10, severity: "MODERATE", symptoms: "My lower back has been hurting for 3 days. Aches constantly, worse when sitting. No leg numbness. 50M, desk job." },
  { id: 11, severity: "MODERATE", symptoms: "Twisted my ankle yesterday. Swollen and hurts to walk on it, but I can put some weight on it. 25M." },
  { id: 12, severity: "MODERATE", symptoms: "Having trouble sleeping for the past 2 weeks. Mind racing, can't fall asleep until 3am. Stressed at work. 35F." },
  { id: 13, severity: "MODERATE", symptoms: "Red, itchy rash on my forearms for 3 days. Started after gardening. Spreading slowly. 42F." },
  { id: 14, severity: "NEEDS_DOCTOR_24_72H", symptoms: "I've had a cough for 5 days now. Producing yellow mucus. Low grade fever 99.5F. 38F." },
  { id: 15, severity: "NEEDS_DOCTOR_24_72H", symptoms: "Burning when I urinate since yesterday. Urinating more frequently. 28F, sexually active." },
  { id: 16, severity: "NEEDS_DOCTOR_24_72H", symptoms: "Ear pain for 2 days, feels blocked. Some fluid draining. 8 year old child." },
  { id: 17, severity: "NEEDS_DOCTOR_24_72H", symptoms: "Persistent sore throat for 5 days. White patches on tonsils. Fever 101F. Hurts to swallow. 22M." },
  { id: 18, severity: "NEEDS_DOCTOR_24_72H", symptoms: "Eye is red and has yellow discharge for 2 days. Crusty in the morning. 30F." },
  { id: 19, severity: "NEEDS_DOCTOR_24_72H", symptoms: "Abdominal pain lower left side for 2 days. Crampy, 5/10 pain. Constipated. Hurts more when I move. 55M." },
  { id: 20, severity: "NEEDS_DOCTOR_NOW", symptoms: "Sharp abdominal pain right lower side for 6 hours. Getting worse. 7/10 pain. Slight fever. Hurts when I walk. 25M." },
  { id: 21, severity: "NEEDS_DOCTOR_NOW", symptoms: "Vomiting for 8 hours straight. Can't keep water down. Dizzy when I stand. 35F." },
  { id: 22, severity: "NEEDS_DOCTOR_NOW", symptoms: "High fever 103F for 2 days. Chills, body aches, extreme fatigue. Coughing up green phlegm. 60M with diabetes." },
  { id: 23, severity: "EMERGENCY", symptoms: "Severe headache came on suddenly 2 hours ago. Worst headache of my life. Neck feels stiff. 40M." },
  { id: 24, severity: "EMERGENCY", symptoms: "Crushing chest pain for 20 minutes. Radiating to my left arm. Sweating. Short of breath. 55M." },
  { id: 25, severity: "EMERGENCY", symptoms: "My face is drooping on one side. Can't lift my right arm. Speech is slurred. Started 30 minutes ago. 65F." }
];

async function runTests() {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  console.log("=".repeat(70));
  console.log("HEYDOC PROMPT TEST v2 - 25 SCENARIOS");
  console.log("=".repeat(70));

  const results = [];
  const urgencyOrder = ["MILD", "MODERATE", "NEEDS_DOCTOR_24_72H", "NEEDS_DOCTOR_NOW", "EMERGENCY"];

  for (const test of testCases) {
    console.log("\nTEST #" + test.id + " | Expected: " + test.severity);
    console.log("SYMPTOMS: " + test.symptoms.substring(0, 60) + "...");

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: test.symptoms }]
      });

      const reply = response.content[0].text;

      const urgencyMatch = reply.match(/\*\*Urgency:\*\*\s*(EMERGENCY|NEEDS_DOCTOR_NOW|NEEDS_DOCTOR_24_72H|MODERATE|MILD)/i) ||
                          reply.match(/\*\*Urgency:\s*(EMERGENCY|NEEDS_DOCTOR_NOW|NEEDS_DOCTOR_24_72H|MODERATE|MILD)\*\*/i) ||
                          reply.match(/Urgency:\s*(EMERGENCY|NEEDS_DOCTOR_NOW|NEEDS_DOCTOR_24_72H|MODERATE|MILD)/i);

      const actualUrgency = urgencyMatch ? urgencyMatch[1].toUpperCase() : "NOT_FOUND";
      const match = actualUrgency === test.severity;

      const expectedIdx = urgencyOrder.indexOf(test.severity);
      const actualIdx = urgencyOrder.indexOf(actualUrgency);
      const moreCautious = actualIdx > expectedIdx;

      results.push({ id: test.id, expected: test.severity, actual: actualUrgency, match, moreCautious });

      const status = match ? "EXACT MATCH" : (moreCautious ? "MORE CAUTIOUS (OK)" : "LESS CAUTIOUS");
      console.log("RESULT: " + actualUrgency + " | " + status);

      await new Promise(r => setTimeout(r, 400));

    } catch (error) {
      console.log("ERROR: " + error.message);
      results.push({ id: test.id, expected: test.severity, actual: "ERROR", match: false, moreCautious: false });
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("SUMMARY");
  console.log("=".repeat(70));

  const exact = results.filter(r => r.match).length;
  const cautious = results.filter(r => r.moreCautious && !r.match).length;
  const acceptable = exact + cautious;

  console.log("Exact matches: " + exact + "/" + results.length);
  console.log("More cautious (acceptable): " + cautious);
  console.log("TOTAL ACCEPTABLE: " + acceptable + "/" + results.length + " (" + ((acceptable/results.length)*100).toFixed(1) + "%)");

  const problems = results.filter(r => !r.match && !r.moreCautious && r.actual !== "NOT_FOUND");
  if (problems.length > 0) {
    console.log("\nPROBLEMS (less cautious):");
    problems.forEach(r => console.log("  #" + r.id + ": Expected " + r.expected + " got " + r.actual));
  }

  const notFound = results.filter(r => r.actual === "NOT_FOUND");
  if (notFound.length > 0) {
    console.log("\nPARSING ISSUES:");
    notFound.forEach(r => console.log("  #" + r.id + ": Could not parse urgency"));
  }
}

runTests().catch(console.error);
