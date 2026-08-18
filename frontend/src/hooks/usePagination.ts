import { useState, useEffect } from "react";

export function usePagination<T>(
  data: T[],
  defaultPageSize: number = 10,
  resetKey?: unknown,
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  const paginatedData = data.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // Reset to page 1 whenever resetKey or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [resetKey, pageSize]);

  const nextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));
  const prevPage = () => setCurrentPage((p) => Math.max(1, p - 1));

  return {
    currentPage,
    totalPages,
    pageSize,
    setPageSize,
    paginatedData,
    nextPage,
    prevPage,
    setCurrentPage,
  };
}