# Deploy and trace

## Run locally

```sh
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
INGEST_SECRET=dev LOCAL_TEST_MODE=true functions-framework --target ingest --debug --port 8080
curl -s localhost:8080 -H 'Content-Type: application/json' -H 'X-Ingest-Secret: dev' \
  -d '{"device_id": "dev-01", "temperature": 21.5}'
```

Run the unit tests with `pytest`.

## Deploy (Cloud Run functions)

Check the current command in the documentation; the functions product and its flags have changed names over time.

```sh
gcloud run deploy {function-name} --source . --function ingest --base-image {python runtime} \
  --region {region} --allow-unauthenticated \
  --set-env-vars BQ_DATASET={dataset},BQ_TABLE={table} --set-secrets INGEST_SECRET={secret-name}:latest
```

`--allow-unauthenticated` is needed because the broker's webhook cannot sign Google identity tokens; the shared secret replaces that check. Store it in Secret Manager, and put the same value in the broker's webhook header.

## Logs

```sh
gcloud run services logs read {function-name} --region {region} --limit 50
```

## Common failures

| Symptom | Likely cause |
| --- | --- |
| Device log shows publish OK, broker shows nothing | Wrong broker host, port, or credentials; TLS settings on the device |
| Broker shows messages, webhook history shows none | Topic filter does not match exactly; webhook disabled |
| Webhook history shows 401 | Secret header missing or different from the function's secret |
| Webhook history shows 400 | Payload field names, types, or ranges differ from the function's schema |
| Function logs "rejected the row" | Table schema differs from the row (name, type, required field) |
| Function logs a permission error | Service account lacks insert permission on the dataset |
