import React from 'react';
import Link from 'next/link';

interface HeaderProps {
  user: { name: string } | null;
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="bg-white shadow">
      <nav className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-blue-600">
            LunchVote
          </Link>
          {user ? (
            <span className="text-gray-600">Welcome, {user.name}</span>
          ) : (
            <Link href="/login" className="text-blue-600">
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

