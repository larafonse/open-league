import React from 'react';
import { useParams } from 'react-router-dom';

const PlayerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Player Details</h1>
        <p className="mt-2 text-gray-600">Player ID: {id}</p>
      </div>
      
      <div className="card">
        <p className="text-gray-600">Player detail page coming soon...</p>
      </div>
    </div>
  );
};

export default PlayerDetail;
