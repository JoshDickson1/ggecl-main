import { trpc } from "@/utils/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useEnrollInstructor() {
  const queryClient = useQueryClient();
  const { mutate: enrollInstructor, isPending: isEnrolling } = useMutation(
    trpc.instructor.enroll.mutationOptions({
      onSuccess: ({ instructor }) => {
        toast.success(
          `Instructor ${instructor.fullName} has been enrolled successfully`,
        );

        queryClient.invalidateQueries({
          queryKey: trpc.cart.getAllItems.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.instructor.getAll.queryKey(),
        });
        
        queryClient.invalidateQueries({
          queryKey: trpc.instructor.getById.queryKey(),
        });
      },
      onError: (err) => {
        toast.error(err.message);
      },
    }),
  );

  return { enrollInstructor, isEnrolling };
}
