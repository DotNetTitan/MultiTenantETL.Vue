import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Context information for different pages
const pageContexts = {
  dashboard: {
    title: 'Dashboard',
    description: 'Real-time monitoring of ETL pipelines, data sources, and executions',
    features: [
      'View total pipelines, active pipelines, data sources, and recent executions',
      'Monitor pipeline status distribution',
      'Track recent execution history with status and duration',
      'Quick access to create new pipelines and data sources'
    ]
  },
  pipelines: {
    title: 'Pipelines',
    description: 'Manage ETL pipelines that move data from source to destination',
    features: [
      'Create pipelines by selecting source and destination data sources',
      'Add transformations to modify data during transfer',
      'Configure field mappings between source and destination',
      'Schedule pipelines to run automatically',
      'Execute pipelines manually and monitor progress',
      'Filter and sort pipelines by status and name'
    ]
  },
  'data-sources': {
    title: 'Data Sources',
    description: 'Configure connections to databases, files, and APIs',
    features: [
      'Support for SQL Server, PostgreSQL, MySQL databases',
      'File sources: CSV, Excel, JSON',
      'REST API integration with custom endpoints',
      'Test connections before saving',
      'Auto-detect schemas from databases',
      'Configure as source, destination, or both',
      'Set up write configuration for destinations (table names, operations, batch sizes)'
    ]
  },
  transformations: {
    title: 'Transformations',
    description: 'Define data transformation rules',
    features: [
      'Filter: Remove rows based on conditions',
      'Map: Transform values using key-value mappings',
      'Trim: Remove whitespace from text fields',
      'Case Convert: Change text case (upper, lower, title, camel)',
      'Substring: Extract portions of text',
      'Replace: Find and replace text or patterns',
      'Script: Custom JavaScript or C# transformation logic',
      'Clone existing transformations for reuse'
    ]
  },
  executions: {
    title: 'Executions',
    description: 'Monitor pipeline execution history and logs',
    features: [
      'View execution status (Running, Completed, Failed)',
      'Track records processed and execution duration',
      'View detailed logs with timeline visualization',
      'Filter executions by pipeline, status, and date range',
      'Monitor progress percentage for running executions',
      'Review error messages for failed executions'
    ]
  },
  users: {
    title: 'User Management',
    description: 'Manage user accounts and permissions (Admin only)',
    features: [
      'Create and edit user accounts',
      'Assign roles: Admin or User',
      'Toggle user active/inactive status',
      'Filter and search users',
      'Admin role has full access; User role has limited access'
    ]
  },
  tenants: {
    title: 'Tenant Management',
    description: 'Manage multi-tenant organizations (Admin only)',
    features: [
      'Create and configure tenant organizations',
      'Set tenant identifiers and contact information',
      'Toggle tenant active/inactive status',
      'Switch between tenants to manage their data',
      'Secure data isolation between tenants'
    ]
  },
  settings: {
    title: 'Settings',
    description: 'Configure user profile, preferences, and API keys',
    features: [
      'Update profile information',
      'Toggle dark/light theme',
      'Set dashboard refresh intervals',
      'Configure notification preferences',
      'Generate and manage API keys for programmatic access',
      'Set date format and items per page preferences'
    ]
  }
};

export async function getChatResponse(message, currentPage, conversationHistory = []) {
  try {
    // Use gemini-2.5-flash (stable, fast, and widely supported)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash'
    });
    
    // Build context-aware system prompt
    const pageContext = pageContexts[currentPage] || pageContexts.dashboard;
    const systemPrompt = `You are a helpful assistant for the Multi-Tenant ETL Platform application. 
The user is currently on the ${pageContext.title} page.

Page Description: ${pageContext.description}

Available Features on this page:
${pageContext.features.map(f => `- ${f}`).join('\n')}

General App Information:
- This is a multi-tenant ETL (Extract, Transform, Load) platform
- Users can create pipelines to move data between sources and destinations
- Supports databases (SQL Server, PostgreSQL, MySQL), files (CSV, Excel, JSON), and REST APIs
- Transformations can modify data during transfer
- Admin users can manage tenants and users
- Regular users can manage pipelines, data sources, and transformations within their tenant

Provide concise, helpful answers (2-3 sentences typically) focused on the current page context. If the user asks about features not on the current page, briefly explain where to find them.`;

    // Build conversation history
    const history = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(`${systemPrompt}\n\nUser question: ${message}`);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting Gemini response:', error);
    
    // More specific error handling
    if (error.message?.includes('429')) {
      throw new Error('Rate limit exceeded. Please wait and try again.');
    } else if (error.message?.includes('quota')) {
      throw new Error('API quota exceeded. Please create a new API key.');
    } else if (error.message?.includes('403')) {
      throw new Error('API access forbidden. Please check your API key.');
    } else if (error.message?.includes('404')) {
      throw new Error('Model not found. Please check your API configuration.');
    }
    
    throw error;
  }
}