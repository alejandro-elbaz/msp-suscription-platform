# NexusMSP

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/alejandro-elbaz/msp-app-suscription)

A visually stunning and intuitive platform for Managed Service Providers to control and monitor client SaaS subscriptions and cloud resources.

NexusMSP is a sophisticated, visually stunning web application designed for Managed Service Providers (MSPs) to effortlessly monitor, manage, and control client software subscriptions and cloud resource usage. The platform provides a centralized dashboard for a high-level overview of key metrics like MRR and upcoming renewals. It allows MSPs to manage a detailed client list, a catalog of offered services (e.g., Microsoft 365, AWS, Figma), and assign specific subscriptions to each client with detailed tracking of costs, quantities, and renewal dates.

## Key Features

-   **Centralized Dashboard**: Get a high-level overview of your operations with key metrics like Total MRR, active clients, and upcoming renewals.
-   **Comprehensive Client Management**: A full CRUD interface to manage your client list efficiently.
-   **Service Catalog**: Define and manage a master catalog of all the products and services you offer.
-   **Subscription Tracking**: Assign services to clients and track subscription details like cost, quantity, and renewal dates.
-   **Modern UI/UX**: A beautiful, minimalist interface built with performance and user experience as a top priority.
-   **Serverless Architecture**: Built on the robust and scalable Cloudflare Workers platform.

## Technology Stack

-   **Frontend**:
    -   [React](https://react.dev/)
    -   [Vite](https://vitejs.dev/)
    -   [React Router](https://reactrouter.com/)
    -   [Tailwind CSS](https://tailwindcss.com/)
    -   [shadcn/ui](https://ui.shadcn.com/)
    -   [Zustand](https://zustand-demo.pmnd.rs/) for state management
    -   [React Hook Form](https://react-hook-form.com/) for form handling
    -   [Recharts](https://recharts.org/) for data visualization
-   **Backend**:
    -   [Cloudflare Workers](https://workers.cloudflare.com/)
    -   [Hono](https://hono.dev/)
    -   [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/) for state persistence
-   **Language**: [TypeScript](https://www.typescriptlang.org/)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   [Bun](https://bun.sh/) installed on your machine.
-   A [Cloudflare account](https://dash.cloudflare.com/sign-up).
-   [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed and authenticated.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/nexus_msp_subscription_manager.git
    cd nexus_msp_subscription_manager
    ```

2.  **Install dependencies:**
    ```sh
    bun install
    ```

### Running in Development

To start the local development server, which includes both the Vite frontend and a local simulation of the Cloudflare Worker, run:

```sh
bun run dev
```

This will start the application, typically on `http://localhost:3000`. The frontend will hot-reload on changes, and the worker backend will be accessible for API requests.

## Usage

Once the application is running, you can navigate through the interface:

-   **Dashboard**: The main landing page with an overview of your MSP business.
-   **Clients**: View, add, edit, and delete clients from the client list.
-   **Services**: (Coming in Phase 2) Manage the catalog of services you offer.

The application is designed to be intuitive. Use the sidebar to navigate between different sections and use the on-screen controls to manage your data.

## Project Structure

-   `src/`: Contains all the frontend code, built with React and Vite.
    -   `pages/`: Top-level page components.
    -   `components/`: Reusable UI components, including shadcn/ui elements.
    -   `lib/`: Utility functions and API client.
-   `worker/`: Contains the backend Cloudflare Worker code.
    -   `index.ts`: The main entry point for the worker.
    -   `user-routes.ts`: Hono API route definitions.
    -   `entities.ts`: Durable Object entity definitions for data persistence.
-   `shared/`: Contains TypeScript types and mock data shared between the frontend and backend.

## Deployment

This project is designed for seamless deployment to Cloudflare's global network.

1.  **Build the application:**
    The deployment script handles the build process automatically.

2.  **Deploy to Cloudflare:**
    Run the following command to deploy your application using Wrangler:
    ```sh
    bun run deploy
    ```
    This command will build the frontend assets, bundle the worker, and deploy everything to your Cloudflare account.

Alternatively, you can deploy directly from your GitHub repository with a single click.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/alejandro-elbaz/msp-app-suscription)

## Contributing

Contributions are welcome! If you have suggestions for improving the application, please feel free to open an issue or submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.