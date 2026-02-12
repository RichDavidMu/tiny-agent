import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import rootStore from '@/stores/root-store.ts';

export const useHistorySync = () => {
  const navigate = useNavigate();
  const params = useParams();
  useEffect(() => {
    rootStore.historyStore.setNavigate(navigate);
  }, [navigate]);
  useEffect(() => {
    rootStore.historyStore.setParams(params);
  }, [params.sessionId]);
};
