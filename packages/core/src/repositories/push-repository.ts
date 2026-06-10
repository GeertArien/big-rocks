import type {
  NotificationSettings,
  Prisma,
  PrismaClient,
  PushSubscription,
} from "@prisma/client";

/** The only place Prisma is touched for push subscriptions + settings. */
export interface PushRepository {
  saveSubscription(data: {
    endpoint: string;
    p256dh: string;
    auth: string;
  }): Promise<PushSubscription>;
  deleteSubscription(endpoint: string): Promise<void>;
  listSubscriptions(): Promise<PushSubscription[]>;
  /** The single settings row, created with defaults on first read. */
  getSettings(): Promise<NotificationSettings>;
  updateSettings(
    data: Prisma.NotificationSettingsUpdateInput,
  ): Promise<NotificationSettings>;
}

export class PrismaPushRepository implements PushRepository {
  constructor(private readonly db: PrismaClient) {}

  saveSubscription(data: {
    endpoint: string;
    p256dh: string;
    auth: string;
  }): Promise<PushSubscription> {
    return this.db.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      create: data,
      update: { p256dh: data.p256dh, auth: data.auth },
    });
  }

  async deleteSubscription(endpoint: string): Promise<void> {
    await this.db.pushSubscription.deleteMany({ where: { endpoint } });
  }

  listSubscriptions(): Promise<PushSubscription[]> {
    return this.db.pushSubscription.findMany();
  }

  async getSettings(): Promise<NotificationSettings> {
    const existing = await this.db.notificationSettings.findFirst();
    if (existing) return existing;
    return this.db.notificationSettings.create({ data: {} });
  }

  async updateSettings(
    data: Prisma.NotificationSettingsUpdateInput,
  ): Promise<NotificationSettings> {
    const settings = await this.getSettings();
    return this.db.notificationSettings.update({
      where: { id: settings.id },
      data,
    });
  }
}
