"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/useAuth";
import {
  deleteHunt,
  getAllHunts,
  saveHunt,
} from "@/lib/db/huntsRepository";
import {
  deleteCloudHunt,
  getCloudHunts,
  getCloudSettings,
  importCloudBackup,
  mergeHuntsToCloud,
  saveCloudHunt,
  setCloudSettings,
} from "@/lib/cloud/huntsRepository";
import { importBackup } from "@/lib/backup/importBackup";
import type { HuntBackup, HuntSettings, SavedHunt } from "@/lib/db/types";
import type { PxGHuntData } from "@/lib/pxg/types";

const SETTINGS_KEY = "huntdex-settings-v2";
const DEFAULT_SETTINGS: HuntSettings = { diamondPrice: null };

function readLocalSettings(): HuntSettings {
  try {
    const value = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null");
    if (
      value &&
      (value.diamondPrice === null ||
        (typeof value.diamondPrice === "number" &&
          Number.isFinite(value.diamondPrice) &&
          value.diamondPrice > 0))
    ) {
      return { diamondPrice: value.diamondPrice };
    }
  } catch {
    // Preferimos a configuração padrão a bloquear o histórico por preferência inválida.
  }
  return DEFAULT_SETTINGS;
}

function writeLocalSettings(settings: HuntSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function useHuntLibrary() {
  const auth = useAuth();
  const userId = auth.user?.id ?? null;
  const cloudMode = Boolean(auth.configured && userId);
  const [hunts, setHunts] = useState<SavedHunt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<HuntSettings>(DEFAULT_SETTINGS);
  const [localPendingCount, setLocalPendingCount] = useState(0);
  const [syncingLocal, setSyncingLocal] = useState(false);

  const refresh = useCallback(async () => {
    if (auth.loading) return;
    setLoading(true);
    try {
      if (cloudMode && userId) {
        const [remoteHunts, remoteSettings, localHunts] = await Promise.all([
          getCloudHunts(userId),
          getCloudSettings(userId),
          getAllHunts(),
        ]);
        setHunts(remoteHunts);
        const localSettings = readLocalSettings();
        const resolvedSettings =
          remoteSettings.diamondPrice === null && localSettings.diamondPrice !== null
            ? localSettings
            : remoteSettings;
        setSettings(resolvedSettings);
        if (remoteSettings.diamondPrice === null && localSettings.diamondPrice !== null) {
          void setCloudSettings(userId, localSettings).catch(() => {
            setError("O histórico foi sincronizado, mas o preço local do Diamond não pôde ser enviado para a conta.");
          });
        }
        const remoteKeys = new Set(remoteHunts.map((hunt) => hunt.duplicateKey));
        setLocalPendingCount(
          localHunts.reduce(
            (total, hunt) => total + (remoteKeys.has(hunt.duplicateKey) ? 0 : 1),
            0,
          ),
        );
      } else {
        const localHunts = await getAllHunts();
        setHunts(localHunts);
        setSettings(readLocalSettings());
        setLocalPendingCount(0);
      }
      setError(null);
    } catch {
      setError(
        cloudMode
          ? "Não foi possível sincronizar sua conta agora. Verifique a conexão e tente novamente."
          : "Não foi possível acessar o histórico local. O analisador continua disponível.",
      );
    } finally {
      setLoading(false);
    }
  }, [auth.loading, cloudMode, userId]);

  useEffect(() => {
    if (auth.loading) return;
    queueMicrotask(() => void refresh());
  }, [auth.loading, refresh, userId]);

  useEffect(() => {
    if (auth.loading) return;
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [auth.loading, refresh]);

  const updateSettings = useCallback(
    (next: HuntSettings) => {
      setSettings(next);
      setError(null);
      if (cloudMode && userId) {
        void setCloudSettings(userId, next).catch(() => {
          setError("A configuração foi alterada nesta sessão, mas não pôde ser sincronizada.");
        });
        return;
      }
      try {
        writeLocalSettings(next);
      } catch {
        setError("A configuração está disponível nesta sessão, mas não pôde ser salva no navegador.");
      }
    },
    [cloudMode, userId],
  );

  const save = useCallback(
    async (raw: PxGHuntData) => {
      const result =
        cloudMode && userId ? await saveCloudHunt(userId, raw) : await saveHunt(raw);
      await refresh();
      return result;
    },
    [cloudMode, refresh, userId],
  );

  const remove = useCallback(
    async (id: string) => {
      if (cloudMode && userId) await deleteCloudHunt(userId, id);
      else await deleteHunt(id);
      await refresh();
    },
    [cloudMode, refresh, userId],
  );

  const restoreBackup = useCallback(
    async (backup: HuntBackup, mode: "merge" | "replace") => {
      const result =
        cloudMode && userId
          ? await importCloudBackup(userId, backup, mode)
          : await importBackup(backup, mode);
      try {
        if (cloudMode && userId) await setCloudSettings(userId, backup.settings);
        else writeLocalSettings(backup.settings);
        setSettings(backup.settings);
      } catch {
        setError("As hunts foram restauradas, mas a configuração do Diamond não pôde ser salva.");
      }
      await refresh();
      return result;
    },
    [cloudMode, refresh, userId],
  );

  const syncLocalToAccount = useCallback(async () => {
    if (!cloudMode || !userId) return { imported: 0, duplicates: 0 };
    setSyncingLocal(true);
    setError(null);
    try {
      const localHunts = await getAllHunts();
      const result = await mergeHuntsToCloud(userId, localHunts);
      const currentCloudSettings = await getCloudSettings(userId);
      const localSettings = readLocalSettings();
      if (currentCloudSettings.diamondPrice === null && localSettings.diamondPrice !== null) {
        await setCloudSettings(userId, localSettings);
      }
      await refresh();
      return result;
    } catch (cause) {
      setError("Não foi possível enviar as hunts locais para sua conta. Nenhuma hunt local foi apagada.");
      throw cause;
    } finally {
      setSyncingLocal(false);
    }
  }, [cloudMode, refresh, userId]);

  const savedKeys = useMemo(() => new Set(hunts.map((hunt) => hunt.duplicateKey)), [hunts]);

  return {
    auth,
    cloudMode,
    hunts,
    savedKeys,
    loading,
    error: error ?? auth.error,
    refresh,
    settings,
    updateSettings,
    save,
    remove,
    restoreBackup,
    localPendingCount,
    syncingLocal,
    syncLocalToAccount,
  };
}
