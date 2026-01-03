import { Link } from 'react-router-dom';
import { Gamepad2, Trophy, Coins, User, LogOut, Menu, X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export function Header() {
  const { user, profile, signOut, hasRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = hasRole('admin');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
            <Gamepad2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-gradient-primary">REVALLO</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">Admin</span>
                </Link>
              )}
              <Link to="/my-tournaments" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <Trophy className="h-4 w-4" />
                <span className="font-medium">Meus Torneios</span>
              </Link>
              <Link to="/credits" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <Coins className="h-4 w-4" />
                <span className="font-medium">{profile?.credits ?? 0} créditos</span>
              </Link>
              <Link to="/profile" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <User className="h-4 w-4" />
                <span className="font-medium">{profile?.nickname ?? 'Perfil'}</span>
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button className="bg-gradient-primary hover:opacity-90 glow-primary font-semibold">
                Entrar
              </Button>
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container py-4 flex flex-col gap-4">
            {user ? (
              <>
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">Admin</span>
                  </Link>
                )}
                <Link 
                  to="/my-tournaments" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Trophy className="h-4 w-4" />
                  <span className="font-medium">Meus Torneios</span>
                </Link>
                <Link 
                  to="/credits" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Coins className="h-4 w-4" />
                  <span className="font-medium">{profile?.credits ?? 0} créditos</span>
                </Link>
                <Link 
                  to="/profile" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  <span className="font-medium">{profile?.nickname ?? 'Perfil'}</span>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { signOut(); setMobileMenuOpen(false); }}
                  className="justify-start text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-gradient-primary hover:opacity-90 glow-primary font-semibold">
                  Entrar
                </Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
