import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationProvider, useNotification } from '../NotificationContext';
import { ReactNode } from 'react';

// Test component to use the notification context
function TestComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useNotification();

  return (
    <div>
      <button onClick={() => showSuccess('Success message')} data-testid="success-btn">
        Show Success
      </button>
      <button onClick={() => showError('Error message')} data-testid="error-btn">
        Show Error
      </button>
      <button onClick={() => showWarning('Warning message')} data-testid="warning-btn">
        Show Warning
      </button>
      <button onClick={() => showInfo('Info message')} data-testid="info-btn">
        Show Info
      </button>
    </div>
  );
}

function renderWithNotificationProvider(ui: ReactNode) {
  return render(
    <NotificationProvider>
      {ui}
    </NotificationProvider>
  );
}

describe('NotificationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    renderWithNotificationProvider(<TestComponent />);
    expect(screen.getByTestId('success-btn')).toBeInTheDocument();
  });

  it('should show success notification', async () => {
    const user = userEvent.setup();
    renderWithNotificationProvider(<TestComponent />);
    
    await user.click(screen.getByTestId('success-btn'));
    
    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });
  });

  it('should show error notification', async () => {
    const user = userEvent.setup();
    renderWithNotificationProvider(<TestComponent />);
    
    await user.click(screen.getByTestId('error-btn'));
    
    await waitFor(() => {
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  it('should show warning notification', async () => {
    const user = userEvent.setup();
    renderWithNotificationProvider(<TestComponent />);
    
    await user.click(screen.getByTestId('warning-btn'));
    
    await waitFor(() => {
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });
  });

  it('should show info notification', async () => {
    const user = userEvent.setup();
    renderWithNotificationProvider(<TestComponent />);
    
    await user.click(screen.getByTestId('info-btn'));
    
    await waitFor(() => {
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });
  });

  it('should auto-hide notifications after duration', async () => {
    const user = userEvent.setup();
    renderWithNotificationProvider(<TestComponent />);
    
    await user.click(screen.getByTestId('success-btn'));
    
    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    // Wait for auto-hide (default 6 seconds)
    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    }, { timeout: 7000 });
  });

  it('should allow manual dismissal of notifications', async () => {
    const user = userEvent.setup();
    renderWithNotificationProvider(<TestComponent />);
    
    await user.click(screen.getByTestId('success-btn'));
    
    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    // Find and click the close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    });
  });

  it('should handle multiple notifications', async () => {
    const user = userEvent.setup();
    renderWithNotificationProvider(<TestComponent />);
    
    await user.click(screen.getByTestId('success-btn'));
    await user.click(screen.getByTestId('error-btn'));
    
    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  it('should throw error when used outside provider', () => {
    // Temporarily suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useNotification must be used within a NotificationProvider');

    console.error = originalError;
  });
});
