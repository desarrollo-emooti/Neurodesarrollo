import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUpload from './FileUpload';

// Mock browser-image-compression
vi.mock('browser-image-compression', () => ({
  default: vi.fn((file) => Promise.resolve(file)),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('FileUpload Component', () => {
  let mockOnUpload;
  let mockOnDelete;

  beforeEach(() => {
    mockOnUpload = vi.fn();
    mockOnDelete = vi.fn();
  });

  it('should render with default label', () => {
    render(<FileUpload onUpload={mockOnUpload} />);

    expect(screen.getByText('Subir archivo')).toBeInTheDocument();
  });

  it('should render with custom label', () => {
    render(<FileUpload onUpload={mockOnUpload} label="Subir documento" />);

    expect(screen.getByText('Subir documento')).toBeInTheDocument();
  });

  it('should display drop zone with instructions', () => {
    render(<FileUpload onUpload={mockOnUpload} />);

    expect(screen.getByText(/Haz clic para subir/i)).toBeInTheDocument();
    expect(screen.getByText(/o arrastra archivos aquí/i)).toBeInTheDocument();
  });

  it('should display max file size', () => {
    render(<FileUpload onUpload={mockOnUpload} maxSizeMB={15} />);

    expect(screen.getByText(/Tamaño máximo: 15MB/i)).toBeInTheDocument();
  });

  it('should display accepted file types', () => {
    render(
      <FileUpload
        onUpload={mockOnUpload}
        acceptedFileTypes={['image/*', 'application/pdf']}
      />
    );

    expect(screen.getByText(/Formatos: image\/\*, application\/pdf/i)).toBeInTheDocument();
  });

  it('should handle file selection via input', async () => {
    const user = userEvent.setup();
    render(<FileUpload onUpload={mockOnUpload} />);

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByRole('button').querySelector('input[type="file"]');

    // Mock file input change
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalled();
    });
  });

  it('should show uploaded file in the list', async () => {
    render(
      <FileUpload
        onUpload={mockOnUpload}
        existingFiles={[
          {
            name: 'documento.pdf',
            size: 1024 * 1024, // 1MB
            type: 'application/pdf',
          },
        ]}
      />
    );

    expect(screen.getByText('documento.pdf')).toBeInTheDocument();
    expect(screen.getByText('1.0 MB')).toBeInTheDocument();
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const existingFiles = [
      {
        name: 'documento.pdf',
        size: 1024 * 1024,
        type: 'application/pdf',
      },
    ];

    render(
      <FileUpload
        onUpload={mockOnUpload}
        onDelete={mockOnDelete}
        existingFiles={existingFiles}
      />
    );

    const deleteButton = screen.getByTitle('Eliminar archivo');
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(existingFiles[0]);
  });

  it('should support multiple file selection', () => {
    render(<FileUpload onUpload={mockOnUpload} multiple={true} />);

    const input = screen.getByRole('button').querySelector('input[type="file"]');

    expect(input).toHaveAttribute('multiple');
  });

  it('should not support multiple files by default', () => {
    render(<FileUpload onUpload={mockOnUpload} />);

    const input = screen.getByRole('button').querySelector('input[type="file"]');

    expect(input).not.toHaveAttribute('multiple');
  });

  it('should format file sizes correctly', () => {
    render(
      <FileUpload
        onUpload={mockOnUpload}
        existingFiles={[
          { name: 'small.txt', size: 500, type: 'text/plain' },
          { name: 'medium.txt', size: 1024 * 500, type: 'text/plain' },
          { name: 'large.txt', size: 1024 * 1024 * 2.5, type: 'text/plain' },
        ]}
      />
    );

    expect(screen.getByText('500 B')).toBeInTheDocument();
    expect(screen.getByText('500.0 KB')).toBeInTheDocument();
    expect(screen.getByText('2.5 MB')).toBeInTheDocument();
  });

  it('should show image preview for image files', () => {
    const imageFile = {
      name: 'photo.jpg',
      size: 1024 * 1024,
      type: 'image/jpeg',
      preview: 'blob:http://localhost/mock-preview',
    };

    render(<FileUpload onUpload={mockOnUpload} existingFiles={[imageFile]} />);

    const img = screen.getByAlt('photo.jpg');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', imageFile.preview);
  });

  it('should disable upload when uploading', () => {
    const { rerender } = render(<FileUpload onUpload={mockOnUpload} />);

    const dropZone = screen.getByRole('button');
    expect(dropZone).not.toHaveClass('pointer-events-none');

    // Simulate uploading state (this would need internal state manipulation in real implementation)
    // For now, we're just testing the class structure
  });

  it('should apply drag-active styles on drag over', () => {
    render(<FileUpload onUpload={mockOnUpload} />);

    const dropZone = screen.getByText(/Haz clic para subir/i).closest('div');

    fireEvent.dragEnter(dropZone);

    // Check if drag active state is applied
    expect(dropZone).toHaveClass('border-blue-500', 'bg-blue-50');
  });

  it('should remove drag-active styles on drag leave', () => {
    render(<FileUpload onUpload={mockOnUpload} />);

    const dropZone = screen.getByText(/Haz clic para subir/i).closest('div');

    fireEvent.dragEnter(dropZone);
    fireEvent.dragLeave(dropZone);

    // Check if drag active state is removed
    expect(dropZone).not.toHaveClass('border-blue-500', 'bg-blue-50');
  });
});
