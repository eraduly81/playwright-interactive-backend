import React, { useState } from 'react';

interface CodeSample {
  title: string;
  description: string;
  code: string;
  language: string;
  executable: boolean;
  apiPath?: string;
}

interface DocSection {
  id: string;
  title: string;
  content: React.ReactNode;
  samples?: CodeSample[];
}

const samples: CodeSample[] = [
  {
    title: 'Health Check',
    description: 'Verify the backend is running',
    code: `curl http://localhost:3000/health`,
    language: 'bash',
    executable: true,
    apiPath: '/health'
  },
  {
    title: 'Bearer Token Auth',
    description: 'Test with Authorization header and JSON body',
    code: `{
  "id": "auth-test",
  "name": "Bearer Token Test",
  "description": "Testing authenticated POST endpoint with JSON body",
  "endpoints": [{
    "id": "ep1",
    "name": "Create Resource",
    "method": "POST",
    "path": "/api/resources",
    "headers": {
      "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "Content-Type": "application/json"
    },
    "body": {
      "name": "Example Resource",
      "description": "This is a sample payload",
      "status": "active",
      "metadata": {
        "createdBy": "test-user",
        "version": 1
      }
    }
  }],
  "authFlows": [],
  "assertions": [{
    "id": "a1",
    "type": "status",
    "expected": 201,
    "operator": "equals"
  }],
  "environment": {
    "name": "test",
    "baseUrl": "https://api.example.com",
    "variables": {
      "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "timeouts": { "request": 30000, "response": 30000 }
  },
  "tags": ["auth", "bearer", "post"]
}`,
    language: 'json',
    executable: false
  },
  {
    title: 'Simple Test',
    description: 'Run a basic API test',
    code: `{
  "id": "demo-test",
  "name": "Demo API Test",
  "description": "Testing JSONPlaceholder API",
  "endpoints": [{
    "id": "ep1",
    "name": "Get Posts",
    "method": "GET",
    "path": "/posts/1"
  }],
  "authFlows": [],
  "assertions": [{
    "id": "a1",
    "type": "status",
    "expected": 200,
    "operator": "equals"
  }],
  "environment": {
    "name": "test",
    "baseUrl": "https://jsonplaceholder.typicode.com",
    "variables": {},
    "timeouts": { "request": 30000, "response": 30000 }
  },
  "tags": ["demo"]
}`,
    language: 'json',
    executable: true,
    apiPath: '/api/tests/run'
  }
];

export function InteractiveHelp() {
  const [currentSection, setCurrentSection] = useState('intro');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [executingSample, setExecutingSample] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [filterText, setFilterText] = useState('');
  const [editedCode, setEditedCode] = useState<Record<string, string>>({});

  const getCode = (sample: CodeSample) => editedCode[sample.title] ?? sample.code;

  const resetCode = (title: string) => {
    setEditedCode(prev => {
      const next = { ...prev };
      delete next[title];
      return next;
    });
  };

  const sections: DocSection[] = [
    {
      id: 'intro',
      title: 'Introduction',
      content: (
        <div>
          <p className="text-lg text-white mb-4 font-medium">
            Welcome to Playwright Spec Kit - an API testing framework with TypeScript and Playwright.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black p-4 rounded border-2 border-red-600">
              <h4 className="font-semibold text-red-500">Spec-Driven</h4>
              <p className="text-sm text-white mt-1">JSON-based test definitions</p>
            </div>
            <div className="bg-black p-4 rounded border-2 border-red-600">
              <h4 className="font-semibold text-red-500">Auth Support</h4>
              <p className="text-sm text-white mt-1">JWT, OAuth2, API Key, Basic</p>
            </div>
            <div className="bg-black p-4 rounded border-2 border-red-600">
              <h4 className="font-semibold text-red-500">Live Results</h4>
              <p className="text-sm text-white mt-1">Real-time WebSocket updates</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'getting-started',
      title: 'Getting Started',
      content: (
        <div>
          <p className="text-white mb-4 font-medium">The server runs on port 3000. Try the health check below:</p>
        </div>
      ),
      samples: [samples[0]]
    },
    {
      id: 'try-it',
      title: 'Try It Out',
      content: (
        <p className="text-gray-700">Click "Execute" to run these examples against the live API.</p>
      ),
      samples: samples
    },
    {
      id: 'endpoints',
      title: 'API Endpoints',
      content: (
        <div>
          <table className="w-full border-collapse mt-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Method</th>
                <th className="border p-2 text-left">Path</th>
                <th className="border p-2 text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">GET</td>
                <td className="border p-2">/health</td>
                <td className="border p-2">Health status</td>
              </tr>
              <tr>
                <td className="border p-2">POST</td>
                <td className="border p-2">/api/tests/run</td>
                <td className="border p-2">Execute tests</td>
              </tr>
              <tr>
                <td className="border p-2">GET</td>
                <td className="border p-2">/api/tests</td>
                <td className="border p-2">List tests</td>
              </tr>
            </tbody>
          </table>
        </div>
      )
    }
  ];

  const copyToClipboard = (sample: CodeSample) => {
    const code = getCode(sample);
    navigator.clipboard.writeText(code);
    setCopiedText(code);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const executeSample = async (sample: CodeSample) => {
    if (!sample.executable || !sample.apiPath) return;
    
    setExecutingSample(sample.title);
    
    try {
      let res;
      
      if (sample.apiPath === '/health') {
        res = await fetch('http://localhost:3000/health');
        const data = await res.json();
        setResults(prev => ({ ...prev, [sample.title]: { ok: true, data, status: res.status } }));
      } else if (sample.apiPath === '/api/tests/run') {
        const code = getCode(sample);
        const body = JSON.parse(code);
        res = await fetch('http://localhost:3000/api/tests/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        setResults(prev => ({ ...prev, [sample.title]: { ok: true, data, status: res.status } }));
      }
    } catch (err) {
      setResults(prev => ({ ...prev, [sample.title]: { ok: false, error: String(err) } }));
    } finally {
      setExecutingSample(null);
    }
  };

  const filtered = sections.filter(s =>
    s.title.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Help & Documentation</h1>
        <p className="text-red-200 mt-2">Interactive guide with executable examples</p>
      </div>

      <input
        type="text"
        placeholder="Search..."
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        className="w-full px-4 py-2 bg-white border-2 border-red-600 rounded-lg mb-6 text-black placeholder-gray-500"
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-60 flex-shrink-0">
          <div className="sticky top-24 bg-black rounded-lg shadow-lg border-2 border-red-600 p-3">
            <h3 className="font-semibold px-2 mb-3 text-white">Sections</h3>
            <ul className="space-y-1">
              {sections.map(s => (
                <li key={s.id}>
                  <button
                    onClick={() => {
                      setCurrentSection(s.id);
                      document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-sm ${
                      currentSection === s.id 
                        ? 'bg-red-900 text-white border-r-2 border-red-500' 
                        : 'text-gray-300 hover:bg-gray-800 hover:text-red-400'
                    }`}
                  >
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="flex-1">
          <div className="space-y-6">
            {filtered.map(s => (
              <section
                key={s.id}
                id={s.id}
                className="bg-black rounded-lg shadow-lg border-2 border-red-600 p-6"
              >
                <h2 className="text-2xl font-bold text-white mb-4">{s.title}</h2>
                <div className="text-gray-300">{s.content}</div>

                {s.samples && (
                  <div className="mt-4 space-y-4">
                    {s.samples.map((sample, i) => (
                      <div key={i} className="bg-black rounded-lg border-2 border-red-600 p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-white">{sample.title}</h4>
                            <p className="text-sm text-gray-400">{sample.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => copyToClipboard(sample)}
                              className="px-3 py-1 bg-white border-2 border-red-600 rounded hover:bg-red-50 text-black text-sm font-medium"
                            >
                              {copiedText === getCode(sample) ? 'Copied!' : 'Copy'}
                            </button>
                            {editedCode[sample.title] && (
                              <button
                                onClick={() => resetCode(sample.title)}
                                className="px-3 py-1 bg-gray-700 border border-gray-500 rounded hover:bg-gray-600 text-white text-sm font-medium"
                              >
                                Reset
                              </button>
                            )}
                            {sample.executable && (
                              <button
                                onClick={() => executeSample(sample)}
                                disabled={executingSample === sample.title}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium disabled:opacity-50 border-2 border-white"
                              >
                                {executingSample === sample.title ? 'Running...' : 'Execute'}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto border border-gray-700">
                          <textarea
                            value={getCode(sample)}
                            onChange={(e) => setEditedCode(prev => ({ ...prev, [sample.title]: e.target.value }))}
                            className="w-full bg-gray-900 text-green-400 font-mono text-sm resize-y min-h-[100px] focus:outline-none"
                            spellCheck={false}
                          />
                        </div>

                        {results[sample.title] && (
                          <div className={`mt-3 p-3 rounded border-2 ${
                            results[sample.title].ok 
                              ? 'bg-black border-green-500' 
                              : 'bg-black border-red-500'
                          }`}>
                            <h5 className={`font-semibold text-sm mb-2 ${
                              results[sample.title].ok ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {results[sample.title].ok ? '✓ Success' : '✗ Failed'}
                            </h5>
                            <pre className="text-xs overflow-x-auto text-gray-300">
                              {JSON.stringify(results[sample.title].data || results[sample.title].error, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </main>
      </div>

      {copiedText && (
        <div className="fixed bottom-4 right-4 bg-black border-2 border-red-600 text-red-500 px-4 py-2 rounded-lg shadow-lg font-bold">
          Copied!
        </div>
      )}
    </div>
  );
}
