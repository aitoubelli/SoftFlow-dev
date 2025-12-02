import { render, screen } from '@testing-library/react';
import { Tooltip, TooltipTrigger, TooltipContent } from './tooltip';

describe('Tooltip', () => {
  it('renders tooltip trigger', () => {
    render(
      <Tooltip>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent>Tooltip text</TooltipContent>
      </Tooltip>
    );

    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });
});
