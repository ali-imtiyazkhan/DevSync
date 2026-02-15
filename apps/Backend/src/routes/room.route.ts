import { Router, Response } from "express";
import { prisma, Role } from "@devsync/db";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

router.post(
  "/create",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { name } = req.body;
      const userId = req.user!.userId;

      const room = await prisma.$transaction(async (tx) => {
        const createdRoom = await tx.room.create({
          data: {
            name,
            ownerId: userId,
          },
        });

        await tx.roomParticipant.create({
          data: {
            userId,
            roomId: createdRoom.id,
            role: Role.OWNER,
          },
        });

        return createdRoom;
      });

      return res.status(201).json(room);
    } catch (error) {
      return res.status(500).json({ message: "Failed to create room" });
    }
  },
);

router.post(
  "/:roomId/join",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const roomId = req.params.roomId as string;
      const userId = req.user!.userId;

      const roomExists = await prisma.room.findUnique({
        where: { id: roomId },
      });

      if (!roomExists) {
        return res.status(404).json({ message: "Room not found" });
      }

      const participant = await prisma.roomParticipant.upsert({
        where: {
          userId_roomId: { userId, roomId },
        },
        update: {},
        create: {
          userId,
          roomId,
          role: Role.PARTICIPANT,
        },
      });

      return res.status(200).json(participant);
    } catch (error) {
      return res.status(500).json({ message: "Failed to join room" });
    }
  },
);

router.get(
  "/:roomId",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const roomId = req.params.roomId as string;

      const userId = req.user!.userId;

      const membership = await prisma.roomParticipant.findUnique({
        where: {
          userId_roomId: { userId, roomId },
        },
      });

      if (!membership) {
        return res.status(403).json({ message: "Not a member of this room" });
      }

      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      return res.status(200).json(room);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch room" });
    }
  },
);

router.post(
  "/:roomId/leave",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const roomId = req.params.roomId as string;

      const userId = req.user!.userId;

      const room = await prisma.room.findUnique({
        where: { id: roomId },
      });

      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      if (room.ownerId === userId) {
        return res.status(400).json({
          message: "Owner cannot leave the room. Transfer ownership first.",
        });
      }

      await prisma.roomParticipant.delete({
        where: {
          userId_roomId: { userId, roomId },
        },
      });

      return res.status(200).json({ message: "Left room successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to leave room" });
    }
  },
);

router.delete(
  "/:roomId",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const roomId = req.params.roomId as string;

      const userId = req.user!.userId;

      const room = await prisma.room.findUnique({
        where: { id: roomId },
      });

      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      if (room.ownerId !== userId) {
        return res.status(403).json({ message: "Only owner can delete room" });
      }

      await prisma.room.delete({
        where: { id: roomId },
      });

      return res.status(200).json({ message: "Room deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete room" });
    }
  },
);

router.get(
  "/my/rooms",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;

      const rooms = await prisma.roomParticipant.findMany({
        where: { userId },
        include: {
          room: true,
        },
      });

      return res.status(200).json(rooms);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch user rooms" });
    }
  },
);

export default router;
