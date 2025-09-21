import {
  HStack,
  Button,
  Text,
  IconButton,
  Select,
  useColorModeValue,
  Box,
  useBreakpointValue
} from '@chakra-ui/react'
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons'

const PaginationControls = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [10, 20, 50, 100],
  isLoading = false
}) => {
  const isMobile = useBreakpointValue({ base: true, md: false })

  // Color mode values
  const bg = useColorModeValue('white', 'neutral.800')
  const borderColor = useColorModeValue('neutral.200', 'neutral.700')
  const textColor = useColorModeValue('neutral.600', 'neutral.300')
  const activeColor = useColorModeValue('accent.500', 'accent.400')

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const getVisiblePages = () => {
    const maxVisible = isMobile ? 3 : 5
    const start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages, start + maxVisible - 1)
    const adjustedStart = Math.max(1, end - maxVisible + 1)

    return Array.from(
      { length: end - adjustedStart + 1 },
      (_, i) => adjustedStart + i
    )
  }

  const visiblePages = getVisiblePages()

  if (totalPages <= 1) return null

  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      mt={6}
    >
      <HStack justify="space-between" align="center" wrap="wrap" spacing={4}>
        {/* Items info */}
        {!isMobile && (
          <Text fontSize="sm" color={textColor}>
            {startItem}-{endItem} / {totalItems} öğe
          </Text>
        )}

        {/* Page controls */}
        <HStack spacing={1}>
          {/* Previous button */}
          <IconButton
            icon={<ChevronLeftIcon />}
            aria-label="Önceki sayfa"
            size="sm"
            variant="ghost"
            isDisabled={currentPage === 1 || isLoading}
            onClick={() => onPageChange(currentPage - 1)}
          />

          {/* First page */}
          {visiblePages[0] > 1 && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onPageChange(1)}
                isDisabled={isLoading}
              >
                1
              </Button>
              {visiblePages[0] > 2 && (
                <Text fontSize="sm" color={textColor}>
                  ...
                </Text>
              )}
            </>
          )}

          {/* Visible pages */}
          {visiblePages.map((page) => (
            <Button
              key={page}
              size="sm"
              variant={page === currentPage ? 'solid' : 'ghost'}
              colorScheme={page === currentPage ? 'accent' : 'gray'}
              onClick={() => onPageChange(page)}
              isDisabled={isLoading}
              color={page === currentPage ? 'white' : textColor}
              _hover={{
                color: page === currentPage ? 'white' : activeColor
              }}
            >
              {page}
            </Button>
          ))}

          {/* Last page */}
          {visiblePages[visiblePages.length - 1] < totalPages && (
            <>
              {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <Text fontSize="sm" color={textColor}>
                  ...
                </Text>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onPageChange(totalPages)}
                isDisabled={isLoading}
              >
                {totalPages}
              </Button>
            </>
          )}

          {/* Next button */}
          <IconButton
            icon={<ChevronRightIcon />}
            aria-label="Sonraki sayfa"
            size="sm"
            variant="ghost"
            isDisabled={currentPage === totalPages || isLoading}
            onClick={() => onPageChange(currentPage + 1)}
          />
        </HStack>

        {/* Items per page selector */}
        {!isMobile && onItemsPerPageChange && (
          <HStack spacing={2}>
            <Text fontSize="sm" color={textColor} whiteSpace="nowrap">
              Sayfa başına:
            </Text>
            <Select
              size="sm"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              width="auto"
              minW="70px"
              isDisabled={isLoading}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </HStack>
        )}
      </HStack>

      {/* Mobile items info */}
      {isMobile && (
        <Text
          fontSize="xs"
          color={textColor}
          textAlign="center"
          mt={2}
        >
          {startItem}-{endItem} / {totalItems} öğe
        </Text>
      )}
    </Box>
  )
}

export default PaginationControls