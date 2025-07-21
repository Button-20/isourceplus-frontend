import React from "react";

const Pagination = ({ count, page, setPage, next, previous }) => {
  const itemsPerPage = 10; // Assuming 10 items per page, adjust if different
  const totalPages = Math.ceil(count / itemsPerPage);
  const pageNumbers = [];

  // Generate page numbers (show up to 5 pages around the current page)
  const maxPagesToShow = 5;
  const startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="flex justify-center items-center mt-6 space-x-2">
      <button
        onClick={() => handlePageChange(page - 1)}
        disabled={!previous}
        className={`py-2 px-4 rounded-md text-sm font-medium ${
          previous
            ? "bg-indigo-600 text-white hover:bg-indigo-700"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        } transition duration-200`}
      >
        Previous
      </button>
      {pageNumbers.map((pageNum) => (
        <button
          key={pageNum}
          onClick={() => handlePageChange(pageNum)}
          className={`py-2 px-4 rounded-md text-sm font-medium ${
            page === pageNum
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          } transition duration-200`}
        >
          {pageNum}
        </button>
      ))}
      <button
        onClick={() => handlePageChange(page + 1)}
        disabled={!next}
        className={`py-2 px-4 rounded-md text-sm font-medium ${
          next
            ? "bg-indigo-600 text-white hover:bg-indigo-700"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        } transition duration-200`}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;