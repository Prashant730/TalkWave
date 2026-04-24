import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Toaster } from 'react-hot-toast';
import { store, persistor } from './store/index.js';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import Spinner from './components/common/Spinner.jsx';

// Pages will be imported here
const Login = React.lazy(() => import('./pages/Login.jsx').catch(() => ({ default: () => <div>Login</div> })));
const Register = React.lazy(() => import('./pages/Register.jsx').catch(() => ({ default: () => <div>Register</div> })));
const Chat = React.lazy(() =>
  import('./pages/Chat.jsx').catch((err) => {
    console.error('Failed to load Chat page:', err);
    return { default: () => <div className="flex items-center justify-center w-screen h-screen text-red-500">Error loading chat: {err.message}</div> };
  })
);
const Profile = React.lazy(() => import('./pages/Profile.jsx').catch(() => ({ default: () => <div>Profile</div> })));
const Admin = React.lazy(() => import('./pages/Admin.jsx').catch(() => ({ default: () => <div>Admin</div> })));
const NotFound = React.lazy(() => import('./pages/NotFound.jsx').catch(() => ({ default: () => <div>Not Found</div> })));

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<Spinner size="lg" />} persistor={persistor}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Toaster position="top-right" />
          <React.Suspense fallback={<div className="flex items-center justify-center w-screen h-screen"><Spinner size="lg" /></div>}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/chat/:conversationId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/" element={<Navigate to="/chat" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </React.Suspense>
        </Router>
      </PersistGate>
    </Provider>
  );
}

export default App;
