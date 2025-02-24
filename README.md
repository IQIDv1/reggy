# Reggy - Financial Aid Regulations AI Assistant

Reggy is an AI-powered assistant designed to help users navigate complex financial aid regulations. This application uses Next.js, TypeScript, and Supabase for backend services.

REGGY - FINANCIAL AID REGULATIONS AI ASSISTANT
SETUP AND RUNNING INSTRUCTIONS (NOTE: THIS IS NOT UPDATED)

1. PREREQUISITES

- Node.js (version 18.17.0 or later)
- npm (comes with Node.js)
- Two Supabase projects (one for development, one for production)
- An OpenAI API key
- Supabase CLI (install with: npm install -g supabase)
- cross-env (install with: npm install --save-dev cross-env)

2. ENVIRONMENT OVERVIEW
   We work with two environments:
   a. Development Supabase Project: Used for local development and testing.
   b. Production Supabase Project: Used for the live application.

3. REPOSITORY SETUP
   a. Clone the repository:
   git clone https://your-repository-url.git
   cd reggy

b. Install dependencies:
npm install

4. ADMIN API CONFIGURATION
   a. Set up the admin API key:
   - Generate a secure random string for your admin API key
   - Add it to your environment variables as ADMIN_API_KEY
   - Keep this key secure and only share it with authorized administrators

b. Using the admin API:

- Include the x-api-key header in your requests
- Example curl command:
  \`\`\`
  curl -X POST https://your-domain.com/api/admin/fine-tune \
   -H "x-api-key: your-admin-api-key"
  \`\`\`

c. Available admin endpoints:

- POST /api/admin/fine-tune: Triggers the fine-tuning process
- GET /api/admin/fine-tune/test: Tests admin authentication

5. SUPABASE PROJECT SETUP
   a. Create two Supabase projects: one for development and one for production.

b. Set up environment variables:

- Create .env.development and .env.production files in the root directory.
- Add the following to each file, using the appropriate project credentials:

.env.development:
NEXT_PUBLIC_SUPABASE_URL=your_dev_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_dev_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
ADMIN_API_KEY=your_admin_api_key

.env.production:
NEXT_PUBLIC_SUPABASE_URL=your_prod_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_prod_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
ADMIN_API_KEY=your_admin_api_key

Required environment variables:

- NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase project's anon key
- SUPABASE_SERVICE_ROLE_KEY: Your Supabase project's service role key
- OPENAI_API_KEY: Your OpenAI API key
- ADMIN_API_KEY: A secure random string for admin API authentication
- PROD_SUPABASE_URL: Your production Supabase project URL (for production only)
- PROD_SUPABASE_SERVICE_ROLE_KEY: Your production Supabase project's service role key (for production only)

Optional environment variables:

- NEXT_PUBLIC_APP_URL: The public URL of your application (useful for generating absolute URLs)
- LOG_LEVEL: The logging level for the application (e.g., "info", "warn", "error")

Note: Ensure that you use different Supabase project URLs and keys for development and production environments.

c. Initialize Supabase:
supabase init

d. Link your local setup to your development Supabase project:
supabase link --project-ref your-dev-project-ref

6. DATABASE SETUP
   a. The initial schema is defined in `supabase/migrations/20240214000000_initial_schema.sql`.

b. Apply the initial schema to your development project:
supabase db push

c. Generate TypeScript types for your schema:
supabase gen types typescript --local > lib/database.types.ts

7. DATA PREPARATION
   a. Organize financial aid regulation documents (PDFs) in the following structure:
   documents/
   ├── Federal/
   ├── States/
   │ ├── California/
   │ ├── New York/
   │ └── ...
   └── University/

b. Ensure each document filename includes the relevant academic year (e.g., "Federal_Regulations_2025-2026.pdf").

c. Process the documents for the development environment:
npm run process-documents

d. To process documents for the production environment:

- Create a new script in package.json:
  "process-documents:prod": "cross-env NODE_ENV=production ts-node scripts/process_documents.ts"
- Run: npm run process-documents:prod

e. Update the process_documents.ts script to use the correct environment variables:

\`\`\`typescript
const env = process.env.NODE_ENV || 'development';
const supabaseUrl = env === 'production'
? process.env.PROD_SUPABASE_URL
: process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env === 'production'
? process.env.PROD_SUPABASE_SERVICE_ROLE_KEY
: process.env.SUPABASE_SERVICE_ROLE_KEY;
\`\`\`

8. FINE-TUNING THE MODEL
   a. Ensure you have sufficient chat data in your database.
   b. Run the fine-tuning script:
   npm run fine-tune

c. This process may take several hours. Once complete, the fine-tuned model ID will be saved in 'fine_tuned_model_id.txt'.
d. The application will automatically use the fine-tuned model for generating responses.

9. RUNNING THE APPLICATION LOCALLY
   a. Start the Next.js development server:
   npm run dev

b. Access the application at http://localhost:3000

10. DEVELOPMENT WORKFLOW
    a. Develop and test using your development Supabase project.
    b. For database schema changes:

- Create a new migration: supabase migration new your_migration_name
- Apply to development: supabase db push
- Update types: supabase gen types typescript --local > lib/database.types.ts

11. DEPLOYING TO PRODUCTION
    a. Push your database changes to the production Supabase project:
    supabase db push -p your-production-project-ref

b. Deploy your Next.js application to your preferred hosting platform (e.g., Vercel).

c. Set the production environment variables in your hosting platform's dashboard.

12. VERCEL PRODUCTION DEPLOYMENT
    a. Ensure you have a Vercel account and are logged in.

b. Install the Vercel CLI globally:
npm install -g vercel

c. In your project root, run:
vercel

d. Follow the prompts to link your project to Vercel.

e. Set up your environment variables in the Vercel dashboard:

- Go to your project settings
- Navigate to the "Environment Variables" section
- Add all necessary variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, ADMIN_API_KEY, etc.)

f. Configure your build settings in the Vercel dashboard:

- Set the framework preset to Next.js
- Ensure the "Build Command" is set to "next build"
- Set the "Output Directory" to ".next"

g. Set up automatic deployments:

- Connect your GitHub repository to your Vercel project
- Configure branch deployments (e.g., main branch for production)

h. Trigger a deployment:

- Push changes to your connected GitHub repository, or
- Run `vercel --prod` from your local machine

i. After deployment, your app will be live at a \*.vercel.app domain.

j. (Optional) Set up a custom domain:

- In the Vercel dashboard, go to your project settings
- Navigate to the "Domains" section
- Add and configure your custom domain

k. Monitor your deployment:

- Use Vercel's built-in analytics and monitoring tools
- Check the "Deployments" tab in your Vercel dashboard for logs and performance metrics

Remember to always test your application thoroughly in a staging environment before deploying to production.

13. TROUBLESHOOTING

- For Supabase issues: supabase status
- Verify database connection: supabase db ping
- For Vercel deployment issues:
  - Check the deployment logs in the Vercel dashboard
  - Ensure all environment variables are correctly set
  - Verify that the build command and output directory are correct
  - Use `vercel logs` command to view recent logs

For more detailed Supabase CLI commands and troubleshooting, refer to the official documentation: https://supabase.com/docs/reference/cli/introduction

For Vercel-specific issues and advanced configurations, consult the Vercel documentation: https://vercel.com/docs
