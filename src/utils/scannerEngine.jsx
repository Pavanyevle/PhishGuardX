import { DEEPSEEK_API_KEY } from '@env';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

/* ============================= */
/* Normalize URL */
/* ============================= */
const normalizeUrl = (input) => {
  if (!input.startsWith('http://') && !input.startsWith('https://')) {
    return 'https://' + input;
  }
  return input;
};

/* ============================= */
/* Extract Domain */
/* ============================= */
const extractDomain = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
};

/* ============================= */
/* Rule Based Scan */
/* ============================= */
const ruleBasedScan = (url) => {
  let score = 0;

  const parsed = new URL(url);
  const hostname = parsed.hostname.toLowerCase();
  const fullUrl = url.toLowerCase();

  if (parsed.protocol !== 'https:') score += 25;

  const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
  if (ipRegex.test(hostname)) score += 40;

  if (hostname.split('.').length > 4) score += 15;

  const keywords = [
    'login',
    'verify',
    'secure',
    'update',
    'bank',
    'password',
    'bonus',
    'free',
  ];

  keywords.forEach(word => {
    if (fullUrl.includes(word)) score += 10;
  });

  const suspiciousTLDs = ['.xyz', '.ru', '.tk', '.ml', '.ga'];
  suspiciousTLDs.forEach(tld => {
    if (hostname.endsWith(tld)) score += 20;
  });

  return score;
};

/* ============================= */
/* Firebase Global Blacklist */
/* ============================= */
const blacklistCheck = async (domain) => {
  try {
    const snapshot = await database()
      .ref('phishing_blacklist')
      .once('value');

    const blacklist = snapshot.val();
    if (!blacklist) return false;

    return Object.values(blacklist).includes(domain);
  } catch (e) {
    console.log('Blacklist error:', e);
    return false;
  }
};

/* ============================= */
/* DeepSeek AI Scan */
/* ============================= */
const aiScan = async (url) => {
  try {
    const res = await fetch(
      'https://api.deepseek.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content:
                'You are a strict cybersecurity engine. Reply ONLY SAFE, SUSPICIOUS, or HIGH.',
            },
            { role: 'user', content: url },
          ],
        }),
      }
    );

    const data = await res.json();

    const text =
      data?.choices?.[0]?.message?.content?.trim().toUpperCase() || 'SAFE';

    if (text.includes('HIGH')) return 'HIGH';
    if (text.includes('SUSPICIOUS')) return 'SUSPICIOUS';
    return 'SAFE';

  } catch (e) {
    console.log('AI error:', e);
    return 'SAFE';
  }
};

/* ============================= */
/* Auto Store Result */
/* ============================= */
const autoStoreResult = async (domain, result) => {
  try {
    const user = auth().currentUser;
    if (!user) return;

    const key = domain.replace(/\./g, '_dot_');

    if (result === 'SAFE') {
      await database()
        .ref(`users/${user.uid}/whitelist/${key}`)
        .set({
          original: domain,
          auto: true,
          addedAt: Date.now(),
        });
    }

    if (result === 'HIGH' || result === 'SUSPICIOUS') {
      await database()
        .ref(`users/${user.uid}/blacklist/${key}`)
        .set({
          original: domain,
          auto: true,
          riskLevel: result,
          addedAt: Date.now(),
        });
    }

  } catch (e) {
    console.log('Store error:', e);
  }
};

/* ============================= */
/* FINAL HYBRID SCAN */
/* ============================= */
export const hybridScan = async (inputUrl) => {
  try {
    if (!inputUrl) return 'SUSPICIOUS';

    const url = normalizeUrl(inputUrl);
    const domain = extractDomain(url);
    if (!domain) return 'SUSPICIOUS';

    const blacklisted = await blacklistCheck(domain);
    if (blacklisted) {
      await autoStoreResult(domain, 'HIGH');
      return 'HIGH';
    }

    let risk = ruleBasedScan(url);

    const aiResult = await aiScan(url);

    if (aiResult === 'HIGH') risk += 40;
    if (aiResult === 'SUSPICIOUS') risk += 20;

    let finalResult;

    if (risk < 30) finalResult = 'SAFE';
    else if (risk < 60) finalResult = 'SUSPICIOUS';
    else finalResult = 'HIGH';

    await autoStoreResult(domain, finalResult);

    return finalResult;

  } catch (e) {
    console.log('Hybrid error:', e);
    return 'SUSPICIOUS';
  }
};