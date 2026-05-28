import { useEffect, useState } from "react";
import { getMessengers } from "../services/getMessengers"
import { type Messenger } from "../types";
import { db } from "../../../lib/firebase";

export const useGetMessengers = () => {
  const [messengers, setMessengers] = useState<Messenger[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessengers = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getMessengers(db);
        setMessengers(data);
      } catch {
        setError('No se pudieron cargar los mensajeros.');
      } finally {
        setLoading(false);
      }
    };
    fetchMessengers();
  }, [])

  return { messengers, loading, error };
}
