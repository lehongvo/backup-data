import { scanTokenMigratedEvents } from "./main/workerBackupData";

scanTokenMigratedEvents().catch(console.error);