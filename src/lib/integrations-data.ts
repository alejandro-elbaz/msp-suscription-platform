import type { Integration } from '@shared/types';
import { LayoutPanelLeft, Globe, Figma, Slack, Github, Cloud, Shield } from 'lucide-react';
import { MicrosoftIcon, GoogleWorkspaceIcon, SlackIcon as SlackIconCustom, FigmaIcon as FigmaIconCustom, GitHubIcon as GitHubIconCustom, AWSIcon, CloudflareIcon } from '@/components/integrations/IntegrationIcons';

export const INTEGRATIONS_DATA: Integration[] = [
  {
    id: 'microsoft-365',
    name: 'Microsoft 365',
    description: 'Comprehensive integration with Microsoft 365 to automatically sync licenses, users, and subscription data across your entire tenant.',
    logo: MicrosoftIcon as any,
    status: 'not_connected',
    features: [
      'Real-time user and license synchronization',
      'Automatic detection of all Microsoft 365 SKUs',
      'Track Business Premium, E3, E5, and specialized licenses',
      'Monitor SharePoint and OneDrive storage usage',
      'Exchange mailbox size tracking',
      'Azure AD group management visibility',
      'License assignment history and trends',
      'Automated compliance reporting'
    ],
    syncCapabilities: {
      dataTypes: ['Users', 'Licenses', 'Groups', 'Domains', 'Subscriptions', 'Storage Usage'],
      syncFrequency: 'Every 4 hours (configurable)',
      realTime: true
    },
    pricing: {
      model: 'Included in all plans',
      includedIn: ['Starter', 'Professional', 'Enterprise']
    },
    security: {
      encryption: 'TLS 1.3 + AES-256 at rest',
      compliance: ['SOC 2', 'ISO 27001', 'GDPR', 'HIPAA'],
      dataLocation: 'Encrypted in Cloudflare Workers KV'
    },
    steps: [
      {
        title: 'Step 1: Register Azure AD Application',
        description: 'Create an app registration in Azure AD with the required Microsoft Graph API permissions. We need Application permissions for User.Read.All, Directory.Read.All, and Organization.Read.All.',
      },
      {
        title: 'Step 2: Configure Application Credentials',
        description: 'Enter your Azure AD Tenant ID and the client credentials from your app registration. These will be securely stored and used for API authentication.',
        fields: [
          { id: 'tenantId', label: 'Microsoft 365 Tenant ID', type: 'text', placeholder: 'e.g., 12345678-abcd-1234-abcd-1234567890ab' },
          { id: 'clientId', label: 'Application (Client) ID', type: 'text', placeholder: 'e.g., 87654321-dcba-4321-dcba-0987654321ab' },
          { id: 'clientSecret', label: 'Client Secret Value', type: 'password', placeholder: 'Enter your client secret' },
          { id: 'defaultSeatCost', label: 'Default License Cost (USD)', type: 'number', placeholder: 'e.g., 22.00' },
        ],
      },
      {
        title: 'Step 3: Test and Sync',
        description: 'Verify the connection and perform an initial sync. This will import all users, licenses, and subscription data into NexusMSP.',
      },
    ],
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    description: 'Complete visibility into your Google Workspace environment with automated user provisioning, license optimization, and storage management.',
    logo: GoogleWorkspaceIcon as any,
    status: 'not_connected',
    features: [
      'User and license synchronization',
      'Google Drive storage analytics',
      'Gmail mailbox size monitoring',
      'Shared drive permissions audit',
      'Enterprise, Business, and Basic plan tracking',
      'Third-party app usage insights',
      'Security key and 2FA status',
      'Admin console audit logs integration'
    ],
    syncCapabilities: {
      dataTypes: ['Users', 'Licenses', 'Groups', 'Shared Drives', 'Storage', 'Security Settings'],
      syncFrequency: 'Every 6 hours',
      realTime: false
    },
    pricing: {
      model: 'Included in Professional and Enterprise',
      includedIn: ['Professional', 'Enterprise']
    },
    security: {
      encryption: 'TLS 1.3 + AES-256',
      compliance: ['SOC 2', 'ISO 27001', 'GDPR'],
      dataLocation: 'Encrypted in Cloudflare Workers KV'
    },
    steps: [
      {
        title: 'Step 1: Enable Admin SDK API',
        description: 'In your Google Cloud Console, enable the Admin SDK API and Directory API for your project. This allows NexusMSP to read organizational data.',
      },
      {
        title: 'Step 2: Create Service Account',
        description: 'Create a service account with domain-wide delegation. Download the JSON key file and grant it the necessary scopes in your Google Admin console.',
      },
      {
        title: 'Step 3: Configure Integration',
        description: 'Upload your service account credentials and specify the admin email to impersonate for API calls.',
        fields: [
          { id: 'serviceAccountJson', label: 'Service Account JSON File', type: 'file' },
          { id: 'adminEmail', label: 'Admin Email to Impersonate', type: 'text', placeholder: 'admin@yourdomain.com' },
          { id: 'defaultCostPerUser', label: 'Default Cost per User (USD)', type: 'number', placeholder: 'e.g., 12.00' },
        ],
      },
    ],
  },
  {
    id: 'figma',
    name: 'Figma',
    description: 'Monitor design team productivity and license utilization with comprehensive Figma organization insights.',
    logo: FigmaIconCustom as any,
    status: 'not_connected',
    features: [
      'Team member and editor seat tracking',
      'Professional vs Organization plan monitoring',
      'FigJam seat management',
      'Project and file analytics',
      'Guest access monitoring',
      'Design system usage metrics',
      'Branching and version history insights',
      'Plugin usage statistics'
    ],
    syncCapabilities: {
      dataTypes: ['Users', 'Teams', 'Projects', 'Files', 'Billing'],
      syncFrequency: 'Daily',
      realTime: false
    },
    pricing: {
      model: 'Available in all plans',
      includedIn: ['Starter', 'Professional', 'Enterprise']
    },
    security: {
      encryption: 'TLS 1.3',
      compliance: ['SOC 2', 'GDPR'],
      dataLocation: 'Encrypted API credentials only'
    },
    steps: [
      {
        title: 'Step 1: Generate Personal Access Token',
        description: 'Navigate to your Figma account settings and create a new personal access token with read access to your organization.',
      },
      {
        title: 'Step 2: Configure Integration',
        description: 'Enter your Figma access token and organization details to begin tracking design team licenses and usage.',
        fields: [
          { id: 'apiToken', label: 'Figma Personal Access Token', type: 'password', placeholder: 'figd_xxxxxxxxxxxxxxxxxxxx' },
          { id: 'organizationId', label: 'Organization ID (Optional)', type: 'text', placeholder: 'org_123456789' },
        ],
      },
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Comprehensive Slack workspace analytics including user activity, channel usage, and license optimization insights.',
    logo: SlackIconCustom as any,
    status: 'not_connected',
    features: [
      'Active user tracking and analytics',
      'Pro vs Business+ vs Enterprise Grid monitoring',
      'Channel and workspace statistics',
      'Guest user management',
      'App and integration usage',
      'Message and file storage metrics',
      'Workflow automation usage',
      'Connect and huddle analytics'
    ],
    syncCapabilities: {
      dataTypes: ['Users', 'Channels', 'Apps', 'Guests', 'Analytics'],
      syncFrequency: 'Every 12 hours',
      realTime: false
    },
    pricing: {
      model: 'Included in all plans',
      includedIn: ['Starter', 'Professional', 'Enterprise']
    },
    security: {
      encryption: 'OAuth 2.0 + TLS 1.3',
      compliance: ['SOC 2', 'ISO 27001', 'GDPR', 'HIPAA'],
      dataLocation: 'Token-based access only'
    },
    steps: [
      {
        title: 'Step 1: Create Slack App',
        description: 'Visit api.slack.com and create a new app for your workspace. Choose "From scratch" and select your workspace.',
      },
      {
        title: 'Step 2: Configure OAuth Scopes',
        description: 'Add these Bot Token Scopes: users:read, team:read, channels:read, usergroups:read for comprehensive analytics.',
      },
      {
        title: 'Step 3: Install and Authorize',
        description: 'Install the app to your workspace and securely store the Bot User OAuth Token.',
        fields: [
          { id: 'botToken', label: 'Bot User OAuth Token', type: 'password', placeholder: 'xoxb-your-token' },
          { id: 'workspaceId', label: 'Workspace ID', type: 'text', placeholder: 'T0123456789' },
        ],
      },
    ],
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Enterprise-grade GitHub organization management with comprehensive seat tracking, security insights, and Copilot usage analytics.',
    logo: GitHubIconCustom as any,
    status: 'not_connected',
    features: [
      'Organization member and seat tracking',
      'GitHub Copilot license monitoring',
      'Advanced Security feature usage',
      'Actions minutes consumption',
      'Package and container registry storage',
      'Repository access audit',
      'Team structure visualization',
      'SAML SSO user mapping'
    ],
    syncCapabilities: {
      dataTypes: ['Members', 'Teams', 'Repositories', 'Copilot Usage', 'Security Alerts'],
      syncFrequency: 'Every 8 hours',
      realTime: true
    },
    pricing: {
      model: 'Professional and Enterprise only',
      includedIn: ['Professional', 'Enterprise']
    },
    security: {
      encryption: 'GitHub App + RSA keys',
      compliance: ['SOC 2', 'ISO 27001', 'FedRAMP'],
      dataLocation: 'App credentials only'
    },
    steps: [
      {
        title: 'Step 1: Create GitHub App',
        description: 'In your organization settings, create a new GitHub App with read access to members, organization, and billing.',
      },
      {
        title: 'Step 2: Configure Permissions',
        description: 'Grant these permissions: Organization members (read), Organization billing (read), Metadata (read).',
      },
      {
        title: 'Step 3: Install and Authenticate',
        description: 'Generate a private key, install the app to your organization, and configure the integration.',
        fields: [
          { id: 'appId', label: 'GitHub App ID', type: 'text', placeholder: '123456' },
          { id: 'privateKey', label: 'Private Key (.pem file)', type: 'file' },
          { id: 'organizationName', label: 'Organization Name', type: 'text', placeholder: 'your-org-name' },
        ],
      },
    ],
  },
  {
    id: 'aws',
    name: 'Amazon Web Services',
    description: 'Complete AWS cost management and resource optimization with detailed billing analytics and usage insights.',
    logo: AWSIcon as any,
    status: 'not_connected',
    features: [
      'Consolidated billing tracking',
      'EC2, RDS, and Lambda usage analytics',
      'S3 storage cost breakdown',
      'Reserved instance optimization',
      'Savings plan recommendations',
      'Cost allocation by tags',
      'Budget alerts and forecasting',
      'Multi-account organization support'
    ],
    syncCapabilities: {
      dataTypes: ['Billing', 'Resources', 'Usage', 'Costs', 'Budgets', 'Savings'],
      syncFrequency: 'Every 2 hours',
      realTime: false
    },
    pricing: {
      model: 'Enterprise plan feature',
      includedIn: ['Enterprise']
    },
    security: {
      encryption: 'IAM Role + TLS 1.3',
      compliance: ['SOC 2', 'ISO 27001', 'PCI DSS', 'HIPAA'],
      dataLocation: 'Read-only IAM access'
    },
    steps: [
      {
        title: 'Step 1: Create IAM Role',
        description: 'Create a cross-account IAM role in your AWS account with billing and cost management read permissions.',
      },
      {
        title: 'Step 2: Configure Trust Relationship',
        description: 'Set up the trust relationship to allow NexusMSP to assume the role and access billing data securely.',
      },
      {
        title: 'Step 3: Connect Account',
        description: 'Provide the IAM role ARN and configure cost allocation settings.',
        fields: [
          { id: 'roleArn', label: 'IAM Role ARN', type: 'text', placeholder: 'arn:aws:iam::123456789012:role/NexusMSP-Billing' },
          { id: 'externalId', label: 'External ID', type: 'text', placeholder: 'Generated security token' },
          { id: 'defaultMarkup', label: 'Default Markup %', type: 'number', placeholder: 'e.g., 15' },
        ],
      },
    ],
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    description: 'Monitor Cloudflare usage across zones, Workers, and security services with integrated billing insights.',
    logo: CloudflareIcon as any,
    status: 'not_connected',
    features: [
      'Zone and domain analytics',
      'Workers and Pages usage',
      'R2 storage consumption',
      'Stream minutes tracking',
      'Security event monitoring',
      'Rate limiting analytics',
      'Cache performance metrics',
      'Multi-account management'
    ],
    syncCapabilities: {
      dataTypes: ['Zones', 'Workers', 'Storage', 'Analytics', 'Billing'],
      syncFrequency: 'Hourly',
      realTime: true
    },
    pricing: {
      model: 'Available in all plans',
      includedIn: ['Starter', 'Professional', 'Enterprise']
    },
    security: {
      encryption: 'API Token + TLS 1.3',
      compliance: ['SOC 2', 'ISO 27001', 'GDPR'],
      dataLocation: 'Cloudflare API access only'
    },
    steps: [
      {
        title: 'Step 1: Create API Token',
        description: 'Generate a custom API token with Account:Read and Zone:Read permissions in your Cloudflare dashboard.',
      },
      {
        title: 'Step 2: Configure Access',
        description: 'Provide your API token and account details to enable comprehensive Cloudflare monitoring.',
        fields: [
          { id: 'apiToken', label: 'Cloudflare API Token', type: 'password', placeholder: 'Your API token' },
          { id: 'accountId', label: 'Account ID', type: 'text', placeholder: 'Your account ID' },
        ],
      },
    ],
  },
];