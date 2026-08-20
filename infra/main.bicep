@description('Location for all Azure resources.')
param location string = resourceGroup().location

@description('Short project name used for resource naming.')
param appName string

@description('PostgreSQL administrator login name.')
param postgresAdminLogin string

@secure()
@description('PostgreSQL administrator password.')
param postgresAdminPassword string

@description('Allowed frontend origins for the API. Use comma-separated values.')
param allowedOrigins string = 'https://your-frontend-domain.vercel.app'

@description('Name of the default database to create.')
param databaseName string = 'track_sd05'

@description('App Service plan SKU for the Node.js backend.')
param backendSkuName string = 'B1'

@description('PostgreSQL Flexible Server SKU.')
param postgresSkuName string = 'Standard_B1ms'

var appServicePlanName = '${appName}-plan'
var webAppName = '${appName}-backend'
var postgresServerName = '${appName}-db'

resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: appServicePlanName
  location: location
  kind: 'linux'
  sku: {
    name: backendSkuName
    tier: 'Basic'
  }
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2023-01-01' = {
  name: webAppName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|22-lts'
      alwaysOn: true
      ftpsState: 'FtpsOnly'
      appSettings: [
        {
          name: 'WEBSITES_PORT'
          value: '3000'
        }
        {
          name: 'PORT'
          value: '3000'
        }
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'ALLOWED_ORIGINS'
          value: allowedOrigins
        }
        {
          name: 'PGHOST'
          value: '${postgresServerName}.postgres.database.azure.com'
        }
        {
          name: 'PGPORT'
          value: '5432'
        }
        {
          name: 'PGUSER'
          value: postgresAdminLogin
        }
        {
          name: 'PGPASSWORD'
          value: postgresAdminPassword
        }
        {
          name: 'PGDATABASE'
          value: databaseName
        }
        {
          name: 'PGSSL'
          value: 'true'
        }
      ]
    }
  }
}

resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: postgresServerName
  location: location
  sku: {
    name: postgresSkuName
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: postgresAdminLogin
    administratorLoginPassword: postgresAdminPassword
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    network: {
      publicNetworkAccess: 'Enabled'
    }
    availabilityZone: '1'
  }
}

resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-06-01-preview' = {
  parent: postgresServer
  name: databaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

resource postgresAllowAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-06-01-preview' = {
  parent: postgresServer
  name: 'allow-azure-services'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '255.255.255.255'
  }
}

output backendUrl string = 'https://${webApp.properties.defaultHostName}'
output postgresServerHost string = postgresServer.properties.fullyQualifiedDomainName
output databaseName string = databaseName
