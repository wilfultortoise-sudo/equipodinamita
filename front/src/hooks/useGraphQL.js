import { useState, useEffect, useCallback } from 'react';
import { fetchGraphQL } from '../api/graphqlClient';

// Custom Hook para ejecutar peticiones GraphQL con control de estado (Tema 3 de React)
export function useGraphQL(query, variables = {}, immediate = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (customVariables = variables) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchGraphQL(query, customVariables);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'Error al consultar GraphQL');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [query, JSON.stringify(variables)]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { data, loading, error, refetch: execute };
}
