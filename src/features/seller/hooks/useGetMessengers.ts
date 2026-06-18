import { useEffect, useState } from "react";
import { subscribeToMessengers } from "../services/getMessengers";
import { type Messenger } from "../types";
import { db } from "../../../lib/firebase";

export const useGetMessengers = () => {
  const [messengers, setMessengers] = useState<Messenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToMessengers(
      db,
      (data) => {
        setMessengers(data);
        setLoading(false);
      },
      () => {
        setError("No se pudieron cargar los mensajeros.");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { messengers, loading, error };
};
