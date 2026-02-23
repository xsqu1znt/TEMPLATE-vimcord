# Scheduled Jobs Reference

Cron-based recurring tasks using `node-cron`.

---

## Base Class

Create `src/jobs/_BaseCronJob.ts`:

```typescript
import { schedule, ScheduledTask } from "node-cron";

export abstract class _BaseCronJob {
    protected task: ScheduledTask | null = null;
    private static instances = new Map<any, any>();

    static getInstance<T extends _BaseCronJob>(this: new (...args: any[]) => T): T {
        let instance = _BaseCronJob.instances.get(this);
        if (!instance) instance = new this();
        return instance as T;
    }

    constructor(
        private interval: string,
        private immediate?: boolean
    ) {
        _BaseCronJob.instances.set(this.constructor, this);
        this.start();
    }

    abstract execute(): Promise<any>;

    async start(): Promise<void> {
        if (this.task) {
            this.task.start();
            return;
        }
        this.task = schedule(this.interval, () => this.execute(), { noOverlap: true });
        if (this.immediate) await this.execute();
    }

    stop(): void {
        this.task?.stop();
    }
}
```

## Implementing a Job

```typescript
// src/jobs/DatabaseBackup.job.ts
import { _BaseCronJob } from "./_BaseCronJob";

export class DatabaseBackup extends _BaseCronJob {
    constructor() {
        super("0 0 */6 * * *", false); // Every 6 hours, not immediate
    }

    async execute(): Promise<void> {
        console.log("Running backup...");
        // backup logic
        console.log("Backup complete.");
    }
}
```

## Job with Client Access

```typescript
// src/jobs/PremiumSync.job.ts
import { Vimcord } from "vimcord";
import { UserSchema } from "@db/index";
import { _BaseCronJob } from "./_BaseCronJob";

export class PremiumSync extends _BaseCronJob {
    private client: Vimcord;

    constructor(client: Vimcord) {
        super("0 0 * * * *", false); // Every hour
        this.client = client;
    }

    async execute(): Promise<void> {
        const premiumUsers = await UserSchema.fetchAll({ isPremium: true });
        for (const user of premiumUsers) {
            await UserSchema.syncPremiumStatus(this.client, user.userId);
        }
    }
}
```

## Job Initializer

```typescript
// src/jobs/index.ts
import { Vimcord } from "vimcord";
import { DatabaseBackup } from "./DatabaseBackup.job";
import { PremiumSync } from "./PremiumSync.job";
import { CooldownSweeper } from "./CooldownSweeper.job";

export async function initializeJobs(client: Vimcord): Promise<void> {
    new DatabaseBackup();
    new PremiumSync(client);
    new CooldownSweeper();
}
```

Call inside `client.start()` callback:

```typescript
client.start(() => {
    initializeJobs(client);
});
```

## Cron Schedule Reference

Format: `second minute hour day month weekday`

| Pattern | Description |
|---------|-------------|
| `* * * * * *` | Every second |
| `0 * * * * *` | Every minute |
| `0 0 * * * *` | Every hour |
| `0 0 */6 * * *` | Every 6 hours |
| `0 0 0 * * *` | Daily at midnight |
| `0 30 4 * * *` | Daily at 4:30 AM |
| `0 0 0 * * 1` | Every Monday midnight |
