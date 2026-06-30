import { app } from "@azure/functions";
import { StorageSharedKeyCredential, BlobSASPermissions, generateBlobSASQueryParameters } from "@azure/storage-blob";

const AZURE_ACCOUNT_NAME = process.env.AZURE_ACCOUNT_NAME || "";
const AZURE_ACCOUNT_KEY = process.env.AZURE_ACCOUNT_KEY || "";
const AZURE_CONTAINER = process.env.AZURE_CONTAINER || "";
const BROKER_API_KEY = process.env.BROKER_API_KEY || "";

function sanitizeBlobName(name) {
  const fallback = `upload_${Date.now()}.bin`;
  if (!name || typeof name !== "string") return fallback;
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

app.http("uploadSas", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "storage/upload-sas",
  handler: async (request, context) => {
    try {
      if (!AZURE_ACCOUNT_NAME || !AZURE_ACCOUNT_KEY || !AZURE_CONTAINER) {
        return { status: 500, jsonBody: { error: "Missing Azure configuration" } };
      }

      if (BROKER_API_KEY) {
        const clientKey = request.headers.get("x-api-key") || "";
        if (clientKey !== BROKER_API_KEY) {
          return { status: 401, jsonBody: { error: "Unauthorized" } };
        }
      }

      const body = await request.json();
      const fileName = sanitizeBlobName(body?.fileName);

      const now = new Date();
      const startsOn = new Date(now.getTime() - 60 * 1000);
      const expiresOn = new Date(now.getTime() + 10 * 60 * 1000);

      const credential = new StorageSharedKeyCredential(AZURE_ACCOUNT_NAME, AZURE_ACCOUNT_KEY);
      const sas = generateBlobSASQueryParameters(
        {
          containerName: AZURE_CONTAINER,
          blobName: fileName,
          permissions: BlobSASPermissions.parse("acwt"),
          startsOn,
          expiresOn,
          protocol: "https",
        },
        credential
      ).toString();

      const blobUrl = `https://${AZURE_ACCOUNT_NAME}.blob.core.windows.net/${AZURE_CONTAINER}/${fileName}`;

      return {
        jsonBody: {
          blobName: fileName,
          blobUrl,
          uploadUrl: `${blobUrl}?${sas}`,
          expiresAt: expiresOn.toISOString(),
        },
      };
    } catch (error) {
      return { status: 500, jsonBody: { error: error.message || String(error) } };
    }
  },
});
