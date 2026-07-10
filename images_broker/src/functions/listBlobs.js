const { app } = require("@azure/functions");
const { StorageSharedKeyCredential, BlobServiceClient } = require("@azure/storage-blob");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

app.http("listBlobs", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "storage/blobs",
  handler: async (request, context) => {
    if (request.method === "OPTIONS") {
      return { status: 204, headers: CORS_HEADERS };
    }

    try {
      const AZURE_ACCOUNT_NAME = process.env.AZURE_ACCOUNT_NAME || "";
      const AZURE_ACCOUNT_KEY = process.env.AZURE_ACCOUNT_KEY || "";
      const AZURE_CONTAINER = process.env.AZURE_CONTAINER || "";
      const BROKER_API_KEY = process.env.BROKER_API_KEY || "";

      if (!AZURE_ACCOUNT_NAME || !AZURE_ACCOUNT_KEY || !AZURE_CONTAINER) {
        return { status: 500, headers: CORS_HEADERS, jsonBody: { error: "Missing Azure configuration" } };
      }

      if (BROKER_API_KEY) {
        const clientKey = request.headers.get("x-api-key") || "";
        if (clientKey !== BROKER_API_KEY) {
          return { status: 401, headers: CORS_HEADERS, jsonBody: { error: "Unauthorized" } };
        }
      }

      const prefix = request.query.get("prefix") || "";

      const credential = new StorageSharedKeyCredential(AZURE_ACCOUNT_NAME, AZURE_ACCOUNT_KEY);
      const blobServiceClient = new BlobServiceClient(
        `https://${AZURE_ACCOUNT_NAME}.blob.core.windows.net`,
        credential
      );
      const containerClient = blobServiceClient.getContainerClient(AZURE_CONTAINER);

      const blobs = [];
      for await (const blob of containerClient.listBlobsFlat({ prefix: prefix || undefined })) {
        blobs.push({
          name: blob.name,
          size: blob.properties.contentLength,
          lastModified: blob.properties.lastModified?.toISOString(),
          contentType: blob.properties.contentType,
        });
      }
      blobs.sort((a, b) => (b.lastModified || "").localeCompare(a.lastModified || ""));

      return { headers: CORS_HEADERS, jsonBody: { container: AZURE_CONTAINER, blobs } };
    } catch (error) {
      return { status: 500, headers: CORS_HEADERS, jsonBody: { error: error.message || String(error) } };
    }
  },
});
