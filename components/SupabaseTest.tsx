import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function SupabaseTest() {
  const [tables, setTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        // Test the connection by fetching tables (requires appropriate RLS policies)
        const { data, error } = await supabase
          .from('pg_tables')
          .select('tablename')
          .eq('schemaname', 'public');

        if (error) {
          setError(`Error connecting to Supabase: ${error.message}`);
          console.error('Supabase error:', error);
        } else {
          setTables(data?.map((item: { tablename: string }) => item.tablename) || []);
        }
      } catch (err) {
        setError('Failed to connect to Supabase');
        console.error('Connection error:', err);
      } finally {
        setLoading(false);
      }
    }

    testConnection();
  }, []);

  if (loading) return <div>Connecting to Supabase...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Supabase Connection Test</h2>
      <p className="text-green-600 mb-2">✅ Successfully connected to Supabase!</p>
      <div>
        <h3 className="font-medium mb-1">Available Tables:</h3>
        {tables.length > 0 ? (
          <ul className="list-disc pl-5">
            {tables.map((table) => (
              <li key={table}>{table}</li>
            ))}
          </ul>
        ) : (
          <p>No tables found or insufficient permissions</p>
        )}
      </div>
    </div>
  );
}
