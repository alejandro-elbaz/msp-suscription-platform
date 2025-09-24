import type { Integration } from '@shared/types';
import { LayoutPanelLeft, Globe, Figma, Slack, Github } from 'lucide-react';
export const INTEGRATIONS_DATA: Integration[] = [
  {
    id: 'microsoft-365',
    name: 'Microsoft 365',
    description: 'Connect to sync user licenses and usage data from your Microsoft 365 tenant.',
    logo: LayoutPanelLeft,
    status: 'not_connected',
    steps: [
      {
        title: 'Step 1: Authorize Application',
        description: 'Log in to your Microsoft 365 admin account and grant NexusMSP access to read directory and license information. This is a secure OAuth2 flow.',
      },
      {
        title: 'Step 2: Enter Tenant ID',
        description: 'Find your Tenant ID in the Microsoft Entra admin center and paste it below.',
        fields: [
          { id: 'tenantId', label: 'Microsoft 365 Tenant ID', type: 'text', placeholder: 'e.g., 12345678-abcd-1234-abcd-1234567890ab' },
          { id: 'defaultSeatCost', label: 'Default License Cost (USD)', type: 'number', placeholder: 'e.g., 18.00' },
        ],
      },
      {
        title: 'Step 3: Verify Connection',
        description: 'We will perform a test connection to ensure the credentials are valid and we can access the required data.',
      },
    ],
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    description: 'Sync your Google Workspace users and licenses to manage them directly from NexusMSP.',
    logo: Globe,
    status: 'not_connected',
    steps: [
      {
        title: 'Step 1: Enable API Access',
        description: 'In your Google Workspace Admin console, enable API access for third-party applications.',
      },
      {
        title: 'Step 2: Create Service Account',
        description: 'Create a new service account in the Google Cloud Platform console and download the JSON key file.',
      },
      {
        title: 'Step 3: Upload Credentials',
        description: 'Upload the JSON key file you downloaded. This will be used to authenticate with the Google Workspace API.',
        fields: [
          { id: 'jsonCredentials', label: 'Service Account JSON', type: 'file' },
        ],
      },
    ],
  },
  {
    id: 'figma',
    name: 'Figma',
    description: 'Track your Figma team licenses, including seats and plan details.',
    logo: Figma,
    status: 'not_connected',
    steps: [
      {
        title: 'Step 1: Generate API Token',
        description: 'Log in to your Figma account, go to Settings, and generate a new personal access token.',
      },
      {
        title: 'Step 2: Enter API Token',
        description: 'Paste the generated personal access token below to allow NexusMSP to access your Figma account data.',
        fields: [
          { id: 'apiToken', label: 'Figma API Token', type: 'password', placeholder: 'figd_... '},
        ],
      },
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Monitor your Slack workspace usage and member count.',
    logo: Slack,
    status: 'not_connected',
    steps: [
      {
        title: 'Step 1: Create a Slack App',
        description: 'Go to the Slack API website and create a new app in your workspace.',
      },
      {
        title: 'Step 2: Add Scopes',
        description: 'Add the `users:read` and `team:read` OAuth scopes to your Slack app.',
      },
      {
        title: 'Step 3: Install App and Get Token',
        description: 'Install the app to your workspace and copy the Bot User OAuth Token.',
        fields: [
          { id: 'botToken', label: 'Slack Bot Token', type: 'password', placeholder: 'xoxb-...' },
        ],
      },
    ],
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Manage GitHub organization seats and repository access.',
    logo: Github,
    status: 'not_connected',
    steps: [
      {
        title: 'Step 1: Create a GitHub App',
        description: 'Create a new GitHub App under your organization settings with read-only access to members.',
      },
      {
        title: 'Step 2: Generate Private Key',
        description: 'Generate a private key for your GitHub App and download it.',
      },
      {
        title: 'Step 3: Provide App ID and Key',
        description: 'Enter your App ID and upload the private key file.',
        fields: [
          { id: 'appId', label: 'GitHub App ID', type: 'text', placeholder: 'e.g., 123456' },
          { id: 'privateKey', label: 'Private Key (.pem)', type: 'file' },
        ],
      },
    ],
  },
];