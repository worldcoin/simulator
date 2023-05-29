export enum Environment {
  Production = "production",
  Staging = "staging",
}

export enum CredentialType {
  Orb = "orb",
  Phone = "phone",
}

export enum Chain {
  Polygon = "polygon",
  Optimism = "optimism",
}

export enum Status {
  Loading,
  Waiting,
  Pending,
  Success,
  Error,
}

export interface ServiceStatusResponse {
  services: {
    name: string;
    id: string;
    description: string;
    status: string;
    logs: {
      id: number;
      datetime: number;
      status: string;
      name: string;
      description: string;
    }[];
    allUptimeRatio: string;
  }[];
  lastIncident: number;
}
