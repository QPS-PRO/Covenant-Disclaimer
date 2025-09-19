import React from 'react';
import { Button, IconButton, Typography } from "@material-tailwind/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const PaginationComponent = ({
    currentPage = 1,
    totalPages = 1,
    totalCount = 0,
    pageSize = 20,
    hasNext = false,
    hasPrevious = false,
    onPageChange,
    loading = false,
    showPageInfo = true,
    maxVisiblePages = 5,
    size = "sm"
}) => {
    // Calculate page range to display
    const calculatePageRange = (current, total, maxVisible = maxVisiblePages) => {
        const half = Math.floor(maxVisible / 2);
        let start = Math.max(1, current - half);
        let end = Math.min(total, start + maxVisible - 1);
        
        // Adjust start if we're near the end
        if (end - start + 1 < maxVisible && total >= maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        
        const pages = [];
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        
        return { pages, start, end };
    };

    const { pages, start, end } = calculatePageRange(currentPage, totalPages);
    
    // Calculate display range
    const startRecord = ((currentPage - 1) * pageSize) + 1;
    const endRecord = Math.min(currentPage * pageSize, totalCount);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages && page !== currentPage && !loading) {
            onPageChange(page);
        }
    };

    const handlePrevious = () => {
        if (hasPrevious && !loading) {
            handlePageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (hasNext && !loading) {
            handlePageChange(currentPage + 1);
        }
    };

    // Don't render if there's only one page or no data
    if (totalPages <= 1 || totalCount === 0) {
        return showPageInfo && totalCount > 0 ? (
            <div className="flex justify-center py-4">
                <Typography variant="small" color="gray" className="font-normal">
                    Showing {totalCount} result{totalCount !== 1 ? 's' : ''}
                </Typography>
            </div>
        ) : null;
    }

    return (
        <div className="flex items-center justify-between border-t border-blue-gray-50 p-4">
            {/* Page Info */}
            {showPageInfo && (
                <div className="flex items-center gap-2">
                    <Typography variant="small" color="gray" className="font-normal">
                        Showing {startRecord} to {endRecord} of {totalCount} results
                    </Typography>
                </div>
            )}

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
                {/* Previous Button */}
                <IconButton
                    size={size}
                    variant="outlined"
                    disabled={!hasPrevious || loading}
                    onClick={handlePrevious}
                >
                    <ChevronLeftIcon strokeWidth={2} className="h-4 w-4" />
                </IconButton>

                {/* Show first page if not in range */}
                {start > 1 && (
                    <>
                        <IconButton
                            size={size}
                            variant={currentPage === 1 ? "filled" : "text"}
                            color={currentPage === 1 ? "gray" : "blue-gray"}
                            onClick={() => handlePageChange(1)}
                            disabled={loading}
                        >
                            1
                        </IconButton>
                        {start > 2 && (
                            <Typography variant="small" color="gray" className="mx-1">
                                ...
                            </Typography>
                        )}
                    </>
                )}

                {/* Page Numbers */}
                {pages.map((page) => (
                    <IconButton
                        key={page}
                        size={size}
                        variant={currentPage === page ? "filled" : "text"}
                        color={currentPage === page ? "gray" : "blue-gray"}
                        onClick={() => handlePageChange(page)}
                        disabled={loading}
                    >
                        {page}
                    </IconButton>
                ))}

                {/* Show last page if not in range */}
                {end < totalPages && (
                    <>
                        {end < totalPages - 1 && (
                            <Typography variant="small" color="gray" className="mx-1">
                                ...
                            </Typography>
                        )}
                        <IconButton
                            size={size}
                            variant={currentPage === totalPages ? "filled" : "text"}
                            color={currentPage === totalPages ? "gray" : "blue-gray"}
                            onClick={() => handlePageChange(totalPages)}
                            disabled={loading}
                        >
                            {totalPages}
                        </IconButton>
                    </>
                )}

                {/* Next Button */}
                <IconButton
                    size={size}
                    variant="outlined"
                    disabled={!hasNext || loading}
                    onClick={handleNext}
                >
                    <ChevronRightIcon strokeWidth={2} className="h-4 w-4" />
                </IconButton>
            </div>
        </div>
    );
};

export default PaginationComponent;