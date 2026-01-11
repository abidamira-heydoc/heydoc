const https = require('https');

const API_KEY = 'AIzaSyAv2YInxCnvmFHkgpkJAYvh5Q_MI_Qt2qo';
const PROJECT_ID = 'heydoc-562fe';

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

// Firestore REST API helper
function firestoreRequest(path, method, data, token) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const options = {
      hostname: 'firestore.googleapis.com',
      path: '/v1/projects/' + PROJECT_ID + '/databases/(default)/documents' + path,
      method: method,
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
    if (postData) req.write(postData);
    req.end();
  });
}

// Convert JS Date to Firestore timestamp format
function toFirestoreTimestamp(date) {
  return { timestampValue: date.toISOString() };
}

// Convert string to Firestore string format
function toFirestoreString(str) {
  return { stringValue: str };
}

// Convert boolean to Firestore boolean format
function toFirestoreBool(bool) {
  return { booleanValue: bool };
}

async function runTests() {
  console.log('Signing in...');
  const authResponse = await postJSON(
    'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + API_KEY,
    { email: 'chattest@heydoc.com', password: 'testing123', returnSecureToken: true }
  );

  if (!authResponse.idToken) {
    console.log('Auth failed:', authResponse);
    return;
  }

  const token = authResponse.idToken;
  const userId = authResponse.localId;
  console.log('Signed in! User ID:', userId);
  console.log('');

  let successCount = 0;

  for (const test of testCases) {
    console.log('Test #' + test.id + ' (' + test.severity + ')...');

    try {
      // 1. Call the chat function to get AI response
      const chatResponse = await postJSONWithAuth(
        'https://us-central1-heydoc-562fe.cloudfunctions.net/chat',
        { data: { messages: [{ role: 'user', content: test.symptoms }] } },
        token
      );

      const aiMessage = chatResponse.result?.message || 'No response';

      // 2. Create conversation in Firestore
      const now = new Date();
      const title = 'Test #' + test.id + ': ' + test.symptoms.substring(0, 40) + '...';

      const conversationDoc = {
        fields: {
          userId: toFirestoreString(userId),
          title: toFirestoreString(title),
          createdAt: toFirestoreTimestamp(now),
          updatedAt: toFirestoreTimestamp(now),
          emergencyDetected: toFirestoreBool(test.severity === 'EMERGENCY'),
          messages: { arrayValue: { values: [] } }
        }
      };

      const convResult = await firestoreRequest('/conversations', 'POST', conversationDoc, token);

      if (convResult.error) {
        console.log('  Error creating conversation:', convResult.error.message);
        continue;
      }

      // Extract conversation ID from the name (format: projects/.../documents/conversations/CONV_ID)
      const convName = convResult.name;
      const conversationId = convName.split('/').pop();

      // 3. Create user message in Firestore
      const userMsgDoc = {
        fields: {
          conversationId: toFirestoreString(conversationId),
          role: toFirestoreString('user'),
          content: toFirestoreString(test.symptoms),
          timestamp: toFirestoreTimestamp(now),
          emergencyFlag: toFirestoreBool(test.severity === 'EMERGENCY')
        }
      };

      await firestoreRequest('/messages', 'POST', userMsgDoc, token);

      // 4. Create assistant message in Firestore
      const assistantMsgDoc = {
        fields: {
          conversationId: toFirestoreString(conversationId),
          role: toFirestoreString('assistant'),
          content: toFirestoreString(aiMessage),
          timestamp: toFirestoreTimestamp(new Date(now.getTime() + 1000))
        }
      };

      await firestoreRequest('/messages', 'POST', assistantMsgDoc, token);

      // Extract urgency from response
      const urgencyMatch = aiMessage.match(/Urgency:\s*(EMERGENCY|NEEDS_DOCTOR_NOW|NEEDS_DOCTOR_24_72H|MODERATE|MILD)/i);
      const actualUrgency = urgencyMatch ? urgencyMatch[1].toUpperCase() : 'NOT_FOUND';
      const match = actualUrgency === test.severity;

      if (match) successCount++;

      console.log('  Created conversation: ' + conversationId);
      console.log('  Expected: ' + test.severity + ', Got: ' + actualUrgency + ' ' + (match ? 'OK' : 'MISMATCH'));

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 1000));

    } catch (error) {
      console.log('  Error:', error.message);
    }
  }

  console.log('');
  console.log('='.repeat(50));
  console.log('COMPLETE!');
  console.log('Created ' + testCases.length + ' conversations in chat history');
  console.log('Accuracy: ' + successCount + '/' + testCases.length);
  console.log('');
  console.log('Open https://heydoccare.com and log in as chattest@heydoc.com');
  console.log('to see all test conversations in the sidebar!');
}

runTests().catch(console.error);
