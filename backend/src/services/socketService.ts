import { Server as IOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { Group, Message } from "../models/messageSchema.js";

interface GroupData {
  admin: string;
  name: string;
  students: string[];
  instructors: string[];
}

interface CreateGroupData {
  groupId: string;
  adminId: string;
  groupName: string;
  students: string[];
  instructors: string[];
}

interface MessageData {
  groupId: string;
  senderId: string;
  sender: string;
  role: "admin" | "student" | "instructor";
  text: string | null;
  image: string | null;
}

export class SocketService {
  private io: IOServer;
  private groups: Record<string, GroupData> = {};

  constructor(server: HttpServer) {
    this.io = new IOServer(server, {
      cors: {
        origin: ["http://localhost:5173", "https://ggecl-frontend.vercel.app"],
        credentials: true,
      },
    });

    this.initializeEvents();
  }

  private initializeEvents(): void {
    this.io.on("connection", (socket: Socket) => {
      console.log("Socket connected:", socket.id);

      this.handleCreateGroup(socket);
      this.handleJoinGroups(socket);
      this.handleSendMessage(socket);
      this.handleReceiveMessage(socket);
      this.handleDisconnect(socket);
    });
  }

  private handleCreateGroup(socket: Socket): void {
    socket.on(
      "createGroup",
      async ({
        groupId,
        adminId,
        groupName,
        students,
        instructors,
      }: CreateGroupData) => {
        if (!this.groups[groupId]) {
          this.groups[groupId] = {
            admin: adminId,
            name: groupName,
            students,
            instructors: instructors || [],
          };

          const newGroup = new Group({
            groupId,
            name: groupName,
            admin: adminId,
            students,
            instructors: instructors || [],
          });

          await newGroup
            .save()
            .then(() => {
              console.log("Group saved to database:", newGroup);
            })
            .catch((err) => {
              console.error("Error saving group to database:", err);
            });

          socket.join(groupId);

          console.log({
            admin: adminId,
            name: groupName,
            students,
            instructors,
          });

          this.io.emit("groupCreated", {
            groupId,
            adminId,
            groupName,
            students,
          });

          this.io.emit("allGroups", this.groups);
        } else {
          socket.emit("error", "Group already exists");
        }
      }
    );
  }

  private handleJoinGroups(socket: Socket): void {
    socket.on(
      "joinGroups",
      async ({
        groupIds,
        studentId,
        instructor,
        admin,
      }: {
        groupIds: string[];
        studentId?: string;
        instructor?: string;
        admin?: string;
      }) => {
        if (!studentId && !instructor && !admin) {
          socket.emit(
            "error",
            "Student ID, instructor ID, or admin ID must be provided"
          );
          return;
        }

        for (const groupId of groupIds) {
          let group = this.groups[groupId];

          // If group doesn't exist in memory, fetch from database
          if (!group) {
            try {
              const dbGroup = await Group.findOne({ groupId }).lean();
              if (dbGroup) {
                group = {
                  admin: dbGroup.admin,
                  name: dbGroup.name,
                  students: dbGroup.students,
                  instructors: dbGroup.instructors || [],
                };
                this.groups[groupId] = group;
              }
            } catch (err) {
              console.error(`Failed to fetch group ${groupId} from DB`, err);
              continue;
            }
          }

          if (!group) {
            // console.warn(`⚠️ Group ${groupId} does not exist`);
            continue;
          }

          // Handle student joining
          if (studentId && group.students) {
            if (!group.students.includes(studentId)) {
              group.students.push(studentId);
            }
            socket.join(groupId);
            // console.log(`👨‍🎓 Student ${studentId} joined group ${groupId}`);
            // this.io.to(groupId).emit("message", {
            //   from: "system",
            //   text: `${studentId} has joined the group`,
            // });
          }

          // Handle instructor joining
          if (instructor && group.instructors) {
            if (!group.instructors.includes(instructor)) {
              group.instructors.push(instructor);
            }
            socket.join(groupId);
            // console.log(`👨‍🏫 Instructor ${instructor} joined group ${groupId}`);
          }

          // Handle admin joining (assuming specific admin ID for super admin)
          if (admin && admin === "67fe79c80f4c4734f412abeb") {
            socket.join(groupId);
            // console.log(`👑 Admin ${admin} joined group ${groupId}`);
          }
        }
      }
    );
  }

  private handleSendMessage(socket: Socket): void {
    console.log("groups before:", this.groups);
    socket.on("sendMessage", async (data: MessageData) => {
      const { groupId, senderId, role, sender, text, image } = data;
      let group = this.groups[groupId];

      // console.log("Message data:", data);

      if ((!text || (typeof text === "string" && !text.trim())) && !image) {
        socket.emit("error", "Message or image must be provided");
        return;
      }

      if (!group) {
        const dbGroup = await Group.findOne({ groupId }).lean();
        if (dbGroup) {
          group = {
            admin: dbGroup.admin,
            name: dbGroup.name,
            students: dbGroup.students,
            instructors: dbGroup.instructors || [],
          };
          this.groups[groupId] = group;
        }
      }

      console.log("Group :", group);

      if (
        group &&
        ((role === "admin" && senderId === group.admin) ||
          (role === "student" && group.students.includes(senderId)) ||
          (role === "instructor" && group.instructors.includes(senderId)))
      ) {
        console.log({ senderId });
        const newMessage = new Message({
          group: groupId,
          sender: role === "instructor" ? "Instructor" : sender,
          senderId,
          role,
          text: text ? text.trim() : null,
          image: image || null,
        });

        await newMessage
          .save()
          .then(() => {
            console.log("Message saved to database:", newMessage);
          })
          .catch((err) => {
            console.error("Error saving message to database:", err);
          });

        this.io.to(groupId).emit("message", {
          groupId,
          senderId,
          role,
          sender: sender,
          text: text ? text.trim() : null,
          image: image || null,
        });

        console.log(role, senderId, text, image);
      } else {
        socket.emit("error", "Not authorized to send messages to this group");
      }
    });
  }

  private handleReceiveMessage(socket: Socket): void {
    socket.on("receiveMessage", (data: MessageData) => {
      const { groupId, senderId, role, sender, text, image } = data;
      const group = this.groups[groupId];

      if (group) {
        this.io.to(groupId).emit("message", {
          groupId,
          senderId,
          role,
          sender,
          text: text ? text.trim() : null,
          image: image || null,
        });
      } else {
        socket.emit("error", "Group does not exist");
      }
    });
  }

  private handleDisconnect(socket: Socket): void {
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  }

  public getGroups(): Record<string, GroupData> {
    return this.groups;
  }
}
