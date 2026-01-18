import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-dark-900 text-cream shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">League</span>
            <img
              src="/league-genius-logo.png"
              alt="League Genius"
              className="h-[45px] w-[45px]"
            />
            <span className="font-bold text-xl">Genius</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link
              to="/"
              className={`hover:text-primary-300 transition-colors ${
                isActive("/") ? "text-primary font-medium" : ""
              }`}
            >
              Home
            </Link>
            <Link
              to="/leagues"
              className={`hover:text-primary-300 transition-colors ${
                isActive("/leagues") ? "text-primary font-medium" : ""
              }`}
            >
              Leagues
            </Link>
            {/* 
            <Link
              to="/players"
              className={`hover:text-primary-300 transition-colors ${
                isActive("/players") ? "text-primary font-medium" : ""
              }`}
            >
              Players
            </Link> */}
            {/* <Link
              to="/register"
              className={`hover:text-primary-300 transition-colors ${
                isActive("/register") ? "text-primary font-medium" : ""
              }`}
            >
              Register Team
            </Link> */}
            {/* <Link
              to="/score-entry"
              className={`hover:text-primary-300 transition-colors ${
                isActive("/score-e
                ntry") ? "text-primary font-medium" : ""
              }`}
            >
              Submit Scores
            </Link> */}
            {user ? (
              <>
                <Link
                  to="/admin/dashboard"
                  className="hover:text-primary-300 transition-colors"
                >
                  Admin
                </Link>
                <button
                  onClick={logout}
                  className="hover:text-primary-300 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className={`hover:text-primary-300 transition-colors ${
                  isActive("/login") ? "text-primary font-medium" : ""
                }`}
              >
                Login
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-cream focus:outline-none"
            onClick={toggleMenu}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-3 slide-in">
            <Link
              to="/"
              className={`block py-2 hover:text-primary-300 transition-colors ${
                isActive("/") ? "text-primary font-medium" : ""
              }`}
              onClick={toggleMenu}
            >
              Home
            </Link>
            <Link
              to="/leagues"
              className={`block py-2 hover:text-primary-300 transition-colors ${
                isActive("/leagues") ? "text-primary font-medium" : ""
              }`}
              onClick={toggleMenu}
            >
              Leagues
            </Link>
            <Link
              to="/players"
              className={`block py-2 hover:text-primary-300 transition-colors ${
                isActive("/players") ? "text-primary font-medium" : ""
              }`}
              onClick={toggleMenu}
            >
              Players
            </Link>
            {/* <Link
              to="/register"
              className={`block py-2 hover:text-primary-300 transition-colors ${
                isActive("/register") ? "text-primary font-medium" : ""
              }`}
              onClick={toggleMenu}
            >
              Register Team
            </Link> */}
            {/* <Link
              to="/score-entry"
              className={`block py-2 hover:text-primary-300 transition-colors ${
                isActive("/score-entry") ? "text-primary font-medium" : ""
              }`}
              onClick={toggleMenu}
            >
              Submit Scores
            </Link> */}
            {user ? (
              <>
                <Link
                  to="/admin/dashboard"
                  className="block py-2 hover:text-primary-300 transition-colors"
                  onClick={toggleMenu}
                >
                  Admin
                </Link>
                <button
                  onClick={() => {
                    logout();
                    toggleMenu();
                  }}
                  className="block py-2 hover:text-primary-300 transition-colors w-full text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className={`block py-2 hover:text-primary-300 transition-colors ${
                  isActive("/login") ? "text-primary font-medium" : ""
                }`}
                onClick={toggleMenu}
              >
                Login
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
