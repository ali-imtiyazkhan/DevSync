import { Router, Request, Response } from "express";
import { prisma, Role } from "@devsync/db";

const router1: Router = Router();

router1.post("/create", async (req: Request, res: Response) => {
  try {
    const { ownerId, name } = req.body as {
      ownerId: string;
      name?: string;
    };

    if (!ownerId) {
      return res.status(400).json({ message: "ownerId is required" });
    }

    const room = await prisma.room.create({
      data: {
        name,
        ownerId,
        participants: {
          create: {
            userId: ownerId,
            role: Role.OWNER,
          },
        },
      },
      include: {
        participants: true,
      },
    });

    res.status(201).json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create room" });
  }
});

router1.post("/:roomId/join", async (req: Request, res: Response) => {
  try {
    const roomId = String(req.params.roomId);
    const { userId } = req.body as { userId: string };

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const participant = await prisma.roomParticipant.upsert({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
      update: {},
      create: {
        userId,
        roomId,
        role: Role.PARTICIPANT,
      },
    });

    res.status(200).json(participant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to join room" });
  }
});

router1.get("/:roomId", async (req: Request, res: Response) => {
  try {
    const roomId = String(req.params.roomId);

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch room" });
  }
});

router1.post("/:roomId/leave", async (req: Request, res: Response) => {
  try {
    const roomId = String(req.params.roomId);
    const { userId } = req.body as { userId: string };

    await prisma.roomParticipant.delete({
      where: {
        userId_roomId: {
          userId,
          roomId,
        },
      },
    });

    res.status(200).json({ message: "Left room successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to leave room" });
  }
});

router1.delete("/:roomId", async (req: Request, res: Response) => {
  try {
    const roomId = String(req.params.roomId);
    const { userId } = req.body as { userId: string };

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

    res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete room" });
  }
});

export default router1;
