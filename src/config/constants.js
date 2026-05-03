/**
 * Application Constants
 * Fetched from backend on app initialization to avoid hardcoding
 */

import axios from "@/services/api";

export const AppConstants = {
  roles: null,
  supportedLanguages: null,
  _initialized: false,
};

export const ConnectorProviders = {
  SqlServer: "SqlServer",
  PostgreSQL: "PostgreSQL",
  MySQL: "MySQL",
  MongoDb: "MongoDb",
  CosmosDb: "CosmosDb",
  REST: "REST",
  FTP: "FTP",
  SFTP: "SFTP",
  AzureBlob: "AzureBlob",
  Email: "Email",
};

/**
 * Initialize constants from backend
 * Should be called once during app startup
 * @returns {Promise<void>}
 */
export async function initializeConstants() {
  if (AppConstants._initialized) {
    return;
  }

  const { data } = await axios.get("/api/metadata/app-constants");

  // Validate response structure
  if (!data || !data.roles) {
    throw new Error("Invalid response structure from backend");
  }

  AppConstants.roles = data.roles;
  AppConstants.supportedLanguages = data.supportedLanguages;
  AppConstants._initialized = true;
}

/**
 * Get role constants
 * @returns {Object} Role names
 */
export function getRoles() {
  if (!AppConstants._initialized) {
    throw new Error(
      "Constants not initialized. Call initializeConstants() first.",
    );
  }
  return AppConstants.roles;
}

/**
 * Get supported languages
 * @returns {Array} Supported languages
 */
export function getSupportedLanguages() {
  if (!AppConstants._initialized) {
    throw new Error(
      "Constants not initialized. Call initializeConstants() first.",
    );
  }
  return AppConstants.supportedLanguages;
}
