import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

export function useISubmittedAssignments({
  page = 1,
  limit = 10,
  search = "",
  dueDate,
}: {
  page?: number;
  limit?: number;
  search?: string;
  dueDate: Date | undefined;
}) {
  const { data, isLoading } = useQuery(
    trpc.assignment.getAllSubmitted.queryOptions({
      page,
      limit,
      search,
      dueDate,
    }),
  );
  return {
    assignments: data?.assignments ?? [],
    meta: data?.meta,
    loading: isLoading,
  };
}
