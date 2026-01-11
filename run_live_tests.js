const https = require('https');

const API_KEY = 'AIzaSyAv2YInxCnvmFHkgpkJAYvh5Q_MI_Qt2qo';
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

function postJSON(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch(e) { resolve(body); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function postJSONWithAuth(url, data, token) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch(e) { resolve(body); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  const fs = require('fs');
  const outputFile = '/Users/mr.assister/claudeProjects/heydoc-handoff/heydoc/HEYDOC_TEST_RESULTS.md';
  
  // Sign in
  console.log('Signing in...');
  const authResponse = await postJSON(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    { email: 'chattest@heydoc.com', password: 'testing123', returnSecureToken: true }
  );
  
  if (!authResponse.idToken) {
    console.log('Auth failed:', authResponse);
    return;
  }
  
  const token = authResponse.idToken;
  console.log('Signed in successfully!\n');
  
  let output = `# HeyDoc Live Test Results\n`;
  output += `**Date:** ${new Date().toISOString()}\n`;
  output += `**Test Account:** chattest@heydoc.com\n\n`;
  output += `---\n\n`;
  
  const results = [];
  
  for (const test of testCases) {
    console.log(`Running Test #${test.id}...`);
    
    try {
      const response = await postJSONWithAuth(
        'https://us-central1-heydoc-562fe.cloudfunctions.net/chat',
        { data: { messages: [{ role: 'user', content: test.symptoms }] } },
        token
      );
      
      const message = response.result?.message || 'No response';
      
      // Extract urgency
      const urgencyMatch = message.match(/Urgency:\s*(EMERGENCY|NEEDS_DOCTOR_NOW|NEEDS_DOCTOR_24_72H|MODERATE|MILD)/i);
      const actualUrgency = urgencyMatch ? urgencyMatch[1].toUpperCase() : 'NOT_FOUND';
      const match = actualUrgency === test.severity;
      
      results.push({ id: test.id, expected: test.severity, actual: actualUrgency, match });
      
      output += `## Test #${test.id} - ${test.severity}\n\n`;
      output += `**Patient Input:**\n> ${test.symptoms}\n\n`;
      output += `**Expected Urgency:** ${test.severity}\n`;
      output += `**Actual Urgency:** ${actualUrgency} ${match ? '✅' : '❌'}\n\n`;
      output += `**HeyDoc Response:**\n\n${message}\n\n`;
      output += `---\n\n`;
      
      // Small delay
      await new Promise(r => setTimeout(r, 800));
      
    } catch (error) {
      output += `## Test #${test.id} - ERROR\n\n`;
      output += `Error: ${error.message}\n\n---\n\n`;
      results.push({ id: test.id, expected: test.severity, actual: 'ERROR', match: false });
    }
  }
  
  // Summary
  const exact = results.filter(r => r.match).length;
  output += `# Summary\n\n`;
  output += `| Test | Expected | Actual | Result |\n`;
  output += `|------|----------|--------|--------|\n`;
  results.forEach(r => {
    output += `| #${r.id} | ${r.expected} | ${r.actual} | ${r.match ? '✅' : '❌'} |\n`;
  });
  output += `\n**Accuracy: ${exact}/${results.length} (${((exact/results.length)*100).toFixed(1)}%)**\n`;
  
  fs.writeFileSync(outputFile, output);
  console.log(`\nResults saved to: ${outputFile}`);
  console.log(`Accuracy: ${exact}/${results.length}`);
}

runTests().catch(console.error);
