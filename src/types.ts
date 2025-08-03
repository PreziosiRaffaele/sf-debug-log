export type SaveResult = {
  isSuccess: boolean;
  error?: string;
};

export interface GetLogsOptions {
  userId?: string | null;
  timeLimit?: number | null;
}

export type ApexLog = {
  Id: string;
  LogUser: {
    Username: string;
  };
};

export type TraceFlag = {
  Id: string;
  TracedEntityId: string;
  DebugLevelId: string;
  StartDate: string;
  ExpirationDate: string;
};

/**
 * Shape used to create a new DebugLevel record (developer + master label + categories).
 */
export interface DebugLevelCreate {
  [key: string]: string | undefined;
  MasterLabel: string;
  DeveloperName: string;
}

/**
 * Shape returned when querying existing DebugLevel records.
 */
export type DebugLevel = {
  Id: string;
  DeveloperName: string;
  Workflow: string;
  Validation: string;
  Callout: string;
  ApexCode: string;
  ApexProfiling: string;
  Visualforce: string;
  System: string;
  Database: string;
  Wave: string;
  Nba: string;
};
