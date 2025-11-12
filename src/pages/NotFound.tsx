import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NotFound(): JSX.Element {
  const navigate = useNavigate();
  const { t} = useTranslation('notFound');

  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-xl w-full p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-gray-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t('notFound.title')}
          </h1>
          <p className="text-gray-600 mb-6">
            {t('notFound.description')}
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('notFound.goToDashboard')}
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('notFound.signIn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}