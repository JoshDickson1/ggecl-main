import { trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function useGradeAssignment() {
  const { mutate: gradeStudent, isPending: isGradingStudent } = useMutation(
    trpc.assignment.mark.mutationOptions({
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );
  return { gradeStudent, isGradingStudent };
}
