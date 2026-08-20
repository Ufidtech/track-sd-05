# Public deployment guide

This project is now structured for a real public deployment path using:

- Azure App Service for the Express backend
- Azure Database for PostgreSQL Flexible Server for persistence
- Vercel or another static host for the frontend

## 1. Backend deployment to Azure

1. Sign in to Azure:
   `az login --tenant <tenant-id>`
2. Create a resource group:
   `az group create --name track-sd-05-rg --location eastus`
3. Deploy the Bicep template:
   `az deployment group create --resource-group track-sd-05-rg --template-file infra/main.bicep --parameters @infra/main.parameters.json`
4. After deployment, copy the backend URL from the output.
5. Update the frontend environment variable to that backend URL:
   `VITE_API_URL=https://<your-backend-app>.azurewebsites.net`

## 2. Database setup

The template creates the PostgreSQL Flexible Server and database automatically.
Then run the schema once from the server project:

```bash
psql "host=<server-host> port=5432 dbname=track_sd05 user=<admin-user> password=<password> sslmode=require" -f server/src/db/schema.sql
```

## 3. Frontend deployment

Option A: Vercel

- import the client folder
- set `VITE_API_URL` to the Azure backend URL
- deploy

Option B: Netlify or another static host

- build with `npm run build`
- deploy the `dist` folder
- set the same environment variable

## 4. Production security notes

- never commit `.env` files
- set `ALLOWED_ORIGINS` to only your production frontend domains
- use Azure Key Vault or equivalent for secrets in production
- keep PostgreSQL firewall locked down to your app and required admin access

## 5. Local verification before release

Before public launch, confirm:

- backend health route is returning success
- frontend build succeeds
- a real ticket can be created from the public frontend
- the queue endpoint works from the production backend
