import { useEffect, useState } from 'react';
import { loadQuestion, loadTopicContent } from './index.js';

function useLoader(key, loader) {
  const [state, setState] = useState({ key: null, data: null, error: null });
  useEffect(() => {
    let alive = true;
    setState((s) => (s.key === key ? s : { key: null, data: null, error: null }));
    loader(key)
      .then((data) => alive && setState({ key, data, error: null }))
      .catch((error) => alive && setState({ key, data: null, error }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const ready = state.key === key;
  return { data: ready ? state.data : null, loading: !ready && !state.error, error: state.error };
}

export const useTopicContent = (topicId) => useLoader(topicId, loadTopicContent);
export const useQuestion = (questionId) => useLoader(questionId, loadQuestion);
