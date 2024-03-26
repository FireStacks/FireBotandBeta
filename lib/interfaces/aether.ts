import {
  MinecraftVersion,
  ModVersions,
  OptifineVersion,
} from "@fire/src/modules/mclogs";

export type Payload = {
  op: number; // opcode
  d?: unknown; // data
  s?: number; // sequence
  t?: string; // type as UPPER_SNAKE_CASE
  n?: string; // nonce
};

type Config = Record<string, boolean>;

interface TreatmentConfig {
  id: number;
  label: string;
  config: Config;
}

export interface ExperimentConfig {
  id: string;
  label: string;
  kind: "user" | "guild";
  defaultConfig: Config;
  treatments: TreatmentConfig[];
}

export interface GuildExperimentConfig extends ExperimentConfig {
  kind: "guild";
}

export interface UserExperimentConfig extends ExperimentConfig {
  kind: "user";
}

export interface Caches {
  members: number;
  users: number;
  channels: number;
  threads: number;
  threadMembers: number;
  roles: number;
  permissionOverwrites: number;
  messages: number;
  voiceStates: number;
  userConfigs: number;
}

export interface ManagerState {
  guildExperiments: GuildExperimentConfig[];
  userExperiments: UserExperimentConfig[];
  modVersions: Record<string, Record<MinecraftVersion, ModVersions>>;
  optifineVersions: Record<MinecraftVersion, OptifineVersion[]>;
}

export interface IPoint {
  /**
   * Measurement is the Influx measurement name.
   */
  measurement?: string;
  /**
   * Tags is the list of tag values to insert.
   */
  tags?: {
    [name: string]: string;
  };
  /**
   * Fields is the list of field values to insert.
   */
  fields?: {
    [name: string]: any;
  };
  /**
   * Timestamp tags this measurement with a date. This can be a Date object,
   * in which case we'll adjust it to the desired precision, or a numeric
   * string or number, in which case it gets passed directly to Influx.
   */
  timestamp?: Date | string | number;
}

type InfluxPrecision = "n" | "u" | "ms" | "s" | "m" | "h";

export interface IWriteOptions {
  /**
   * Precision at which the points are written, defaults to nanoseconds 'n'.
   */
  precision?: InfluxPrecision;
  /**
   * Retention policy to write the points under, defaults to the DEFAULT
   * database policy.
   */
  retentionPolicy?: string;
  /**
   * Database under which to write the points. This is required if a default
   * database is not provided in Influx.
   */
  database?: string;
}
export interface IQueryOptions {
  /**
   * Defines the precision at which to query points. When left blank, it will
   * query in nanosecond precision.
   */
  precision?: InfluxPrecision;
  /**
   * Retention policy to query from, defaults to the DEFAULT
   * database policy.
   */
  retentionPolicy?: string;
  /**
   * Database under which to query the points. This is required if a default
   * database is not provided in Influx.
   */
  database?: string;
  /**
   * Any placeholders used by the query. Using these is strongly recommended
   * to avoid injection attacks.
   */
  placeholders?: Record<string, string | number>;
}
