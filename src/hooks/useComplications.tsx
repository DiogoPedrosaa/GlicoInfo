import { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../api/firebase/config';

export interface Complication {
  id: string;
  name: string;
  instructions?: string;
  keywords?: string[];
  createdAt?: any;
}

export function useComplications() {
  const [complications, setComplications] = useState<Complication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComplications();
  }, []);

  async function fetchComplications() {
    try {
      setLoading(true);
      setError(null);
      const q = query(collection(db, "complications"), orderBy("name"));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Complication[];
      setComplications(data);
    } catch (e) {
      console.error("Erro ao buscar complicações:", e);
      setError("Erro ao carregar complicações");
    } finally {
      setLoading(false);
    }
  }

  return { complications, loading, error, refetch: fetchComplications };
}