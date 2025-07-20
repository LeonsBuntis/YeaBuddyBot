# Deploy Azure Function App (Consumption, West Europe) with Bicep

This folder contains Bicep templates to deploy:
- Azure Storage Account
- Azure Function App (Node.js, Consumption plan, West Europe)

## Parameters
- `functionAppName`: Name for the Function App (must be globally unique)
- `storageAccountName`: Name for the Storage Account (must be globally unique, 3-24 lowercase letters/numbers)

## Deployment

### Prerequisites
- Azure CLI installed and logged in
- [Bicep CLI](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/install) (or use `az` which includes Bicep)

### Deploy

```
az deployment sub create \
  --location westeurope \
  --template-file infrastructure/main.bicep \
  --parameters functionAppName=<your-func-name> storageAccountName=<yourstorageacct>
```

Replace `<your-func-name>` and `<yourstorageacct>` with unique names.

---

## Outputs
- `functionAppName`: The name of the deployed Function App
- `functionAppUrl`: The default URL of the Function App
