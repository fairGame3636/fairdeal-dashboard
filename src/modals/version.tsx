export interface UpdateVersionRequest {
  version: string;
}

export interface ConfigResponse {
  _id: string;
  min_frontend_version: string;
  createdAt: string;
  updatedAt: string;
}