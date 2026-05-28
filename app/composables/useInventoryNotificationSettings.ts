import type { ApiResponse, InventoryNotificationSettings } from "~/types/inventory";

const DEFAULT_INVENTORY_NOTIFICATION_SETTINGS: InventoryNotificationSettings = {
  email_low_stock: true,
  email_out_of_stock: true,
  email_daily_summary: false,
  push_low_stock: true,
  push_out_of_stock: true,
  default_low_stock_threshold: 10,
  alert_emails: "",
  alert_frequency: "realtime",
};

export const useInventoryNotificationSettings = () => {
  const client = useSanctumClient();
  const loading = useState<boolean>("inventory-notification-settings:loading", () => false);
  const settings = useState<InventoryNotificationSettings>(
    "inventory-notification-settings:data",
    () => ({ ...DEFAULT_INVENTORY_NOTIFICATION_SETTINGS })
  );

  async function fetchSettings(): Promise<InventoryNotificationSettings> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<InventoryNotificationSettings>>(
        "/api/v1/admin/inventory/notification-settings",
        { method: "GET" }
      );

      settings.value = {
        ...DEFAULT_INVENTORY_NOTIFICATION_SETTINGS,
        ...(response.data ?? {}),
      };

      return settings.value;
    } finally {
      loading.value = false;
    }
  }

  async function updateSettings(
    payload: InventoryNotificationSettings
  ): Promise<InventoryNotificationSettings> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<InventoryNotificationSettings>>(
        "/api/v1/admin/inventory/notification-settings",
        {
          method: "PUT",
          body: payload,
        }
      );

      settings.value = {
        ...DEFAULT_INVENTORY_NOTIFICATION_SETTINGS,
        ...(response.data ?? payload),
      };

      return settings.value;
    } finally {
      loading.value = false;
    }
  }

  function resetLocalDefaults(): InventoryNotificationSettings {
    settings.value = { ...DEFAULT_INVENTORY_NOTIFICATION_SETTINGS };
    return settings.value;
  }

  return {
    settings: readonly(settings),
    loading: readonly(loading),
    fetchSettings,
    updateSettings,
    resetLocalDefaults,
  };
};
