require('dotenv').config();
const express = require('express');
const session = require('express-session');
const msal = require('@azure/msal-node');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

/* ── MSAL Config ── */
const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || 'common'}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET || '',
  },
};

const REDIRECT_URI = process.env.REDIRECT_URI || `http://localhost:${PORT}/auth/callback`;
const DEVOPS_ORG = process.env.AZURE_DEVOPS_ORG || 'tederga';
const DEVOPS_PROJECT = process.env.AZURE_DEVOPS_PROJECT || 'T_SW_Projects';

const GRAPH_SCOPES = ['https://graph.microsoft.com/.default'];
const DEVOPS_SCOPES = ['499b84ac-1321-427f-aa17-267ca6975798/.default'];

// User-delegated scopes for interactive login
const LOGIN_SCOPES = [
  'openid', 'profile', 'email', 'offline_access',
  'User.Read',
  'AuditLog.Read.All',
  'User.Read.All',
  'Directory.Read.All',
];

let cca = null;
const isConfigured = !!(process.env.AZURE_CLIENT_ID && process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_SECRET);

if (isConfigured) {
  cca = new msal.ConfidentialClientApplication(msalConfig);
  console.log('[MSAL] Azure AD configured for tenant:', process.env.AZURE_TENANT_ID);
} else {
  console.log('[MSAL] Azure AD not configured - running in DEMO mode');
  console.log('[MSAL] Copy .env.example to .env and fill in your credentials to enable real API');
}

/* ── Session ── */
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
}));

/* ── Static files ── */
app.use(express.static(path.join(__dirname), {
  index: false,
  extensions: ['html'],
}));
app.use(express.json());

/* ── Regulation Engine ── */
const regulationRouter = require('./routes/regulation');
app.use('/api/regulation', regulationRouter);
app.get('/regulation-engine', (req, res) => {
  res.sendFile(path.join(__dirname, 'regulation-engine.html'));
});

/* ── Open Data Proxies (CORS bypass for public datasets) ── */
app.get('/proxy/ibb-parks', async (req, res) => {
  const url = 'https://data.ibb.gov.tr/dataset/82e809cf-9465-407a-91cd-ac745d6fbc95' +
    '/resource/41ddb7a6-6931-4176-9614-2c2892da5307/download/yaysis_mahal_geo_data.geojson';
  try {
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 60000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    response.data.pipe(res);
  } catch (err) {
    console.error('[Proxy] ibb-parks error:', err.message);
    res.status(502).json({ error: 'Upstream fetch failed', detail: err.message });
  }
});

app.get('/proxy/izmir-co2', async (req, res) => {
  const files = {
    emissions: 'https://acikveri.bizizmir.com/dataset/89785392-da99-4d7b-a01e-6601691ac731' +
      '/resource/d2ec448e-f225-430e-9e26-2a7b51e539b6/download/co2_emisyon_deerleri_ton.csv',
    efficiency: 'https://acikveri.bizizmir.com/dataset/89785392-da99-4d7b-a01e-6601691ac731' +
      '/resource/987be479-6d1e-4016-8c74-9a340f07b577/download/1milyonyol.bas.co2_mik.ton.csv',
  };
  const file = req.query.file;
  if (!files[file]) return res.status(400).json({ error: 'Invalid file param. Use ?file=emissions or ?file=efficiency' });
  try {
    const response = await axios.get(files[file], {
      responseType: 'stream',
      timeout: 30000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    response.data.pipe(res);
  } catch (err) {
    console.error('[Proxy] izmir-co2 error:', err.message);
    res.status(502).json({ error: 'Upstream fetch failed', detail: err.message });
  }
});

/* ── Middleware: check auth ── */
function requireAuth(req, res, next) {
  if (!req.session.account) {
    return res.status(401).json({ error: 'Not authenticated', demo: !isConfigured });
  }
  next();
}

/* ── Helper: get Graph token (client credentials) ── */
async function getGraphToken() {
  if (!cca) throw new Error('MSAL not configured');
  const result = await cca.acquireTokenByClientCredential({ scopes: GRAPH_SCOPES });
  return result.accessToken;
}

/* ── Helper: get DevOps token (client credentials) ── */
async function getDevOpsToken() {
  if (!cca) throw new Error('MSAL not configured');
  const result = await cca.acquireTokenByClientCredential({ scopes: DEVOPS_SCOPES });
  return result.accessToken;
}

/* ── Helper: Graph API call (uses delegated token if available, falls back to client credentials) ── */
async function graphApi(endpoint, params = {}, delegatedToken = null, apiVersion = 'v1.0') {
  const token = delegatedToken || await getGraphToken();
  const url = `https://graph.microsoft.com/${apiVersion}${endpoint}`;
  console.log(`[Graph] → ${apiVersion}${endpoint}`);
  const res = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      ConsistencyLevel: 'eventual',
    },
    params,
    timeout: 60000,
  });
  console.log(`[Graph] ← ${endpoint} (${(res.data.value||[]).length} items)`);
  return res.data;
}

/* ── Helper: DevOps API call (PAT or OAuth) ── */
const DEVOPS_PAT = process.env.AZURE_DEVOPS_PAT || '';
function devopsAuthHeader() {
  if (DEVOPS_PAT) {
    return 'Basic ' + Buffer.from(':' + DEVOPS_PAT).toString('base64');
  }
  return null;
}
async function devopsApi(endpoint, method = 'GET', data = null) {
  const url = `https://dev.azure.com/${DEVOPS_ORG}/${DEVOPS_PROJECT}/_apis${endpoint}`;
  let authHeader = devopsAuthHeader();
  if (!authHeader) {
    const token = await getDevOpsToken();
    authHeader = `Bearer ${token}`;
  }
  console.log(`[DevOps] → ${endpoint}`);
  const config = {
    method,
    url,
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    params: { 'api-version': '7.1' },
    timeout: 15000,
  };
  if (data) config.data = data;
  const res = await axios(config);
  console.log(`[DevOps] ← ${endpoint} (${(res.data.value||[]).length || 0} items)`);
  return res.data;
}

/* ── Helper: DevOps Org-level API (vsaex.dev.azure.com) ── */
async function devopsOrgApi(endpoint) {
  const url = `https://vsaex.dev.azure.com/${DEVOPS_ORG}/_apis${endpoint}`;
  let authHeader = devopsAuthHeader();
  if (!authHeader) {
    const token = await getDevOpsToken();
    authHeader = `Bearer ${token}`;
  }
  console.log(`[DevOps-Org] → ${endpoint}`);
  const res = await axios.get(url, {
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    params: { 'api-version': '7.1-preview.3' },
    timeout: 15000,
  });
  console.log(`[DevOps-Org] ← ${endpoint} (${(res.data.members||res.data.value||[]).length} items)`);
  return res.data;
}

/* ── Cache for DevOps members ── */
let devopsMembersCache = { data: null, expiry: 0 };
const MEMBERS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/* ═══════════════════════════════════════════
   AUTH ROUTES
   ═══════════════════════════════════════════ */

/* GET /auth/status - check if configured and logged in */
app.get('/auth/status', (req, res) => {
  res.json({
    configured: isConfigured,
    authenticated: !!req.session.account,
    user: req.session.account ? {
      name: req.session.account.name,
      username: req.session.account.username,
    } : null,
  });
});

/* GET /auth/login - start OAuth flow */
app.get('/auth/login', async (req, res) => {
  if (!cca) return res.redirect('/?error=not_configured');
  try {
    const authUrl = await cca.getAuthCodeUrl({
      scopes: LOGIN_SCOPES,
      redirectUri: REDIRECT_URI,
      prompt: 'select_account',
    });
    res.redirect(authUrl);
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    res.redirect('/?error=login_failed');
  }
});

/* GET /auth/callback - OAuth callback */
app.get('/auth/callback', async (req, res) => {
  if (!cca) return res.redirect('/?error=not_configured');
  try {
    const tokenResponse = await cca.acquireTokenByCode({
      code: req.query.code,
      scopes: LOGIN_SCOPES,
      redirectUri: REDIRECT_URI,
    });
    req.session.account = tokenResponse.account;
    req.session.accessToken = tokenResponse.accessToken;
    console.log('[Auth] User logged in:', tokenResponse.account.username);
    res.redirect('/performance.html');
  } catch (err) {
    console.error('[Auth] Callback error:', err.message);
    res.redirect('/?error=auth_failed');
  }
});

/* GET /auth/logout */
app.get('/auth/logout', (req, res) => {
  const account = req.session.account?.username || 'unknown';
  req.session.destroy(() => {
    console.log('[Auth] User logged out:', account);
    res.redirect('/performance.html');
  });
});

/* ═══════════════════════════════════════════
   GRAPH API ROUTES
   ═══════════════════════════════════════════ */

/* GET /api/me - current user info */
app.get('/api/me', (req, res) => {
  if (!req.session.account) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({
    name: req.session.account.name,
    username: req.session.account.username,
    tenantId: req.session.account.tenantId,
  });
});

/* GET /api/users - list users from Azure AD */
app.get('/api/users', requireAuth, async (req, res) => {
  try {
    const token = req.session.accessToken;
    const data = await graphApi('/users', {
      $select: 'id,displayName,userPrincipalName,department,jobTitle,accountEnabled,signInActivity',
      $top: 999,
    }, token);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const users = (data.value || [])
      .filter(u => {
        if (u.accountEnabled === false) return false;
        // Filter out users with no sign-in in last 30 days
        const lastSignIn = u.signInActivity?.lastSignInDateTime;
        if (!lastSignIn) return false; // never signed in
        return new Date(lastSignIn) >= thirtyDaysAgo;
      })
      .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '', 'tr'))
      .map((u, i) => ({
        id: u.id,
        name: u.displayName,
        upn: u.userPrincipalName,
        dept: u.department || 'Bilinmiyor',
        role: u.jobTitle || '',
        lastSignIn: u.signInActivity?.lastSignInDateTime || null,
        index: i,
      }));
    res.json(users);
  } catch (err) {
    const errData = err.response?.data;
    console.error('[API] Users error:', JSON.stringify(errData) || err.message);
    res.status(500).json({ error: 'Failed to fetch users', detail: errData?.error?.message || err.message });
  }
});

/* GET /api/signins?upn=xxx&from=xxx&to=xxx - sign-in logs */
app.get('/api/signins', requireAuth, async (req, res) => {
  try {
    const { upn, from, to } = req.query;
    if (!upn) return res.status(400).json({ error: 'upn parameter required' });

    const fromDate = from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const toDate = to || new Date().toISOString();

    let filter = `userPrincipalName eq '${upn}' and createdDateTime ge ${fromDate} and createdDateTime le ${toDate}`;

    const token = req.session.accessToken;
    const data = await graphApi('/auditLogs/signIns', {
      $filter: filter,
      $top: 500,
      $select: 'createdDateTime,appDisplayName,clientAppUsed,ipAddress,status',
    }, token);

    const signins = (data.value || []).map(s => ({
      time: s.createdDateTime,
      app: s.appDisplayName || 'Unknown',
      client: s.clientAppUsed || '',
      ip: s.ipAddress || '',
      status: s.status?.errorCode === 0 ? 'success' : 'failure',
      statusDetail: s.status?.failureReason || '',
    }));

    res.json(signins);
  } catch (err) {
    console.error('[API] SignIns error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch sign-ins', detail: err.message });
  }
});

/* ═══════════════════════════════════════════
   AZURE DEVOPS API ROUTES
   ═══════════════════════════════════════════ */

/* GET /api/devops/members - list DevOps org members (cached 30 min) */
app.get('/api/devops/members', requireAuth, async (req, res) => {
  try {
    // Return cached if fresh
    if (devopsMembersCache.data && Date.now() < devopsMembersCache.expiry) {
      console.log('[DevOps-Org] Members served from cache');
      return res.json(devopsMembersCache.data);
    }

    // Fetch member entitlements (paginated)
    let allMembers = [];
    let continuationToken = null;
    do {
      let endpoint = '/userentitlements?$top=500';
      if (continuationToken) endpoint += `&continuationToken=${continuationToken}`;
      const data = await devopsOrgApi(endpoint);
      const members = (data.members || data.value || []).map(m => ({
        email: (m.user?.mailAddress || m.user?.principalName || '').toLowerCase(),
        displayName: m.user?.displayName || '',
        accessLevel: m.accessLevel?.accountLicenseType || '',
      }));
      allMembers = allMembers.concat(members);
      continuationToken = data.continuationToken || null;
    } while (continuationToken);

    // Filter out empty emails
    const result = allMembers.filter(m => m.email);
    console.log(`[DevOps-Org] Total members: ${result.length}`);

    // Cache result
    devopsMembersCache = { data: result, expiry: Date.now() + MEMBERS_CACHE_TTL };
    res.json(result);
  } catch (err) {
    console.error('[API] DevOps Members error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch DevOps members', detail: err.message });
  }
});

/* GET /api/devops/repos - list repositories */
app.get('/api/devops/repos', requireAuth, async (req, res) => {
  try {
    const data = await devopsApi('/git/repositories');
    const repos = (data.value || []).map(r => ({
      id: r.id,
      name: r.name,
      defaultBranch: r.defaultBranch,
      url: r.webUrl,
    }));
    res.json(repos);
  } catch (err) {
    console.error('[API] Repos error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch repos', detail: err.message });
  }
});

/* GET /api/devops/commits?repoId=xxx&author=xxx&from=xxx&to=xxx */
app.get('/api/devops/commits', requireAuth, async (req, res) => {
  try {
    const { repoId, author, from, to } = req.query;
    if (!repoId) return res.status(400).json({ error: 'repoId parameter required' });

    let endpoint = `/git/repositories/${repoId}/commits`;
    const params = new URLSearchParams();
    if (author) params.append('searchCriteria.author', author);
    if (from) params.append('searchCriteria.fromDate', from);
    if (to) params.append('searchCriteria.toDate', to);
    params.append('searchCriteria.$top', '200');

    const queryStr = params.toString();
    if (queryStr) endpoint += `?${queryStr}`;

    const data = await devopsApi(endpoint);
    const commits = (data.value || []).map(c => ({
      id: c.commitId,
      message: c.comment,
      author: c.author?.name,
      email: c.author?.email,
      date: c.author?.date,
      changeCounts: c.changeCounts,
    }));
    res.json(commits);
  } catch (err) {
    console.error('[API] Commits error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch commits', detail: err.message });
  }
});

/* GET /api/devops/pullrequests?creatorId=xxx&status=all */
app.get('/api/devops/pullrequests', requireAuth, async (req, res) => {
  try {
    const { status, creatorId } = req.query;
    let endpoint = '/git/pullrequests';
    const params = new URLSearchParams();
    if (status) params.append('searchCriteria.status', status);
    if (creatorId) params.append('searchCriteria.creatorId', creatorId);
    params.append('$top', '100');

    const queryStr = params.toString();
    if (queryStr) endpoint += `?${queryStr}`;

    const data = await devopsApi(endpoint);
    const prs = (data.value || []).map(pr => ({
      id: pr.pullRequestId,
      title: pr.title,
      status: pr.status,
      createdBy: pr.createdBy?.displayName,
      createdByEmail: pr.createdBy?.uniqueName,
      creationDate: pr.creationDate,
      closedDate: pr.closedDate,
      sourceRef: pr.sourceRefName,
      targetRef: pr.targetRefName,
      mergeStatus: pr.mergeStatus,
    }));
    res.json(prs);
  } catch (err) {
    console.error('[API] PRs error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch pull requests', detail: err.message });
  }
});

/* GET /api/devops/workitems?assignedTo=xxx&from=xxx */
app.get('/api/devops/workitems', requireAuth, async (req, res) => {
  try {
    const { assignedTo, from } = req.query;
    const fromDate = from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let query = `SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo], [System.WorkItemType], [System.ChangedDate], [System.CreatedDate]
      FROM WorkItems
      WHERE [System.TeamProject] = '${DEVOPS_PROJECT}'`;

    if (assignedTo) {
      query += ` AND [System.AssignedTo] = '${assignedTo}'`;
    }
    query += ` AND [System.ChangedDate] >= '${fromDate}'`;
    query += ` ORDER BY [System.ChangedDate] DESC`;

    const wiqlResult = await devopsApi('/wit/wiql', 'POST', { query });
    const ids = (wiqlResult.workItems || []).map(w => w.id).slice(0, 100);

    if (ids.length === 0) return res.json([]);

    // Fetch work item details in batches
    const batchSize = 200;
    const allItems = [];
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const token = await getDevOpsToken();
      const detailUrl = `https://dev.azure.com/${DEVOPS_ORG}/${DEVOPS_PROJECT}/_apis/wit/workitems?ids=${batch.join(',')}&$expand=none&api-version=7.1`;
      const detailRes = await axios.get(detailUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const items = (detailRes.data.value || []).map(w => ({
        id: w.id,
        title: w.fields['System.Title'],
        state: w.fields['System.State'],
        type: w.fields['System.WorkItemType'],
        assignedTo: w.fields['System.AssignedTo']?.displayName,
        changedDate: w.fields['System.ChangedDate'],
        createdDate: w.fields['System.CreatedDate'],
      }));
      allItems.push(...items);
    }

    res.json(allItems);
  } catch (err) {
    console.error('[API] WorkItems error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch work items', detail: err.message });
  }
});

/* GET /api/devops/builds?requestedFor=xxx&from=xxx&to=xxx */
app.get('/api/devops/builds', requireAuth, async (req, res) => {
  try {
    const { requestedFor, from, to } = req.query;
    let endpoint = '/build/builds';
    const params = new URLSearchParams();
    if (requestedFor) params.append('requestedFor', requestedFor);
    if (from) params.append('minTime', from);
    if (to) params.append('maxTime', to);
    params.append('$top', '100');

    const queryStr = params.toString();
    if (queryStr) endpoint += `?${queryStr}`;

    const data = await devopsApi(endpoint);
    const builds = (data.value || []).map(b => ({
      id: b.id,
      number: b.buildNumber,
      status: b.status,
      result: b.result,
      definition: b.definition?.name,
      requestedBy: b.requestedBy?.displayName,
      requestedByEmail: b.requestedBy?.uniqueName,
      startTime: b.startTime,
      finishTime: b.finishTime,
      sourceBranch: b.sourceBranch,
    }));
    res.json(builds);
  } catch (err) {
    console.error('[API] Builds error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch builds', detail: err.message });
  }
});

/* ═══════════════════════════════════════════
   DAILY REPORT API (for Power Automate)
   ═══════════════════════════════════════════ */

const REPORT_API_KEY = process.env.REPORT_API_KEY || '';

function requireReportKey(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.key;
  if (!REPORT_API_KEY || key !== REPORT_API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  next();
}

/* ── Timezone helper (Turkey / UTC+3) ── */
const TZ = 'Europe/Istanbul';
function nowTR() {
  // Returns a Date-like object whose getters reflect Turkish local time
  const iso = new Date().toLocaleString('en-US', { timeZone: TZ });
  return new Date(iso);
}

/* ── Server-side PRNG (same as client) ── */
function seededRandom(seed) {
  let s = seed;
  return function() {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function minutesToTime(m) {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

function computeVariance(arr) {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  return arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
}

/* ── Demo data generation (mirrors client-side) ── */
const DEMO_USERS = [
  { id:1, name:'Ayşe Kaya', upn:'ayse.kaya@contoso.com', dept:'Muhasebe', role:'Uzman', userType:'office' },
  { id:2, name:'Mert Demir', upn:'mert.demir@contoso.com', dept:'IT', role:'Kıdemli Müh.', userType:'devops' },
  { id:3, name:'Elif Şahin', upn:'elif.sahin@contoso.com', dept:'İK', role:'Müdür', userType:'office' },
  { id:4, name:'Can Arslan', upn:'can.arslan@contoso.com', dept:'Satış', role:'Temsilci', userType:'office' },
  { id:5, name:'Zeynep Yıldız', upn:'zeynep.yildiz@contoso.com', dept:'Pazarlama', role:'Analist', userType:'office' },
  { id:6, name:'Mehmet Çelik', upn:'mehmet.celik@contoso.com', dept:'Finans', role:'Müdür', userType:'office' },
  { id:7, name:'Fatma Öztürk', upn:'fatma.ozturk@contoso.com', dept:'Hukuk', role:'Danışman', userType:'office' },
  { id:8, name:'Ali Yılmaz', upn:'ali.yilmaz@contoso.com', dept:'IT', role:'DevOps Müh.', userType:'devops' },
  { id:9, name:'Selin Kurt', upn:'selin.kurt@contoso.com', dept:'Muhasebe', role:'Uzman', userType:'office' },
  { id:10, name:'Burak Aslan', upn:'burak.aslan@contoso.com', dept:'Operasyon', role:'Koordinatör', userType:'office' },
];

const APP_NAMES = [
  'Windows Sign In','Microsoft Teams','Outlook','Microsoft Outlook',
  'Office365 Shell WCSS-Client','Azure Portal','Azure DevOps','VS Code',
  'Visual Studio Code','SharePoint Online','SharePoint','OneDrive',
  'Power BI','Microsoft 365','OfficeHome','Exchange Admin Center',
  'Microsoft Edge','My Apps','My Account','Microsoft Admin Center','EkipRadar-Teams',
];

function getDates() {
  const now = nowTR();
  const dates = [];
  // Last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
    const dayNames = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];
    dates.push({
      label: `${day} ${months[d.getMonth()]}`,
      dayName: dayNames[d.getDay()],
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      dayIndex: i,
    });
  }
  return dates;
}

function generateSessionDataServer(userId, dates) {
  const days = [];
  for (let d = 0; d < dates.length; d++) {
    const rng = seededRandom(userId * 1000 + d + 42);
    const weekend = dates[d].isWeekend;

    if (weekend && rng() > 0.25) {
      days.push({ date: dates[d].label, off: true });
      continue;
    }

    const loginMin = 420 + Math.floor(rng() * 150);
    const logoutMin = 990 + Math.floor(rng() * 210);

    const userApps = [];
    const pool = [...APP_NAMES];
    const appCount = 4 + Math.floor(rng() * 4);
    for (let i = 0; i < appCount && pool.length > 0; i++) {
      const idx = Math.floor(rng() * pool.length);
      userApps.push(pool.splice(idx, 1)[0]);
    }
    const appUsage = {};
    let remaining = 100;
    userApps.forEach((app, i) => {
      if (i === userApps.length - 1) {
        appUsage[app] = remaining;
      } else {
        const share = Math.floor(rng() * (remaining / 2)) + 5;
        appUsage[app] = Math.min(share, remaining);
        remaining -= appUsage[app];
      }
    });

    days.push({
      date: dates[d].label,
      firstLogin: minutesToTime(loginMin),
      lastLogout: minutesToTime(logoutMin),
      loginMin, logoutMin,
      activeMinutes: logoutMin - loginMin,
      appUsage,
      off: false,
    });
  }
  return days;
}

function generateDevOpsDataServer(userId, dates) {
  const days = [];
  for (let d = 0; d < dates.length; d++) {
    const rng = seededRandom(userId * 2000 + d + 77);
    const weekend = dates[d].isWeekend;

    const commits = weekend ? Math.floor(rng() * 3) : 1 + Math.floor(rng() * 11);
    const prsCreated = weekend ? Math.floor(rng() * 2) : Math.floor(rng() * 4);
    const prsMerged = Math.min(prsCreated, Math.floor(rng() * (prsCreated + 1)));
    const codeReviews = weekend ? Math.floor(rng() * 2) : 1 + Math.floor(rng() * 5);
    const workItemsAssigned = 3 + Math.floor(rng() * 5);
    const workItemsCompleted = Math.min(workItemsAssigned, weekend ? Math.floor(rng() * 2) : 1 + Math.floor(rng() * (workItemsAssigned - 1)));
    const buildRuns = weekend ? Math.floor(rng() * 2) : Math.floor(rng() * 5);
    const buildSuccesses = Math.min(buildRuns, Math.floor(rng() * (buildRuns + 1)));
    const linesAdded = commits > 0 ? 10 + Math.floor(rng() * 300) : 0;
    const linesRemoved = commits > 0 ? Math.floor(rng() * 150) : 0;

    days.push({
      date: dates[d].label,
      commits, prsCreated, prsMerged, codeReviews,
      workItemsAssigned, workItemsCompleted,
      buildRuns, buildSuccesses, linesAdded, linesRemoved,
    });
  }
  return days;
}

function computeScoreServer(sessions, devops, userType) {
  const workDays = sessions.filter(d => !d.off);
  if (workDays.length === 0) return { total: 50, userType, breakdown: [] };

  const breakdown = [];
  const CORE_START = 480, CORE_END = 1140;

  // Devam Tutarlılığı (0-15)
  const loginTimes = workDays.map(d => d.loginMin);
  const loginVar = computeVariance(loginTimes);
  let attendanceScore = Math.max(0, Math.min(12, 12 - loginVar / 100));
  const coreLoginDays = loginTimes.filter(t => t >= CORE_START && t <= 570).length;
  attendanceScore += (coreLoginDays / workDays.length) * 3;
  attendanceScore = Math.min(15, attendanceScore);
  breakdown.push({ label: 'Devam Tutarlılığı', score: Math.round(attendanceScore * 10) / 10, max: 15 });

  // Çalışma Süresi (0-15)
  const effectiveHours = workDays.map(d => {
    const start = d.loginMin, end = d.logoutMin;
    const coreStart = Math.max(start, CORE_START);
    const coreEnd = Math.min(end, CORE_END);
    const coreMins = Math.max(0, coreEnd - coreStart);
    const offMins = (end - start) - coreMins;
    return (coreMins + offMins * 0.3) / 60;
  });
  const avgEffectiveHours = effectiveHours.reduce((s, v) => s + v, 0) / effectiveHours.length;
  const hoursScore = Math.min(15, (avgEffectiveHours / 8.5) * 15);
  breakdown.push({ label: 'Çalışma Süresi', score: Math.round(hoursScore * 10) / 10, max: 15 });

  // Aktif Gün (0-10)
  const activeDayScore = Math.min(10, (workDays.length / 5) * 10);
  breakdown.push({ label: 'Aktif Gün', score: Math.round(activeDayScore * 10) / 10, max: 10 });

  const commonTotal = attendanceScore + hoursScore + activeDayScore;
  let roleTotal = 0;

  if (userType === 'devops' && devops && devops.length > 0) {
    const totalCommits = devops.reduce((s, d) => s + d.commits, 0);
    const codeScore = Math.min(20, (totalCommits / 25) * 20);
    breakdown.push({ label: 'Kod Katkısı', score: Math.round(codeScore * 10) / 10, max: 20 });

    const totalPRs = devops.reduce((s, d) => s + d.prsCreated + d.prsMerged, 0);
    const prScore = Math.min(15, (totalPRs / 5) * 15);
    breakdown.push({ label: 'PR Aktivitesi', score: Math.round(prScore * 10) / 10, max: 15 });

    const totalWI = devops.reduce((s, d) => s + d.workItemsCompleted, 0);
    const wiScore = Math.min(15, (totalWI / 15) * 15);
    breakdown.push({ label: 'Görev Tamamlama', score: Math.round(wiScore * 10) / 10, max: 15 });

    const totalBuilds = devops.reduce((s, d) => s + d.buildRuns, 0);
    const totalSuccess = devops.reduce((s, d) => s + d.buildSuccesses, 0);
    const buildScore = totalBuilds > 0 ? (totalSuccess / totalBuilds) * 10 : 7;
    breakdown.push({ label: 'Build Kalitesi', score: Math.round(buildScore * 10) / 10, max: 10 });

    roleTotal = codeScore + prScore + wiScore + buildScore;
  } else {
    const commApps = ['Microsoft Teams', 'Outlook', 'Microsoft Outlook'];
    let commDays = 0;
    workDays.forEach(d => {
      const apps = Object.keys(d.appUsage || {});
      if (apps.some(a => commApps.includes(a))) commDays++;
    });
    const commScore = Math.min(20, (commDays / workDays.length) * 20);
    breakdown.push({ label: 'İletişim', score: Math.round(commScore * 10) / 10, max: 20 });

    const collabApps = ['SharePoint', 'SharePoint Online', 'OneDrive'];
    let collabDays = 0;
    workDays.forEach(d => {
      const apps = Object.keys(d.appUsage || {});
      if (apps.some(a => collabApps.includes(a))) collabDays++;
    });
    const collabScore = Math.min(15, (collabDays / workDays.length) * 15);
    breakdown.push({ label: 'İşbirliği', score: Math.round(collabScore * 10) / 10, max: 15 });

    const allApps = new Set();
    workDays.forEach(d => Object.keys(d.appUsage || {}).forEach(a => allApps.add(a)));
    const toolScore = Math.min(15, (allApps.size / 5) * 15);
    breakdown.push({ label: 'Araç Çeşitliliği', score: Math.round(toolScore * 10) / 10, max: 15 });

    const dailyHours = workDays.map(d => d.activeMinutes / 60);
    const hoursVar2 = computeVariance(dailyHours);
    const regScore = Math.max(0, Math.min(10, 10 - hoursVar2 / 3));
    breakdown.push({ label: 'Düzenlilik', score: Math.round(regScore * 10) / 10, max: 10 });

    roleTotal = commScore + collabScore + toolScore + regScore;
  }

  const total = Math.round(Math.min(100, commonTotal + roleTotal));
  return { total, userType, breakdown };
}

/* ── HTML Report Generator ── */
function generateReportHTML(users, reportDate) {
  const dates = getDates();

  // Compute data for all users
  const userData = users.map(u => {
    const sessions = generateSessionDataServer(u.id, dates);
    const devops = u.userType === 'devops' ? generateDevOpsDataServer(u.id, dates) : [];
    const score = computeScoreServer(sessions, devops, u.userType);
    const workDays = sessions.filter(d => !d.off);

    let avgLogin = '—', avgLogout = '—', avgHours = 0;
    if (workDays.length > 0) {
      const logins = workDays.map(d => d.loginMin);
      const logouts = workDays.map(d => d.logoutMin);
      avgLogin = minutesToTime(Math.round(logins.reduce((s,v) => s+v, 0) / logins.length));
      avgLogout = minutesToTime(Math.round(logouts.reduce((s,v) => s+v, 0) / logouts.length));
      avgHours = workDays.reduce((s,d) => s + d.activeMinutes, 0) / workDays.length / 60;
    }

    let devopsSummary = null;
    if (u.userType === 'devops' && devops.length > 0) {
      devopsSummary = {
        commits: devops.reduce((s,d) => s+d.commits, 0),
        prsCreated: devops.reduce((s,d) => s+d.prsCreated, 0),
        prsMerged: devops.reduce((s,d) => s+d.prsMerged, 0),
        workItemsCompleted: devops.reduce((s,d) => s+d.workItemsCompleted, 0),
        workItemsAssigned: devops.reduce((s,d) => s+d.workItemsAssigned, 0),
        buildRuns: devops.reduce((s,d) => s+d.buildRuns, 0),
        buildSuccesses: devops.reduce((s,d) => s+d.buildSuccesses, 0),
        linesAdded: devops.reduce((s,d) => s+d.linesAdded, 0),
        linesRemoved: devops.reduce((s,d) => s+d.linesRemoved, 0),
      };
    }

    return {
      ...u,
      score,
      workDays: workDays.length,
      avgLogin,
      avgLogout,
      avgHours: avgHours.toFixed(1),
      devopsSummary,
    };
  });

  // Sort by score descending
  userData.sort((a, b) => b.score.total - a.score.total);

  const avgScore = Math.round(userData.reduce((s,u) => s + u.score.total, 0) / userData.length);
  const topPerformer = userData[0];
  const dateRange = `${dates[0].label} – ${dates[dates.length - 1].label}`;

  function scoreColor(s) {
    if (s >= 80) return '#4ade80';
    if (s >= 60) return '#fbbf24';
    return '#f87171';
  }

  function scoreBg(s) {
    if (s >= 80) return 'rgba(74,222,128,.15)';
    if (s >= 60) return 'rgba(251,191,36,.15)';
    return 'rgba(248,113,113,.15)';
  }

  const html = `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

<div style="max-width:700px;margin:0 auto;background:#ffffff;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0d0f1e 0%,#1a1f3a 50%,#0d0f1e 100%);padding:32px 28px;text-align:center;">
    <div style="font-size:13px;color:#818cf8;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">GÜNLÜK PERFORMANS RAPORU</div>
    <div style="font-size:24px;font-weight:700;color:#e2e8ff;">Azure Entra ID — Performans Ölçümü</div>
    <div style="font-size:13px;color:#7986c4;margin-top:8px;">${reportDate} · ${dateRange}</div>
  </div>

  <!-- Genel Özet -->
  <div style="padding:24px 28px;border-bottom:1px solid #e5e7eb;">
    <div style="font-size:11px;color:#6b7280;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:16px;">GENEL ÖZET</div>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="text-align:center;padding:12px;">
          <div style="font-size:32px;font-weight:800;color:${scoreColor(avgScore)};">${avgScore}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:4px;">Ort. Skor</div>
        </td>
        <td style="text-align:center;padding:12px;">
          <div style="font-size:32px;font-weight:800;color:#5b6af0;">${userData.length}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:4px;">Aktif Kullanıcı</div>
        </td>
        <td style="text-align:center;padding:12px;">
          <div style="font-size:32px;font-weight:800;color:#22d3ee;">${topPerformer.score.total}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:4px;">En Yüksek Skor</div>
        </td>
        <td style="text-align:center;padding:12px;">
          <div style="font-size:32px;font-weight:800;color:#818cf8;">${userData.filter(u => u.score.total >= 80).length}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:4px;">80+ Skor</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Kullanıcı Sıralaması -->
  <div style="padding:24px 28px;">
    <div style="font-size:11px;color:#6b7280;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:16px;">KULLANICI PERFORMANS SIRALAMASI</div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="text-align:left;padding:10px 12px;color:#6b7280;font-weight:600;font-size:11px;border-bottom:2px solid #e5e7eb;">#</th>
          <th style="text-align:left;padding:10px 12px;color:#6b7280;font-weight:600;font-size:11px;border-bottom:2px solid #e5e7eb;">Kullanıcı</th>
          <th style="text-align:center;padding:10px 12px;color:#6b7280;font-weight:600;font-size:11px;border-bottom:2px solid #e5e7eb;">Tip</th>
          <th style="text-align:center;padding:10px 12px;color:#6b7280;font-weight:600;font-size:11px;border-bottom:2px solid #e5e7eb;">Skor</th>
          <th style="text-align:center;padding:10px 12px;color:#6b7280;font-weight:600;font-size:11px;border-bottom:2px solid #e5e7eb;">Ort. Giriş</th>
          <th style="text-align:center;padding:10px 12px;color:#6b7280;font-weight:600;font-size:11px;border-bottom:2px solid #e5e7eb;">Ort. Çıkış</th>
          <th style="text-align:center;padding:10px 12px;color:#6b7280;font-weight:600;font-size:11px;border-bottom:2px solid #e5e7eb;">Ort. Saat</th>
          <th style="text-align:center;padding:10px 12px;color:#6b7280;font-weight:600;font-size:11px;border-bottom:2px solid #e5e7eb;">İş Günü</th>
        </tr>
      </thead>
      <tbody>
        ${userData.map((u, i) => `
        <tr style="border-bottom:1px solid #f3f4f6;${i === 0 ? 'background:rgba(74,222,128,.06);' : ''}">
          <td style="padding:10px 12px;font-weight:700;color:#374151;">${i + 1}</td>
          <td style="padding:10px 12px;">
            <div style="font-weight:600;color:#111827;">${u.name}</div>
            <div style="font-size:11px;color:#9ca3af;">${u.dept} · ${u.role}</div>
          </td>
          <td style="text-align:center;padding:10px 12px;">
            <span style="font-size:10px;padding:3px 8px;border-radius:10px;background:${u.userType === 'devops' ? '#dbeafe' : '#fef3c7'};color:${u.userType === 'devops' ? '#1d4ed8' : '#92400e'};">${u.userType === 'devops' ? '&lt;/&gt; DevOps' : '💼 Ofis'}</span>
          </td>
          <td style="text-align:center;padding:10px 12px;">
            <span style="font-weight:800;font-size:16px;color:${scoreColor(u.score.total)};">${u.score.total}</span>
          </td>
          <td style="text-align:center;padding:10px 12px;font-family:monospace;color:#374151;">${u.avgLogin}</td>
          <td style="text-align:center;padding:10px 12px;font-family:monospace;color:#374151;">${u.avgLogout}</td>
          <td style="text-align:center;padding:10px 12px;font-family:monospace;font-weight:600;color:${parseFloat(u.avgHours) >= 8 ? '#16a34a' : parseFloat(u.avgHours) >= 6 ? '#ca8a04' : '#dc2626'};">${u.avgHours}s</td>
          <td style="text-align:center;padding:10px 12px;font-weight:600;color:#374151;">${u.workDays}/7</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <!-- Skor Kırılımı Detay -->
  <div style="padding:24px 28px;border-top:1px solid #e5e7eb;">
    <div style="font-size:11px;color:#6b7280;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:16px;">SKOR KIRILIMI DETAYLARI</div>
    ${userData.map(u => `
    <div style="margin-bottom:20px;padding:16px;background:#f9fafb;border-radius:8px;border-left:4px solid ${scoreColor(u.score.total)};">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div>
          <span style="font-weight:700;color:#111827;font-size:14px;">${u.name}</span>
          <span style="font-size:11px;color:#9ca3af;margin-left:8px;">${u.dept} · ${u.role}</span>
        </div>
        <span style="font-weight:800;font-size:20px;color:${scoreColor(u.score.total)};">${u.score.total}/100</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        ${u.score.breakdown.map(b => {
          const pct = Math.round((b.score / b.max) * 100);
          const barColor = pct >= 75 ? '#4ade80' : pct >= 50 ? '#fbbf24' : '#f87171';
          return `
          <tr>
            <td style="padding:4px 0;color:#6b7280;width:130px;">${b.label}</td>
            <td style="padding:4px 8px;">
              <div style="background:#e5e7eb;border-radius:4px;height:8px;overflow:hidden;">
                <div style="height:100%;width:${pct}%;background:${barColor};border-radius:4px;"></div>
              </div>
            </td>
            <td style="padding:4px 0;text-align:right;font-weight:600;color:#374151;width:60px;">${b.score}/${b.max}</td>
          </tr>`;
        }).join('')}
      </table>
      ${u.devopsSummary ? `
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid #e5e7eb;font-size:11px;color:#6b7280;">
        <span style="margin-right:12px;">📝 ${u.devopsSummary.commits} commit</span>
        <span style="margin-right:12px;">🔀 ${u.devopsSummary.prsCreated} PR (${u.devopsSummary.prsMerged} merged)</span>
        <span style="margin-right:12px;">✅ ${u.devopsSummary.workItemsCompleted}/${u.devopsSummary.workItemsAssigned} iş</span>
        <span>🚀 ${u.devopsSummary.buildSuccesses}/${u.devopsSummary.buildRuns} build</span>
      </div>
      <div style="margin-top:4px;font-size:11px;color:#6b7280;">
        <span style="color:#16a34a;">+${u.devopsSummary.linesAdded}</span> / <span style="color:#dc2626;">-${u.devopsSummary.linesRemoved}</span> satır
      </div>` : ''}
    </div>`).join('')}
  </div>

  <!-- Footer -->
  <div style="background:#f9fafb;padding:20px 28px;text-align:center;border-top:1px solid #e5e7eb;">
    <div style="font-size:11px;color:#9ca3af;">
      Bu rapor <strong>Azure Entra ID — Performans Ölçümü</strong> sistemi tarafından otomatik oluşturulmuştur.
    </div>
    <div style="font-size:11px;color:#9ca3af;margin-top:4px;">
      ${reportDate} · ${DEVOPS_ORG}/${DEVOPS_PROJECT}
    </div>
  </div>
</div>

</body>
</html>`;

  return { html, userData, avgScore, dateRange };
}

/* GET /api/report/daily - Daily performance report for Power Automate */
app.get('/api/report/daily', requireReportKey, (req, res) => {
  const now = nowTR();
  const months = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  const reportDate = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  const { html, userData, avgScore, dateRange } = generateReportHTML(DEMO_USERS, reportDate);

  const format = req.query.format || 'json';

  if (format === 'html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }

  // JSON format for Power Automate
  res.json({
    subject: `📊 Günlük Performans Raporu — ${reportDate}`,
    htmlBody: html,
    reportDate,
    dateRange,
    summary: {
      totalUsers: userData.length,
      avgScore,
      topPerformer: { name: userData[0].name, score: userData[0].score.total },
      usersAbove80: userData.filter(u => u.score.total >= 80).length,
    },
    users: userData.map(u => ({
      name: u.name,
      dept: u.dept,
      role: u.role,
      userType: u.userType,
      score: u.score.total,
      avgLogin: u.avgLogin,
      avgLogout: u.avgLogout,
      avgHours: u.avgHours,
      workDays: u.workDays,
    })),
  });
});

/* POST /api/report/send - Send daily report via email (Graph API) */
app.post('/api/report/send', requireReportKey, async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ error: 'to (email) is required' });

  if (!cca) return res.status(500).json({ error: 'MSAL not configured' });

  try {
    const now = nowTR();
    const months = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    const reportDate = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    const { html } = generateReportHTML(DEMO_USERS, reportDate);
    const subject = `📊 Günlük Performans Raporu — ${reportDate}`;

    const token = await getGraphToken();

    // Send mail via Graph API (application permission: Mail.Send)
    const sendMailPayload = {
      message: {
        subject,
        body: { contentType: 'HTML', content: html },
        toRecipients: to.split(',').map(email => ({
          emailAddress: { address: email.trim() },
        })),
      },
    };

    // Use the recipient as sender context, or a shared mailbox
    // With client credentials, we POST to /users/{sender}/sendMail
    const sender = req.body.from || to.split(',')[0].trim();

    await axios.post(
      `https://graph.microsoft.com/v1.0/users/${sender}/sendMail`,
      sendMailPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    console.log(`[Report] Email sent to ${to} from ${sender}`);
    res.json({ success: true, to, from: sender, subject });
  } catch (err) {
    const detail = err.response?.data?.error || err.message;
    console.error('[Report] Send email error:', JSON.stringify(detail));
    res.status(500).json({ error: 'Failed to send email', detail });
  }
});

/* ── Default route ── */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'performance.html'));
});

/* ── Start server ── */
app.listen(PORT, () => {
  console.log(`\n[Server] Performance Dashboard running at http://localhost:${PORT}`);
  console.log(`[Server] Dashboard: http://localhost:${PORT}/performance.html`);
  if (!isConfigured) {
    console.log('[Server] Mode: DEMO (mock data)');
    console.log('[Server] To enable real API: copy .env.example to .env and configure\n');
  } else {
    console.log('[Server] Mode: LIVE (Azure API)');
    console.log(`[Server] DevOps: ${DEVOPS_ORG}/${DEVOPS_PROJECT}\n`);
  }
});
