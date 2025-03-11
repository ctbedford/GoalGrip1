
import { useEffect, useState } from "react";
import axios from "axios";

interface FeatureStatus {
  name: string;
  status: {
    implemented: boolean;
    tested: boolean;
    lastVerified?: string;
    notes?: string[];
  };
  relatedTests?: {
    id: string;
    name: string;
    description: string;
    status: string;
  }[];
}

export function FeatureStatusViewer() {
  const [features, setFeatures] = useState<FeatureStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/debug/features');
        setFeatures(response.data.features || []);
        setError(null);
      } catch (err) {
        setError('Failed to fetch feature information');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, []);

  const runTest = async (testId: string) => {
    try {
      await axios.post(`/api/debug/tests/run/${testId}`);
      // Refresh features list to get updated test status
      const response = await axios.get('/api/debug/features');
      setFeatures(response.data.features || []);
    } catch (err) {
      console.error('Failed to run test:', err);
    }
  };

  if (loading) {
    return <div className="p-4">Loading feature information...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Feature Status</h2>
      
      {features.length === 0 ? (
        <p className="text-gray-500">No features found. Features may not be registered in the debug system.</p>
      ) : (
        <div className="grid gap-4">
          {features.map((feature) => (
            <div key={feature.name} className="border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">{feature.name}</h3>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${feature.status.implemented ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {feature.status.implemented ? 'Implemented' : 'Not Implemented'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${feature.status.tested ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {feature.status.tested ? 'Tested' : 'Not Tested'}
                  </span>
                </div>
              </div>
              
              {feature.status.lastVerified && (
                <p className="text-sm text-gray-500 mt-1">
                  Last verified: {new Date(feature.status.lastVerified).toLocaleString()}
                </p>
              )}
              
              {feature.status.notes && feature.status.notes.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-sm font-medium">Notes:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
                    {feature.status.notes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {feature.relatedTests && feature.relatedTests.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-1">Related Tests:</h4>
                  <div className="grid gap-2">
                    {feature.relatedTests.map((test) => (
                      <div key={test.id} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                        <div>
                          <span className="font-medium">{test.name}</span>
                          <p className="text-xs text-gray-500">{test.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            test.status === 'passed' ? 'bg-green-100 text-green-800' : 
                            test.status === 'failed' ? 'bg-red-100 text-red-800' :
                            test.status === 'running' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {test.status}
                          </span>
                          <button 
                            onClick={() => runTest(test.id)}
                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                          >
                            Run Test
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 pt-4 border-t">
        <h3 className="font-semibold mb-2">Debug API Commands</h3>
        <div className="bg-gray-50 p-3 rounded font-mono text-sm">
          <div className="mb-2">curl http://localhost:5000/api/debug/features</div>
          <div className="mb-2">curl http://localhost:5000/api/debug/features/feature-name</div>
          <div className="mb-2">curl http://localhost:5000/api/debug/tests</div>
          <div>curl -X POST http://localhost:5000/api/debug/tests/run/test-id</div>
        </div>
      </div>
    </div>
  );
}

export default FeatureStatusViewer;
