import { render, screen } from '@testing-library/react';
import { UserRoleBadge } from './UserRoleBadge';
import { ROLES } from '@/utils/roles';

describe('UserRoleBadge', () => {
  it('renders admin role with shield icon and destructive badge', () => {
    render(<UserRoleBadge role={ROLES.ADMIN} />);
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
  });

  it('renders owner role with crown icon and default badge', () => {
    render(<UserRoleBadge role={ROLES.OWNER} />);
    expect(screen.getByText('owner')).toBeInTheDocument();
    expect(screen.getByTestId('crown-icon')).toBeInTheDocument();
  });

  it('renders developer role with code icon and secondary badge', () => {
    render(<UserRoleBadge role={ROLES.DEVELOPER} />);
    expect(screen.getByText('dev')).toBeInTheDocument();
    expect(screen.getByTestId('code-icon')).toBeInTheDocument();
  });
});
