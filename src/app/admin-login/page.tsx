import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import AdminLoginInteractive from './components/AdminLoginInteractive';

export const metadata: Metadata = {
  title: 'Admin Login - POV Store Uruguay',
  description: 'Acceso administrativo a POV Store Uruguay.',
};

export default function AdminLoginPage() {
  return (
    <>
      <Header isAdminMode />
      <main className="min-h-screen bg-background">
        <AdminLoginInteractive />
      </main>
    </>
  );
}
