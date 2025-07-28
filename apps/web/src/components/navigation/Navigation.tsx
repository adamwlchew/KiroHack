import React, { useState } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAppSelector } from '@/hooks/redux';

const NavContainer = styled.nav`
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 0 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const NavContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #4a6cfa;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LogoIcon = styled.span`
  font-size: 2rem;
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled(Link)<{ active?: boolean }>`
  color: ${props => props.active ? '#4a6cfa' : '#666'};
  text-decoration: none;
  font-weight: ${props => props.active ? '600' : '500'};
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    color: #4a6cfa;
    background: #f0f4ff;
  }
  
  ${props => props.active && `
    background: #f0f4ff;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 2px;
      background: #4a6cfa;
      border-radius: 1px;
    }
  `}
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a6cfa, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const UserMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 0.5rem 0;
  min-width: 200px;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transform: translateY(${props => props.isOpen ? '0' : '-10px'});
  transition: all 0.2s ease;
`;

const UserMenuItem = styled(Link)`
  display: block;
  padding: 0.75rem 1rem;
  color: #333;
  text-decoration: none;
  transition: background 0.2s ease;
  
  &:hover {
    background: #f8f9fa;
  }
`;

const UserMenuDivider = styled.div`
  height: 1px;
  background: #e0e0e0;
  margin: 0.5rem 0;
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileMenu = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 70px;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 1rem;
  transform: translateY(${props => props.isOpen ? '0' : '-100%'});
  transition: transform 0.3s ease;
  z-index: 99;
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const MobileNavLink = styled(Link)<{ active?: boolean }>`
  display: block;
  padding: 1rem;
  color: ${props => props.active ? '#4a6cfa' : '#333'};
  text-decoration: none;
  font-weight: ${props => props.active ? '600' : '500'};
  border-radius: 8px;
  margin-bottom: 0.5rem;
  
  &:hover {
    background: #f8f9fa;
  }
`;

const Navigation: React.FC = () => {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.user);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/learning-paths', label: 'Learning Paths', icon: '📚' },
    { href: '/assessments', label: 'Assessments', icon: '📝' },
    { href: '/progress', label: 'Progress', icon: '📊' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return router.pathname === '/';
    }
    return router.pathname.startsWith(href);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return 'U';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <>
      <NavContainer>
        <NavContent>
          <Logo>
            <LogoIcon>📖</LogoIcon>
            PageFlow
          </Logo>

          <NavLinks>
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                active={isActive(item.href)}
              >
                {item.icon} {item.label}
              </NavLink>
            ))}
          </NavLinks>

          <UserSection>
            <UserAvatar
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              title="User menu"
            >
              {getInitials(user?.firstName, user?.lastName)}
            </UserAvatar>
            
            <UserMenu isOpen={userMenuOpen}>
              <UserMenuItem href="/profile">
                👤 Profile
              </UserMenuItem>
              <UserMenuItem href="/settings">
                ⚙️ Settings
              </UserMenuItem>
              <UserMenuDivider />
              <UserMenuItem href="/logout">
                🚪 Logout
              </UserMenuItem>
            </UserMenu>

            <MobileMenuButton
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </MobileMenuButton>
          </UserSection>
        </NavContent>
      </NavContainer>

      <MobileMenu isOpen={mobileMenuOpen}>
        {navItems.map((item) => (
          <MobileNavLink
            key={item.href}
            href={item.href}
            active={isActive(item.href)}
            onClick={() => setMobileMenuOpen(false)}
          >
            {item.icon} {item.label}
          </MobileNavLink>
        ))}
        <MobileNavLink href="/profile" onClick={() => setMobileMenuOpen(false)}>
          👤 Profile
        </MobileNavLink>
        <MobileNavLink href="/settings" onClick={() => setMobileMenuOpen(false)}>
          ⚙️ Settings
        </MobileNavLink>
        <MobileNavLink href="/logout" onClick={() => setMobileMenuOpen(false)}>
          🚪 Logout
        </MobileNavLink>
      </MobileMenu>
    </>
  );
};

export default Navigation; 