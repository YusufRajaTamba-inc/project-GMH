import React, { useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  itemName?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [5, 10, 25, 50],
  onPageChange,
  onPageSizeChange,
  itemName = 'data',
  className = '',
}) => {
  if (totalItems === 0) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Ensure current pageSize is included in options and sorted
  const mergedOptions = useMemo(() => {
    const opts = new Set(pageSizeOptions);
    if (pageSize) opts.add(pageSize);
    return Array.from(opts).sort((a, b) => a - b);
  }, [pageSizeOptions, pageSize]);

  // Generate visible page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    return pages;
  };

  const isSinglePage = totalPages <= 1;

  const handlePageSizeSelect = (newSize: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    }
    onPageChange(1);
  };

  return (
    <div
      className={`pagination-container ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '12px 18px',
        background: '#fafbfc',
        borderTop: '1px solid var(--gmh-border, #e2e8f0)',
        fontSize: 13,
        color: 'var(--gmh-text-muted, #64748b)',
        borderBottomLeftRadius: 'inherit',
        borderBottomRightRadius: 'inherit',
      }}
    >
      {/* Left: Item Counter & Page Size Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Menampilkan</span>
          <span
            style={{
              fontWeight: 700,
              color: 'var(--gmh-text, #0f172a)',
              background: '#ffffff',
              padding: '2px 8px',
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              fontSize: 12.5,
            }}
          >
            {startItem} – {endItem}
          </span>
          <span>dari</span>
          <span style={{ fontWeight: 700, color: 'var(--gmh-text, #0f172a)' }}>
            {totalItems}
          </span>
          <span>{itemName}</span>
        </div>

        {onPageSizeChange && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              paddingLeft: 10,
              borderLeft: '1px solid #e2e8f0',
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--gmh-text-muted, #64748b)' }}>Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeSelect(Number(e.target.value))}
              style={{
                width: 'auto',
                padding: '4px 24px 4px 10px',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--gmh-text, #0f172a)',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 7,
                height: 30,
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              {mergedOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / hal
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Page Navigation Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {isSinglePage ? (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#64748b',
              background: '#f1f5f9',
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid #e2e8f0',
              letterSpacing: 0.2,
            }}
          >
            Halaman 1 dari 1
          </span>
        ) : (
          <>
            {/* First Page (only shown if totalPages >= 6) */}
            {totalPages >= 6 && (
              <button
                type="button"
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => onPageChange(1)}
                title="Halaman Pertama"
                style={{
                  width: 32,
                  height: 32,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 7,
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: currentPage === 1 ? '#cbd5e1' : '#475569',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.45 : 1,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease',
                }}
              >
                <ChevronsLeft size={14} />
              </button>
            )}

            {/* Previous Page */}
            <button
              type="button"
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              title="Halaman Sebelumnya"
              style={{
                height: 32,
                padding: '0 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                borderRadius: 7,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: currentPage === 1 ? '#cbd5e1' : '#334155',
                fontSize: 12.5,
                fontWeight: 500,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.45 : 1,
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease',
              }}
            >
              <ChevronLeft size={14} />
              <span className="pagination-btn-text">Sebelumnya</span>
            </button>

            {/* Numbered Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {getPageNumbers().map((p, idx) => {
                if (p === '...') {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      style={{
                        width: 28,
                        height: 32,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8',
                        fontSize: 13,
                        userSelect: 'none',
                        letterSpacing: 1,
                      }}
                    >
                      •••
                    </span>
                  );
                }

                const pageNum = Number(p);
                const isActive = pageNum === currentPage;

                return (
                  <button
                    key={`page-${pageNum}`}
                    type="button"
                    className={isActive ? '' : 'pagination-btn'}
                    onClick={() => onPageChange(pageNum)}
                    style={{
                      minWidth: 32,
                      height: 32,
                      padding: '0 8px',
                      borderRadius: 7,
                      fontSize: 12.5,
                      fontWeight: isActive ? 700 : 500,
                      border: isActive ? '1px solid var(--gmh-green, #1B4332)' : '1px solid #e2e8f0',
                      background: isActive ? 'var(--gmh-green, #1B4332)' : '#ffffff',
                      color: isActive ? '#ffffff' : '#334155',
                      cursor: isActive ? 'default' : 'pointer',
                      boxShadow: isActive
                        ? '0 2px 4px rgba(27, 67, 50, 0.25)'
                        : '0 1px 2px rgba(0,0,0,0.03)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Next Page */}
            <button
              type="button"
              className="pagination-btn"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              title="Halaman Berikutnya"
              style={{
                height: 32,
                padding: '0 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                borderRadius: 7,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: currentPage >= totalPages ? '#cbd5e1' : '#334155',
                fontSize: 12.5,
                fontWeight: 500,
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage >= totalPages ? 0.45 : 1,
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease',
              }}
            >
              <span className="pagination-btn-text">Berikutnya</span>
              <ChevronRight size={14} />
            </button>

            {/* Last Page (only shown if totalPages >= 6) */}
            {totalPages >= 6 && (
              <button
                type="button"
                className="pagination-btn"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(totalPages)}
                title="Halaman Terakhir"
                style={{
                  width: 32,
                  height: 32,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 7,
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: currentPage >= totalPages ? '#cbd5e1' : '#475569',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage >= totalPages ? 0.45 : 1,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease',
                }}
              >
                <ChevronsRight size={14} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
