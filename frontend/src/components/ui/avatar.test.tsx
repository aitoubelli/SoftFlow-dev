import { render, screen } from '@testing-library/react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';

describe('Avatar', () => {

  it('renders fallback when image fails', () => {
    render(
      <Avatar>
        <AvatarImage src="broken.jpg" alt="Test" />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    );

    expect(screen.getByText('AB')).toBeInTheDocument();
  });

  it('renders fallback only', () => {
    render(
      <Avatar>
        <AvatarFallback>CD</AvatarFallback>
      </Avatar>
    );

    expect(screen.getByText('CD')).toBeInTheDocument();
  });
});
