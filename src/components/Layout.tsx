import { NavLink } from 'react-router-dom';
import { User, ClipboardList, Stethoscope, ListTodo, Activity, DollarSign, FileText } from 'lucide-react';
import clsx from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/identificacao', label: 'ID', icon: User },
  { path: '/avaliacao', label: 'Avaliação', icon: ClipboardList },
  { path: '/exames', label: 'Exames', icon: Stethoscope },
  { path: '/plano', label: 'Plano', icon: ListTodo },
  { path: '/sessoes', label: 'Sessões', icon: Activity },
  { path: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { path: '/relatorios', label: 'Relatórios', icon: FileText },
];

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20 md:pb-0 md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-dark">FisioVet App</h1>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-4">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                      isActive
                        ? 'bg-purple-100 text-purple-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-100'
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <div className="md:hidden bg-white p-4 border-b border-gray-200 sticky top-0 z-10">
          <h1 className="text-lg font-bold text-center text-primary-dark">FisioVet</h1>
        </div>
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-2 pb-safe">
        <ul className="flex justify-between">
          {navItems.map((item) => (
            <li key={item.path} className="flex-1">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  clsx(
                    'flex flex-col items-center justify-center w-full h-16 transition-colors',
                    isActive ? 'text-purple-600' : 'text-gray-500'
                  )
                }
              >
                <item.icon className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium truncate w-full text-center px-1">
                  {item.label}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
