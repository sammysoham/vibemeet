import { prisma } from "../utils/prisma.js";

function serializeFriendship(record) {
  return {
    id: record.id,
    createdAt: record.createdAt,
    friend: {
      id: record.friend.id,
      displayName: record.friend.displayName,
      gender: record.friend.gender,
      isPremium: record.friend.isPremium,
    },
  };
}

export async function listFriends(req, res) {
  const friendships = await prisma.friendship.findMany({
    where: { userId: req.user.id },
    include: { friend: true },
    orderBy: { createdAt: "desc" },
  });

  return res.json({
    friends: friendships.map(serializeFriendship),
  });
}

export async function addFriend(req, res) {
  if (!req.user.isPremium) {
    return res
      .status(403)
      .json({ error: "Premium is required to add friends." });
  }

  const friendUserId = String(req.body.friendUserId || "");

  if (!friendUserId) {
    return res.status(400).json({ error: "Friend user id is required." });
  }

  if (friendUserId === req.user.id) {
    return res.status(400).json({ error: "You cannot add yourself." });
  }

  const friend = await prisma.user.findUnique({
    where: { id: friendUserId },
  });

  if (!friend) {
    return res.status(404).json({ error: "That user could not be found." });
  }

  const [friendship] = await prisma.$transaction([
    prisma.friendship.upsert({
      where: {
        userId_friendId: {
          userId: req.user.id,
          friendId: friendUserId,
        },
      },
      update: {},
      create: {
        userId: req.user.id,
        friendId: friendUserId,
      },
    }),
    prisma.friendship.upsert({
      where: {
        userId_friendId: {
          userId: friendUserId,
          friendId: req.user.id,
        },
      },
      update: {},
      create: {
        userId: friendUserId,
        friendId: req.user.id,
      },
    }),
  ]);

  const friendshipWithFriend = await prisma.friendship.findUnique({
    where: { id: friendship.id },
    include: { friend: true },
  });

  return res.status(201).json({
    friendship: serializeFriendship(friendshipWithFriend),
  });
}
