import { GoogleGenerativeAI } from '@google/generative-ai';
import api from './api';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Detailed context information for different pages
const pageContexts = {
  dashboard: {
    title: 'Dashboard',
    description: 'Real-time monitoring hub showing overview of all ETL operations',
    details: `The Dashboard displays four key metric cards at the top:
- Total Pipelines: Shows count of all pipelines in the system (click "VIEW PIPELINES" to see all pipelines)
- Active Pipelines: Number of pipelines currently enabled and ready to run (click "VIEW ACTIVE" to filter active ones)
- Connectors: Total configured database, file, and API connections (click "VIEW CONNECTORS" to manage connectors)
- Recent Executions: Count of pipeline runs in the last 24 hours (click "VIEW EXECUTIONS" to see all executions)

Below the metrics, there are two main sections:
1. Pipeline Status Chart: Pie chart showing distribution of pipeline statuses (Active, Inactive, Failed)
2. Recent Executions Table: Lists the 5 most recent pipeline runs with columns for Pipeline Name, Status (Running/Completed/Failed), Start Time, Duration, and Records Processed

IMPORTANT: The Dashboard is READ-ONLY for viewing metrics and monitoring. There are NO "Create Pipeline" or "Create Connector" buttons on the Dashboard page itself. To create new items, users must navigate to the respective pages using the left sidebar menu.`,
    features: [
      'Auto-refreshes every 30 seconds (configurable in Settings)',
      'Click on any execution to view detailed logs',
      'Status badges use color coding: green (completed), blue (running), red (failed)',
      'Metrics update in real-time as pipelines execute',
      'Click "VIEW PIPELINES" button to navigate to Pipelines page where you can create new pipelines',
      'Click "VIEW CONNECTORS" button to navigate to Connectors page where you can create new connectors',
      'Use the left sidebar menu to navigate to different pages (Pipelines, Connectors, etc.)'
    ]
  },
  pipelines: {
    title: 'Pipelines',
    description: 'Create and manage ETL pipelines that orchestrate data movement',
    details: `Pipelines are the core of the ETL platform. Each pipeline defines:
- Source: Where data comes from (database, file, or API)
- Destination: Where data goes to
- Transformations: Optional data modifications applied during transfer
- Field Mappings: How source fields map to destination fields
- Schedule: When the pipeline runs (manual, hourly, daily, weekly, monthly)

The pipeline list shows:
- Name and description
- Source → Destination flow
- Status (Active/Inactive)
- Last execution time and status
- Actions: Edit, Clone, Delete, Execute Now

Creating a Pipeline:
1. Click "Create Pipeline" button
2. Enter name and description
3. Select source connector (must have "source" or "both" direction)
4. Select destination connector (must have "destination" or "both" direction)
5. Optionally add transformations (applied in order)
6. Map source fields to destination fields using the visual mapper
7. Set schedule (None for manual execution only)
8. Save and optionally execute immediately

Field Mapping:
- Drag source fields to destination fields
- Supports one-to-one mappings
- Unmapped fields are ignored
- Validation ensures all required destination fields are mapped`,
    features: [
      'Clone existing pipelines to create similar ones quickly',
      'Execute pipelines manually with "Run Now" button',
      'Filter by status (All, Active, Inactive) and search by name',
      'Edit pipelines to modify source, destination, transformations, or mappings',
      'Disable pipelines without deleting them',
      'View execution history for each pipeline'
    ]
  },
  'connectors': {
    title: 'Connectors',
    description: 'Configure connections to databases, files, and APIs',
    details: `Connectors represent connections to external systems. Three types are supported:

1. DATABASE Sources:
   - Supported: SQL Server, PostgreSQL, MySQL
   - Configuration: Server, Port, Database Name, Username, Password
   - Schema: Auto-detected by querying database metadata
   - Direction: Source (read), Destination (write), or Both
   - Write Config (for destinations): Table name, Operation (INSERT/UPDATE/UPSERT/BULK_INSERT), Primary keys, Batch size

2. FILE Sources:
   - Supported formats: CSV, Excel (.xlsx), JSON
   - Configuration: File path on server
   - CSV: Delimiter, has headers, encoding
   - Excel: Sheet name, start row
   - JSON: Root path for nested data
   - Schema: Auto-detected from file structure or manually defined
   - Write Config (for destinations): Write mode (overwrite/append), column order, sheet name

3. API Sources:
   - Configuration: Base URL, endpoint, HTTP method (GET/POST/PUT)
   - Authentication: None, Basic Auth, API Key, Bearer Token
   - Headers: Custom HTTP headers
   - Query parameters for GET requests
   - Request body template for POST/PUT
   - Schema: Manually defined based on API response structure
   - Write Config (for destinations): Request format (JSON/XML/Form Data), batch size, root key

Schema Definition:
- Each field has: Name, Data Type (String/Integer/Decimal/Boolean/Date), Required flag
- Auto-detection available for databases and files
- Manual definition required for APIs
- Schema validation ensures data compatibility`,
    features: [
      'Test Connection button validates credentials before saving',
      'Clone connectors to create similar configurations',
      'Direction setting determines if connector can be used in pipelines',
      'Write configuration only required for destination connectors',
      'Schema preview shows all detected fields with types',
      'Edit existing connectors to update credentials or configuration',
      'Delete connectors (only if not used in any pipeline)'
    ]
  },
  transformations: {
    title: 'Transformations',
    description: 'Define reusable data transformation rules',
    details: `Transformations modify data as it flows through pipelines. Seven types available:

1. FILTER Transformation:
   - Purpose: Remove rows that don't meet conditions
   - Configuration: Field name, Operator (equals, not equals, contains, starts with, ends with, greater than, less than, is empty, is not empty), Value
   - Example: Filter rows where Status equals "Active"
   - Multiple conditions can be combined

2. MAP Transformation:
   - Purpose: Replace field values using lookup table
   - Configuration: Field name, Key-value mappings
   - Example: Map "US" → "United States", "UK" → "United Kingdom"
   - Unmapped values pass through unchanged

3. TRIM Transformation:
   - Purpose: Remove leading/trailing whitespace
   - Configuration: Field names to trim
   - Useful for cleaning imported data

4. CASE_CONVERT Transformation:
   - Purpose: Change text case
   - Options: UPPERCASE, lowercase, Title Case, camelCase
   - Configuration: Field names and target case
   - Example: Convert all email addresses to lowercase

5. SUBSTRING Transformation:
   - Purpose: Extract portion of text
   - Configuration: Field name, Start position, Length
   - Example: Extract first 3 characters of product code

6. REPLACE Transformation:
   - Purpose: Find and replace text
   - Configuration: Field name, Find text, Replace text, Use regex (optional)
   - Example: Replace all dashes with underscores
   - Regex support for complex patterns

7. SCRIPT Transformation:
   - Purpose: Custom logic using JavaScript or C# ONLY (Python is NOT supported)
   - Configuration: Script language (JavaScript or C#), Code editor with syntax highlighting
   - Access to row data via 'row' object
   - Return modified row object
   - Example: Calculate derived fields, complex validations
   - Most flexible but requires programming knowledge
   - IMPORTANT: Only JavaScript and C# are supported - do not suggest Python or other languages

Using Transformations in Pipelines:
- Add multiple transformations to a pipeline
- Transformations execute in order (top to bottom)
- Each transformation receives output from previous one
- Can reuse same transformation in multiple pipelines`,
    features: [
      'Clone transformations to create variations',
      'Test transformations with sample data before using in pipelines',
      'Script editor includes syntax highlighting (Prism.js)',
      'Validation ensures required fields are configured',
      'Edit transformations (updates all pipelines using it)',
      'Delete transformations (only if not used in pipelines)',
      'Search and filter transformations by name or type'
    ]
  },
  executions: {
    title: 'Executions',
    description: 'Monitor and troubleshoot pipeline execution history',
    details: `The Executions page shows complete history of all pipeline runs with detailed logging.

Execution List displays:
- Pipeline Name: Which pipeline was executed
- Status: Running (blue), Completed (green), Failed (red)
- Start Time: When execution began
- Duration: How long it took (or elapsed time for running)
- Records Processed: Number of rows transferred
- Progress: Percentage complete (for running executions)
- Actions: View detailed logs

Execution Details (click "View Logs"):
- Timeline visualization showing each step
- Detailed log messages with timestamps
- Step-by-step breakdown:
  1. Initialization: Pipeline setup and validation
  2. Source Connection: Connecting to source connector
  3. Data Extraction: Reading data from source
  4. Transformation: Applying each transformation in order
  5. Destination Connection: Connecting to destination
  6. Data Loading: Writing data to destination
  7. Completion: Final statistics and cleanup
- Error messages and stack traces for failed executions
- Records processed at each stage
- Performance metrics (rows per second)

Filtering Options:
- By Pipeline: Select specific pipeline
- By Status: All, Running, Completed, Failed
- By Date Range: Last 24 hours, 7 days, 30 days, Custom range
- Search by execution ID

Execution Triggers:
- Manual: User clicks "Run Now" on pipeline
- Scheduled: Automatic execution based on pipeline schedule
- API: Triggered via REST API call`,
    features: [
      'Real-time updates for running executions (auto-refresh)',
      'Export execution logs to file for analysis',
      'Retry failed executions with same configuration',
      'Cancel running executions if needed',
      'View execution statistics and performance metrics',
      'Timeline shows duration of each step',
      'Error details include line numbers for script transformations'
    ]
  },
  users: {
    title: 'User Management',
    description: 'Manage user accounts and access control (Admin only)',
    details: `User Management is restricted to Admin users only. Regular users cannot access this page.

User Roles:
1. ADMIN Role:
   - Full access to all features
   - Can manage tenants, users, pipelines, connectors, transformations
   - Can switch between tenants
   - Can view all execution logs
   - Can generate API keys

2. USER Role:
   - Access to pipelines, connectors, transformations, executions
   - Cannot manage tenants or users
   - Cannot switch tenants (locked to assigned tenant)
   - Can only view executions for their tenant
   - Can generate API keys for their account

User List displays:
- Full Name
- Email (used for login)
- Role (Admin/User badge)
- Tenant (organization they belong to)
- Status (Active/Inactive)
- Last Login timestamp
- Actions: Edit, Deactivate/Activate, Delete

Creating a User:
1. Click "Create User" button
2. Enter: First Name, Last Name, Email
3. Set initial password (user can change later)
4. Select Role (Admin or User)
5. Assign to Tenant
6. Set Active status
7. Save

User Status:
- Active: Can log in and use the system
- Inactive: Cannot log in (account disabled)
- Useful for temporarily suspending access without deleting

Security:
- Passwords are hashed and never stored in plain text
- Email must be unique across all tenants
- Admin users can reset passwords for other users
- Users can change their own password in Settings`,
    features: [
      'Search users by name or email',
      'Filter by role (All, Admin, User) or status (All, Active, Inactive)',
      'Sort by name, email, or last login',
      'Bulk actions: Activate/deactivate multiple users',
      'Edit user details without changing password',
      'Force password reset on next login',
      'View user activity and login history'
    ]
  },
  tenants: {
    title: 'Tenant Management',
    description: 'Manage multi-tenant organizations and data isolation (Admin only)',
    details: `Tenant Management is restricted to Admin users only. Tenants provide complete data isolation.

What is a Tenant?
- A tenant represents an organization or customer
- Each tenant has completely isolated data (pipelines, connectors, executions)
- Users are assigned to one tenant (except Admins who can switch)
- Ensures data security in multi-customer environments

Tenant List displays:
- Tenant Name
- Slug / Identifier (unique code used in API calls)
- Status (Active/Inactive)
- Created date
- Actions: Edit (pencil icon), Add user to tenant (person icon), Delete (red icon)

IMPORTANT: The tenant list does NOT show Pipeline Count, User Count, Contact Email, or Contact Phone columns. To see pipelines, navigate to the Pipelines page.

Creating a Tenant:
1. Click "+ ADD TENANT" button (top right)
2. Enter: Tenant Name, Slug/Identifier (unique, alphanumeric)
3. Set Active status
4. Save

Switching Tenants (Admin only):
- Use the "Select Tenant" dropdown in the top navigation bar
- All data (pipelines, connectors, etc.) switches to that tenant's context
- Allows admins to manage multiple customer environments

Tenant Status:
- Active: Users can log in and use the system
- Inactive: All users in tenant cannot log in`,
    features: [
      'Search tenants by name',
      'Filter by status (All, Active, Inactive)',
      'Sort by name',
      'Edit tenant name and slug',
      'Delete tenants',
      'Switch between tenants via the top navigation bar dropdown'
    ]
  },
  settings: {
    title: 'Settings',
    description: 'Configure personal preferences, theme, and API access',
    details: `Settings page has four tabs:

1. PROFILE Tab:
   - Update First Name and Last Name
   - Change Email (must be unique)
   - Change Password (requires current password)
   - View account creation date
   - View last login timestamp
   - Cannot change Role or Tenant (admin only)

2. PREFERENCES Tab:
   - Theme: Toggle between Dark and Light mode
   - Dashboard Refresh: Set auto-refresh interval (15s, 30s, 1min, 5min, Off)
   - Items Per Page: Default pagination size (10, 25, 50, 100)
   - Date Format: Display format (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
   - Preferences saved automatically
   - Applied immediately across all pages

3. API KEYS Tab:
   - Generate API keys for programmatic access
   - Each key has: Name, Key value, Created date, Last used date
   - Click "Create API Key" to generate new key
   - Key shown only once after creation (copy and save securely)
   - Keys never expire but can be revoked
   - Use keys in API requests: Authorization: Bearer <api_key>
   - Revoke keys to disable access immediately
   - View usage statistics for each key

4. NOTIFICATIONS Tab:
   - Email Notifications: Toggle on/off
   - Notification Types:
     * Pipeline Execution Completed
     * Pipeline Execution Failed
     * Connector Connection Failed
     * System Maintenance Alerts
   - Set notification frequency (Immediate, Daily Digest, Weekly Summary)
   - Configure quiet hours (no notifications during specified times)

API Key Usage:
- Use keys to authenticate REST API calls
- Required header: Authorization: Bearer <your_api_key>
- Keys inherit user's role and tenant permissions
- Rate limits apply (configurable per tenant)
- Keys can be scoped to specific operations (read-only, execute-only)`,
    features: [
      'Profile changes require password confirmation',
      'Theme preference syncs across devices',
      'API keys can be named for easy identification',
      'Revoked keys immediately stop working',
      'Notification preferences saved per user',
      'Export settings as JSON for backup',
      'Import settings from another account'
    ]
  }
};

// ── Live context helpers ─────────────────────────────────────────────────

function fmt(ms) {
  if (ms == null) return '-';
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

function fmtDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString();
}

/**
 * Formats an execution's key log entries into a compact text block.
 * Keeps Error/Warning logs plus the first and last Info log to stay within token limits.
 */
function fmtLogs(logs) {
  if (!logs || logs.length === 0) return '    (no logs)';
  const errorWarn = logs.filter(l => l.level === 'Error' || l.level === 'Warning');
  const info = logs.filter(l => l.level !== 'Error' && l.level !== 'Warning');
  const selected = [
    ...errorWarn,
    ...(info.length > 0 ? [info[0]] : []),
    ...(info.length > 1 ? [info[info.length - 1]] : [])
  ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  return selected
    .map(l => `    [${l.level}] ${l.message || ''}${l.details ? ' — ' + l.details : ''}`)
    .join('\n');
}

/**
 * Fetches live data scoped to the current page.
 * Returns a formatted text block, or null if fetching fails or the page has no live data.
 */
async function fetchLiveContext(page) {
  try {
    const now = new Date().toLocaleString();

    // Pages that don't need live data
    if (['users', 'tenants', 'settings'].includes(page)) return null;

    if (page === 'dashboard') {
      const [statsRes, execRes, pipeRes, connRes] = await Promise.allSettled([
        api.get('/api/executions/stats'),
        api.get('/api/executions', { params: { page: 1, pageSize: 5, sortBy: 'start_time_desc' } }),
        api.get('/api/pipelines', { params: { page: 1, pageSize: 1 } }),
        api.post('/api/connectors/search', { page: 1, pageSize: 1 })
      ]);
      const stats = statsRes.status === 'fulfilled' ? statsRes.value.data : null;
      const execs = execRes.status === 'fulfilled' ? (execRes.value.data.executions || []) : [];
      const totalPipelines = pipeRes.status === 'fulfilled' ? (pipeRes.value.data.totalCount ?? '?') : '?';
      const totalConnectors = connRes.status === 'fulfilled' ? (connRes.value.data.totalCount ?? '?') : '?';

      let out = `=== LIVE DATA (as of ${now}) ===\n`;
      if (stats) {
        out += `Execution Stats:\n`;
        out += `  Total: ${stats.totalExecutions}, Running: ${stats.runningExecutions}, Completed: ${stats.completedExecutions}, Failed: ${stats.failedExecutions}, Cancelled: ${stats.cancelledExecutions}\n`;
        out += `  Success rate: ${stats.successRate != null ? Math.round(stats.successRate) + '%' : '-'}, Avg duration: ${fmt(stats.averageDurationMs)}, Total rows: ${(stats.totalRecordsProcessed || 0).toLocaleString()}\n`;
      }
      out += `Totals: ${totalPipelines} pipelines, ${totalConnectors} connectors\n`;
      if (execs.length > 0) {
        out += `\nRecent Executions:\n`;
        execs.forEach(e => {
          out += `  - ${e.pipelineName}: ${e.status} | started ${fmtDate(e.startTime)} | ${fmt(e.durationMs)} | ${(e.recordsProcessed || 0).toLocaleString()} rows\n`;
        });
      }
      return out;
    }

    if (page === 'pipelines') {
      const res = await api.get('/api/pipelines', { params: { page: 1, pageSize: 50 } });
      const pipelines = res.data.pipelines || [];
      if (pipelines.length === 0) return `=== LIVE DATA (as of ${now}) ===\nNo pipelines found.\n`;
      let out = `=== LIVE DATA (as of ${now}) ===\nPipelines (${pipelines.length} total):\n`;
      pipelines.forEach(p => {
        out += `  - "${p.name}" | ${p.isActive ? 'Active' : 'Inactive'} | `;
        out += `Schedule: ${p.schedule || 'Manual'} | `;
        out += `Source: ${p.sourceConnectorName || '-'} → Dest: ${p.destinationConnectorName || '-'}\n`;
      });
      return out;
    }

    if (page === 'executions') {
      const res = await api.get('/api/executions', { params: { page: 1, pageSize: 10, sortBy: 'start_time_desc' } });
      const execs = res.data.executions || [];
      if (execs.length === 0) return `=== LIVE DATA (as of ${now}) ===\nNo executions found.\n`;
      let out = `=== LIVE DATA (as of ${now}) ===\nRecent Executions (${execs.length} shown):\n`;
      execs.forEach(e => {
        out += `  - "${e.pipelineName}" | ${e.status} | started ${fmtDate(e.startTime)} | ${fmt(e.durationMs)} | ${(e.recordsProcessed || 0).toLocaleString()} rows\n`;
        if (e.logs && e.logs.length > 0) {
          out += `    Key logs:\n${fmtLogs(e.logs)}\n`;
        }
      });
      return out;
    }

    if (page === 'connectors') {
      const res = await api.get('/api/connectors');
      const connectors = Array.isArray(res.data) ? res.data : [];
      if (connectors.length === 0) return `=== LIVE DATA (as of ${now}) ===\nNo connectors found.\n`;
      let out = `=== LIVE DATA (as of ${now}) ===\nConnectors (${connectors.length} total):\n`;
      connectors.forEach(c => {
        out += `  - "${c.name}" | Type: ${c.type} (${c.provider}) | Direction: ${c.direction} | ${c.isActive ? 'Active' : 'Inactive'}\n`;
      });
      return out;
    }

    if (page === 'transformations') {
      const res = await api.get('/api/transformations', { params: { page: 1, pageSize: 50 } });
      const transforms = res.data.transformations || res.data || [];
      if (transforms.length === 0) return `=== LIVE DATA (as of ${now}) ===\nNo transformations found.\n`;
      let out = `=== LIVE DATA (as of ${now}) ===\nTransformations (${transforms.length} total):\n`;
      transforms.forEach(t => {
        out += `  - "${t.name}" | Type: ${t.type}\n`;
      });
      return out;
    }

    return null;
  } catch (err) {
    // Best-effort: live context is optional, never block the chat
    console.warn('[Maeve] Could not fetch live context:', err?.message);
    return null;
  }
}

// Retry helper with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRetryable = error.message?.includes('503') ||
        error.message?.includes('overloaded') ||
        error.message?.includes('429');

      const isLastAttempt = attempt === maxRetries - 1;

      if (!isRetryable || isLastAttempt) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export async function getChatResponse(message, currentPage, conversationHistory = [], userLanguage = 'en') {
  // Fetch live data for the current page before calling Gemini
  const liveContext = await fetchLiveContext(currentPage);
  return retryWithBackoff(async () => {
    // Use gemini-2.5-flash (stable, fast, and widely supported)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash'
    });

    // Language instruction based on user's locale
    const languageInstructions = {
      'en': 'Respond in English.',
      'es': 'Responde en español (Spanish).',
      'fr': 'Répondez en français (French).',
      'de': 'Antworte auf Deutsch (German).',
      'it': 'Rispondi in italiano (Italian).',
      'pt': 'Responda em português (Portuguese).'
    };
    const languageInstruction = languageInstructions[userLanguage] || languageInstructions['en'];

    // Build context-aware system prompt
    const pageContext = pageContexts[currentPage] || pageContexts.dashboard;
    const systemPrompt = `You are Maeve, a helpful AI assistant for the Multi-Tenant ETL Platform application. ${languageInstruction} 
The user is currently on the ${pageContext.title} page.

=== CURRENT PAGE CONTEXT ===
${pageContext.description}

${pageContext.details}

Key Features on this page:
${pageContext.features.map(f => `- ${f}`).join('\n')}

=== GENERAL APP INFORMATION ===
Application: Multi-Tenant ETL (Extract, Transform, Load) Platform
Purpose: Move and transform data between different systems with complete tenant isolation

Core Concepts:
- Connectors: Connections to databases (ONLY SQL Server, PostgreSQL, MySQL), files (ONLY CSV, Excel .xlsx, JSON), or REST APIs (GET/POST/PUT methods only)
- Pipelines: Orchestrate data movement from source → transformations → destination
- Transformations: EXACTLY 7 types available - Filter, Map, Trim, Case Convert, Substring, Replace, Script (JavaScript/C# only)
- Executions: Historical record of pipeline runs with detailed logs
- Tenants: Organizations with isolated data (multi-customer support)
- Users: ONLY two roles - Admin (full access) and User (limited access)

IMPORTANT LIMITATIONS:
- Script transformations support ONLY JavaScript and C# (NOT Python, Ruby, or any other language)
- Database support is ONLY SQL Server, PostgreSQL, MySQL, and Oracle (NOT MongoDB, etc.)
- File formats are ONLY CSV, Excel (.xlsx), and JSON (NOT XML, Parquet, Avro, etc.)
- HTTP methods for APIs are ONLY GET, POST, PUT (NOT DELETE, PATCH, etc.)

Navigation:
- Dashboard: Overview and metrics
- Pipelines: Create and manage data flows
- Connectors: Configure connections
- Transformations: Define data modification rules
- Executions: Monitor pipeline runs
- Users: Manage accounts (Admin only)
- Tenants: Manage organizations (Admin only)
- Settings: Personal preferences and API keys

=== RESPONSE GUIDELINES ===
- Provide specific, actionable answers based on the current page context
- Use 2-4 sentences for simple questions, more detail for complex topics
- Reference exact button names, field names, and UI elements when explaining how to do something
- If the user asks about features on a different page, briefly explain and tell them which page to navigate to
- For technical questions, provide step-by-step instructions
- Be conversational but professional
- If you don't know something specific about the implementation, say so honestly

CRITICAL - DO NOT HALLUCINATE:
- ONLY suggest JavaScript or C# for script transformations (NEVER Python, Ruby, etc.)
- ONLY mention SQL Server, PostgreSQL, MySQL, or Oracle for databases (NEVER MongoDB, etc.)
- ONLY mention CSV, Excel, or JSON for files (NEVER XML, Parquet, etc.)
- ONLY mention the 7 transformation types listed above (NEVER suggest custom plugins, extensions, etc.)
- If a user asks about unsupported features, politely explain what IS supported instead
- Do not invent features, integrations, or capabilities that are not explicitly mentioned in this context

${liveContext ? liveContext + '\nIMPORTANT: When the user asks about their data (pipelines, executions, connectors, logs), ALWAYS use the live data above to give specific, accurate answers with real names, statuses, timestamps, and log messages. Do not give generic answers when you have real data available.' : '(No live data available for this page — answer from general knowledge of the app.)'}`;

    // Build conversation history
    const history = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 2500,
        temperature: 0.7,
      },
    });

    try {
      const result = await chat.sendMessage(`${systemPrompt}\n\nUser question: ${message}`);
      const response = result.response;
      return response.text();
    } catch (error) {
      // More specific error handling
      if (error.message?.includes('503') || error.message?.includes('overloaded')) {
        throw new Error('The AI service is currently overloaded. Retrying...');
      } else if (error.message?.includes('429')) {
        throw new Error('Rate limit exceeded. Retrying...');
      } else if (error.message?.includes('quota')) {
        throw new Error('API quota exceeded. Please create a new API key.');
      } else if (error.message?.includes('403')) {
        throw new Error('API access forbidden. Please check your API key.');
      } else if (error.message?.includes('404')) {
        throw new Error('Model not found. Please check your API configuration.');
      }

      throw error;
    }
  });
}