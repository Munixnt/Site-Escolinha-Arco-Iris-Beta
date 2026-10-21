import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const LOGO_URL = "/logo.jpeg";

export default function Login() {
  const { login, isAuthenticated, isLoadingAuth, authChecked } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Destino depois do login: rota que o usuário tentou abrir, ?next= ou o painel
  const requested = location.state?.from || params.get('next') || '';
  const destination = requested.startsWith('/admin') ? requested : '/admin/dashboard';

  if (isLoadingAuth || !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-gold border-t-burgundy rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to={destination} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.message || 'Não foi possível entrar. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src={LOGO_URL}
            alt="Arco Íris"
            className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-4 border-gold shadow"
          />
          <h1 className="font-montserrat font-black text-burgundy text-3xl">Painel Administrativo</h1>
          <p className="text-gray-500 mt-2">Acesso restrito à administração</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 border-t-4 border-t-gold p-8 space-y-5"
        >
          <div>
            <label htmlFor="email" className="block font-montserrat font-semibold text-sm text-gray-700 mb-1">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold"
            />
          </div>

          <div>
            <label htmlFor="password" className="block font-montserrat font-semibold text-sm text-gray-700 mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-burgundy text-white font-montserrat font-bold rounded-lg hover:bg-burgundy/90 transition-all disabled:opacity-60"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center mt-6">
          <Link to="/" className="text-sm text-gray-500 hover:text-burgundy transition-colors">
            ← Voltar ao site
          </Link>
        </p>
      </div>
    </div>
  );
}
