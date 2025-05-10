import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState, useCallback } from "react";
import { Assignment } from "@/utils/trpc";
import { toast } from "sonner";

import { useInstructor } from "@/hooks/useInstructor";
import { useCreateAssignment } from "../hooks/useCreateAssignment";
import { useGradeAssignment } from "../hooks/useGradeAssignment";
import MarkAssignmentModal, {
  Grade,
} from "@/components/ui/MarkAssignmentModal";
import GivenAssignment from "../_components/GivenAssignment";
import SubmittedAssignment from "../_components/SubmittedAssignment";
import AssignmentFromAdmin from "../_components/AssignmentFromAdmin";

export default function AssignmentDashboard() {
  const { instructor } = useInstructor();
  const { createAssignment, isCreatingAssignment } = useCreateAssignment();
  const { isGradingStudent, gradeStudent } = useGradeAssignment();

  const courses = instructor.courses as {
    _id: string;
    title: string;
  }[];

  // Modal state
  const [selected, setSelected] = useState<Assignment | null>(null);
  const closeModal = useCallback(() => setSelected(null), []);
  const openModal = useCallback(
    (assignment: Assignment) => setSelected(assignment),
    [],
  );

  const handleGrade = (id: string, grade: Grade, remark: string) => {
    gradeStudent({
      assignmentId: id,
      grade: grade!,
      ...(remark && { remark }),
    });
    toast.success("Assignment graded successfully");
    closeModal();
  };

  // New assignment state
  const [newTitle, setNewTitle] = useState<string>("");
  const [newCourse, setNewCourse] = useState<string>(
    instructor.courses[0]?._id.toString() || "",
  );
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [newQuestion, setNewQuestion] = useState<string>("");

  const handleCreate = () => {
    if (!newTitle || !newCourse || !newDueDate || !newQuestion) {
      toast.info("All fields are required");
      return;
    }
    createAssignment(
      {
        title: newTitle,
        course: newCourse,
        dueDate: new Date(newDueDate),
        question: newQuestion,
      },
      {
        onSuccess: () => {
          toast.success("Assignment created");
          setNewTitle("");
          setNewDueDate("");
          setNewQuestion("");
        },
      },
    );
  };

  return (
    <div className="container mx-auto rounded-lg bg-white p-6 shadow dark:bg-gray-900">
      <div className="mb-5 space-y-0.5">
        <h1 className="text-3xl font-bold md:text-4xl">Manage Assignments</h1>
        <p className="text-gray-600 dark:text-gray-300">
          View, search, and grade submitted assignments.
        </p>
      </div>

      <main className="space-y-20 py-7">
        <GivenAssignment />
        <SubmittedAssignment onOpenModal={openModal} />
        <AssignmentFromAdmin />
      </main>

      {/* Create Assignment */}
      <div className="mt-8 rounded-lg bg-gray-50 p-6 shadow dark:bg-gray-800">
        <h2 className="mb-4 text-2xl font-semibold">Create New Assignment</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="new-title">Title</Label>
            <Input
              id="new-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Assignment title"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="new-course">Course</Label>
            <Select value={newCourse} onValueChange={setNewCourse}>
              <SelectTrigger id="new-course">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c._id.toString()} value={c._id.toString()}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="new-due-date">Due Date</Label>
            <Input
              id="new-due-date"
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col space-y-2 md:col-span-3">
            <Label htmlFor="new-question">Question</Label>
            <Textarea
              id="new-question"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Enter assignment question"
              rows={4}
            />
          </div>
        </div>
        <Button
          className="mt-4"
          variant="secondary"
          onClick={handleCreate}
          disabled={isCreatingAssignment}
        >
          {isCreatingAssignment ? "Creating..." : "Create Assignment"}
        </Button>
      </div>

      {/* Grading Modal */}
      {selected && (
        <MarkAssignmentModal
          assignment={selected}
          isOpen={Boolean(selected)}
          onClose={closeModal}
          onGradeSubmitted={handleGrade}
          isGrading={isGradingStudent}
        />
      )}
    </div>
  );
}
