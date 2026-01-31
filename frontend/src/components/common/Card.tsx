import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  gradient?: boolean;
}

export function Card({ children, className = '', onClick, hoverable = false, gradient = false }: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-xl border border-gray-200/60
        shadow-soft
        ${hoverable ? 'hover:shadow-soft-lg hover:border-gray-300/80 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer' : ''}
        ${gradient ? 'bg-gradient-to-br from-white to-gray-50/50' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function CardHeader({ children, className = '', action }: CardHeaderProps) {
  return (
    <div className={`px-6 py-4 border-b border-gray-100 ${className}`}>
      {action ? (
        <div className="flex items-center justify-between">
          <div>{children}</div>
          <div>{action}</div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl ${className}`}>
      {children}
    </div>
  );
}
