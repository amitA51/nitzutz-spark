import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Connection {
  type: 'book' | 'article' | 'contradiction';
  title: string;
  relation: string;
  id: string;
}

interface ConnectionsSidebarProps {
  articleId: string;
}

const ConnectionsSidebar: React.FC<ConnectionsSidebarProps> = ({ articleId }) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConnections = async () => {
      if (!articleId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/ai/find-connections`, {
          articleId,
        });
        setConnections(response.data.connections || []);
      } catch (err: any) {
        console.error('Error fetching connections:', err);
        setError('Failed to load connections');
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [articleId]);

  if (loading) {
    return (
      <div className="bg-gray-dark rounded-lg p-6 border border-gray-light">
        <h3 className="text-lg font-semibold mb-4 text-primary">🕸️ Connections</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-dark rounded-lg p-6 border border-gray-light">
        <h3 className="text-lg font-semibold mb-4 text-primary">🕸️ Connections</h3>
        <p className="text-sm text-gray-400">{error}</p>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="bg-gray-dark rounded-lg p-6 border border-gray-light">
        <h3 className="text-lg font-semibold mb-4 text-primary">🕸️ Connections</h3>
        <p className="text-sm text-gray-400 italic">
          No connections found yet. As you add more content to your library, connections will appear here automatically.
        </p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'book':
        return '📚';
      case 'article':
        return '📰';
      case 'contradiction':
        return '⚠️';
      default:
        return '🔗';
    }
  };

  return (
    <div className="bg-gray-dark rounded-lg p-6 border border-gray-light">
      <h3 className="text-lg font-semibold mb-4 text-primary">🕸️ Connections</h3>
      <div className="space-y-4">
        {connections.map((connection, index) => (
          <div
            key={index}
            className="border-l-2 border-primary pl-4 py-2 hover:bg-gray-medium transition-colors rounded-r"
          >
            <div className="flex items-start gap-2">
              <span className="text-lg flex-shrink-0">{getIcon(connection.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-1">{connection.relation}</p>
                <p className="text-sm font-medium text-white truncate">{connection.title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConnectionsSidebar;
