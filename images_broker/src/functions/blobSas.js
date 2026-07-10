const { app } = require("@azure/functions");
const { StorageSharedKeyCredential, BlobSASPermissions, generateBlobSASQueryParameters } = require("@azure/storage-blob");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

app.http("blobSas", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "storage/blob-sas",
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

      const blobName = request.query.get("name");
      if (!blobName) {
        return { status: 400, headers: CORS_HEADERS, jsonBody: { error: "Missing 'name' query parameter" } };
      }

      const containerName = request.query.get("container") || AZURE_CONTAINER;

      const now = new Date();
      const startsOn = new Date(now.getTime() - 60 * 1000);
      const expiresOn = new Date(now.getTime() + 10 * 60 * 1000);

      const credential = new StorageSharedKeyCredential(AZURE_ACCOUNT_NAME, AZURE_ACCOUNT_KEY);
      const sas = generateBlobSASQueryParameters(
        {
          containerName,
          blobName,
          permissions: BlobSASPermissions.parse("r"),
          startsOn,
          expiresOn,
          protocol: "https",
        },
        credential
      ).toString();

      const blobUrl = `https://${AZURE_ACCOUNT_NAME}.blob.core.windows.net/${containerName}/${blobName}`;

      return {
        headers: CORS_HEADERS,
        jsonBody: {
          blobName,
          downloadUrl: `${blobUrl}?${sas}`,
          expiresAt: expiresOn.toISOString(),
        },
      };
    } catch (error) {
      return { status: 500, headers: CORS_HEADERS, jsonBody: { error: error.message || String(error) } };
    }
  },
});
