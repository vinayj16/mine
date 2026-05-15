import apiService from './api';
import { API_ENDPOINTS } from '../config/api';

// Types
export interface Book {
  id: string;
  title: string;
  isbn: string;
  authors: string[];
  publisher: string;
  publicationDate: string;
  category: string;
  edition: string;
  pages: number;
  language: string;
  description: string;
  keywords: string[];
  totalCopies: number;
  availableCopies: number;
  status: 'available' | 'borrowed' | 'reserved' | 'lost' | 'damaged';
  location: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface Author {
  id: string;
  name: string;
  biography: string;
  nationality: string;
  birthDate: string;
  deathDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Borrowing {
  id: string;
  book: string;
  borrower: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'borrowed' | 'returned' | 'overdue' | 'renewed';
  fineAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Fine {
  id: string;
  borrowing: string;
  amount: number;
  reason: string;
  status: 'pending' | 'paid';
  paidDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookInput {
  title: string;
  isbn: string;
  authors: string[];
  publisher: string;
  publicationDate: string;
  category: string;
  edition: string;
  pages: number;
  language: string;
  description: string;
  keywords: string[];
  totalCopies: number;
  location: string;
  price: number;
}

export interface UpdateBookInput extends Partial<CreateBookInput> {
  status?: 'available' | 'borrowed' | 'reserved' | 'lost' | 'damaged';
}

export interface CreateAuthorInput {
  name: string;
  biography: string;
  nationality: string;
  birthDate: string;
  deathDate?: string;
}

export interface CreateCategoryInput {
  name: string;
  description: string;
}

export interface IssueBookInput {
  bookId: string;
  borrowerId: string;
  dueDate: string;
}

export interface ReturnBookInput {
  fineAmount?: number;
  fineReason?: string;
}

export interface SearchParams {
  q?: string;
  category?: string;
  author?: string;
  status?: string;
  language?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LibraryFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Functions
export const libraryService = {
  // Books Management
  async getBooks(filters: LibraryFilters = {}): Promise<PaginatedResponse<Book>> {
    try {
      const params = {
        page: filters.page || 1,
        limit: filters.limit || 10,
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.status && { status: filters.status }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
      };

      const response = await apiService.get<PaginatedResponse<Book>>(
        API_ENDPOINTS.LIBRARY.BOOKS.LIST,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch books');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Library Service] Failed to fetch books:', error);
      throw error;
    }
  },

  async getBookById(id: string): Promise<Book> {
    try {
      const response = await apiService.get<Book>(
        API_ENDPOINTS.LIBRARY.BOOKS.DETAIL(id)
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch book');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Library Service] Failed to fetch book:', error);
      throw error;
    }
  },

  async createBook(data: CreateBookInput): Promise<Book> {
    try {
      const response = await apiService.post<Book>(
        API_ENDPOINTS.LIBRARY.BOOKS.CREATE,
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create book');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Library Service] Failed to create book:', error);
      throw error;
    }
  },

  async updateBook(id: string, data: UpdateBookInput): Promise<Book> {
    try {
      const response = await apiService.put<Book>(
        API_ENDPOINTS.LIBRARY.BOOKS.UPDATE(id),
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update book');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Library Service] Failed to update book:', error);
      throw error;
    }
  },

  async deleteBook(id: string): Promise<void> {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(
        API_ENDPOINTS.LIBRARY.BOOKS.DELETE(id)
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete book');
      }
    } catch (error) {
      console.error('[Library Service] Failed to delete book:', error);
      throw error;
    }
  },

  // Authors Management
  async getAuthors(params?: Record<string, unknown>): Promise<Author[]> {
    try {
      const response = await apiService.get<Author[]>(
        API_ENDPOINTS.LIBRARY.AUTHORS.LIST,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch authors');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Library Service] Failed to fetch authors:', error);
      throw error;
    }
  },

  async createAuthor(data: CreateAuthorInput): Promise<Author> {
    try {
      const response = await apiService.post<Author>(
        API_ENDPOINTS.LIBRARY.AUTHORS.CREATE,
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create author');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Library Service] Failed to create author:', error);
      throw error;
    }
  },

  // Categories Management
  async getCategories(params?: Record<string, unknown>): Promise<Category[]> {
    try {
      const response = await apiService.get<Category[]>(
        API_ENDPOINTS.LIBRARY.CATEGORIES.LIST,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch categories');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Library Service] Failed to fetch categories:', error);
      throw error;
    }
  },

  async createCategory(data: CreateCategoryInput): Promise<Category> {
    try {
      const response = await apiService.post<Category>(
        API_ENDPOINTS.LIBRARY.CATEGORIES.CREATE,
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create category');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Library Service] Failed to create category:', error);
      throw error;
    }
  },

  // Borrowing Management
  async issueBook(data: IssueBookInput): Promise<Borrowing> {
    try {
      const response = await apiService.post<Borrowing>(
        API_ENDPOINTS.LIBRARY.BORROWINGS.ISSUE,
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to issue book');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Library Service] Failed to issue book:', error);
      throw error;
    }
  },

  async returnBook(id: string, data?: ReturnBookInput): Promise<Borrowing> {
    try {
      const response = await apiService.put<Borrowing>(
        API_ENDPOINTS.LIBRARY.BORROWINGS.RETURN(id),
        data || {}
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to return book');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Library Service] Failed to return book:', error);
      throw error;
    }
  },

  async renewBook(id: string): Promise<Borrowing> {
    try {
      const response = await apiService.put<Borrowing>(
        API_ENDPOINTS.LIBRARY.BORROWINGS.RENEW(id),
        {}
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to renew book');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Library Service] Failed to renew book:', error);
      throw error;
    }
  },

  async getBorrowings(params?: Record<string, unknown>): Promise<Borrowing[]> {
    try {
      const response = await apiService.get<Borrowing[]>(
        API_ENDPOINTS.LIBRARY.BORROWINGS.LIST,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch borrowings');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Library Service] Failed to fetch borrowings:', error);
      throw error;
    }
  },

  async getMyBorrowings(): Promise<Borrowing[]> {
    try {
      const response = await apiService.get<Borrowing[]>(
        API_ENDPOINTS.LIBRARY.BORROWINGS.MY_BORROWINGS
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch my borrowings');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Library Service] Failed to fetch my borrowings:', error);
      throw error;
    }
  },

  // Fines Management
  async getFines(params?: Record<string, unknown>): Promise<Fine[]> {
    try {
      const response = await apiService.get<Fine[]>(
        API_ENDPOINTS.LIBRARY.FINES.LIST,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch fines');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Library Service] Failed to fetch fines:', error);
      throw error;
    }
  },

  async payFine(id: string): Promise<Fine> {
    try {
      const response = await apiService.put<Fine>(
        API_ENDPOINTS.LIBRARY.FINES.PAY(id),
        {}
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to pay fine');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Library Service] Failed to pay fine:', error);
      throw error;
    }
  },

  // Search
  async searchBooks(params: SearchParams): Promise<Book[]> {
    try {
      const response = await apiService.get<Book[]>(
        API_ENDPOINTS.LIBRARY.SEARCH,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to search books');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Library Service] Failed to search books:', error);
      throw error;
    }
  },

  // Dashboard
  async getDashboard(): Promise<{
    books: { total: number; available: number; borrowed: number };
    borrowings: { active: number; overdue: number };
    fines: { total: number; pending: number };
  }> {
    try {
      const response = await apiService.get<{
        books: { total: number; available: number; borrowed: number };
        borrowings: { active: number; overdue: number };
        fines: { total: number; pending: number };
      }>(API_ENDPOINTS.LIBRARY.DASHBOARD);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch dashboard');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Library Service] Failed to fetch dashboard:', error);
      throw error;
    }
  },

  // Bulk operations
  async bulkDeleteBooks(ids: string[]): Promise<void> {
    try {
      const response = await apiService.post<{ success: boolean; message: string }>(
        `${API_ENDPOINTS.LIBRARY.BOOKS.LIST}/bulk-delete`,
        { ids }
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to bulk delete books');
      }
    } catch (error) {
      console.error('[Library Service] Failed to bulk delete books:', error);
      throw error;
    }
  },

  // Export
  async exportBooksCSV(filters: LibraryFilters = {}): Promise<Blob> {
    try {
      const params = { ...filters, format: 'csv' };
      const response = await apiService.get<Blob>(
        `${API_ENDPOINTS.LIBRARY.BOOKS.LIST}/export`,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to export books as CSV');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Library Service] Failed to export books as CSV:', error);
      throw error;
    }
  },

  async exportBooksPDF(filters: LibraryFilters = {}): Promise<Blob> {
    try {
      const params = { ...filters, format: 'pdf' };
      const response = await apiService.get<Blob>(
        `${API_ENDPOINTS.LIBRARY.BOOKS.LIST}/export`,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to export books as PDF');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Library Service] Failed to export books as PDF:', error);
      throw error;
    }
  },

  // Statistics
  async getStatistics(): Promise<{
    totalBooks: number;
    availableBooks: number;
    borrowedBooks: number;
    totalBorrowings: number;
    activeBorrowings: number;
    overdueBorrowings: number;
    totalFines: number;
    pendingFines: number;
    byCategory: { category: string; count: number }[];
  }> {
    try {
      const response = await apiService.get<{
        totalBooks: number;
        availableBooks: number;
        borrowedBooks: number;
        totalBorrowings: number;
        activeBorrowings: number;
        overdueBorrowings: number;
        totalFines: number;
        pendingFines: number;
        byCategory: { category: string; count: number }[];
      }>(`${API_ENDPOINTS.LIBRARY.BOOKS.LIST}/statistics`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch statistics');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Library Service] Failed to fetch statistics:', error);
      throw error;
    }
  },
};

export default libraryService;