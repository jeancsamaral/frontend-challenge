'use client';

import Link from "next/link";
import { useSession } from "next-auth/react";
import { MdLock, MdPeople, MdSchool } from "react-icons/md";

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              📊 Slide Editor
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-2">
              Apresentações Interativas
            </p>
            <p className="text-gray-500">
              Crie apresentações envolventes com interação em tempo real dos estudantes
            </p>
          </div>

          {/* Status de autenticação */}
          {status === 'loading' ? (
            <div className="mb-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : session ? (
            <div className="mb-8 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-800">
                Bem-vindo, <strong>{session.user?.name || session.user?.email}</strong>! 
                Você está autenticado e pode acessar todas as funcionalidades.
              </p>
            </div>
          ) : (
            <div className="mb-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-center mb-2">
                <MdLock className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-yellow-800">
                  Faça login para acessar o editor de slides
                </p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center justify-center mb-3">
                <MdSchool className="h-8 w-8 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-blue-900">
                  Para Professores
                </h3>
              </div>
              <p className="text-blue-700 mb-4">
                Crie slides interativos com questões de múltipla escolha, nuvens de palavras e enquetes ao vivo
              </p>
              <Link
                href={session ? "/editor" : "/auth/signin?callbackUrl=/editor"}
                className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {!session && <MdLock className="h-4 w-4 mr-2" />}
                Abrir Editor
              </Link>
              {!session && (
                <p className="text-xs text-blue-600 mt-2">Requer login</p>
              )}
            </div>

            <div className="bg-green-50 rounded-lg p-6">
              <div className="flex items-center justify-center mb-3">
                <MdPeople className="h-8 w-8 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-green-900">
                  Para Estudantes
                </h3>
              </div>
              <p className="text-green-700 mb-4">
                Participe de sessões interativas e responda às questões em tempo real
              </p>
              <Link
                href="/student/login"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Entrar na Sessão
              </Link>
            </div>
          </div>

          {/* Informações de teste */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Códigos de Demonstração
            </h3>
            <div className="flex flex-wrap justify-center gap-4 text-sm mb-4">
              <span className="bg-white px-3 py-1 rounded-md font-mono">ABC123</span>
              <span className="bg-white px-3 py-1 rounded-md font-mono">DEF456</span>
              <span className="bg-white px-3 py-1 rounded-md font-mono">GHI789</span>
            </div>
            <p className="text-gray-600 text-sm">
              Use estes códigos para testar a interface do estudante
            </p>
          </div>

          {/* Informações de login */}
          {!session && (
            <div className="bg-indigo-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-indigo-900 mb-3">
                Sistema de Login
              </h3>
              <p className="text-indigo-700 text-sm mb-4">
                Para testar o sistema, você pode usar as seguintes credenciais:
              </p>
              <div className="bg-white rounded-md p-4 text-left max-w-md mx-auto">
                <p className="text-sm text-gray-600">
                  <strong>Admin:</strong><br />
                  Email: admin@example.com<br />
                  Senha: password
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Ou:</strong> Qualquer email/senha válidos
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
