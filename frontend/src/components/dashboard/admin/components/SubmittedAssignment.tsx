import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/hooks/useDebounce";
import { Assignment } from "@/utils/trpc";
import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useISubmittedAssignments } from "../hooks/useISubmittedAssignments";

interface SubmittedAssignmentProps {
  onOpenModal: (assignment: Assignment) => void;
}

function SubmittedAssignment({ onOpenModal }: SubmittedAssignmentProps) {
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);

  const { debouncedValue } = useDebounce(searchTerm);

  const { assignments, meta, loading } = useISubmittedAssignments({
    page: currentPage,
    limit: rowsPerPage,
    search: debouncedValue,
    dueDate: dateFilter,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = meta?.totalPages ?? 1;

  const changePage = useCallback(
    (dir: "prev" | "next") => {
      setCurrentPage((p) =>
        dir === "prev" ? Math.max(1, p - 1) : Math.min(totalPages, p + 1),
      );
    },
    [totalPages],
  );

  return (
    <div>
      <div className="mb-4 flex flex-col items-center gap-4 md:flex-row md:justify-between">
        <div className="flex flex-col gap-3">
          <h1 className="text-xl font-semibold md:text-2xl">
            Submitted Assignments
          </h1>

          <div className="relative">
            <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 md:w-64"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 md:flex-nowrap">
          <Input
            type="date"
            value={dateFilter?.toTimeString()}
            onChange={(e) => setDateFilter(new Date(e.target.value))}
          />
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            {[
              "Title",
              "Course",
              "Due Date",
              "Student",
              "Status",
              "Grade",
              "Action",
            ].map((h) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell className="text-center italic" colSpan={6}>
                Loading...
              </TableCell>
            </TableRow>
          ) : assignments.length > 0 ? (
            assignments.map((a) => (
              <TableRow key={a._id.toString()}>
                <TableCell>{a.title}</TableCell>
                <TableCell>{a.course.title}</TableCell>
                <TableCell>
                  {format(new Date(a.dueDate), "dd-MM-yyyy")}
                </TableCell>
                <TableCell className="capitalize">
                  {a?.studentId?.fullName}
                </TableCell>
                <TableCell className="capitalize">{a.status}</TableCell>
                <TableCell>{a.grade ?? "N/A"}</TableCell>
                <TableCell>
                  {a.status !== "graded" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenModal(a)}
                    >
                      Mark
                    </Button>
                  ) : (
                    <Button color="green" size="sm" variant="ghost" disabled>
                      Graded
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="text-center italic" colSpan={7}>
                No Assignments has been submitted...
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={7}>Total: {assignments.length}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => changePage("prev")}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => changePage("next")}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next
          </Button>
        </div>
        <div>
          Page {currentPage} of {totalPages}
        </div>
        <Select
          value={rowsPerPage.toString()}
          onValueChange={(v) => setRowsPerPage(Number(v))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 20].map((n) => (
              <SelectItem key={n} value={n.toString()}>
                {n} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default SubmittedAssignment;
