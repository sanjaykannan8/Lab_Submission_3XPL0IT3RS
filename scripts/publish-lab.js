/* eslint-disable no-console */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

const REQUIRED_ENV_VARS = [
  'FIREBASE_SERVICE_ACCOUNT',
  'ISSUE_BODY',
  'ISSUE_NUMBER',
  'ISSUE_HTML_URL',
  'ISSUE_CREATED_AT',
  'ISSUE_USER_LOGIN',
  'APPROVED_BY_LOGIN',
];

for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key] || process.env[key].trim().length === 0) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
let serviceAccount;

try {
  serviceAccount = JSON.parse(serviceAccountJson);
} catch (error) {
  console.error('FIREBASE_SERVICE_ACCOUNT is not valid JSON:', error);
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const issueBody = process.env.ISSUE_BODY;
const issueNumber = process.env.ISSUE_NUMBER;
const issueHtmlUrl = process.env.ISSUE_HTML_URL;
const issueCreatedAt = process.env.ISSUE_CREATED_AT;
const issueUserLogin = process.env.ISSUE_USER_LOGIN;
const approvedByLogin = process.env.APPROVED_BY_LOGIN;

const DEFAULT_POINTS_TO_UNLOCK = 3;

function extractField(label) {
  const pattern = new RegExp(`###\\s+${label}\\s*\\n+([\\s\\S]*?)(?=\\n###\\s|$)`, 'i');
  const match = issueBody.match(pattern);
  if (!match) {
    return '';
  }

  return match[1].trim();
}

function ensureValue(value, fieldName) {
  if (!value) {
    console.error(
      `Missing required field "${fieldName}" in the issue body. Make sure the template has not been modified.`,
    );
    process.exit(1);
  }

  return value;
}

async function main() {
  const submitterName = ensureValue(extractField('Submitter Name'), 'Submitter Name');
  const challengeName = ensureValue(extractField('Challenge Name'), 'Challenge Name');
  const challengeType = ensureValue(extractField('Challenge Type'), 'Challenge Type');
  const challengeDescription = ensureValue(
    extractField('Challenge Description'),
    'Challenge Description',
  );
  const flag = ensureValue(extractField('Flag'), 'Flag');
  const solution = ensureValue(extractField('Solution'), 'Solution');
  const extraDetails = extractField('Extra Details');

  const docId = `issue-${issueNumber}`;

  const approvedTimestamp = Timestamp.now();
  const submittedTimestamp = issueCreatedAt
    ? Timestamp.fromDate(new Date(issueCreatedAt))
    : approvedTimestamp;

  // Hash the flag for secure storage (SHA-256)
  const crypto = require('crypto');
  const flagHash = crypto.createHash('sha256').update(flag.trim()).digest('hex');

  const labPayload = {
    title: challengeName,
    description: challengeDescription,
    challengeType,
    authorName: submitterName,
    flagHash, // Store only the hash, never the plain flag
    solution,
    extraNotes: extraDetails || null,
    pointsToUnlock: DEFAULT_POINTS_TO_UNLOCK,
    pointsReward: 10, // Points awarded for correct flag submission
    status: 'published',
    approvedAt: approvedTimestamp,
    approvedBy: approvedByLogin,
    submittedAt: submittedTimestamp,
    githubIssueNumber: Number(issueNumber),
    githubIssueUrl: issueHtmlUrl,
    submittedByGithub: issueUserLogin,
    lastSyncedAt: approvedTimestamp,
  };

  console.log(`Publishing lab for issue #${issueNumber}: "${challengeName}"`);

  await db.collection('labs').doc(docId).set(labPayload, { merge: true });

  console.log('Lab published successfully with flag hash.');
}

main().catch((error) => {
  console.error('Failed to publish lab to Firestore:', error);
  process.exit(1);
});

