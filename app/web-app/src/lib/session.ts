import rootStore from '@/stores/root-store.ts';

export const selectSession = (sessionId: string | undefined) => {
  const { navigate } = rootStore.historyStore;
  if (!sessionId) {
    navigate('/chat');
  } else {
    navigate(`/chat/${sessionId}`);
  }
};
