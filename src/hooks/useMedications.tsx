import { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../api/firebase/config';

export interface Medication {
  id: string;
  commercialName: string;
  genericName: string;
  pharmaceuticalForm: string;
  concentration: string;
  administrationRoute: string;
  description?: string;
}

export function useMedications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMedications();
  }, []);

  async function fetchMedications() {
    try {
      setLoading(true);
      setError(null);
      const q = query(collection(db, "medications"), orderBy("commercialName"));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Medication[];
      setMedications(data);
    } catch (e) {
      console.error("Erro ao buscar medicamentos:", e);
      setError("Erro ao carregar medicamentos");
    } finally {
      setLoading(false);
    }
  }

  return { medications, loading, error, refetch: fetchMedications };
}